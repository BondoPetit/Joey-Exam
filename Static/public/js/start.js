document.addEventListener('DOMContentLoaded', () => {
    // RTT-pinger måling
    const startTime = Date.now();
    const pingUrl = `${window.location.origin}/ping`; // Dynamisk URL baseret på værtsadresse
    fetch(pingUrl)
        .then(response => response.text())
        .then(() => {
            const endTime = Date.now();
            console.log(`RTT mellem klient og server: ${endTime - startTime} ms`);
        })
        .catch(error => console.error('Ping fejlede:', error));

    // Håndtering af knapper
    const coachButton = document.getElementById('coach-button');
    const teamplayerButton = document.getElementById('teamplayer-button');

    coachButton.addEventListener('click', () => {
        window.location.href = '/static/views/admin_login.html';
    });

    teamplayerButton.addEventListener('click', () => {
        window.location.href = '/static/views/employee_login.html';
    });
});
