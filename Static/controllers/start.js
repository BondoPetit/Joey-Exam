document.addEventListener('DOMContentLoaded', () => {
    const coachButton = document.getElementById('coach-button');
    const teamplayerButton = document.getElementById('teamplayer-button');

    coachButton.addEventListener('click', () => {
        window.location.href = 'admin-login.html';
    });

    teamplayerButton.addEventListener('click', () => {
        window.location.href = 'employee-login.html';
    });
});
