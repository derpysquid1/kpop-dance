// User state and database management
let currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || null;
let isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
let registrationProgress = null;
let userParticipation = false;

// In-memory database simulation
let database = JSON.parse(localStorage.getItem('kpopCompetitionData')) || {
    participants: [],
    votes: [],
    songs: [],
    voters: [],
    users: [],
    registrationProgress: {} // Store registration progress by user ID
};

// Initialize sample data if needed
if (database.songs.length === 0) {
    database.songs = [
        {
            id: 1,
            title: "Dynamite",
            artist: "BTS",
            genre: "k-pop",
            year: 2020,
            url: "https://www.youtube.com/watch?v=gdZLi9oWNZg",
            submitter: "Admin",
            email: "admin@kpop.com",
            reason: "Perfect for energetic dance routines!"
        },
        {
            id: 2,
            title: "How You Like That",
            artist: "BLACKPINK",
            genre: "k-pop",
            year: 2020,
            url: "https://www.youtube.com/watch?v=ioNng23DkIM",
            submitter: "Admin",
            email: "admin@kpop.com",
            reason: "Great choreography and beat!"
        },
        {
            id: 3,
            title: "God's Menu",
            artist: "Stray Kids",
            genre: "k-pop",
            year: 2020,
            url: "https://www.youtube.com/watch?v=TQTlCHxyuu8",
            submitter: "Admin",
            email: "admin@kpop.com",
            reason: "Intense and challenging choreography!"
        }
    ];
    localStorage.setItem('kpopCompetitionData', JSON.stringify(database));
}

// Tab navigation
function showTab(tabName) {
    // Check login for restricted tabs
    if (!isLoggedIn && ['register', 'submit-song', 'profile'].includes(tabName)) {
        window.location.href = 'login.html';
        return;
    }
    
    // Check participation for submit-song tab
    if (tabName === 'submit-song') {
        if (!checkUserParticipation()) {
            showMessage('submit-song', 'Only registered participants can submit songs. Please register for the competition first.', 'error');
            return;
        }
    }
    
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all buttons
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
        
        // Add active class to the button
        const activeBtn = document.querySelector(`.nav-btn[onclick*="${tabName}"]`);
        if (activeBtn) activeBtn.classList.add('active');
        
        // Load tab-specific content
        switch(tabName) {
            case 'voting':
                loadParticipants();
                break;
            case 'home':
                updateHomeStats();
                break;
            case 'register':
                if (isLoggedIn) loadRegistrationProgress();
                break;
            case 'profile':
                loadProfileContent();
                break;
            case 'submit-song':
                // Reset any previous error messages
                const messageDiv = document.getElementById('submit-song-message');
                if (messageDiv) messageDiv.innerHTML = '';
                break;
        }
    }
}

// Check if user is a participant
function checkUserParticipation() {
    if (!isLoggedIn || !currentUser) return false;
    userParticipation = database.participants.some(p => p.userId === currentUser.id);
    return userParticipation;
}

// Initialize UI based on auth state
function initializeAuthUI() {
    const userProfile = document.getElementById('user-profile');
    const loginBtn = document.querySelector('.login-btn');
    const profileBtn = document.getElementById('profile-btn');
    const registerBtn = document.querySelector('.nav-btn[onclick*="register"]');
    const submitSongBtn = document.querySelector('.nav-btn[onclick*="submit-song"]');
    
    // Check if user is a participant
    checkUserParticipation();
    
    if (isLoggedIn && currentUser) {
        // Show user profile
        if (userProfile) {
            userProfile.style.display = 'flex';
            const avatar = document.getElementById('user-avatar');
            const userName = document.getElementById('user-name');
            
            if (currentUser.picture) {
                avatar.src = currentUser.picture;
            } else {
                avatar.src = getInitialsAvatar(currentUser.name);
            }
            userName.textContent = currentUser.name;
        }
        
        // Show profile button, hide login button
        if (profileBtn) profileBtn.style.display = 'inline-block';
        if (loginBtn) loginBtn.style.display = 'none';
        
        // Enable register button
        if (registerBtn) {
            registerBtn.classList.remove('disabled');
            registerBtn.title = '';
        }
        
        // Enable/disable submit song based on participation
        if (submitSongBtn) {
            if (userParticipation) {
                submitSongBtn.classList.remove('disabled');
                submitSongBtn.title = '';
            } else {
                submitSongBtn.classList.add('disabled');
                submitSongBtn.title = 'Only registered participants can submit songs';
            }
        }
    } else {
        // Hide user profile
        if (userProfile) userProfile.style.display = 'none';
        
        // Hide profile button, show login button
        if (profileBtn) profileBtn.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'inline-block';
        
        // Disable restricted buttons
        [registerBtn, submitSongBtn].forEach(btn => {
            if (btn) {
                btn.classList.add('disabled');
                btn.title = 'Please sign in to access this feature';
            }
        });
    }
}

