document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('admin-login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); 

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
                    cache: 'no-store',
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.redirectUrl) {
                        console.log('Redirecting to:', result.redirectUrl);
                        window.location.href = result.redirectUrl; // Redirect til admin siden
                    } else {
                        console.warn('No redirect URL provided in response.');
                        alert('No redirect URL provided in response.');
                    }
                } else {
                    // Håndter fejl ved login
                    const errorData = await response.json();
                    console.error('Login failed:', errorData);
                    alert(errorData.error || 'Invalid credentials.');
                }
            } catch (error) {
                console.error('Error during admin login:', error);
                alert('An error occurred while logging in.');
            }
        });
    }
});

