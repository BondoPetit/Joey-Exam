document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('employee-register-form');
    console.log('Register Form:', registerForm); // Tjekker om registerForm findes

    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Forhindrer standard form submission
            
            // Få fat i inputfelter ved hjælp af deres ID'er og log dem
            const emailField = document.getElementById('email');
            const passwordField = document.getElementById('password');
            const confirmPasswordField = document.getElementById('confirm-password');

            console.log('Email Field:', emailField);
            console.log('Password Field:', passwordField);
            console.log('Confirm Password Field:', confirmPasswordField);

            if (!emailField || !passwordField || !confirmPasswordField) {
                alert('One or more fields are missing.');
                return;
            }

            const email = emailField.value;
            const password = passwordField.value;
            const confirmPassword = confirmPasswordField.value;

            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }

            try {
                // Send POST request til serveren for at registrere medarbejderen
                const response = await fetch('http://localhost:3000/employee_login/register', { // Opdater URL
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: email, password }),
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.redirectUrl) {
                        window.location.href = result.redirectUrl; // Redirect til employee dashboard
                    }
                } else {
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.indexOf("application/json") !== -1) {
                        const errorData = await response.json();
                        alert(errorData.error || 'An error occurred while registering.');
                    } else {
                        alert('An error occurred: ' + response.statusText);
                    }
                }
            } catch (error) {
                console.error('Error during registration:', error);
                alert('An error occurred while registering.');
            }
        });
    }
});
