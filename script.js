const MENU_ITEMS = [
    //HOT COFFEE CATEGORY
    { id: 1, name: 'Classic Espresso', category: 'hot', price: 120, desc: 'Rich, bold, and perfectly extracted classic espresso shot.', image: '☕' },
    { id: 2, name: 'Vanilla Latte', category: 'hot', price: 180, desc: 'Espresso with steamed milk and a touch of sweet natural vanilla.', image: '🥛' },
    { id: 7, name: 'Caramel Macchiato', category: 'hot', price: 220, desc: 'Steamed milk stained with espresso and finished with buttery caramel drizzle.', image: '🍯' },
    { id: 8, name: 'Velvety Flat White', category: 'hot', price: 190, desc: 'Smooth, micro-foamed milk poured perfectly over a double shot of ristretto.', image: '☕' },

    //COLD COFFEE CATEGORY
    { id: 3, name: 'Cold Brew Fudge', category: 'cold', price: 210, desc: 'Slow-steeped cold brew served over ice with dark chocolate drizzle.', image: '🧊' },
    { id: 4, name: 'Iced Matcha Latte', category: 'cold', price: 240, desc: 'Premium Japanese matcha whisked with chilled organic oat milk.', image: '🍵' },
    { id: 9, name: 'Hazelnut Frappe', category: 'cold', price: 260, desc: 'Blended espresso ice beverage loaded with roasted hazelnut syrup and whipped cream.', image: '🥤' },
    { id: 10, name: 'Spanish Iced Latte', category: 'cold', price: 250, desc: 'Sweetened condensed milk layered with fresh espresso and cold whole milk.', image: '❄️' },

    //BAKERY & EATS CATEGORY
    { id: 5, name: 'Almond Croissant', category: 'bakery', price: 150, desc: 'Flaky, buttery pastry filled with sweet almond frangipane paste.', image: '🥐' },
    { id: 6, name: 'Blueberry Muffin', category: 'bakery', price: 140, desc: 'Soft-baked muffin bursting with fresh, juicy mountain berries.', image: '🧁' },
    { id: 11, name: 'Avocado Sourdough Toast', category: 'bakery', price: 280, desc: 'Toasted artisanal sourdough topped with crushed avocado, chili flakes, and sea salt.', image: '🥑' },
    { id: 12, name: 'Red Velvet Cookie', category: 'bakery', price: 90, desc: 'Fudgy, thick-baked cookie loaded with premium white chocolate chunks.', image: '🍪' }
];


let cart = [];


const menuContainer = document.getElementById('menu-container');
const filterButtons = document.querySelectorAll('.filter-btn');
const cartToggle = document.getElementById('cart-toggle');
const cartClose = document.getElementById('cart-close');
const cartDrawer = document.getElementById('cart-drawer');
const drawerOverlay = document.getElementById('drawer-overlay');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartCount = document.getElementById('cart-count');
const cartFooter = document.getElementById('cart-footer');


function displayMenu(items) {
    menuContainer.innerHTML = ''; 

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'menu-card';
        card.innerHTML = `
            <div>
                <div class="card-icon">${item.image}</div>
                <h3 class="card-title">${item.name}</h3>
                <p class="card-desc">${item.desc}</p>
            </div>
            <div class="card-footer">
                <span class="price">₹${item.price}</span>
                <button class="add-btn" onclick="addItemToCart(${item.id})">Add to Cup</button>
            </div>
        `;
        menuContainer.appendChild(card);
    });
}


filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        
        button.classList.add('active');

        const selectedCategory = button.getAttribute('data-category');
        
        if (selectedCategory === 'all') {
            displayMenu(MENU_ITEMS);
        } else {
            const filteredData = MENU_ITEMS.filter(item => item.category === selectedCategory);
            displayMenu(filteredData);
        }
    });
});


window.addItemToCart = function(id) {
    const targetProduct = MENU_ITEMS.find(item => item.id === id);
    cart.push(targetProduct);
    updateCartUI();
};


window.removeItemFromCart = function(index) {
    cart.splice(index, 1); 
    updateCartUI();
};


