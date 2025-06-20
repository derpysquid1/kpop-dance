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
    if (!response.credential) {
        showMessage('login-message', 'Google sign-in failed. Please try again.', 'error');
        return;
    }

    const credential = response.credential;
    const payload = parseJwt(credential);
    
    // Create user object from Google data
    const user = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        provider: 'google',
        emailVerified: payload.email_verified,
        createdAt: new Date().toISOString()
    };
    
    try {
        // Save user to database if new
        saveUser(user);
        
        // Save auth state
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('googleCredential', credential); // Store for token refresh
        
        // Save remember me state if checked
        const remember = document.getElementById('remember').checked;
        if (remember) {
            localStorage.setItem('rememberUser', JSON.stringify({
                email: user.email,
                userId: user.id,
                provider: 'google'
            }));
        }
        
        showMessage('login-message', 'Sign in successful! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } catch (error) {
        console.error('Google sign-in error:', error);
        showMessage('login-message', 'An error occurred during sign-in. Please try again.', 'error');
    }
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

// Password visibility toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('password');
    const toggleButton = document.querySelector('.password-toggle');
    const eyeIcon = toggleButton.querySelector('.eye-icon');
    const eyeOffIcon = toggleButton.querySelector('.eye-off-icon');

    // Show the initial icon (eye-off for hidden password)
    eyeOffIcon.style.display = 'block';

    // Function to toggle password visibility
    function togglePasswordVisibility(show) {
        passwordInput.type = show ? 'text' : 'password';
        eyeIcon.style.display = show ? 'block' : 'none';
        eyeOffIcon.style.display = show ? 'none' : 'block';
    }

    // Handle click events (toggle on/off)
    toggleButton.addEventListener('click', (e) => {
        e.preventDefault();
        const currentType = passwordInput.type;
        togglePasswordVisibility(currentType === 'password');
    });

    // Handle mouse events (show while holding)
    toggleButton.addEventListener('mousedown', (e) => {
        e.preventDefault();
        togglePasswordVisibility(true);
    });

    toggleButton.addEventListener('mouseup', (e) => {
        e.preventDefault();
        togglePasswordVisibility(false);
    });

    toggleButton.addEventListener('mouseleave', (e) => {
        e.preventDefault();
        togglePasswordVisibility(false);
    });

    // Handle touch events for mobile devices
    toggleButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        togglePasswordVisibility(true);
    });

    toggleButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        togglePasswordVisibility(false);
    });
});

// Function to toggle password visibility
function togglePasswordVisibility(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}
