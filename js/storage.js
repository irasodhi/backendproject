// Storage script for Campus Lost & Found System
// Uses localStorage for reports, users, claims, and notifications

// Initial default sample users list (empty for clean new user experience)
let defaultUsers = [];

// Initial sample reports
let defaultReports = [
    {
        id: "REP-1001",
        type: "lost",
        itemName: "Black Nike Backpack",
        category: "Bags",
        color: "Black",
        zone: "Library",
        date: "2026-08-11",
        description: "Black Nike backpack with laptop compartment and red zipper puller. Left near silent study zone.",
        hiddenDetails: "Contains a Dell XPS charger and blue notebook with initials IS.",
        postedBy: "Campus Student",
        postedByEmail: "student1@campus.edu",
        contactPhone: "+91 98765 43210",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
        status: "Searching"
    },
    {
        id: "REP-1002",
        type: "found",
        itemName: "Black Nike Backpack",
        category: "Bags",
        color: "Black",
        zone: "Library",
        date: "2026-08-12",
        description: "Found black Nike bag near second floor study tables in Library with red accent zippers.",
        hiddenDetails: "Contains a Dell XPS charger inside.",
        postedBy: "Campus Finder",
        postedByEmail: "finder1@campus.edu",
        contactPhone: "+91 98123 45678",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
        status: "Searching"
    },
    {
        id: "REP-1003",
        type: "lost",
        itemName: "Apple iPhone 14 Pro",
        category: "Electronics",
        color: "Black",
        zone: "Cafeteria",
        date: "2026-08-10",
        description: "Space black iPhone 14 Pro with a clear transparent magsafe protective case.",
        hiddenDetails: "Lockscreen wallpaper is a golden retriever dog sitting on grass.",
        postedBy: "Campus Student",
        postedByEmail: "student2@campus.edu",
        contactPhone: "+91 97654 32109",
        image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80",
        status: "Searching"
    },
    {
        id: "REP-1004",
        type: "found",
        itemName: "Black Smartphone in Clear Case",
        category: "Electronics",
        color: "Black",
        zone: "Main Block",
        date: "2026-08-11",
        description: "Found an iPhone on a dining table near cafeteria entry in Main Block. Screen turns on.",
        hiddenDetails: "Golden retriever lockscreen wallpaper.",
        postedBy: "Campus Finder",
        postedByEmail: "finder2@campus.edu",
        contactPhone: "+91 98000 11122",
        image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80",
        status: "Searching"
    }
];

// Initialize localStorage if empty or if legacy data exists
function initStorage() {
    let existingUsersStr = localStorage.getItem("users");
    if (!existingUsersStr) {
        localStorage.setItem("users", JSON.stringify([]));
    } else {
        try {
            let parsed = JSON.parse(existingUsersStr);
            if (Array.isArray(parsed)) {
                // Filter out legacy demo mock users so only actual user-registered accounts exist
                let demoEmails = ["ira.sodhi@example.com", "rohan.verma@example.com", "admin@fluffytails.com"];
                let cleaned = parsed.filter(u => u && u.useremail && !demoEmails.includes(u.useremail.toLowerCase().trim()));
                localStorage.setItem("users", JSON.stringify(cleaned));
            } else {
                localStorage.setItem("users", JSON.stringify([]));
            }
        } catch (e) {
            localStorage.setItem("users", JSON.stringify([]));
        }
    }

    let existingReportsStr = localStorage.getItem("campus_reports");
    if (!existingReportsStr) {
        localStorage.setItem("campus_reports", JSON.stringify(defaultReports));
    } else {
        try {
            let reports = JSON.parse(existingReportsStr);
            if (Array.isArray(reports)) {
                let unwantedNames = ["airpods pro gen 2", "student id card & dorm keys", "casio fx-991ex calculator"];
                let unwantedPosters = ["ananya gupta", "kabir mehta", "campus security", "campus sec..."];
                let cleanedReports = reports.filter(r => {
                    let name = (r.itemName || "").toLowerCase().trim();
                    let poster = (r.postedBy || "").toLowerCase().trim();
                    let isUnwanted = unwantedNames.some(u => name.includes(u)) || unwantedPosters.some(p => poster.includes(p));
                    return !isUnwanted;
                });
                localStorage.setItem("campus_reports", JSON.stringify(cleanedReports.length > 0 ? cleanedReports : defaultReports));
            } else {
                localStorage.setItem("campus_reports", JSON.stringify(defaultReports));
            }
        } catch (e) {
            localStorage.setItem("campus_reports", JSON.stringify(defaultReports));
        }
    }
    
    // Note: Do NOT auto-login to any user. New visitors start as guest (not logged in).

    if (!localStorage.getItem("campus_claims")) {
        localStorage.setItem("campus_claims", JSON.stringify([]));
    }
    
    if (!localStorage.getItem("campus_notifications")) {
        localStorage.setItem("campus_notifications", JSON.stringify([]));
    }
}

