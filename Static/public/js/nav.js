document.addEventListener('DOMContentLoaded', () => {
    // Navigation toggle script with smoother animation
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            if (navMenu.classList.contains('visible')) {
                // Hide the menu smoothly without affecting header
                navMenu.style.transition = 'transform 0.8s ease, opacity 0.8s ease';
                navMenu.style.opacity = '0';
                navMenu.style.transform = 'translateX(-100%)';
                setTimeout(() => {
                    navMenu.classList.remove('visible');
                    navMenu.style.display = 'none';
                }, 800);
            } else {
                // Show the menu smoothly without affecting header
                navMenu.style.display = 'block';
                setTimeout(() => {
                    navMenu.style.transition = 'transform 0.8s ease, opacity 0.8s ease';
                    navMenu.classList.add('visible');
                    navMenu.style.opacity = '1';
                    navMenu.style.transform = 'translateX(0)';
                }, 10);
            }
        });
    }
});
