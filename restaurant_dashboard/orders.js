// restaurant_dashboard/js/orders.js

let currentOrders = []; // To store orders fetched for modal viewing

document.addEventListener('DOMContentLoaded', function() {
    // Set initial filter from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const initialStatus = urlParams.get('status');
    if (initialStatus) {
        const filterEl = document.getElementById('order-status-filter');
        if (filterEl) filterEl.value = initialStatus;
    }

    loadOrders(); // Load orders on page load
    const applyBtn = document.getElementById('apply-filter-btn');
    if (applyBtn) applyBtn.addEventListener('click', loadOrders);
    const closeBtn = document.getElementById('close-order-detail-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => {
        const modal = document.getElementById('order-detail-modal');
        if (modal) modal.classList.add('hidden');
    });
    const updBtn = document.getElementById('update-order-status-btn');
    if (updBtn) updBtn.addEventListener('click', openUpdateStatusModal);
});

async function loadOrders() {
    // Resolve DOM elements up-front; if core containers are missing, skip work
    const ordersList = document.getElementById('orders-list');
    const statusEl = document.getElementById('order-status-filter');
    if (!ordersList) {
        return; // This page doesn't have the orders UI
    }
    const statusFilter = statusEl ? statusEl.value : 'all';
    const url = `/webtechnologies/FoodBox/backend/api/restaurant/get_orders.php?status=${encodeURIComponent(statusFilter)}`;

    try {
        const response = await fetch(url, { credentials: 'include' });
        const raw = await response.text();
        let data;
        try { data = JSON.parse(raw); } catch (e) { data = null; }
        if (!response.ok) {
            const msg = data && (data.error_detail || data.error) ? `${data.error}${data.error_detail ? ' - ' + data.error_detail : ''}` : raw || `HTTP ${response.status}`;
            throw new Error(msg);
        }

        ordersList.innerHTML = ''; // Clear existing orders
        currentOrders = []; // Reset stored orders

        if (response.ok && data && data.orders && data.orders.length > 0) {
            currentOrders = data.orders; // Store for modal access

            data.orders.forEach(order => {
                const orderCard = document.createElement('div');
                orderCard.className = 'card order-card';
                orderCard.innerHTML = `
                    <h3>Order #${order.id} <span class="status">${order.status.replace(/_/g, ' ')}</span></h3>
                    <p><strong>Customer:</strong> ${order.customer_name}</p>
                    <p><strong>Total:</strong> $${parseFloat(order.total_amount).toFixed(2)}</p>
                    <p><strong>Placed:</strong> ${new Date(order.order_date).toLocaleString()}</p>
                    <div class="actions">
                        <button class="btn btn-sm btn-primary view-order-btn" data-order-id="${order.id}">View Details</button>
                        ${renderStatusActionButton(order)}
                    </div>
                `;
                ordersList.appendChild(orderCard);
            });

            // Add event listeners for view and action buttons
            ordersList.querySelectorAll('.view-order-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const orderId = this.dataset.orderId;
                    showOrderDetail(orderId);
                });
            });
            ordersList.querySelectorAll('.order-action-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const orderId = this.dataset.orderId;
                    const action = this.dataset.action; // e.g., 'accept', 'prepare', 'dispatch', 'complete'
                    handleOrderAction(orderId, action);
                });
            });

        } else if (response.status === 401) {
            alert('Your session has expired or you are not logged in. Please log in again.');
            window.location.href = '../restaurant_login.php';
        } else {
            // Recreate and show the empty state message after clearing the list
            ordersList.innerHTML = '<p class="text-center" id="no-orders-message">No orders found for the selected filter.</p>';
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        alert(`Failed to load orders: ${error.message}`);
    }
}

