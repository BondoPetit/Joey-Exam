document.addEventListener('DOMContentLoaded', async () => {
    const quizContainer = document.getElementById('create-quiz');
    const toggleQuizButton = document.getElementById('toggle-quiz-button');

    // Toggler at quizzen bliver vist
    toggleQuizButton.addEventListener('click', () => {
        quizContainer.classList.toggle('show');
        toggleQuizButton.textContent = quizContainer.classList.contains('show')
            ? 'Hide Quiz Creator'
            : 'Show Quiz Creator';
    });
    
    
    const quizForm = document.getElementById('quiz-form');
    const addQuestionButton = document.getElementById('add-question');
    const questionsContainer = document.getElementById('questions-container');
    const loggedInUserSpan = document.getElementById('logged-in-user');
    const logoutButton = document.getElementById('logout-button');
    let questionCount = 1;

    // Tjekker hvem er logget ind
    try {
        const response = await fetch('/admin/whoami');
        if (response.ok) {
            const result = await response.json();
            if (result.loggedIn && result.userType === 'admin') {
                // Viser brugernavnen 
                loggedInUserSpan.textContent = `Logged in as: ${result.username}`;
                logoutButton.style.display = 'block';
            } else {
                alert('You are not authorized to view this page. Please log in as an admin.');
                // Redirecter til loginsiden
                window.location.href = `${window.location.origin}/static/views/admin_login.html`;
                return; 
            }
        } else {
            alert('Unable to verify login status. Please log in.');
            // Redirecter til loginsiden
            window.location.href = `${window.location.origin}/static/views/admin_login.html`;
            return; 
        }
    } catch (error) {
        console.error('Error checking login status:', error);
        alert('An error occurred while checking login status. Please log in.');
        // Redirect to login page
        window.location.href = `${window.location.origin}/static/views/admin_login.html`;
        return; // Stop further script execution
    }

    // Logout funktion
    logoutButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/admin/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                // Sender brugeren til loginsiden
                window.location.href = `${window.location.origin}/`;
            } else {
                alert('Failed to log out. Please try again.');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            alert('An error occurred while logging out.');
        }
    });

    if (!quizForm || !addQuestionButton || !questionsContainer) return;

    addQuestionButton.addEventListener('click', () => {
        questionCount++;
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('question', 'question-separator'); // Tilføjer en ny klasse for adskillelse
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
        
        // Sender quiz data til serveren til at gemme i databasen
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
                // Resetter form inputsne
                quizForm.reset();
                questionsContainer.innerHTML = '';
                questionCount = 1;
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
