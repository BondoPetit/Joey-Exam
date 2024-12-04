document.addEventListener('DOMContentLoaded', async () => {
    const resultsList = document.getElementById('results-list');

    try {
        // Fetch quiz results from the server
        const response = await fetch('/results'); // Updated URL to be relative
        if (response.status === 401) {
            resultsList.innerHTML = '<p>You must be logged in as an admin to view quiz results.</p>';
            return;
        }

        if (!response.ok) {
            throw new Error('Failed to fetch quiz results from the server');
        }

        const quizResults = await response.json();

        // Add check to ensure quizResults is an array
        if (!Array.isArray(quizResults) || quizResults.length === 0) {
            resultsList.innerHTML = '<p>No quiz results available at the moment.</p>';
            return;
        }

        quizResults.forEach((quiz, index) => {
            // Check if quiz and its properties are defined
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
