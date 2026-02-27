// restaurant_dashboard/js/earnings.js

document.addEventListener('DOMContentLoaded', function() {
    loadEarningsReport(); // Load default report on page load
    const btn = document.getElementById('apply-earnings-filter-btn');
    if (btn) btn.addEventListener('click', loadEarningsReport);
});

async function loadEarningsReport() {
    const periodEl = document.getElementById('date-range-filter');
    const period = periodEl ? periodEl.value : 'last_7_days';
    const url = `/webtechnologies/FoodBox/backend/api/restaurant/get_earnings_report.php?period=${encodeURIComponent(period)}`;

    try {
        const response = await fetch(url, { credentials: 'include' });
        const raw = await response.text();
        let data; try { data = JSON.parse(raw); } catch { data = null; }

        const earningsTableBody = document.getElementById('earnings-table-body');
        earningsTableBody.innerHTML = ''; // Clear existing data
        document.getElementById('earnings-table').classList.add('hidden');
        document.getElementById('no-earnings-data').classList.remove('hidden');

        if (response.ok && data && data.summary) {
            // Update summary cards
            document.getElementById('total-revenue').textContent = `$${parseFloat(data.summary.total_revenue || 0).toFixed(2)}`;
            document.getElementById('total-completed-orders').textContent = data.summary.total_completed_orders || 0;
            document.getElementById('avg-order-value').textContent = `$${parseFloat(data.summary.average_order_value || 0).toFixed(2)}`;

            // Populate detailed report table
            if (data.detailed_orders && data.detailed_orders.length > 0) {
                document.getElementById('earnings-table').classList.remove('hidden');
                document.getElementById('no-earnings-data').classList.add('hidden');

                data.detailed_orders.forEach(order => {
                    const row = earningsTableBody.insertRow();
                    row.innerHTML = `
                        <td>#${order.id}</td>
                        <td>${new Date(order.order_date).toLocaleString()}</td>
                        <td>$${parseFloat(order.total_amount).toFixed(2)}</td>
                        <td>${order.status.replace(/_/g, ' ')}</td>
                        <td><a href="orders.html?order_id=${order.id}" class="btn btn-sm btn-info">View</a></td>
                    `;
                });
            }

        } else if (response.status === 401) {
            alert('Your session has expired or you are not logged in. Please log in again.');
            window.location.href = '../restaurant_login.php';
        } else {
            const errMsg = (data && (data.error_detail || data.error)) ? `${data.error}${data.error_detail ? ' - ' + data.error_detail : ''}` : raw || `HTTP ${response.status}`;
            console.error('Failed to fetch earnings data:', errMsg);
            alert(`Error loading earnings data: ${errMsg}`);
        }
    } catch (error) {
        console.error('Network or server error:', error);
        alert('An error occurred while connecting to the server.');
    }
}