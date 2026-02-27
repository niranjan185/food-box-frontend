// restaurant_dashboard/js/profile.js

document.addEventListener('DOMContentLoaded', function() {
    loadRestaurantProfile();
    document.getElementById('update-restaurant-profile-form').addEventListener('submit', handleUpdateProfile);
    document.getElementById('change-password-form').addEventListener('submit', handleChangePassword);
});

async function loadRestaurantProfile() {
    try {
        const response = await fetch('/webtechnologies/FoodBox/backend/api/restaurant/get_profile_data.php', { credentials: 'include' });
        const raw = await response.text();
        let data; try { data = JSON.parse(raw); } catch { data = null; }

        if (response.ok && data && data.profile) {
            const profile = data.profile;
            document.getElementById('restaurant-name').value = profile.restaurant_name;
            document.getElementById('owner-name').value = profile.owner_name || '';
            document.getElementById('email').value = profile.email;
            document.getElementById('phone').value = profile.phone;
            document.getElementById('cuisine-type').value = profile.cuisine_type || '';
            document.getElementById('address').value = profile.address || '';
            document.getElementById('opening-time').value = profile.opening_time || '';
            document.getElementById('closing-time').value = profile.closing_time || '';
            document.getElementById('logo-url').value = profile.logo_url || '';
            document.getElementById('status').value = profile.status || 'open';
        } else if (response.status === 401) {
            alert('Your session has expired or you are not logged in. Please log in again.');
            window.location.href = '../restaurant_login.php';
        } else {
            const msg = data && (data.error_detail || data.error) ? `${data.error}${data.error_detail ? ' - ' + data.error_detail : ''}` : raw || `HTTP ${response.status}`;
            console.error('Failed to load restaurant profile:', msg);
            alert('Error loading profile data. ' + msg);
        }
    } catch (error) {
        console.error('Network or server error:', error);
        alert('An error occurred while connecting to the server to load profile.');
    }
}

async function handleUpdateProfile(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const profileData = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/webtechnologies/FoodBox/backend/api/restaurant/update_profile.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(profileData)
        });
        const raw = await response.text();
        let data; try { data = JSON.parse(raw); } catch { data = null; }

        if (response.ok && data && data.success) {
            alert('Restaurant profile updated successfully!');
            // Potentially refresh header or other relevant parts
            location.reload(); // Simple reload to update header name
        } else {
            const msg = data && (data.error_detail || data.error) ? `${data.error}${data.error_detail ? ' - ' + data.error_detail : ''}` : raw || `HTTP ${response.status}`;
            alert(`Failed to update profile: ${msg}`);
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('An error occurred while updating the profile.');
    }
}

async function handleChangePassword(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const passwordData = Object.fromEntries(formData.entries());

    if (passwordData.new_password !== passwordData.confirm_new_password) {
        alert('New password and confirmation do not match.');
        return;
    }

    try {
        const response = await fetch('/webtechnologies/FoodBox/backend/api/restaurant/change_password.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            })
        });
        const raw = await response.text();
        let data; try { data = JSON.parse(raw); } catch { data = null; }

        if (response.ok && data && data.success) {
            alert('Password changed successfully!');
            form.reset(); // Clear the form
        } else {
            const msg = data && (data.error_detail || data.error) ? `${data.error}${data.error_detail ? ' - ' + data.error_detail : ''}` : raw || `HTTP ${response.status}`;
            alert(`Failed to change password: ${msg}`);
        }
    } catch (error) {
        console.error('Error changing password:', error);
        alert('An error occurred while changing the password.');
    }
}