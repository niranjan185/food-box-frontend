// restaurant_dashboard/js/dashboard.js

document.addEventListener('DOMContentLoaded', function() {
    fetchRestaurantDashboardStats();
    // Refresh when tab becomes active
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            fetchRestaurantDashboardStats();
        }
    });
    // Periodic refresh (every 60s)
    window.__rb_dash_timer = window.setInterval(fetchRestaurantDashboardStats, 60000);
});

async function fetchRestaurantDashboardStats() {
    try {
        const response = await fetch('/webtechnologies/FoodBox/backend/api/restaurant/get_dashboard_stats.php', { credentials: 'include' });
        const data = await response.json();

        if (response.ok && data.success) {
            const welcomeEl = document.getElementById('welcome-restaurant-name');
            if (welcomeEl && data.restaurant_name) {
                welcomeEl.textContent = `Welcome, ${data.restaurant_name}!`;
            }
            const newOrdersEl = document.getElementById('new-orders-count');
            if (newOrdersEl) newOrdersEl.textContent = data.new_orders ?? 0;
            const salesEl = document.getElementById('total-sales-today');
            if (salesEl) salesEl.textContent = `$${parseFloat(data.total_sales_today || 0).toFixed(2)}`;
            const pendingEl = document.getElementById('pending-deliveries-count');
            if (pendingEl) pendingEl.textContent = data.pending_deliveries ?? 0;

            // Populate recent orders
            const recentOrdersList = document.getElementById('recent-orders-list');
            const noRecentEl = document.getElementById('no-recent-orders');
            if (recentOrdersList) {
                recentOrdersList.innerHTML = '';
                if (Array.isArray(data.recent_orders) && data.recent_orders.length > 0) {
                    if (noRecentEl) noRecentEl.classList.add('hidden');
                    data.recent_orders.forEach(order => {
                        const orderCard = document.createElement('div');
                        orderCard.className = 'card order-card';
                        const safeStatus = (order.status || '').replace(/_/g, ' ');
                        orderCard.innerHTML = `
                            <h3>Order #${order.id} <span class="status">${safeStatus}</span></h3>
                            <p><strong>Customer:</strong> ${order.customer_name}</p>
                            <p><strong>Total:</strong> $${parseFloat(order.total_amount).toFixed(2)}</p>
                            <p><strong>Placed:</strong> ${new Date(order.order_date).toLocaleString()}</p>
                            <div class="actions">
                                <a href="orders.html?order_id=${order.id}" class="btn btn-sm btn-primary">View Details</a>
                                ${order.status === 'pending' ? `<button class="btn btn-sm btn-secondary accept-order-btn" data-order-id="${order.id}">Accept</button>` : ''}
                            </div>
                        `;
                        recentOrdersList.appendChild(orderCard);
                    });

                    // Accept button events
                    recentOrdersList.querySelectorAll('.accept-order-btn').forEach(button => {
                        button.addEventListener('click', function() {
                            const orderId = this.dataset.orderId;
                            handleAcceptOrder(orderId);
                        });
                    });
                } else {
                    if (noRecentEl) noRecentEl.classList.remove('hidden');
                }
            }
        } else if (response.status === 401) {
            alert('Your session has expired or you are not logged in. Please log in again.');
            window.location.href = '../restaurant_login.php';
        } else {
            console.error('Failed to fetch dashboard stats:', data.error);
            alert('Error loading dashboard.');
        }
    } catch (error) {
        console.error('Network or server error:', error);
        alert('An error occurred while connecting to the server.');
    }
}

async function handleAcceptOrder(orderId) {
    if (!confirm(`Are you sure you want to accept Order #${orderId}?`)) {
        return;
    }
    try {
        const response = await fetch('/webtechnologies/FoodBox/backend/api/restaurant/update_order_status.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ order_id: orderId, status: 'preparing' })
        });
        const data = await response.json();

        if (response.ok && data.success) {
            alert(`Order #${orderId} accepted and status set to 'preparing'.`);
            fetchRestaurantDashboardStats(); // Refresh dashboard data
        } else {
            alert(`Failed to accept order #${orderId}: ${data.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error accepting order:', error);
        alert('An error occurred while trying to accept the order.');
    }
}