// User state
let currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || null;
let isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
let registrationProgress = null;

// In-memory database simulation
let database = JSON.parse(localStorage.getItem('kpopCompetitionData')) || {
    participants: [],
    votes: [],
    songs: [],
    voters: [],
    users: [],
    registrationProgress: {} // Store registration progress by user ID
};

        // Initialize with some sample songs
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
        ];        // Tab navigation
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
        }        // Registration form handling
        document.getElementById('registration-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!isLoggedIn || !currentUser) {
                showMessage('register-message', 'Please sign in to register for the competition', 'error');
                return;
            }
            
            const formData = {
                id: Date.now(),
                userId: currentUser.id,
                name: document.getElementById('participant-name').value,
                email: document.getElementById('participant-email').value,
                age: document.getElementById('participant-age').value,
                phone: document.getElementById('participant-phone').value,
                experience: document.getElementById('dance-experience').value,
                favoriteGroup: document.getElementById('favorite-group').value,
                danceStyle: document.getElementById('dance-style').value,
                bio: document.getElementById('participant-bio').value,
                registrationDate: new Date().toISOString(),
                votes: 0
            };
            
            // Handle photo upload
            const photoInput = document.getElementById('participant-photo');
            if (photoInput.files && photoInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    formData.photo = e.target.result;
                    saveParticipant(formData);
                };
                reader.readAsDataURL(photoInput.files[0]);
            } else {
                // Use placeholder if no photo
                formData.photo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gUGhvdG88L3RleHQ+PC9zdmc+';
                saveParticipant(formData);
            }
        });

        function saveParticipant(formData) {
            if (!currentUser) {
                showMessage('register-message', 'Please sign in with Google to register!', 'error');
                return;
            }

            // Check if email already exists
            const existingParticipant = database.participants.find(p => p.email === formData.email);
            if (existingParticipant) {
                showMessage('register-message', 'This email is already registered!', 'error');
                return;
            }
            
            // Add user information
            formData.userId = currentUser.id;
            formData.googleName = currentUser.name;
            formData.googleEmail = currentUser.email;
            
            database.participants.push(formData);
            
            // Clear registration progress after successful submission
            delete database.registrationProgress[currentUser.id];
            localStorage.setItem('kpopCompetitionData', JSON.stringify(database));
            
            showMessage('register-message', 'Registration successful! You can now participate in voting.', 'success');
            document.getElementById('registration-form').reset();
            updateHomeStats();
        }

        // Song submission form handling
        document.getElementById('song-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const songData = {
                id: Date.now(),
                title: document.getElementById('song-title').value,
                artist: document.getElementById('song-artist').value,
                genre: document.getElementById('song-genre').value,
                year: document.getElementById('song-year').value,
                url: document.getElementById('song-url').value,
                submitter: document.getElementById('submitter-name').value,
                email: document.getElementById('submitter-email').value,
                reason: document.getElementById('song-reason').value,
                submissionDate: new Date().toISOString()
            };
            
            database.songs.push(songData);
            showMessage('song-message', 'Song submitted successfully! It will be reviewed and added to the competition.', 'success');
            document.getElementById('song-form').reset();
            updateHomeStats();
        });

        // Load participants for voting
        function loadParticipants() {
            const participantsList = document.getElementById('participants-list');
            
            if (database.participants.length === 0) {
                participantsList.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #666;">No participants registered yet. Be the first to register!</p>';
                return;
            }
            
            participantsList.innerHTML = database.participants.map(participant => `
                <div class="participant-card">
                    <img src="${participant.photo}" alt="${participant.name}" class="participant-photo">
                    <div class="participant-info">
                        <h3>${participant.name}</h3>
                        <p><strong>Age:</strong> ${participant.age}</p>
                        <p><strong>Experience:</strong> ${participant.experience} years</p>
                        <p><strong>Favorite Group:</strong> ${participant.favoriteGroup}</p>
                        <p><strong>Dance Style:</strong> ${participant.danceStyle}</p>
                        <p><strong>Bio:</strong> ${participant.bio || 'No bio provided'}</p>
                    </div>
                    <div class="vote-section">
                        <button class="vote-btn" onclick="vote(${participant.id})">👍 Vote</button>
                        <span class="vote-count">${participant.votes || 0} votes</span>
                    </div>
                </div>
            `).join('');
        }

        // Voting function
        function vote(participantId) {
            const voterName = document.getElementById('voter-name').value;
            const voterEmail = document.getElementById('voter-email').value;
            
            if (!voterName || !voterEmail) {
                showMessage('voting-message', 'Please enter your name and email before voting.', 'error');
                return;
            }
            
            // Check if voter already voted for this participant
            const existingVote = database.votes.find(v => v.voterEmail === voterEmail && v.participantId === participantId);
            if (existingVote) {
                showMessage('voting-message', 'You have already voted for this participant!', 'error');
                return;
            }
            
            // Add vote
            const voteData = {
                id: Date.now(),
                participantId: participantId,
                voterName: voterName,
                voterEmail: voterEmail,
                voteDate: new Date().toISOString()
            };
            
            database.votes.push(voteData);
            
            // Update participant vote count
            const participant = database.participants.find(p => p.id === participantId);
            if (participant) {
                participant.votes = (participant.votes || 0) + 1;
            }
            
            // Add voter to unique voters list
            if (!database.voters.find(v => v.email === voterEmail)) {
                database.voters.push({
                    name: voterName,
                    email: voterEmail,
                    firstVote: new Date().toISOString()
                });
            }
            
            showMessage('voting-message', 'Vote cast successfully!', 'success');
            loadParticipants(); // Reload to update vote counts
            updateHomeStats();
        }

        // Load admin data
        function loadAdminData() {
            // Update statistics
            document.getElementById('admin-participants').textContent = database.participants.length;
            document.getElementById('admin-votes').textContent = database.votes.length;
            document.getElementById('admin-songs').textContent = database.songs.length;
            document.getElementById('admin-voters').textContent = database.voters.length;
            
            // Load top participants
            const topParticipants = [...database.participants]
                .sort((a, b) => (b.votes || 0) - (a.votes || 0))
                .slice(0, 5);
                
            const topParticipantsHtml = topParticipants.length > 0 ? 
                topParticipants.map((participant, index) => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: white; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                        <div>
                            <strong>${index + 1}. ${participant.name}</strong>
                            <span style="margin-left: 10px; color: #666;">${participant.email}</span>
                        </div>
                        <div style="color: #667eea; font-weight: bold;">${participant.votes || 0} votes</div>
                    </div>
                `).join('') : '<p>No participants yet.</p>';
                
            document.getElementById('top-participants').innerHTML = topParticipantsHtml;
            
            // Load all registrations
            const allRegistrationsHtml = database.participants.length > 0 ?
                database.participants.map(participant => `
                    <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                        <h4>${participant.name}</h4>
                        <p><strong>Email:</strong> ${participant.email}</p>
                        <p><strong>Age:</strong> ${participant.age} | <strong>Experience:</strong> ${participant.experience} years</p>
                        <p><strong>Phone:</strong> ${participant.phone}</p>
                        <p><strong>Favorite Group:</strong> ${participant.favoriteGroup}</p>
                        <p><strong>Dance Style:</strong> ${participant.danceStyle}</p>
                        <p><strong>Bio:</strong> ${participant.bio || 'No bio provided'}</p>
                        <p><strong>Registered:</strong> ${new Date(participant.registrationDate).toLocaleString()}</p>
                        <p><strong>Votes:</strong> ${participant.votes || 0}</p>
                    </div>
                `).join('') : '<p>No registrations yet.</p>';
                
            document.getElementById('all-registrations').innerHTML = allRegistrationsHtml;
            
            // Load song submissions
            const songSubmissionsHtml = database.songs.length > 0 ?
                database.songs.map(song => `
                    <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                        <h4>🎵 ${song.title}</h4>
                        <p><strong>Artist:</strong> ${song.artist}</p>
                        <p><strong>Genre:</strong> ${song.genre || 'K-pop'} | <strong>Year:</strong> ${song.year || 'N/A'}</p>
                        <p><strong>Submitted by:</strong> ${song.submitter} (${song.email})</p>
                        ${song.url ? `<p><strong>URL:</strong> <a href="${song.url}" target="_blank">${song.url}</a></p>` : ''}
                        <p><strong>Reason:</strong> ${song.reason || 'No reason provided'}</p>
                        ${song.submissionDate ? `<p><strong>Submitted:</strong> ${new Date(song.submissionDate).toLocaleString()}</p>` : ''}
                    </div>
                `).join('') : '<p>No song submissions yet.</p>';
                
            document.getElementById('song-submissions').innerHTML = songSubmissionsHtml;
        }

        // Update home page statistics
        function updateHomeStats() {
            document.getElementById('total-participants').textContent = database.participants.length;
            document.getElementById('total-votes').textContent = database.votes.length;
            document.getElementById('total-songs').textContent = database.songs.length;
        }

        // Check if user is a participant
let userParticipation = false;

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

// Export data function
function exportData() {
    const data = {
        participants: database.participants,
        votes: database.votes,
        songs: database.songs,
        voters: database.voters,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `kpop-competition-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Clear all data function
function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone!')) {
        database = {
            participants: [],
            votes: [],
            songs: [
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
            ],
            voters: []
        };
        
        // Clear all forms
        document.getElementById('registration-form').reset();
        document.getElementById('song-form').reset();
        document.getElementById('voter-name').value = '';
        document.getElementById('voter-email').value = '';
        
        // Clear all messages
        document.getElementById('register-message').innerHTML = '';
        document.getElementById('voting-message').innerHTML = '';
        document.getElementById('song-message').innerHTML = '';
        
        // Update displays
        updateHomeStats();
        loadParticipants();
        loadSongs();
        loadAdminData();
        
        alert('All data has been cleared!');
    }
}        // Initialize the page
        document.addEventListener('DOMContentLoaded', function() {
            initializeAuthUI();
            updateHomeStats();
            
            // Update file upload label when file is selected
            document.getElementById('participant-photo').addEventListener('change', function(e) {
                const label = document.querySelector('.file-upload-label');
                if (e.target.files && e.target.files[0]) {
                    label.textContent = `📷 Selected: ${e.target.files[0].name}`;
                } else {
                    label.textContent = '📷 Click to upload your photo';
                }
            });
        });

        // Add some sample data for demonstration (optional - remove in production)
        function addSampleData() {
            const sampleParticipant = {
                id: Date.now(),
                name: "Sample Dancer",
                email: "sample@example.com",
                age: 22,
                phone: "+1234567890",
                experience: 5,
                favoriteGroup: "BTS",
                danceStyle: "hip-hop",
                bio: "Passionate K-pop dancer with 5 years of experience!",
                registrationDate: new Date().toISOString(),
                votes: 3,
                photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzY2N2VlYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE2IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRhbmNlcjwvdGV4dD48L3N2Zz4='
            };
            
            // Uncomment the line below to add sample data
            // database.participants.push(sampleParticipant);
        }

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
    if (!database.users.find(u => u.id === user.id)) {
        database.users.push(user);
        localStorage.setItem('kpopCompetitionData', JSON.stringify(database));
    }
    
    // Save auth state
    currentUser = user;
    isLoggedIn = true;
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    sessionStorage.setItem('isLoggedIn', 'true');
    
    initializeAuthUI();
    loadRegistrationProgress();
}

