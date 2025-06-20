// Admin credentials (in production, this should be handled server-side)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'kpop2024'
};

// Get database from localStorage
let database = JSON.parse(localStorage.getItem('kpopCompetitionData')) || {
    participants: [],
    votes: [],
    songs: [],
    voters: []
};

// Debug function
function debugData() {
    console.log('Current Database State:', database);
    console.log('LocalStorage Data:', localStorage.getItem('kpopCompetitionData'));
}

// Initialize with sample data if empty
function initializeSampleData() {
    if (!database.songs.length) {
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
            }
        ];
    }
    
    if (!database.participants.length) {
        database.participants = [
            {
                id: 1,
                name: "Sample Participant",
                email: "sample@example.com",
                age: 20,
                phone: "123-456-7890",
                experience: 3,
                favoriteGroup: "BTS",
                danceStyle: "hip-hop",
                bio: "Love dancing K-pop!",
                registrationDate: new Date().toISOString(),
                votes: 5
            }
        ];
    }
    
    saveDatabase();
    debugData();
}

// Check if user is logged in
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
    document.getElementById('login-section').style.display = isLoggedIn ? 'none' : 'block';
    document.getElementById('dashboard-section').style.display = isLoggedIn ? 'block' : 'none';
    if (isLoggedIn) {
        database = JSON.parse(localStorage.getItem('kpopCompetitionData')) || {
            participants: [],
            votes: [],
            songs: [],
            voters: []
        };
        
        // Initialize sample data if empty
        if (!database.participants.length && !database.songs.length) {
            initializeSampleData();
        }
        
        loadDashboardData();
        debugData();
    }
}

// Handle login form submission
document.getElementById('admin-login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        showMessage('login-message', 'Login successful!', 'success');
        setTimeout(() => {
            checkAuth();
        }, 1000);
    } else {
        showMessage('login-message', 'Invalid username or password!', 'error');
    }
});

// Logout function
function logout() {
    sessionStorage.removeItem('adminLoggedIn');
    checkAuth();
}

// Show admin tabs
function showAdminTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none';  // Ensure tabs are hidden
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.admin-nav .nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
        selectedTab.style.display = 'block';  // Explicitly show the selected tab
    }
    
    // Add active class to clicked button
    const clickedButton = document.querySelector(`.admin-nav .nav-btn[onclick*="${tabName}"]`);
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
    
    // Update any dynamic content if needed
    if (tabName === 'participants') {
        displayParticipants();
    } else if (tabName === 'votes') {
        displayVotes();
    } else if (tabName === 'songs') {
        displaySongs();
    }
}

// Load data for specific tabs
function loadTabData(tabName) {
    switch(tabName) {
        case 'overview':
            loadOverviewData();
            updateDashboardStats();
            break;
            
        case 'participants':
            loadParticipantsTable();
            initializeParticipantSearch();
            break;
            
        case 'votes':
            loadVotesTable();
            initializeVoteSearch();
            break;
            
        case 'songs':
            loadSongsTable();
            initializeSongSearch();
            break;
    }
}

// Update dashboard statistics
function updateDashboardStats() {
    document.getElementById('total-participants').textContent = database.participants.length;
    document.getElementById('total-votes').textContent = database.votes.length;
    document.getElementById('total-songs').textContent = database.songs.length;
    document.getElementById('total-voters').textContent = new Set(database.votes.map(vote => vote.voterEmail)).size;
}

// Load overview data
function loadOverviewData() {
    // Update statistics
    document.getElementById('total-participants').textContent = database.participants.length;
    document.getElementById('total-votes').textContent = database.votes.length;
    document.getElementById('total-songs').textContent = database.songs.length;
    document.getElementById('total-voters').textContent = database.voters.length;
    
    // Load top participants chart
    loadTopParticipantsChart();
    
    // Load registration trend chart
    loadRegistrationTrendChart();
}

