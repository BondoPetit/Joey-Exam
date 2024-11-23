document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('admin-login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Forhindrer standard form submission
            
            // Få fat i inputfelterne
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                // Send en POST-anmodning til serveren for login
                const response = await fetch('/admin_login/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.redirectUrl) {
                        window.location.href = result.redirectUrl; // Redirect til admin dashboard
                    }
                } else {
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.indexOf("application/json") !== -1) {
                        const errorData = await response.json();
                        alert(errorData.error || 'Invalid credentials.');
                    } else {
                        alert('An error occurred: ' + response.statusText);
                    }
                }
            } catch (error) {
                console.error('Error during admin login:', error);
                alert('An error occurred while logging in.');
            }
        });
    }
});

