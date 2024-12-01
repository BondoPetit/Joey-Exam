// This script is responsible for handling employee login, fetching quizzes from the database, and displaying them for employees to take. 
document.addEventListener('DOMContentLoaded', async () => {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.style.display = 'block'; // Ensure logout button is visible
        logoutButton.addEventListener('click', async () => {
            try {
                const response = await fetch('/employee/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });
                if (response.ok) {
                    window.location.href = '/static/views/employee_login.html';
                } else {
                    alert('Failed to log out. Please try again.');
                }
            } catch (error) {
                console.error('Error during logout:', error);
                alert('An error occurred while logging out.');
            }
        });
    }

    const quizList = document.getElementById('quiz-list');
    const loggedInUserSpan = document.getElementById('logged-in-user');
    let quizzes = []; // Declare quizzes variable to be used globally

    // Check who is logged in
    try {
        const response = await fetch('/employee/whoami', { credentials: 'include' });
        if (response.ok) {
            const result = await response.json();
            if (result.loggedIn && result.userType === 'employee') {
                // Show the logged in email
                loggedInUserSpan.textContent = `Logged in as: ${result.email}`;
            } else {
                alert('You are not authorized to view this page. Please log in as an employee.');
                // Redirect to login page
                window.location.href = `${window.location.origin}/static/views/employee_login.html`;
                return; // Stop further script execution
            }
        } else {
            alert('Unable to verify login status. Please log in.');
            // Redirect to login page
            window.location.href = `${window.location.origin}/static/views/employee_login.html`;
            return; // Stop further script execution
        }
    } catch (error) {
        console.error('Error checking login status:', error);
        alert('An error occurred while checking login status. Please log in.');
        // Redirect to login page
        window.location.href = `${window.location.origin}/static/views/employee_login.html`;
        return; // Stop further script execution
    }

    try {
        // Fetch quizzes from the server
        const response = await fetch('/employee/get', { credentials: 'include' });
        if (!response.ok) {
            throw new Error('Failed to fetch quizzes from the server');
        }

        quizzes = await response.json();

        if (quizzes.length === 0) {
            quizList.innerHTML = '<p>No quizzes available at the moment. Please check back later.</p>';
        } else {
            loadAvailableQuizzes();
        }
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        quizList.innerHTML = '<p>Error fetching quizzes. Please try again later.</p>';
    }

    // Function to handle quiz taking
    window.startQuiz = async function (quizID) {
        try {
            const response = await fetch(`/employee/get/${quizID}`, { credentials: 'include' });
            if (!response.ok) {
                throw new Error('Failed to fetch quiz details from the server');
            }

            const quiz = await response.json();
            const quizContainer = document.createElement('div');
            quizContainer.classList.add('quiz-container');
            quizContainer.innerHTML = `<h3>${quiz.title}</h3>`;

            quiz.questions.forEach((question, qIndex) => {
                const questionDiv = document.createElement('div');
                questionDiv.classList.add('question');
                questionDiv.innerHTML = `
                    <p><strong>Question ${qIndex + 1}: </strong>${question.text}</p>
                `;
                question.answers.forEach((answer, aIndex) => {
                    const answerLabel = document.createElement('label');
                    const answerInput = document.createElement('input');
                    answerInput.type = 'radio';
                    answerInput.name = `question-${qIndex}`;
                    answerInput.value = answer.text;
                    answerLabel.appendChild(answerInput);
                    answerLabel.append(` ${answer.text}`);
                    questionDiv.appendChild(answerLabel);
                    questionDiv.appendChild(document.createElement('br'));
                });
                quizContainer.appendChild(questionDiv);
            });

            // Create button container and buttons
            const buttonContainer = document.createElement('div');
            buttonContainer.classList.add('button-container');

            const backButton = document.createElement('button');
            backButton.textContent = 'Back to Available Quizzes';
            backButton.classList.add('back-button');
            backButton.onclick = () => {
                quizContainer.remove();
                loadAvailableQuizzes();
            };
            buttonContainer.appendChild(backButton);

            const submitButton = document.createElement('button');
            submitButton.textContent = 'Submit Quiz';
            submitButton.classList.add('submit-quiz');
            submitButton.onclick = async () => {
                // Gather results from the quiz
                const employeeAnswers = [];
                quiz.questions.forEach((question, qIndex) => {
                    const selectedAnswer = document.querySelector(`input[name="question-${qIndex}"]:checked`);
                    employeeAnswers.push({
                        text: question.text,
                        employeeAnswer: selectedAnswer ? selectedAnswer.value : "No answer",
                        correctAnswer: question.answers.find(answer => answer.isCorrect).text
                    });
                });

                // Retrieve employeeId from session storage
                const employeeId = sessionStorage.getItem('employeeId');
                if (!employeeId) {
                    alert('No employee ID found. Please log in again.');
                    return;
                }

                // Create result object
                const result = {
                    title: quiz.title,
                    employeeId: employeeId, // Use actual employee ID from session
                    questions: employeeAnswers
                };

                // Send the result to the server to save in the database
                try {
                    const response = await fetch('/employee/submit', { 
                        credentials: 'include',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(result)
                    });                    

                    if (response.ok) {
                        // Show feedback after submission
                        quiz.questions.forEach((question, qIndex) => {
                            const selectedAnswer = document.querySelector(`input[name="question-${qIndex}"]:checked`);
                            const questionDiv = document.querySelectorAll('.question')[qIndex];
                            const feedbackDiv = document.createElement('div');
                            feedbackDiv.classList.add('feedback');

                            if (selectedAnswer && selectedAnswer.value === question.answers.find(answer => answer.isCorrect).text) {
                                feedbackDiv.classList.add('correct');
                                feedbackDiv.innerText = 'Correct!';
                            } else {
                                feedbackDiv.classList.add('incorrect');
                                feedbackDiv.innerText = 'Incorrect!';
                            }

                            questionDiv.appendChild(feedbackDiv);
                        });
                        alert('Quiz submitted successfully!');
                    } else {
                        const error = await response.json();
                        console.error('Error submitting quiz:', error.error);
                        alert('Error submitting quiz: ' + error.error);
                    }
                } catch (err) {
                    console.error('Error during quiz submission:', err);
                    alert('An error occurred while submitting the quiz.');
                }
            };
            buttonContainer.appendChild(submitButton);

            // Append button container after questions
            quizContainer.appendChild(buttonContainer);

            quizList.innerHTML = '';
            quizList.appendChild(quizContainer);
        } catch (error) {
            console.error('Error fetching quiz details:', error);
            quizList.innerHTML = '<p>Error fetching quiz details. Please try again later.</p>';
        }
    }

    // Function to reload available quizzes
    function loadAvailableQuizzes() {
        quizList.innerHTML = '';
        quizzes.forEach((quiz) => {
            const quizDiv = document.createElement('div');
            quizDiv.classList.add('quiz');
            quizDiv.style.position = 'relative';

            // Add status icon to indicate if the quiz is completed
            const statusIcon = document.createElement('div');
            statusIcon.classList.add('status-icon');
            if (quiz.completed) {
                statusIcon.innerHTML = '&#x2714;'; // Green checkmark symbol
                statusIcon.style.backgroundColor = 'green';
                statusIcon.style.color = 'white';
            } else {
                statusIcon.innerHTML = '&#x25CB;'; // Circle symbol
                statusIcon.style.color = 'grey';
            }
            statusIcon.style.position = 'absolute';
            statusIcon.style.top = '10px';
            statusIcon.style.right = '10px';
            statusIcon.style.width = '25px';
            statusIcon.style.height = '25px';
            statusIcon.style.borderRadius = '50%';
            statusIcon.style.display = 'flex';
            statusIcon.style.alignItems = 'center';
            statusIcon.style.justifyContent = 'center';
            quizDiv.appendChild(statusIcon);

            quizDiv.innerHTML += `
                <h3>${quiz.title}</h3>
                <button onclick="startQuiz(${quiz.quizID})">Take Quiz</button>
            `;
            quizList.appendChild(quizDiv);
        });
    }
});
