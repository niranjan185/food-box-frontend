document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('login-form');

  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      const phone = document.getElementById('phn').value.trim();
      const password = document.getElementById('password').value.trim();

      if (phone === "" || password === "") {
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
    });
  }
});