// Get all users from localStorage
function getUsers() {
    initStorage();
    try {
        let users = JSON.parse(localStorage.getItem("users"));
        return Array.isArray(users) ? users : [];
    } catch (e) {
        return [];
    }
}

// Save or update a user in localStorage
function saveUser(user) {
    if (!user || !user.useremail) return;
    let users = getUsers();
    let index = users.findIndex(u => u.useremail && u.useremail.toLowerCase() === user.useremail.toLowerCase());
    if (index >= 0) {
        users[index] = { ...users[index], ...user };
    } else {
        users.push(user);
    }
    localStorage.setItem("users", JSON.stringify(users));
}

// Switch active user by email
function switchUser(email) {
    if (!email) return null;
    let users = getUsers();
    let found = users.find(u => u.useremail && u.useremail.toLowerCase() === email.toLowerCase().trim());
    if (found) {
        localStorage.setItem("current_user", JSON.stringify(found));
        localStorage.setItem("isLoggedIn", "true");
        return found;
    }
    return null;
}

// Add a new user account and make it active
function addAndSwitchAccount(user) {
    if (!user || !user.useremail) return null;
    saveUser(user);
    localStorage.setItem("current_user", JSON.stringify(user));
    localStorage.setItem("isLoggedIn", "true");
    return user;
}

// Remove a specific signed-in account from the browser
function removeUserAccount(email) {
    if (!email) return null;
    let users = getUsers();
    let updatedUsers = users.filter(u => u && u.useremail && u.useremail.toLowerCase() !== email.toLowerCase().trim());
    localStorage.setItem("users", JSON.stringify(updatedUsers));

    let currentUser = getCurrentUser();
    if (currentUser && currentUser.useremail && currentUser.useremail.toLowerCase() === email.toLowerCase().trim()) {
        if (updatedUsers.length > 0) {
            // Switch to next available account
            localStorage.setItem("current_user", JSON.stringify(updatedUsers[0]));
            localStorage.setItem("isLoggedIn", "true");
            return updatedUsers[0];
        } else {
            // No more accounts
            localStorage.removeItem("current_user");
            localStorage.removeItem("isLoggedIn");
            return null;
        }
    }
    return currentUser;
}

// Log out of all accounts on this browser
function logoutAllAccounts() {
    localStorage.setItem("users", JSON.stringify([]));
    localStorage.removeItem("current_user");
    localStorage.removeItem("isLoggedIn");
}

// Get all reports
function getReports() {
    initStorage();
    try {
        return JSON.parse(localStorage.getItem("campus_reports")) || [];
    } catch (e) {
        return defaultReports;
    }
}

// Save a new report
function saveReport(report) {
    let reports = getReports();
    reports.unshift(report);
    localStorage.setItem("campus_reports", JSON.stringify(reports));
}

// Delete report by ID
function deleteReport(id) {
    let reports = getReports();
    let updated = reports.filter(r => r.id !== id);
    localStorage.setItem("campus_reports", JSON.stringify(updated));
}

// Get claims
function getClaims() {
    initStorage();
    try {
        return JSON.parse(localStorage.getItem("campus_claims")) || [];
    } catch (e) {
        return [];
    }
}

// Save claim
function saveClaim(claim) {
    let claims = getClaims();
    claims.unshift(claim);
    localStorage.setItem("campus_claims", JSON.stringify(claims));
}

