document.addEventListener('DOMContentLoaded', () => {
    const resultsList = document.getElementById('results-list');

    // Simulate fetching quiz results from local storage
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
                const questionPara = document.createElement('p');
                questionPara.innerHTML = `<strong>Question ${qIndex + 1}: ${question.text}</strong>`;
                resultDiv.appendChild(questionPara);

                const answerPara = document.createElement('p');
                answerPara.classList.add('answer');
                answerPara.innerHTML = `Answer: ${question.employeeAnswer}`;
                resultDiv.appendChild(answerPara);
            });

            resultsList.appendChild(resultDiv);
        });
    }
});
