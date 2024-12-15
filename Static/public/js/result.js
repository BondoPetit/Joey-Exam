document.addEventListener('DOMContentLoaded', async () => {
    const resultsList = document.getElementById('results-list');
    const loggedInUserSpan = document.getElementById('logged-in-user');
    const logoutButton = document.getElementById('logout-button');

    // Tjekker login status
    try {
        const response = await fetch('/admin/whoami');
        if (response.ok) {
            const result = await response.json();
            if (result.loggedIn && result.userType === 'admin') {
                // Viser brugernavnet for den der er logget ind
                loggedInUserSpan.textContent = `Logged in as: ${result.username}`;
                logoutButton.style.display = 'block';
            } else {
                alert('You are not authorized to view this page. Please log in as an admin.');
                window.location.href = `${window.location.origin}/Static/views/admin_login.html`;
                return; 
            }
        } else {
            alert('Unable to verify login status. Please log in.');
            window.location.href = `${window.location.origin}/Static/views/admin_login.html`;
            return; 
        }
    } catch (error) {
        console.error('Error checking login status:', error);
        alert('An error occurred while checking login status. Please log in.');
        window.location.href = `${window.location.origin}/Static/views/admin_login.html`;
        return; 
    }

    // Logout knap
    logoutButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/admin/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                window.location.href = `${window.location.origin}`;
            } else {
                alert('Failed to log out. Please try again.');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            alert('An error occurred while logging out.');
        }
    });

    // Henter quizresultater
    try {
        const response = await fetch('/results'); // Opdaterer URL
        if (response.status === 401) {
            resultsList.innerHTML = '<p>You must be logged in as an admin to view quiz results.</p>';
            return;
        }

        if (!response.ok) {
            throw new Error('Failed to fetch quiz results from the server');
        }

        const quizResults = await response.json();

        // Tjekker hvis quizresultaterne er tomme
        if (!Array.isArray(quizResults) || quizResults.length === 0) {
            resultsList.innerHTML = '<p>No quiz results available at the moment.</p>';
            return;
        }

        quizResults.forEach((quiz, index) => {
            if (!quiz || !quiz.title || !Array.isArray(quiz.employeeSummaries)) {
                console.warn(`Quiz data is missing or incorrect at index ${index}`);
                return;
            }

            const quizDiv = document.createElement('div');
            quizDiv.classList.add('quiz-result');
            quizDiv.innerHTML = `
                <h3>Quiz: ${quiz.title}</h3>
                <button class="toggle-results-button">Show Employee Answers</button>
                <div class="quiz-results hidden"></div>
            `;

            const resultsContainer = quizDiv.querySelector('.quiz-results');
            quiz.employeeSummaries.forEach((result) => {
                const resultDiv = document.createElement('div');
                resultDiv.classList.add('employee-summary');
                resultDiv.innerHTML = `
                    <p><strong>Submitted by Employee ID:</strong> ${result.employeeId}</p>
                    <p><strong>Incorrect Answers Count:</strong> ${result.incorrectCount}</p>
                `;

                resultsContainer.appendChild(resultDiv);
            });

            const toggleButton = quizDiv.querySelector('.toggle-results-button');
            toggleButton.addEventListener('click', () => {
                resultsContainer.classList.toggle('hidden');
                toggleButton.textContent = resultsContainer.classList.contains('hidden') ? 'Show Employee Answers' : 'Hide Employee Answers';
            });

            resultsList.appendChild(quizDiv);
        });
    } catch (error) {
        console.error('Error fetching quiz results:', error);
        resultsList.innerHTML = '<p>Error fetching quiz results. Please try again later.</p>';
    }
});
