require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());


const db = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', 
    database: process.env.DB_DATABASE || 'break_cup_db',
    port: process.env.DB_PORT || 3306,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Initialize tables if they do not exist
const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
        email VARCHAR(255) PRIMARY KEY,
        fullname VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL
    )
`;

const createOrdersTable = `
    CREATE TABLE IF NOT EXISTS orders (
        order_id INT AUTO_INCREMENT PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        items_summary TEXT NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`;

db.query(createUsersTable, (err) => {
    if (err) {
        console.error('❌ Error creating users table: ', err.message);
    } else {
        console.log('✅ Users table ready.');
    }
});

db.query(createOrdersTable, (err) => {
    if (err) {
        console.error('❌ Error creating orders table: ', err.message);
    } else {
        console.log('✅ Orders table ready.');
    }
});


app.post('/api/signup', async (req, res) => {
    const { fullname, email, password } = req.body;

    try {
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

       
        const sqlInsert = "INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)";
        
        db.query(sqlInsert, [fullname, email, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ success: false, message: "This email is already registered!" });
                }
                return res.status(500).json({ success: false, message: "Database query error: " + err.message });
            }
            console.log(`📦 New user saved to MySQL: ${fullname}`);
            res.status(201).json({ success: true, message: "Account brewed successfully!" });
        });

    } catch (error) {
        res.status(500).json({ success: false, message: "Server error during registration." });
    }
});


app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const sqlSelect = "SELECT * FROM users WHERE email = ?";
    
    db.query(sqlSelect, [email], async (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "Database query error: " + err.message });
        
        if (results.length === 0) {
            return res.status(400).json({ success: false, message: "Account not found. Please sign up!" });
        }

        const user = results[0];

        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Incorrect password credentials." });
        }

        console.log(`🔓 User logged in from MySQL records: ${user.fullname}`);
        res.json({ success: true, message: `Welcome back, ${user.fullname}!`, username: user.fullname });
    });
});

app.post('/api/orders', (req, res) => {
    const { email, items, total } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Please log in first before placing an order!" });
    }

   
    const itemsSummary = items.map(item => item.name).join(', ');

    const sqlOrderInsert = "INSERT INTO orders (user_email, items_summary, total_price) VALUES (?, ?, ?)";

    db.query(sqlOrderInsert, [email, itemsSummary, total], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Database error while placing order: " + err.message });
        }
        console.log(`🛒 Order #${result.insertId} successfully logged for ${email}`);
        res.status(201).json({ success: true, message: "Order successfully placed! Your hot brew will be ready for pickup in 10 minutes. ☕" });
    });
});


app.get('/api/orders/:email', (req, res) => {
    const userEmail = req.params.email;

   
    const sqlSelectOrders = "SELECT order_id, user_email, items_summary, CAST(total_price AS UNSIGNED) as total_price, order_date FROM orders WHERE user_email = ? ORDER BY order_date DESC";

    db.query(sqlSelectOrders, [userEmail], (err, results) => {
        if (err) {
            console.error("❌ SQL Query Error:", err);
            return res.status(500).json({ success: false, message: "Database error retrieving order history: " + err.message });
        }
        console.log(`📦 Sent ${results.length} order history rows to browser for: ${userEmail}`);
        res.json({ success: true, orders: results });
    });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`☕ Break Cup backend engine online at: http://localhost:${PORT}`);
    });
}

module.exports = app;