// Load profile content
function loadProfileContent() {
    if (!isLoggedIn || !currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    const profileContainer = document.getElementById('profile');
    if (!profileContainer) return;

    // Update profile header
    const profileHeader = `
        <div class="profile-header">
            <img src="${currentUser.picture || getInitialsAvatar(currentUser.name)}" 
                 alt="Profile" id="profile-avatar">
            <h3>${currentUser.name}</h3>
            <p>${currentUser.email}</p>
        </div>
    `;

    // Update participation status
    const participant = database.participants.find(p => p.userId === currentUser.id);
    const participationStatus = participant ? `
        <div class="status-registered">
            <h4>✅ Competition Participant</h4>
            <p><strong>Dance Style:</strong> ${participant.danceStyle}</p>
            <p><strong>Experience:</strong> ${participant.experience} years</p>
            <p><strong>Registration Date:</strong> ${new Date(participant.registrationDate).toLocaleDateString()}</p>
            <p><strong>Votes Received:</strong> ${participant.votes || 0}</p>
        </div>
    ` : `
        <div class="status-not-registered">
            <h4>❌ Not Registered</h4>
            <p>You haven't registered for the competition yet.</p>
            <button onclick="showTab('register')" class="btn">Register Now</button>
        </div>
    `;

    // Get user's submitted songs
    const userSongs = database.songs
        .filter(song => song.submitter === currentUser.email)
        .map(song => `
            <div class="song-item">
                <h5>${song.title}</h5>
                <p>${song.artist} (${song.year})</p>
                <p class="song-status">Status: ${song.status || 'Pending'}</p>
            </div>
        `).join('') || '<p>No songs submitted yet</p>';

    // Get user's voting history
    const votingHistory = database.votes
        .filter(vote => vote.voterEmail === currentUser.email)
        .map(vote => {
            const votedParticipant = database.participants.find(p => p.id === vote.participantId);
            return `
                <div class="vote-item">
                    <p>Voted for: ${votedParticipant ? votedParticipant.name : 'Unknown'}</p>
                    <p>Date: ${new Date(vote.date).toLocaleDateString()}</p>
                </div>
            `;
        }).join('') || '<p>No voting history</p>';

    // Update profile content
    profileContainer.innerHTML = `
        <div class="profile-content">
            ${profileHeader}
            <div class="profile-section">
                <h4>Participation Status</h4>
                ${participationStatus}
            </div>
            <div class="profile-section">
                <h4>My Song Submissions</h4>
                <div class="songs-list">
                    ${userSongs}
                </div>
            </div>
            <div class="profile-section">
                <h4>My Voting History</h4>
                <div class="voting-list">
                    ${votingHistory}
                </div>
            </div>
        </div>
    `;
}

// Helper function to generate initials avatar
function getInitialsAvatar(name) {
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="%23667eea"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-size="12">${name.charAt(0).toUpperCase()}</text></svg>`;
}

// Show message helper
function showMessage(elementId, message, type) {
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
        messageElement.innerHTML = `<div class="${type}-message">${message}</div>`;
        if (type !== 'error') {
            setTimeout(() => messageElement.innerHTML = '', 5000);
        }
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI components
    initializeAuthUI();
    updateHomeStats();
    
    // Check and update participation status
    if (isLoggedIn) {
        checkUserParticipation();
    }
    
    // Load initial tab content
    const currentTab = document.querySelector('.tab-content.active');
    if (currentTab) {
        loadTabContent(currentTab.id);
    }
});