function signOut() {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('isLoggedIn');
    currentUser = null;
    isLoggedIn = false;
    initializeAuthUI();
    window.location.reload();
}

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

// Call this when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeAuthUI();
    updateHomeStats();
});

        // Save registration progress
function saveRegistrationProgress() {
    if (!isLoggedIn || !currentUser) return;
    
    const formData = {
        name: document.getElementById('participant-name').value,
        email: document.getElementById('participant-email').value,
        age: document.getElementById('participant-age').value,
        phone: document.getElementById('participant-phone').value,
        experience: document.getElementById('dance-experience').value,
        favoriteGroup: document.getElementById('favorite-group').value,
        danceStyle: document.getElementById('dance-style').value,
        bio: document.getElementById('participant-bio').value
    };
    
    database.registrationProgress[currentUser.id] = formData;
    localStorage.setItem('kpopCompetitionData', JSON.stringify(database));
}

// Load registration progress
function loadRegistrationProgress() {
    if (!isLoggedIn || !currentUser) return;
    
    const progress = database.registrationProgress[currentUser.id];
    if (progress) {
        document.getElementById('participant-name').value = progress.name || '';
        document.getElementById('participant-email').value = progress.email || '';
        document.getElementById('participant-age').value = progress.age || '';
        document.getElementById('participant-phone').value = progress.phone || '';
        document.getElementById('dance-experience').value = progress.experience || '';
        document.getElementById('favorite-group').value = progress.favoriteGroup || '';
        document.getElementById('dance-style').value = progress.danceStyle || '';
        document.getElementById('participant-bio').value = progress.bio || '';
    }
}

