// Get database from localStorage
let database = JSON.parse(localStorage.getItem('kpopCompetitionData')) || {
    participants: [],
    votes: [],
    songs: [],
    voters: [],
    users: [] // Store registered users
};

// Google Sign-In handling
function handleGoogleSignIn(response) {
    const credential = response.credential;
    const payload = parseJwt(credential);
    
    const user = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        provider: 'google'
    };
    
    // Save user to database if new
    saveUser(user);
    
    // Save auth state
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    sessionStorage.setItem('isLoggedIn', 'true');
    
    showMessage('login-message', 'Sign in successful! Redirecting...', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

// Email/Password login handling
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    
    const user = database.users.find(u => 
        u.email === email && 
        u.password === hashPassword(password) &&
        u.provider === 'email'
    );
    
    if (user) {
        // Remove sensitive data
        const publicUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            provider: 'email'
        };
        
        // Save auth state
        sessionStorage.setItem('currentUser', JSON.stringify(publicUser));
        sessionStorage.setItem('isLoggedIn', 'true');
        
        if (remember) {
            localStorage.setItem('rememberUser', JSON.stringify({
                email: email,
                userId: user.id
            }));
        }
        
        showMessage('login-message', 'Sign in successful! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } else {
        showMessage('login-message', 'Invalid email or password!', 'error');
    }
});

function hashPassword(password) {
    // In production, use a proper hashing library
    return btoa(password);
}

function saveUser(user) {
    if (!database.users.find(u => u.id === user.id)) {
        database.users.push(user);
        localStorage.setItem('kpopCompetitionData', JSON.stringify(database));
    }
}

function showMessage(elementId, message, type) {
    const messageElement = document.getElementById(elementId);
    messageElement.innerHTML = `<div class="${type}-message" style="margin-bottom: 20px;">${message}</div>`;
    
    if (type !== 'error') {
        setTimeout(() => {
            messageElement.innerHTML = '';
        }, 5000);
    }
}

function showForgotPassword() {
    // You can implement password reset functionality here
    alert('Password reset functionality will be implemented soon!');
}

function showSignUp() {
    window.location.href = 'signup.html';
}

// Initialize the UI based on auth state
function initializeAuthUI() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    
    const signedInView = document.getElementById('signed-in-view');
    const googleSignIn = document.querySelector('.g_id_signin');
    const loginForm = document.getElementById('login-form');
    const orDivider = document.querySelector('.or-divider');
    
    if (isLoggedIn && currentUser) {
        // Show signed in view
        if (signedInView) {
            signedInView.style.display = 'block';
            const avatar = document.getElementById('user-avatar');
            const userName = document.getElementById('user-name');
            
            if (currentUser.picture) {
                avatar.src = currentUser.picture;
            } else {
                avatar.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="%23667eea"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-size="12">' + currentUser.name.charAt(0).toUpperCase() + '</text></svg>';
            }
            userName.textContent = currentUser.name;
        }
        
        // Hide other elements
        if (googleSignIn) googleSignIn.style.display = 'none';
        if (loginForm) loginForm.style.display = 'none';
        if (orDivider) orDivider.style.display = 'none';
    } else {
        // Show login options
        if (signedInView) signedInView.style.display = 'none';
        if (googleSignIn) googleSignIn.style.display = 'block';
        if (loginForm) loginForm.style.display = 'block';
        if (orDivider) orDivider.style.display = 'block';
    }
}

// Call this when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeAuthUI();
});

// Check for remembered user
document.addEventListener('DOMContentLoaded', function() {
    const remembered = localStorage.getItem('rememberUser');
    if (remembered) {
        const { email } = JSON.parse(remembered);
        document.getElementById('email').value = email;
        document.getElementById('remember').checked = true;
    }
});
