document.addEventListener('DOMContentLoaded', () => {
    // RTT og responstid måling
    async function measureRTT() {
        const startTime = Date.now(); // Starttidspunkt for anmodning (RTT)

        try {
            // Dynamisk URL baseret på værtsadresse
            const pingUrl = `${window.location.origin}/ping`;

            const response = await new Promise((resolve, reject) => {
                const req = new XMLHttpRequest();
                req.open('GET', pingUrl, true); // Åben en asynkron GET-anmodning
                req.onreadystatechange = () => {
                    if (req.readyState === 4) {
                        if (req.status === 200) {
                            resolve(req); // Forespørgslen lykkedes
                        } else {
                            reject(new Error(`HTTP Error: ${req.status}`));
                        }
                    }
                };

                req.onerror = (err) => {
                    reject(err); // Fang fejl
                };

                const sendStartTime = Date.now(); // Tidspunkt for afsendelse
                req.send();
                req.responseStartTime = sendStartTime; // Tilføj tidspunkt til objektet
            });

            const responseTime = Date.now() - response.responseStartTime; // Responstid
            const RTT = Date.now() - startTime; // Beregn RTT

            console.log(`Responstid: ${responseTime} ms`);
            console.log(`RTT mellem klient og server: ${RTT} ms`);
        } catch (error) {
            console.error('Error measuring RTT and Responstid:', error);
        }
    }

    // Kør pinger-funktionen hvert 5. sekund for at måle RTT og responstid
    setInterval(measureRTT, 5000);

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