// Add autosave to registration form inputs
function setupRegistrationAutosave() {
    const formInputs = document.querySelectorAll('#registration-form input, #registration-form select, #registration-form textarea');
    formInputs.forEach(input => {
        input.addEventListener('change', saveRegistrationProgress);
        input.addEventListener('blur', saveRegistrationProgress);
    });
}

// Initialize autosave when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupRegistrationAutosave();
    // ...existing init code...
});

// Initialize UI based on auth state
function initializeUI() {
    const userProfile = document.getElementById('user-profile');
    const loginBtn = document.querySelector('.login-btn');
    const profileBtn = document.getElementById('profile-btn');
    
    if (isLoggedIn && currentUser) {
        // Update header profile
        if (userProfile) {
            userProfile.style.display = 'flex';
            const avatar = document.getElementById('user-avatar');
            avatar.src = currentUser.picture || 
                `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="%23667eea"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-size="12">${currentUser.name.charAt(0).toUpperCase()}</text></svg>`;
            document.getElementById('user-name').textContent = currentUser.name;
        }
        
        // Show profile button, hide login button
        if (loginBtn) loginBtn.style.display = 'none';
        if (profileBtn) profileBtn.style.display = '';
        
        // Check if user is a participant
        userParticipation = database.participants.find(p => p.userId === currentUser.id);
    } else {
        // Hide profile elements, show login button
        if (userProfile) userProfile.style.display = 'none';
        if (loginBtn) loginBtn.style.display = '';
    const restrictedTabs = ['register', 'submit-song', 'profile'];
    
    restrictedTabs.forEach(tabName => {
        const tab = document.querySelector(`.nav-btn[onclick*="${tabName}"]`);
        if (tab) {
            if (!isLoggedIn) {
                tab.classList.add('disabled');
                tab.title = 'Please sign in to access this feature';
            } else if (tabName === 'submit-song' && !userParticipation) {
                tab.classList.add('disabled');
                tab.title = 'Only registered participants can submit songs';
            } else {
                tab.classList.remove('disabled');
                tab.title = '';
            }
        }
    });
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
