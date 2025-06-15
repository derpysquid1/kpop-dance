// Get database from localStorage
let database = JSON.parse(localStorage.getItem('kpopCompetitionData')) || {
    participants: [],
    votes: [],
    songs: [],
    voters: [],
    users: []
};

// Password validation
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirm-password');
const lengthCheck = document.getElementById('length-check');
const uppercaseCheck = document.getElementById('uppercase-check');
const lowercaseCheck = document.getElementById('lowercase-check');
const numberCheck = document.getElementById('number-check');
const matchCheck = document.getElementById('match-check');

function validatePassword() {
    const pass = password.value;
    const confirm = confirmPassword.value;
    
    // Length check
    if (pass.length >= 8) {
        lengthCheck.classList.add('valid');
    } else {
        lengthCheck.classList.remove('valid');
    }
    
    // Uppercase check
    if (/[A-Z]/.test(pass)) {
        uppercaseCheck.classList.add('valid');
    } else {
        uppercaseCheck.classList.remove('valid');
    }
    
    // Lowercase check
    if (/[a-z]/.test(pass)) {
        lowercaseCheck.classList.add('valid');
    } else {
        lowercaseCheck.classList.remove('valid');
    }
    
    // Number check
    if (/[0-9]/.test(pass)) {
        numberCheck.classList.add('valid');
    } else {
        numberCheck.classList.remove('valid');
    }
    
    // Match check
    if (pass === confirm && pass !== '') {
        matchCheck.classList.add('valid');
    } else {
        matchCheck.classList.remove('valid');
    }
}

password.addEventListener('input', validatePassword);
confirmPassword.addEventListener('input', validatePassword);

// Handle form submission
document.getElementById('signup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const fullname = document.getElementById('fullname').value;
    const email = document.getElementById('email').value;
    const pass = password.value;
    const confirm = confirmPassword.value;
    
    // Validate all requirements
    if (pass.length < 8) {
        showMessage('Password must be at least 8 characters long', 'error');
        return;
    }
    
    if (!/[A-Z]/.test(pass)) {
        showMessage('Password must contain at least one uppercase letter', 'error');
        return;
    }
    
    if (!/[a-z]/.test(pass)) {
        showMessage('Password must contain at least one lowercase letter', 'error');
        return;
    }
    
    if (!/[0-9]/.test(pass)) {
        showMessage('Password must contain at least one number', 'error');
        return;
    }
    
    if (pass !== confirm) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    // Check if email already exists
    if (database.users.find(user => user.email === email)) {
        showMessage('This email is already registered', 'error');
        return;
    }
    
    // Create new user
    const user = {
        id: 'email_' + Date.now(),
        name: fullname,
        email: email,
        password: hashPassword(pass),
        provider: 'email'
    };
    
    // Save to database
    database.users.push(user);
    localStorage.setItem('kpopCompetitionData', JSON.stringify(database));
    
    // Auto login
    const publicUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        provider: 'email'
    };
    
    sessionStorage.setItem('currentUser', JSON.stringify(publicUser));
    sessionStorage.setItem('isLoggedIn', 'true');
    
    showMessage('Account created successfully! Redirecting...', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
});

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
    
    // Check if user already exists
    if (!database.users.find(u => u.id === user.id)) {
        database.users.push(user);
        localStorage.setItem('kpopCompetitionData', JSON.stringify(database));
    }
    
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    sessionStorage.setItem('isLoggedIn', 'true');
    
    showMessage('Sign up successful! Redirecting...', 'success');
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

function hashPassword(password) {
    // In production, use a proper hashing library
    return btoa(password);
}

function showMessage(message, type) {
    const messageElement = document.getElementById('signup-message');
    messageElement.innerHTML = `<div class="${type}-message">${message}</div>`;
    
    if (type === 'success') {
        setTimeout(() => {
            messageElement.innerHTML = '';
        }, 5000);
    }
}
