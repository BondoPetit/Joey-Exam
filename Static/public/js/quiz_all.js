// quiz_all.js

document.addEventListener('DOMContentLoaded', async () => {
    const quizzesContainer = document.getElementById('quizzes-container');
    const loggedInUserSpan = document.getElementById('logged-in-user');
    const logoutButton = document.getElementById('logout-button');

    // Check who is logged in
    try {
        const response = await fetch('/admin/whoami');
        if (response.ok) {
            const result = await response.json();
            if (result.loggedIn && result.userType === 'admin') {
                // Show the logged in username
                loggedInUserSpan.textContent = `Logged in as: ${result.username}`;
                logoutButton.style.display = 'block';
            } else {
                alert('You are not authorized to view this page. Please log in as an admin.');
                // Redirect to login page
                window.location.href = `${window.location.origin}/static/views/admin_login.html`;
                return; // Stop further script execution
            }
        } else {
            alert('Unable to verify login status. Please log in.');
            // Redirect to login page
            window.location.href = `${window.location.origin}/static/views/admin_login.html`;
            return; // Stop further script execution
        }
    } catch (error) {
        console.error('Error checking login status:', error);
        alert('An error occurred while checking login status. Please log in.');
        // Redirect to login page
        window.location.href = `${window.location.origin}/static/views/admin_login.html`;
        return; // Stop further script execution
    }

    // Handle logout button click
    logoutButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/admin/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                // Redirect to the homepage after successful logout
                window.location.href = `${window.location.origin}/`;
            } else {
                alert('Failed to log out. Please try again.');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            alert('An error occurred while logging out.');
        }
    });

    // Fetch all quizzes from the server
    try {
        const response = await fetch('/quiz/all');
        if (response.ok) {
            const quizzes = await response.json();
            quizzes.forEach((quiz) => {
                const quizDiv = document.createElement('div');
                quizDiv.classList.add('quiz-item');
                quizDiv.innerHTML = `
                    <h3>${quiz.Title}</h3>
                    <button class="delete-quiz" data-quiz-id="${quiz.QuizID}">Delete</button>
                `;
                quizzesContainer.appendChild(quizDiv);
            });

            // Add event listeners to delete buttons
            document.querySelectorAll('.delete-quiz').forEach(button => {
                button.addEventListener('click', async (event) => {
                    const quizId = event.target.getAttribute('data-quiz-id');
                    if (confirm('Are you sure you want to delete this quiz?')) {
                        try {
                            const response = await fetch(`/quiz/delete/${quizId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            });
                            if (response.ok) {
                                alert('Quiz deleted successfully.');
                                // Reload the page to update the quiz list
                                window.location.reload();
                            } else {
                                alert('Failed to delete quiz. Please try again.');
                            }
                        } catch (error) {
                            console.error('Error deleting quiz:', error);
                            alert('An error occurred while deleting the quiz.');
                        }
                    }
                });
            });
        } else {
            alert('Failed to load quizzes. Please try again later.');
        }
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        alert('An error occurred while loading quizzes.');
    }
});
