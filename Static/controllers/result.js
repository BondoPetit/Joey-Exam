document.addEventListener('DOMContentLoaded', () => {
    const resultsList = document.getElementById('results-list');

    // Fetch quiz results from local storage
    const quizResults = JSON.parse(localStorage.getItem('quizResults')) || [];

    if (quizResults.length === 0) {
        resultsList.innerHTML = '<p>No quiz results available at the moment.</p>';
    } else {
        quizResults.forEach((result, index) => {
            const resultDiv = document.createElement('div');
            resultDiv.classList.add('result');
            resultDiv.innerHTML = `
                <h3>Quiz: ${result.title}</h3>
                <p><strong>Submitted by Employee ID:</strong> ${result.employeeId}</p>
            `;

            result.questions.forEach((question, qIndex) => {
                const questionBlock = document.createElement('div');
                questionBlock.classList.add('question-block');
                questionBlock.innerHTML = `
                    <p><strong>Question ${qIndex + 1}: ${question.text}</strong></p>
                    <p class="answer"><strong>Employee's Answer:</strong> ${question.employeeAnswer}</p>
                    <p class="correct-answer"><strong>Correct Answer:</strong> ${question.correctAnswer}</p>
                `;
                resultDiv.appendChild(questionBlock);
            });

            resultsList.appendChild(resultDiv);
        });
    }
});
