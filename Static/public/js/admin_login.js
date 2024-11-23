document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('admin-login-form');

    // Funktionsdefinition til at udtrække URL-parametre
    function getQueryParams() {
        const params = {};
        window.location.search
            .substring(1)
            .split('&')
            .forEach(function (param) {
                const [key, value] = param.split('=');
                params[key] = decodeURIComponent(value);
            });
        return params;
    }

    // Hent login-parametre fra URL'en
    const params = getQueryParams();
    const { username, password } = params;

    // Hvis både username og password er i URL'en, forsøg automatisk at logge ind
    if (username && password) {
        try {
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
                console.error('Error during auto-login:', await response.text());
                alert('Auto-login failed. Please try logging in manually.');
            }
        } catch (error) {
            console.error('Error during auto-login:', error);
            alert('An error occurred while trying to log in.');
        }
    }

    // Håndtering af manual login form
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Forhindrer standard form submission

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
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
                    const errorData = await response.json();
                    alert(errorData.error || 'Invalid credentials.');
                }
            } catch (error) {
                console.error('Error during manual login:', error);
                alert('An error occurred while logging in.');
            }
        });
    }
});
