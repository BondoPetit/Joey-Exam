document.addEventListener('DOMContentLoaded', async () => {
    const resultsList = document.getElementById('results-list');

    try {
        // Fetch quiz results from the server
        const response = await fetch('https://joe-and-the-juice.engineer/quiz/results');
        if (!response.ok) {
            throw new Error('Failed to fetch quiz results from the server');
        }

        const quizResults = await response.json();

        if (quizResults.length === 0) {
            resultsList.innerHTML = '<p>No quiz results available at the moment.</p>';
        } else {
            quizResults.forEach((quiz, index) => {
                const quizDiv = document.createElement('div');
                quizDiv.classList.add('quiz-result');
                quizDiv.innerHTML = `
                    <h3>Quiz: ${quiz.title}</h3>
                    <button class="toggle-results-button">Show Results</button>
                    <div class="quiz-results hidden"></div>
                `;

                const resultsContainer = quizDiv.querySelector('.quiz-results');
                quiz.results.forEach((result) => {
                    const resultDiv = document.createElement('div');
                    resultDiv.classList.add('result');
                    resultDiv.innerHTML = `
                        <p><strong>Submitted by Employee ID:</strong> ${result.employeeId}</p>
                        <p><strong>Incorrect Answers Count:</strong> ${result.incorrectCount}</p>
                    `;

                    result.questions.forEach((question, qIndex) => {
                        const questionBlock = document.createElement('div');
                        questionBlock.classList.add('question-block');
                        questionBlock.innerHTML = `
                            <p><strong>Question ${qIndex + 1}: ${question.text}</strong></p>
                            <p class="answer"><strong>Employee's Answer:</strong> ${question.employeeAnswer}</p>
                            <p class="correct-answer"><strong>Correct Answer:</strong> ${question.correctAnswer}</p>
                            <p class="${question.isCorrect ? 'correct' : 'incorrect'}">${question.isCorrect ? 'Correct' : 'Incorrect'}</p>
                        `;
                        resultDiv.appendChild(questionBlock);
                    });

                    resultsContainer.appendChild(resultDiv);
                });

                const toggleButton = quizDiv.querySelector('.toggle-results-button');
                toggleButton.addEventListener('click', () => {
                    resultsContainer.classList.toggle('hidden');
                    toggleButton.textContent = resultsContainer.classList.contains('hidden') ? 'Show Results' : 'Hide Results';
                });

                resultsList.appendChild(quizDiv);
            });
        }
    } catch (error) {
        console.error('Error fetching quiz results:', error);
        resultsList.innerHTML = '<p>Error fetching quiz results. Please try again later.</p>';
    }
});
