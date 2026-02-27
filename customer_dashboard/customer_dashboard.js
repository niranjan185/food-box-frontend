// Sample food items
const foodItems = [
  { id: 1, name: "Veg Burger", price: 120, category: "veg", img: "https://via.placeholder.com/200" },
  { id: 2, name: "Chicken Biryani", price: 250, category: "nonveg", img: "https://via.placeholder.com/200" },
  { id: 3, name: "Cold Coffee", price: 80, category: "beverages", img: "https://via.placeholder.com/200" },
  { id: 4, name: "Chocolate Cake", price: 150, category: "desserts", img: "https://via.placeholder.com/200" },
  { id: 5, name: "Paneer Tikka", price: 200, category: "veg", img: "https://via.placeholder.com/200" }
];

const foodContainer = document.getElementById('food-items');
const categoryFilter = document.getElementById('category');
const priceFilter = document.getElementById('price-filter');
const searchInput = document.getElementById('food-search');

// Display food items
// Fetch items from backend with current filters
async function loadFoodItems() {
    try {
        const params = new URLSearchParams();
        if (categoryFilter.value && categoryFilter.value !== 'all') params.set('category', categoryFilter.value);
        if (priceFilter.value && priceFilter.value !== 'all') params.set('price', priceFilter.value);
        if (searchInput.value) params.set('search', searchInput.value);
        const response = await fetch(`/webtechnologies/FoodBox/backend/api/customer/get_menu_items.php?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to load menu items');
        }

        displayFoodItems(data.menu_items || []);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load menu items. Please try again later.');
    }
}

// Update displayFoodItems function to handle cart functionality
function displayFoodItems(items) {
    foodContainer.innerHTML = '';
    items.forEach(item => {
        const card = document.createElement('div');
        card.classList.add('food-card');
        card.innerHTML = `
            <img src="${item.image_url || 'assets/default-food.jpg'}" alt="${item.name}">
            <h3>${item.name}</h3>
            <p class="restaurant">From: ${item.restaurant_name}</p>
            <p class="price">₹${item.price}</p>
            <div class="quantity-controls">
                <button onclick="updateQuantity(${item.id}, 'decrease')">-</button>
                <span id="quantity-${item.id}">1</span>
                <button onclick="updateQuantity(${item.id}, 'increase')">+</button>
            </div>
            <button onclick="addToCart(${item.id})" class="add-to-cart">Add to Cart</button>
        `;
        foodContainer.appendChild(card);
    });
}

// Initial load happens on DOMContentLoaded

// Filters
function applyFilters() {
  loadFoodItems();
}

categoryFilter.addEventListener('change', applyFilters);
priceFilter.addEventListener('change', applyFilters);
searchInput.addEventListener('keyup', applyFilters);

document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    loadFoodItems();
});

async function loadDashboardData() {
    try {
        const response = await fetch('/webtechnologies/FoodBox/backend/api/customer/get_dashboard_data.php');
        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '../login/login_page.html';
                return;
            }
            throw new Error(data.error || 'Failed to load dashboard data');
        }

        // Update customer name
        document.getElementById('customer-name').textContent = data.customer_name;
        
        // Update cart count
        document.getElementById('cart-item-count').textContent = data.cart_count;

        // Update recent orders
        const ordersContainer = document.getElementById('recent-orders');
        ordersContainer.innerHTML = ''; // Clear existing orders

        data.recent_orders.forEach(order => {
            const orderCard = createOrderCard(order);
            ordersContainer.appendChild(orderCard);
        });

    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load dashboard data. Please try again later.');
    }
}

function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';
    card.innerHTML = `
        <div class="order-header">
            <h3>Order #${order.id}</h3>
            <span class="status ${order.status}">${order.status}</span>
        </div>
        <div class="order-details">
            <p><strong>Restaurant:</strong> ${order.restaurant_name}</p>
            <p><strong>Total:</strong> ₹${order.total_amount}</p>
            <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
        </div>
        <button onclick="viewOrderDetails(${order.id})" class="btn-primary">View Details</button>
    `;
    return card;
}

// Add cart management functions
async function addToCart(itemId) {
    const quantity = parseInt(document.getElementById(`quantity-${itemId}`).textContent);
    try {
        const response = await fetch('/webtechnologies/FoodBox/backend/api/customer/add_to_cart.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                menu_item_id: itemId,
                quantity: quantity
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to add item to cart');
        }

        // Update cart count
        document.getElementById('cart-item-count').textContent = data.cart_count;
        alert('Item added to cart successfully!');

    } catch (error) {
        console.error('Error:', error);
        alert('Failed to add item to cart. Please try again later.');
    }
}

function updateQuantity(itemId, action) {
    const quantityElement = document.getElementById(`quantity-${itemId}`);
    let quantity = parseInt(quantityElement.textContent);

    if (action === 'increase') {
        quantity++;
    } else if (action === 'decrease' && quantity > 1) {
        quantity--;
    }

    quantityElement.textContent = quantity;
}
