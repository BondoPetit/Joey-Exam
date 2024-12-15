
// Laver en cookie med en specifik navn, værdi, og expiration
function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    const secure = location.protocol === 'https:' ? ';secure' : '';
    const sameSite = ';samesite=Strict'; // Bruger kun cookie'en på den samme webside
    document.cookie = `${name}=${value};${expires};path=/${secure}${sameSite}`;
}

// Henter en cookie ved at bruge navnet
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

// Sletter et bestemt cookie
function deleteCookie(name) {
    setCookie(name, "", -1);
}

// Kan bruges til at gemme bruger layout præferencer
function rememberUserPreference(theme) {
    setCookie("userTheme", theme, 30); // Gemmer præferencer i 30 dage
}

function loadUserPreference() {
    const theme = getCookie("userTheme");
    if (theme) {
        document.body.className = theme; // Sæt den valgte tema
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { setCookie, getCookie, deleteCookie, rememberUserPreference, loadUserPreference };
}