// Participants Management Functions
function loadParticipantsTable() {
    const tbody = document.getElementById('participants-table-body');
    tbody.innerHTML = '';
    
    database.participants.forEach(participant => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${participant.name}</td>
            <td>${participant.email}</td>
            <td>${participant.age}</td>
            <td>${participant.danceStyle}</td>
            <td>${new Date(participant.registrationDate).toLocaleDateString()}</td>
            <td>${participant.votes || 0}</td>
            <td>
                <button onclick="editParticipant(${participant.id})" class="action-btn edit-btn">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteParticipant(${participant.id})" class="action-btn delete-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function editParticipant(id) {
    const participant = database.participants.find(p => p.id === id);
    if (!participant) return;
    
    // Show edit modal with participant data
    // You would implement a modal dialog here
    const newData = window.prompt('Edit participant data (sample):', JSON.stringify(participant));
    if (newData) {
        try {
            const updated = JSON.parse(newData);
            const index = database.participants.findIndex(p => p.id === id);
            database.participants[index] = { ...participant, ...updated };
            saveDatabase();
            loadParticipantsTable();
        } catch (e) {
            alert('Invalid data format');
        }
    }
}

function deleteParticipant(id) {
    if (confirm('Are you sure you want to delete this participant?')) {
        database.participants = database.participants.filter(p => p.id !== id);
        // Also delete related votes
        database.votes = database.votes.filter(v => v.participantId !== id);
        saveDatabase();
        loadParticipantsTable();
        updateDashboardStats();
    }
}

// Votes Management Functions
function loadVotesTable() {
    const tbody = document.getElementById('votes-table-body');
    tbody.innerHTML = '';
    
    database.votes.forEach(vote => {
        const participant = database.participants.find(p => p.id === vote.participantId);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${vote.voterName}</td>
            <td>${vote.voterEmail}</td>
            <td>${participant ? participant.name : 'Unknown Participant'}</td>
            <td>${new Date(vote.voteDate).toLocaleString()}</td>
            <td>
                <button onclick="deleteVote(${vote.id})" class="action-btn delete-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function deleteVote(id) {
    if (confirm('Are you sure you want to delete this vote?')) {
        const vote = database.votes.find(v => v.id === id);
        if (vote) {
            // Decrease participant's vote count
            const participant = database.participants.find(p => p.id === vote.participantId);
            if (participant) {
                participant.votes = (participant.votes || 1) - 1;
            }
            
            database.votes = database.votes.filter(v => v.id !== id);
            saveDatabase();
            loadVotesTable();
            updateDashboardStats();
        }
    }
}

// Songs Management Functions
function loadSongsTable() {
    const tbody = document.getElementById('songs-table-body');
    tbody.innerHTML = '';
    
    database.songs.forEach(song => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${song.title}</td>
            <td>${song.artist}</td>
            <td>${song.genre || 'N/A'}</td>
            <td>${song.year || 'N/A'}</td>
            <td>${song.submitter}</td>
            <td><span class="status-badge">${song.status || 'Active'}</span></td>
            <td>
                <button onclick="editSong(${song.id})" class="action-btn edit-btn">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteSong(${song.id})" class="action-btn delete-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function editSong(id) {
    const song = database.songs.find(s => s.id === id);
    if (!song) return;
    
    // Show edit modal with song data
    // You would implement a modal dialog here
    const newData = window.prompt('Edit song data (sample):', JSON.stringify(song));
    if (newData) {
        try {
            const updated = JSON.parse(newData);
            const index = database.songs.findIndex(s => s.id === id);
            database.songs[index] = { ...song, ...updated };
            saveDatabase();
            loadSongsTable();
        } catch (e) {
            alert('Invalid data format');
        }
    }
}

function deleteSong(id) {
    if (confirm('Are you sure you want to delete this song?')) {
        database.songs = database.songs.filter(s => s.id !== id);
        saveDatabase();
        loadSongsTable();
        updateDashboardStats();
    }
}

// Export Functions
function exportParticipants() {
    const data = JSON.stringify(database.participants, null, 2);
    downloadJson(data, 'participants-export.json');
}

function exportVotes() {
    const data = JSON.stringify(database.votes, null, 2);
    downloadJson(data, 'votes-export.json');
}

function exportSongs() {
    const data = JSON.stringify(database.songs, null, 2);
    downloadJson(data, 'songs-export.json');
}

function downloadJson(data, filename) {
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Utility functions
function showMessage(elementId, message, type) {
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
        messageElement.innerHTML = `<div class="${type}-message">${message}</div>`;
        setTimeout(() => {
            messageElement.innerHTML = '';
        }, 5000);
    }
}

function saveDatabase() {
    localStorage.setItem('kpopCompetitionData', JSON.stringify(database));
}

function loadDashboardData() {
    console.log('Loading dashboard data...');
    
    // Ensure we have fresh data
    database = JSON.parse(localStorage.getItem('kpopCompetitionData')) || {
        participants: [],
        votes: [],
        songs: [],
        voters: []
    };
    
    try {
        loadOverviewData();
        console.log('Overview data loaded');
        
        loadParticipantsTable();
        console.log('Participants table loaded');
        
        loadVotesTable();
        console.log('Votes table loaded');
        
        loadSongsTable();
        console.log('Songs table loaded');
        
        // Show the overview tab by default
        showAdminTab('overview');
    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('There was an error loading the dashboard. Please try refreshing the page.');
    }
}

function refreshData() {
    console.log('Refreshing data...');
    database = JSON.parse(localStorage.getItem('kpopCompetitionData')) || {
        participants: [],
        votes: [],
        songs: [],
        voters: []
    };
    
    // If no data exists at all, initialize with samples
    if (!database.participants.length && !database.songs.length) {
        console.log('No data found, initializing samples...');
        initializeSampleData();
    }
    
    loadDashboardData();
    showMessage('admin-message', 'Data refreshed successfully!', 'success');
    debugData();
}

function backupData() {
    const backup = {
        database,
        backupDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `kpop-competition-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function clearAllData() {
    if (confirm('⚠️ Are you sure you want to clear ALL competition data? This action cannot be undone!')) {
        database = {
            participants: [],
            votes: [],
            songs: [],
            voters: []
        };
        saveDatabase();
        loadDashboardData();
    }
}

// Initialize admin page
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    
    // Add search functionality
    document.getElementById('participant-search').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#participants-table-body tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
    
    document.getElementById('vote-search').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#votes-table-body tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
    
    document.getElementById('song-search').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#songs-table-body tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
});
