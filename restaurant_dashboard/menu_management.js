// restaurant_dashboard/js/menu_management.js (Continued from previous response)

document.addEventListener('DOMContentLoaded', function () {
    const addForm = document.getElementById('add-menu-item-form');
    const editForm = document.getElementById('edit-menu-item-form');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');

    if (addForm) addForm.addEventListener('submit', handleAddItem);
    if (editForm) editForm.addEventListener('submit', handleEditItem);
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', () => toggleEditModal(false));

    loadMenuItems();
});

function clearFieldError(fieldId) {
    const input = document.getElementById(fieldId);
    if (!input) return;
    input.style.borderColor = '';
    let err = input.nextElementSibling;
    if (err && err.classList && err.classList.contains('field-error')) {
        err.remove();
    }
}

function setFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    if (!input) return;
    input.style.borderColor = '#e74c3c';
    let err = input.nextElementSibling;
    if (!(err && err.classList && err.classList.contains('field-error'))) {
        err = document.createElement('div');
        err.className = 'field-error';
        err.style.color = '#e74c3c';
        err.style.fontSize = '0.9em';
        err.style.marginTop = '6px';
        input.parentNode.insertBefore(err, input.nextSibling);
    }
    err.textContent = message;
}

function clearErrors(scope) {
    const ids = scope === 'edit'
        ? ['edit-item-name','edit-item-price','edit-item-category','edit-item-image-url']
        : ['item-name','item-price','item-category','item-image-url'];
    ids.forEach(clearFieldError);
}

function isValidUrl(str) {
    if (!str) return true;
    try { new URL(str); return true; } catch { return false; }
}

function validatePayload(payload, scope) {
    let valid = true;
    if (!payload.name) { setFieldError(scope==='edit'?'edit-item-name':'item-name', 'Name is required'); valid = false; }
    if (!(typeof payload.price === 'number') || !(payload.price > 0)) { setFieldError(scope==='edit'?'edit-item-price':'item-price', 'Price must be greater than 0'); valid = false; }
    if (!payload.category) { setFieldError(scope==='edit'?'edit-item-category':'item-category', 'Category is required'); valid = false; }
    if (payload.image_url && !isValidUrl(payload.image_url)) { setFieldError(scope==='edit'?'edit-item-image-url':'item-image-url', 'Image URL must be valid'); valid = false; }
    return valid;
}

async function loadMenuItems() {
    try {
        const response = await fetch('/webtechnologies/FoodBox/backend/api/restaurant/list_menu_items.php');
        const data = await response.json();

        const list = document.getElementById('menu-items-list');
        const emptyMsg = document.getElementById('no-menu-items-message');
        list.innerHTML = '';

        const items = (response.ok && data.items) ? data.items : [];
        if (items.length === 0) {
            if (emptyMsg) emptyMsg.classList.remove('hidden');
            return;
        }
        if (emptyMsg) emptyMsg.classList.add('hidden');

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card menu-item-card';
            card.innerHTML = `
                <img src="${item.image_url || 'https://via.placeholder.com/120x120?text=Food'}" alt="${item.name}">
                <div class="menu-item-info">
                    <h3>${item.name}</h3>
                    <p>${item.description || ''}</p>
                    <p><strong>Category:</strong> ${item.category || 'N/A'}</p>
                    <p><strong>Price:</strong> $${parseFloat(item.price).toFixed(2)}</p>
                    <p><strong>Status:</strong> ${parseInt(item.is_available) ? 'Available' : 'Unavailable'}</p>
                    <div class="actions">
                        <button class="btn btn-sm btn-secondary edit-btn">Edit</button>
                        <button class="btn btn-sm btn-danger delete-btn">Delete</button>
                    </div>
                </div>
            `;
            card.querySelector('.edit-btn').addEventListener('click', () => openEditModal(item));
            card.querySelector('.delete-btn').addEventListener('click', () => handleDeleteItem(item.id));
            list.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading menu items:', error);
        alert('Failed to load menu items.');
    }
}

