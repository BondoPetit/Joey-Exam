document.addEventListener('DOMContentLoaded', () => {
    const quizList = document.getElementById('quiz-list');

    // Simulate fetching quizzes from server/local storage
    const quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];

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

    // Function to handle quiz taking
    window.startQuiz = function(quizIndex) {
        const quiz = quizzes[quizIndex];
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
        submitButton.onclick = () => {
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

            // Store result in local storage
            const quizResults = JSON.parse(localStorage.getItem('quizResults')) || [];
            quizResults.push(result);
            localStorage.setItem('quizResults', JSON.stringify(quizResults));

            alert('Quiz submitted successfully!');
            quizList.innerHTML = ''; // Clear quiz list or redirect user as needed
        };
        quizContainer.appendChild(submitButton);

        quizList.innerHTML = '';
        quizList.appendChild(quizContainer);
    }
});
