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
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.admin-nav .nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Load tab-specific data
    loadTabData(tabName);
}

// Load data for specific tabs
function loadTabData(tabName) {
    switch(tabName) {
        case 'overview':
            loadOverviewData();
            break;
        case 'participants':
            loadParticipantsTable();
            break;
        case 'votes':
            loadVotesTable();
            break;
        case 'songs':
            loadSongsTable();
            break;
    }
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

// Load participants table
function loadParticipantsTable() {
    const tableBody = document.getElementById('participants-table-body');
    
    tableBody.innerHTML = database.participants.map(participant => `
        <tr>
            <td>${participant.name}</td>
            <td>${participant.email}</td>
            <td>${participant.age}</td>
            <td>${participant.danceStyle}</td>
            <td>${new Date(participant.registrationDate).toLocaleDateString()}</td>
            <td>${participant.votes || 0}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editParticipant(${participant.id})">✏️</button>
                <button class="action-btn delete-btn" onclick="deleteParticipant(${participant.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// Load votes table
function loadVotesTable() {
    const tableBody = document.getElementById('votes-table-body');
    
    tableBody.innerHTML = database.votes.map(vote => {
        const participant = database.participants.find(p => p.id === vote.participantId);
        return `
            <tr>
                <td>${vote.voterName}</td>
                <td>${vote.voterEmail}</td>
                <td>${participant ? participant.name : 'Unknown'}</td>
                <td>${new Date(vote.voteDate).toLocaleString()}</td>
                <td>
                    <button class="action-btn delete-btn" onclick="deleteVote(${vote.id})">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Load songs table
function loadSongsTable() {
    console.log('Loading songs table with data:', database.songs);
    const tableBody = document.getElementById('songs-table-body');
    
    if (!database.songs || database.songs.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 20px;">
                    No songs have been submitted yet.
                    <br><br>
                    <button class="btn" onclick="initializeSampleData(); loadDashboardData();">
                        Load Sample Data
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = database.songs.map(song => `
        <tr>
            <td>${song.title || 'Untitled'}</td>
            <td>${song.artist || 'Unknown Artist'}</td>
            <td>${song.genre || 'K-pop'}</td>
            <td>${song.year || 'N/A'}</td>
            <td>${song.submitter || 'Anonymous'}<br>
                <small style="color: #666;">${song.email || 'No email'}</small>
            </td>
            <td>✅ Approved</td>
            <td>
                <button class="action-btn edit-btn" onclick="editSong(${song.id})" title="Edit Song">✏️</button>
                <button class="action-btn delete-btn" onclick="deleteSong(${song.id})" title="Delete Song">🗑️</button>
                ${song.url ? `<a href="${song.url}" target="_blank" class="action-btn" title="Listen" style="background: #667eea;">🎵</a>` : ''}
            </td>
        </tr>
    `).join('');
}

// CRUD Operations
function editParticipant(id) {
    const participant = database.participants.find(p => p.id === id);
    if (!participant) return;
    
    // Implementation for editing participant
    if (confirm('Edit participant: ' + participant.name + '?')) {
        // Add your edit logic here
    }
}

function deleteParticipant(id) {
    if (confirm('Are you sure you want to delete this participant?')) {
        database.participants = database.participants.filter(p => p.id !== id);
        database.votes = database.votes.filter(v => v.participantId !== id);
        saveDatabase();
        loadParticipantsTable();
        loadOverviewData();
    }
}

function deleteVote(id) {
    if (confirm('Are you sure you want to delete this vote?')) {
        const vote = database.votes.find(v => v.id === id);
        if (vote) {
            const participant = database.participants.find(p => p.id === vote.participantId);
            if (participant) {
                participant.votes = (participant.votes || 1) - 1;
            }
        }
        database.votes = database.votes.filter(v => v.id !== id);
        saveDatabase();
        loadVotesTable();
        loadOverviewData();
    }
}

function editSong(id) {
    const song = database.songs.find(s => s.id === id);
    if (!song) return;
    
    // Implementation for editing song
    if (confirm('Edit song: ' + song.title + '?')) {
        // Add your edit logic here
    }
}

function deleteSong(id) {
    if (confirm('Are you sure you want to delete this song?')) {
        database.songs = database.songs.filter(s => s.id !== id);
        saveDatabase();
        loadSongsTable();
        loadOverviewData();
    }
}

// Export functions
function exportParticipants() {
    exportData('participants', database.participants);
}

function exportVotes() {
    exportData('votes', database.votes);
}

function exportSongs() {
    exportData('songs', database.songs);
}

function exportData(type, data) {
    const exportData = {
        [type]: data,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `kpop-competition-${type}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showMessage(`${type}-message`, `${type} data exported successfully!`, 'success');
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
