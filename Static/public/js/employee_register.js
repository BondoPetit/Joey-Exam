document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('employee-register-form');
    console.log('Register Form:', registerForm); // Tjekker om registerForm findes

    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Forhindrer standard form submission
            
            // Få fat i inputfelter ved hjælp af deres ID'er og log dem
            const emailField = document.getElementById('email');
            const phoneNumberField = document.getElementById('phone-number');
            const passwordField = document.getElementById('password');
            const confirmPasswordField = document.getElementById('confirm-password');

            console.log('Email Field:', emailField);
            console.log('Phone Number Field:', phoneNumberField);
            console.log('Password Field:', passwordField);
            console.log('Confirm Password Field:', confirmPasswordField);

            if (!emailField || !phoneNumberField || !passwordField || !confirmPasswordField) {
                alert('One or more fields are missing.');
                return;
            }

            const email = emailField.value;
            const phoneNumber = phoneNumberField.value;
            const password = passwordField.value;
            const confirmPassword = confirmPasswordField.value;

            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }

            try {
                // Send POST request til serveren for at sende en verificeringskode via SMS
                const verificationResponse = await fetch('/employee_login/send-verification-code', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ phoneNumber }),
                });

                if (verificationResponse.ok) {
                    const verificationCode = prompt('A verification code has been sent to your phone. Please enter the code:');
                    if (!verificationCode) {
                        alert('Verification code is required.');
                        return;
                    }

                    // Send POST request til serveren for at bekræfte verificeringskoden
                    const verifyCodeResponse = await fetch('/employee_login/verify-code', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ phoneNumber, verificationCode }),
                    });

                    if (!verifyCodeResponse.ok) {
                        alert('Invalid verification code. Please try again.');
                        return;
                    }

                    // Send POST request til serveren for at registrere medarbejderen
                    const response = await fetch('/employee_login/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email, phoneNumber, password }),
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
                } else {
                    alert('Failed to send verification code. Please try again.');
                }
            } catch (error) {
                console.error('Error during registration:', error);
                alert('An error occurred while registering.');
            }
        });
    }
});
