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

// Access control function
function checkAccess(feature) {
    if (!isLoggedIn) {
        alert('Please log in first to access this feature.');
        return false;
    }
    
    switch (feature) {
        case 'register':
            // Allow registration if logged in and not already registered
            if (userParticipation) {
                alert('You are already registered as a participant!');
                return false;
            }
            return true;
        
        case 'submit-song':
            // Only allow song submission for registered participants
            if (!userParticipation) {
                alert('You must register as a participant first to submit songs.');
                return false;
            }
            return true;
        
        case 'vote':
            // Allow voting if logged in (could add more restrictions here)
            return true;
            
        default:
            return false;
    }
}

// Function to handle restricted actions
function handleRestrictedAction(action) {
    if (!isLoggedIn) {
        // Directly redirect to login page if not logged in
        window.location.href = 'login.html';
        return;
    }
    
    // If logged in, proceed with normal tab switching
    showTab(action);
}

// Function to update UI based on access rights
function updateAccessUI() {
    const registerBtn = document.querySelector('button[onclick*="showTab(\'register\')"]');
    const submitSongBtn = document.querySelector('button[onclick*="showTab(\'submit-song\')"]');
    const profileTab = document.querySelector('#profile-btn');

    if (registerBtn) {
        if (!isLoggedIn) {
            registerBtn.classList.add('disabled');
            registerBtn.title = 'Please sign in to access this feature';
        } else {
            registerBtn.classList.remove('disabled');
            registerBtn.title = userParticipation ? 'You are already registered' : 'Register for the competition';
        }
    }

    if (submitSongBtn) {
        if (!isLoggedIn || !userParticipation) {
            submitSongBtn.classList.add('disabled');
            submitSongBtn.title = !isLoggedIn ? 'Please sign in to access this feature' : 'You must register first';
        } else {
            submitSongBtn.classList.remove('disabled');
            submitSongBtn.title = 'Submit your song choice';
        }
    }

    if (profileTab) {
        profileTab.style.display = isLoggedIn ? 'block' : 'none';
    }
}

// Tab navigation
function showTab(tabName) {
    // Check if trying to access restricted features
    if (tabName === 'register' || tabName === 'submitSong') {
        if (!isLoggedIn) {
            window.location.href = 'login.html';
            return;
        }
    }

    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });

    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }

    // Update active state of navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`button[onclick*="showTab('${tabName}')"]`).classList.add('active');
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

// Function to load participants into dropdown
function loadParticipantsDropdown() {
    const select = document.getElementById('selected-participant');
    if (!select) return;

    // Clear existing options except the first one
    while (select.options.length > 1) {
        select.remove(1);
    }

    // Add participants from database
    database.participants.forEach(participant => {
        const option = document.createElement('option');
        option.value = participant.email;
        option.textContent = `${participant.name} - ${participant.danceStyle}`;
        select.appendChild(option);
    });
}

// Function to submit vote
function submitVote() {
    const voterName = document.getElementById('voter-name').value.trim();
    const voterEmail = document.getElementById('voter-email').value.trim();
    const selectedParticipant = document.getElementById('selected-participant').value;
    const comment = document.getElementById('vote-comment').value.trim();

    if (!voterName || !voterEmail || !selectedParticipant) {
        alert('Please fill in all required fields!');
        return;
    }

    // Check if voter has already voted
    if (database.votes.some(v => v.voterEmail === voterEmail)) {
        alert('You have already submitted a vote!');
        return;
    }

    // Add vote to database
    const vote = {
        id: Date.now(),
        voterName,
        voterEmail,
        participantId: selectedParticipant, // Make sure we're using participantId
        comment,
        timestamp: new Date().toISOString()
    };

    database.votes.push(vote);
    localStorage.setItem('kpopCompetitionData', JSON.stringify(database));

    // Clear form
    document.getElementById('voting-form').reset();

    // Update stats and rankings
    updateStats();

    alert('Thank you for voting!');
}

// Load participants when voting tab is shown
document.addEventListener('DOMContentLoaded', () => {
    const votingTab = document.getElementById('voting');
    if (votingTab) {
        loadParticipantsDropdown();
    }
});

// Update participants list when database changes
function updateParticipantsList() {
    loadParticipantsDropdown();
}

// Function to calculate top voted participants
function calculateTopVotedParticipants(limit = 5) {
    // Create a map to count votes for each participant
    const voteCount = new Map();
    
    // Count votes for each participant
    database.votes.forEach(vote => {
        const count = voteCount.get(vote.participantId) || 0;
        voteCount.set(vote.participantId, count + 1);
    });
    
    // Convert to array and sort by votes (descending)
    const sortedParticipants = database.participants
        .map(participant => ({
            ...participant,
            votes: voteCount.get(participant.id) || 0
        }))
        .sort((a, b) => b.votes - a.votes)
        .slice(0, limit);
    
    return sortedParticipants;
}

// Function to update the rankings display
function updateTopRankings() {
    const rankingsContainer = document.getElementById('top-rankings');
    if (!rankingsContainer) return;
    
    const topParticipants = calculateTopVotedParticipants();
    
    if (topParticipants.length === 0) {
        rankingsContainer.innerHTML = '<p class="no-data">No participants yet</p>';
        return;
    }
    
    const rankingsList = topParticipants.map((participant, index) => `
        <div class="ranking-item">
            <div class="rank">#${index + 1}</div>
            <div class="participant-info">
                <span class="name">${participant.name}</span>
                <span class="votes">${participant.votes} votes</span>
            </div>
        </div>
    `).join('');
    
    rankingsContainer.innerHTML = rankingsList;
}

// Update rankings whenever votes change
function updateStats() {
    // Update existing stats
    document.getElementById('total-participants').textContent = database.participants.length;
    document.getElementById('total-votes').textContent = database.votes.length;
    document.getElementById('total-songs').textContent = database.songs.length;
    
    // Update rankings
    updateTopRankings();
}

// Call updateStats when page loads and after any vote
document.addEventListener('DOMContentLoaded', updateStats);

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
    
    updateAccessUI();
    // Load user participation status if logged in
    if (isLoggedIn && currentUser) {
        userParticipation = database.participants.some(p => p.email === currentUser.email);
        updateAccessUI();
    }
});