function updateCartUI() {
    cartCount.textContent = cart.length;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-msg">Your cup is empty. Add some coffee!</p>';
        cartFooter.style.display = 'none';
    } else {
        cartItemsContainer.innerHTML = '';
        let billTotal = 0;

        cart.forEach((item, index) => {
            billTotal += item.price;
            const row = document.createElement('div');
            row.className = 'cart-item-row';
            row.innerHTML = `
                <span>${item.image} <strong>${item.name}</strong> (₹${item.price})</span>
                <button class="remove-item-btn" onclick="removeItemFromCart(${index})">&times;</button>
            `;
            cartItemsContainer.appendChild(row);
        });

        
        cartFooter.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:15px; font-weight:700; font-size:16px;">
                <span>Total:</span>
                <span>₹${billTotal}</span>
            </div>
            <button class="checkout-btn" onclick="processCheckout(${billTotal})">Place Pickup Order</button>
        `;
        cartFooter.style.display = 'block';
    }
}


window.processCheckout = async function(finalBill) {
    
    const loggedInUserEmail = localStorage.getItem('userEmail'); 

    if (!loggedInUserEmail) {
        alert("🔒 Please sign in to your Break Cup account first to process pickup orders!");
        window.location.href = 'login.html';
        return;
    }

    const checkoutBtn = document.querySelector('.checkout-btn');
    checkoutBtn.innerHTML = '⚡ Transmitting Order...';
    checkoutBtn.disabled = true;

    try {
        const response = await fetch('http://localhost:5000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: loggedInUserEmail,
                items: cart,
                total: finalBill
            })
        });

        const data = await response.json();

        if (data.success) {
            alert(data.message);
            cart = []; 
            updateCartUI();
            closeCart();
        } else {
            alert(data.message);
            checkoutBtn.innerHTML = 'Place Pickup Order';
            checkoutBtn.disabled = false;
        }
    } catch (error) {
        alert("Could not reach backend checkout services.");
        checkoutBtn.innerHTML = 'Place Pickup Order';
        checkoutBtn.disabled = false;
    }
};


cartToggle.addEventListener('click', () => {
    cartDrawer.classList.add('open');
    drawerOverlay.classList.add('active');
});

const closeCart = () => {
    cartDrawer.classList.remove('open');
    drawerOverlay.classList.remove('active');
};

cartClose.addEventListener('click', closeCart);
drawerOverlay.addEventListener('click', closeCart);


function checkUserSession() {
    const authContainer = document.getElementById('auth-status-container');
    const storedUsername = localStorage.getItem('username');
    
    const storedAvatar = localStorage.getItem('userAvatar') || '☕';

    if (storedUsername) {
        const cleanName = storedUsername.charAt(0).toUpperCase() + storedUsername.slice(1);

       
        authContainer.innerHTML = `
            <div style="display: flex; gap: 15px; align-items: center; font-size: 14px; font-weight: 600; color: var(--coffee-dark);">
                <span>Welcome, ${cleanName} 👋</span>
                
                <div id="nav-profile-logo" style="width: 35px; height: 35px; border-radius: 50%; overflow: hidden; border: 2px solid var(--coffee-dark); cursor: pointer; display: flex; align-items: center; justify-content: center; background: #fff;">
                    ${storedAvatar.startsWith('data:image') 
                        ? `<img src="${storedAvatar}" style="width: 100%; height: 100%; object-fit: cover;">` 
                        : `<span style="font-size: 18px;">${storedAvatar}</span>`
                    }
                </div>

                <button id="logout-trigger" style="background: none; border: none; color: #cc3333; font-weight: 600; cursor: pointer; padding: 0; font-size: 14px;">Logout</button>
            </div>
        `;

        
        document.getElementById('nav-profile-logo').addEventListener('click', () => {
            window.location.href = 'profile.html';
        });

        
        document.getElementById('logout-trigger').addEventListener('click', () => {
            localStorage.removeItem('username');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userAvatar'); 
            
            alert("Logged out successfully. Have a great day!");
            window.location.href = 'login.html'; 
        });
    }
}


checkUserSession();


displayMenu(MENU_ITEMS);