function renderStatusActionButton(order) {
    let buttonHtml = '';
    switch (order.status) {
        case 'pending':
            buttonHtml = `<button class="btn btn-sm btn-secondary order-action-btn" data-order-id="${order.id}" data-action="accept">Accept Order</button>`;
            break;
        case 'preparing':
            buttonHtml = `<button class="btn btn-sm btn-accent order-action-btn" data-order-id="${order.id}" data-action="dispatch">Mark Out for Delivery</button>`;
            break;
        case 'out_for_delivery':
            buttonHtml = `<button class="btn btn-sm btn-success order-action-btn" data-order-id="${order.id}" data-action="deliver">Mark Delivered</button>`;
            break;
        // 'delivered' typically managed by delivery agent or system; no further actions
        // 'cancelled' has no further actions
    }
    return buttonHtml;
}


async function showOrderDetail(orderId) {
    const order = currentOrders.find(o => o.id == orderId);
    if (!order) {
        alert('Order details not found.');
        return;
    }

    document.getElementById('detail-order-id').textContent = order.id;
    document.getElementById('detail-order-status').textContent = order.status.replace(/_/g, ' ');
    document.getElementById('detail-customer-name').textContent = order.customer_name;
    document.getElementById('detail-customer-phone').textContent = order.customer_phone;
    document.getElementById('detail-delivery-address').textContent = order.delivery_address;
    document.getElementById('detail-payment-method').textContent = order.payment_method;
    document.getElementById('detail-total-amount').textContent = `$${parseFloat(order.total_amount).toFixed(2)}`;
    document.getElementById('detail-special-instructions').textContent = order.special_instructions || 'N/A';

    const orderItemsList = document.getElementById('detail-order-items');
    orderItemsList.innerHTML = '';
    order.items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.quantity} x ${item.name} ($${parseFloat(item.price_at_purchase).toFixed(2)} each)`;
        orderItemsList.appendChild(li);
    });

    // Show/hide update status button based on order status
    const updateStatusBtn = document.getElementById('update-order-status-btn');
    if (order.status === 'pending' || order.status === 'preparing') {
        updateStatusBtn.style.display = 'inline-block';
        updateStatusBtn.dataset.orderId = order.id; // Store order ID for the button
    } else {
        updateStatusBtn.style.display = 'none';
    }

    document.getElementById('order-detail-modal').classList.remove('hidden');
}


async function handleOrderAction(orderId, action) {
    let newStatus = '';
    let confirmationMessage = '';

    switch (action) {
        case 'accept':
            newStatus = 'preparing';
            confirmationMessage = `Are you sure you want to accept order #${orderId}? It will be marked as 'preparing'.`;
            break;
        case 'dispatch':
            newStatus = 'out_for_delivery';
            confirmationMessage = `Are you sure you want to mark order #${orderId} as 'out for delivery'?`;
            break;
        case 'deliver':
            newStatus = 'delivered';
            confirmationMessage = `Confirm order #${orderId} is delivered?`;
            break;
        // Add other actions if needed, e.g., 'cancel'
        default:
            alert('Invalid order action.');
            return;
    }

    if (!confirm(confirmationMessage)) {
        return;
    }

    try {
        const response = await fetch('/webtechnologies/FoodBox/backend/api/restaurant/update_order_status.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ order_id: orderId, status: newStatus })
        });
        const txt = await response.text();
        let data; try { data = JSON.parse(txt); } catch { data = null; }

        if (response.ok && data && data.success) {
            alert(`Order #${orderId} status updated to '${newStatus.replace(/_/g, ' ')}'.`);
            loadOrders(); // Reload orders to reflect changes
        } else {
            const msg = data && (data.error_detail || data.error) ? `${data.error}${data.error_detail ? ' - ' + data.error_detail : ''}` : txt || `HTTP ${response.status}`;
            alert(`Failed to update order status: ${msg}`);
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        alert(`An error occurred while updating the order status: ${error.message}`);
    }
}

// Function to open a specific modal for updating status (could be a dropdown in modal)
function openUpdateStatusModal() {
    alert("This would open a modal/dropdown to select the next status. For now, use the action buttons.");
    // For a more advanced UI, you might have a dedicated modal here
    // for selecting status and dispatching to a delivery agent.
    // For simplicity, we are using direct action buttons on the order cards.
}