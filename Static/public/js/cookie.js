// cookie.js - Script for handling cookies in the application

// Set a cookie with specified name, value, and expiration days
function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    const secure = location.protocol === 'https:' ? ';secure' : '';
    const sameSite = ';samesite=Strict'; // Ensures the cookie is sent in a first-party context only
    document.cookie = `${name}=${value};${expires};path=/${secure}${sameSite}`;
}

// Get a cookie by name
function getCookie(name) {
    const cname = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookies = decodedCookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let c = cookies[i].trim();
        if (c.indexOf(cname) == 0) {
            return c.substring(cname.length, c.length);
        }
    }
    return "";
}

// Delete a cookie by name
function deleteCookie(name) {
    setCookie(name, "", -1);
}

// Example usage for login tracking or user preferences
function rememberUserPreference(theme) {
    setCookie("userTheme", theme, 30); // Save theme preference for 30 days
}

function loadUserPreference() {
    const theme = getCookie("userTheme");
    if (theme) {
        document.body.className = theme; // Apply the saved theme
    }
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { setCookie, getCookie, deleteCookie, rememberUserPreference, loadUserPreference };
}
