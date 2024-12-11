document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('employee-register-form');
    const phoneNumberInput = document.getElementById('phone-number');

    if (!phoneNumberInput) {
        console.error("Phone number input field not found!");
        return;
    }

    // Initialize intl-tel-input
    const iti = window.intlTelInput(phoneNumberInput, {
        initialCountry: 'auto',
        geoIpLookup: (callback) => {
            fetch('https://ipinfo.io?token=a085c8e14684e6')
                .then((resp) => resp.json())
                .then((data) => callback(data.country))
                .catch(() => callback('us'));
        },
        utilsScript: '/static/static/js/utils.js', // Ensure this path matches your server setup
    });

    console.log("IntlTelInput initialized:", iti);

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Check if utils.js is loaded and intl-tel-input validation is available
        if (typeof intlTelInputUtils === "undefined") {
            alert("Phone number validation is not available. Please try again later.");
            return;
        }

        const emailField = document.getElementById('email');
        const passwordField = document.getElementById('password');
        const confirmPasswordField = document.getElementById('confirm-password');

        const email = emailField.value.trim();
        const password = passwordField.value;
        const confirmPassword = confirmPasswordField.value;

        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        if (!iti.isValidNumber()) {
            console.error("Validation failed. Error code:", iti.getValidationError());
            const errorMessages = {
                1: "Invalid country code.",
                2: "Number is too short.",
                3: "Number is too long.",
                4: "Invalid number format.",
            };
            alert(errorMessages[iti.getValidationError()] || "Invalid phone number.");
            return;
        }

        const phoneNumber = iti.getNumber(); // Get the full E.164 formatted number
        console.log("E.164 formatted phone number:", phoneNumber);

        try {
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

                const response = await fetch('/employee_login/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, phoneNumber, password }),
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.employeeId) {
                        sessionStorage.setItem('employeeId', result.employeeId);
                    }
                    if (result.redirectUrl) {
                        window.location.href = result.redirectUrl;
                    }
                } else {
                    const errorData = await response.json();
                    alert(errorData.error || 'An error occurred while registering.');
                }
            } else {
                alert('Failed to send verification code. Please try again.');
            }
        } catch (error) {
            console.error('Error during registration:', error);
            alert('An error occurred while registering.');
        }
    });
});