async function handleAddItem(event) {
    event.preventDefault();
    const form = event.target;
    const payload = {
        name: document.getElementById('item-name').value.trim(),
        description: document.getElementById('item-description').value.trim(),
        price: parseFloat(document.getElementById('item-price').value),
        category: document.getElementById('item-category').value.trim(),
        image_url: document.getElementById('item-image-url').value.trim(),
        is_available: document.getElementById('item-availability').checked ? 1 : 0,
    };

    clearErrors('add');
    if (!validatePayload(payload, 'add')) {
        return;
    }

    try {
        const response = await fetch('/webtechnologies/FoodBox/backend/api/restaurant/add_menu_item.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (response.ok && data.success) {
            form.reset();
            document.getElementById('item-availability').checked = true;
            loadMenuItems();
        } else {
            alert(`Failed to add item: ${data.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error adding item:', error);
        alert('An error occurred while adding the item.');
    }
}

function openEditModal(item) {
    document.getElementById('edit-item-id').value = item.id;
    document.getElementById('edit-item-name').value = item.name;
    document.getElementById('edit-item-description').value = item.description || '';
    document.getElementById('edit-item-price').value = item.price;
    document.getElementById('edit-item-category').value = item.category || '';
    document.getElementById('edit-item-image-url').value = item.image_url || '';
    document.getElementById('edit-item-availability').checked = !!parseInt(item.is_available);
    toggleEditModal(true);
}

function toggleEditModal(show) {
    const modal = document.getElementById('edit-item-modal');
    if (!modal) return;
    if (show) modal.classList.remove('hidden'); else modal.classList.add('hidden');
}

async function handleEditItem(event) {
    event.preventDefault();
    const payload = {
        item_id: parseInt(document.getElementById('edit-item-id').value, 10),
        name: document.getElementById('edit-item-name').value.trim(),
        description: document.getElementById('edit-item-description').value.trim(),
        price: parseFloat(document.getElementById('edit-item-price').value),
        category: document.getElementById('edit-item-category').value.trim(),
        image_url: document.getElementById('edit-item-image-url').value.trim(),
        is_available: document.getElementById('edit-item-availability').checked ? 1 : 0,
    };

    clearErrors('edit');
    if (!validatePayload(payload, 'edit')) {
        return;
    }

    try {
        const response = await fetch('/webtechnologies/FoodBox/backend/api/restaurant/update_menu_item.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (response.ok && data.success) {
            toggleEditModal(false);
            loadMenuItems();
        } else {
            alert(`Failed to update item: ${data.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error updating item:', error);
        alert('An error occurred while updating the item.');
    }
}

async function handleDeleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this menu item? This action cannot be undone.')) {
        return;
    }
    try {
        const response = await fetch('/webtechnologies/FoodBox/backend/api/restaurant/delete_menu_item.php', {
            method: 'POST', // Or DELETE, but POST with JSON body is often simpler in PHP
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_id: itemId })
        });
        const data = await response.json();

        if (response.ok && data.success) {
            alert('Menu item deleted successfully!');
            loadMenuItems(); // Reload menu items
        } else {
            alert(`Failed to delete item: ${data.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('An error occurred while deleting the item.');
    }
}

// Modal related styles (add these to your restaurant_dashboard/css/style.css)
/*
.modal {
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0,0,0,0.4);
    display: flex;
    justify-content: center;
    align-items: center;
}

.modal-content {
    background-color: var(--card-bg);
    margin: auto;
    padding: 30px;
    border-radius: 10px;
    box-shadow: var(--shadow);
    width: 90%;
    max-width: 600px;
    position: relative;
}
.modal-content h2 {
    color: var(--secondary-color);
    margin-top: 0;
    border-bottom: 2px solid var(--bg-light);
    padding-bottom: 10px;
    margin-bottom: 20px;
}
.modal-content .text-right {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}
*/