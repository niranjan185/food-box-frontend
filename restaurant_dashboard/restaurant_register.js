document.addEventListener('DOMContentLoaded', function () {
  const registerForm = document.getElementById('restaurant-register-form');

  registerForm.addEventListener('submit', function (e) {
    const restaurantName = document.getElementById('restaurant_name').value.trim();
    const ownerName = document.getElementById('owner_name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirm-password').value.trim();

    if (!restaurantName || !ownerName || !phone || !password || !confirmPassword) {
      e.preventDefault();
      alert("Please fill all required fields.");
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      e.preventDefault();
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    if (password !== confirmPassword) {
      e.preventDefault();
      alert("Passwords do not match.");
      return;
    }
  });
});
