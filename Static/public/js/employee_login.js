document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('employee-login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); 

            // Hent inputfelter
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/employee_login/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                if (response.ok) {
                    const result = await response.json();

                    // Gem employeeID i localStorage
                    if (result.employeeId) {
                        console.log('Employee ID received:', result.employeeId);
                        sessionStorage.setItem('employeeId', result.employeeId);
                        console.log('Employee ID saved in sessionStorage');
                    } else {
                        console.error('No employeeId found in the response');
                    }

                    // Redirect til employee dashboard
                    if (result.redirectUrl) {
                        window.location.href = result.redirectUrl;
                    }
                } else {
                    const errorData = await response.json();
                    alert(errorData.error || 'Invalid credentials.');
                }
            } catch (error) {
                console.error('Error during login:', error);
                alert('An error occurred while logging in.');
            }
        });
    }
});
