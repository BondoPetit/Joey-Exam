document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('employee-login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Forhindre standard form submission

            // Hent inputfelter
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('http://localhost:3000/employee_login/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.redirectUrl) {
                        window.location.href = result.redirectUrl; // Redirect til employee dashboard
                    }
                } else {
                    const errorData = await response.json();
                    alert(errorData.message || 'Invalid credentials.');
                }
            } catch (error) {
                console.error('Error during login:', error);
                alert('An error occurred while logging in.');
            }
        });
    }
});
