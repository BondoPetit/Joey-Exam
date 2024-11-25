// This script is responsible for fetching quizzes from the database and displaying them for employees to take.
document.addEventListener('DOMContentLoaded', async () => {
    const quizList = document.getElementById('quiz-list');

    try {
        // Fetch quizzes from the server
        const response = await fetch('https://joe-and-the-juice.engineer/employee/get');
        if (!response.ok) {
            throw new Error('Failed to fetch quizzes from the server');
        }

        const quizzes = await response.json();

        if (quizzes.length === 0) {
            quizList.innerHTML = '<p>No quizzes available at the moment. Please check back later.</p>';
        } else {
            quizzes.forEach((quiz, index) => {
                const quizDiv = document.createElement('div');
                quizDiv.classList.add('quiz');
                quizDiv.innerHTML = `
                    <h3>${quiz.title}</h3>
                    <button onclick="startQuiz(${index})">Take Quiz</button>
                `;
                quizList.appendChild(quizDiv);
            });
        }
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        quizList.innerHTML = '<p>Error fetching quizzes. Please try again later.</p>';
    }

    // Function to handle quiz taking
    window.startQuiz = async function (quizIndex) {
        try {
            const response = await fetch(`https://joe-and-the-juice.engineer/employee/get/${quizIndex}`);
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
                    answerInput.value = aIndex + 1;
                    answerLabel.appendChild(answerInput);
                    answerLabel.append(` ${answer}`);
                    questionDiv.appendChild(answerLabel);
                    questionDiv.appendChild(document.createElement('br'));
                });
                quizContainer.appendChild(questionDiv);
            });

            const submitButton = document.createElement('button');
            submitButton.textContent = 'Submit Quiz';
            submitButton.onclick = async () => {
                // Gather results from the quiz
                const employeeAnswers = [];
                quiz.questions.forEach((question, qIndex) => {
                    const selectedAnswer = document.querySelector(`input[name="question-${qIndex}"]:checked`);
                    employeeAnswers.push({
                        text: question.text,
                        employeeAnswer: selectedAnswer ? selectedAnswer.value : "No answer",
                        correctAnswer: question.correctAnswer
                    });
                });

                // Create result object
                const result = {
                    title: quiz.title,
                    employeeId: `EMP${Math.floor(Math.random() * 1000)}`, // Dummy employee ID, replace with actual ID if available
                    questions: employeeAnswers
                };

                // Send the result to the server to save in the database
                try {
                    const response = await fetch('https://joe-and-the-juice.engineer/employee/submit', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(result)
                    });

                    if (response.ok) {
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

                quizList.innerHTML = ''; // Clear quiz list or redirect user as needed
            };
            quizContainer.appendChild(submitButton);

            quizList.innerHTML = '';
            quizList.appendChild(quizContainer);
        } catch (error) {
            console.error('Error fetching quiz details:', error);
            quizList.innerHTML = '<p>Error fetching quiz details. Please try again later.</p>';
        }
    }
});
