document.addEventListener('DOMContentLoaded', () => {
    const coachButton = document.getElementById('coach-button');
    const teamplayerButton = document.getElementById('teamplayer-button');

    coachButton.addEventListener('click', () => {
        window.location.href = '/static/views/admin_login.html';
    });

    teamplayerButton.addEventListener('click', () => {
    window.location.href = '/static/views/employee_login.html';
});
});
