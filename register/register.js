document.addEventListener('DOMContentLoaded', function () {
  const registerForm = document.getElementById('register-form');

  if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
      const fullname = document.getElementById('fullname').value.trim();
      const phone = document.getElementById('phn').value.trim();
      const password = document.getElementById('password').value.trim();
      const confirmPassword = document.getElementById('confirm-password').value.trim();

      if (!fullname || !phone || !password || !confirmPassword) {
        e.preventDefault();
        alert("Please fill all fields.");
        return;
      }

      // Basic phone validation (10 digits)
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
  }
});
