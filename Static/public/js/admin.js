// This script listens for the DOMContentLoaded event, and initializes the quiz functionality.
document.addEventListener('DOMContentLoaded', () => {
    const quizForm = document.getElementById('quiz-form');
    if (!quizForm) return;
    const addQuestionButton = document.getElementById('add-question');
    if (!addQuestionButton) return;
    const questionsContainer = document.getElementById('questions-container');
    let questionCount = 1;

    addQuestionButton.addEventListener('click', () => {
        questionCount++;
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('question');
        questionDiv.setAttribute('data-question-id', questionCount);
        
        questionDiv.innerHTML = `
            <label for="question-${questionCount}">Question ${questionCount}:</label>
            <input type="text" id="question-${questionCount}" name="question-${questionCount}" required>
            
            <label for="answer-${questionCount}-1">Answer 1:</label>
            <input type="text" id="answer-${questionCount}-1" name="answer-${questionCount}-1" required>
            
            <label for="answer-${questionCount}-2">Answer 2:</label>
            <input type="text" id="answer-${questionCount}-2" name="answer-${questionCount}-2" required>
            
            <label for="answer-${questionCount}-3">Answer 3:</label>
            <input type="text" id="answer-${questionCount}-3" name="answer-${questionCount}-3" required>
            
            <label for="correct-answer-${questionCount}">Correct Answer:</label>
            <input type="number" id="correct-answer-${questionCount}" name="correct-answer-${questionCount}" min="1" max="3" required>
        `;
        
        questionsContainer.appendChild(questionDiv);
    });

    quizForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(quizForm);
        const quizData = {};

        quizData.title = formData.get('quiz-title');
        quizData.questions = [];

        for (let i = 1; i <= questionCount; i++) {
            const question = {
                text: formData.get(`question-${i}`),
                answers: [
                    formData.get(`answer-${i}-1`),
                    formData.get(`answer-${i}-2`),
                    formData.get(`answer-${i}-3`)
                ],
                correctAnswer: formData.get(`correct-answer-${i}`)
            };
            quizData.questions.push(question);
        }

        console.log(quizData);
        
        // Send quiz data to the backend to save in the database
        try {
            const response = await fetch('/quiz/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(quizData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Quiz saved to database:', result.message);
                alert('Quiz saved successfully.');
            } else {
                const error = await response.json();
                console.error('Error saving quiz:', error.error);
                alert('Error saving quiz: ' + error.error);
            }
        } catch (err) {
            console.error('Error during quiz save request:', err);
            alert('An error occurred while saving the quiz.');
        }
    });
});