// Update claim status & extra details (meetingDetails, founderFeedback, rejectionReason, providedProof)
function updateClaimStatus(claimId, status, extraData = null) {
    let claims = getClaims();
    let claim = claims.find(c => c.claimId === claimId);
    if (claim) {
        claim.status = status;
        if (extraData) {
            // Check if extraData is a meetingDetails object directly (has location) or an options object
            if (extraData.location) {
                claim.meetingDetails = extraData;
            } else {
                if (extraData.meetingDetails) claim.meetingDetails = extraData.meetingDetails;
                if (extraData.founderFeedback !== undefined) claim.founderFeedback = extraData.founderFeedback;
                if (extraData.rejectionReason !== undefined) claim.rejectionReason = extraData.rejectionReason;
                if (extraData.providedProof !== undefined) claim.providedProof = extraData.providedProof;
                if (extraData.meetingConfirmedBy !== undefined) claim.meetingConfirmedBy = extraData.meetingConfirmedBy;
            }
        }
        localStorage.setItem("campus_claims", JSON.stringify(claims));
    }
}

// Get specific claim by ID
function getClaimById(claimId) {
    let claims = getClaims();
    return claims.find(c => c.claimId === claimId) || null;
}

// Add a direct chat message between founder and claimant for a claim/meeting
function addClaimMessage(claimId, messageObj) {
    let claims = getClaims();
    let claim = claims.find(c => c.claimId === claimId);
    if (claim) {
        if (!claim.messages) claim.messages = [];
        let newMsg = {
            id: "MSG-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
            sender: messageObj.sender,
            senderEmail: messageObj.senderEmail,
            text: messageObj.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date().toLocaleDateString(),
            type: messageObj.type || "text" // "text", "status", "reschedule", "confirmed"
        };
        claim.messages.push(newMsg);
        localStorage.setItem("campus_claims", JSON.stringify(claims));
        return newMsg;
    }
    return null;
}

// Notifications helpers
function getNotifications(userEmail) {
    if (!userEmail) return [];
    initStorage();
    try {
        let all = JSON.parse(localStorage.getItem("campus_notifications")) || [];
        let target = userEmail.toLowerCase().trim();
        return all.filter(n => n.recipientEmail && n.recipientEmail.toLowerCase().trim() === target);
    } catch (e) {
        return [];
    }
}

function sendNotification(notification) {
    initStorage();
    try {
        let all = JSON.parse(localStorage.getItem("campus_notifications")) || [];
        all.unshift(notification);
        localStorage.setItem("campus_notifications", JSON.stringify(all));
    } catch (e) {
        console.error("Error saving notification", e);
    }
}

// Clear all notifications for a specific user
function clearNotifications(userEmail) {
    if (!userEmail) return;
    initStorage();
    try {
        let all = JSON.parse(localStorage.getItem("campus_notifications")) || [];
        let target = userEmail.toLowerCase().trim();
        let remaining = all.filter(n => !n.recipientEmail || n.recipientEmail.toLowerCase().trim() !== target);
        localStorage.setItem("campus_notifications", JSON.stringify(remaining));
    } catch (e) {
        console.error("Error clearing notifications", e);
    }
}

// Delete a single notification by ID
function deleteNotification(notifId) {
    if (!notifId) return;
    initStorage();
    try {
        let all = JSON.parse(localStorage.getItem("campus_notifications")) || [];
        let remaining = all.filter(n => n.id !== notifId);
        localStorage.setItem("campus_notifications", JSON.stringify(remaining));
    } catch (e) {
        console.error("Error deleting notification", e);
    }
}

// Get logged in user (returns null if unauthenticated / guest)
function getCurrentUser() {
    initStorage();
    try {
        let isLoggedIn = localStorage.getItem("isLoggedIn");
        if (isLoggedIn !== "true") {
            return null;
        }
        let user = localStorage.getItem("current_user");
        return user ? JSON.parse(user) : null;
    } catch (e) {
        return null;
    }
}

// Reset sample data helper
function resetData() {
    localStorage.setItem("users", JSON.stringify(defaultUsers));
    localStorage.setItem("campus_reports", JSON.stringify(defaultReports));
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("current_user");
    localStorage.setItem("campus_claims", JSON.stringify([]));
    localStorage.setItem("campus_notifications", JSON.stringify([]));
}

// Initialize on file load
initStorage();
