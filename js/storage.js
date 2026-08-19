// Storage script for Campus Lost & Found System
// Uses localStorage for reports, users, claims, and notifications

// Initial default sample users for multi-user demo with enhanced secure passwords
let defaultUsers = [
    {
        username: "Ira Sodhi",
        useremail: "ira.sodhi@example.com",
        userpassword: "Ira@2026!"
    },
    {
        username: "Rohan Verma",
        useremail: "rohan.verma@example.com",
        userpassword: "Rohan@2026!"
    }
];

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
        postedBy: "Ira Sodhi",
        postedByEmail: "ira.sodhi@example.com",
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
        postedBy: "Rohan Verma",
        postedByEmail: "rohan.verma@example.com",
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
        postedBy: "Ira Sodhi",
        postedByEmail: "ira.sodhi@example.com",
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
        postedBy: "Rohan Verma",
        postedByEmail: "rohan.verma@example.com",
        contactPhone: "+91 98000 11122",
        image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80",
        status: "Searching"
    }
];

// Initialize localStorage if empty or if legacy data exists
function initStorage() {
    let existingUsersStr = localStorage.getItem("users");
    if (!existingUsersStr) {
        localStorage.setItem("users", JSON.stringify(defaultUsers));
    } else {
        try {
            let parsed = JSON.parse(existingUsersStr);
            if (!Array.isArray(parsed) || parsed.length === 0) {
                localStorage.setItem("users", JSON.stringify(defaultUsers));
            } else {
                // Ensure default users exist in users array without removing any custom 3rd users
                let updated = [...parsed];
                defaultUsers.forEach(defU => {
                    if (!updated.some(u => u.useremail && u.useremail.toLowerCase() === defU.useremail.toLowerCase())) {
                        updated.push(defU);
                    }
                });
                localStorage.setItem("users", JSON.stringify(updated));
            }
        } catch (e) {
            localStorage.setItem("users", JSON.stringify(defaultUsers));
        }
    }

    if (!localStorage.getItem("campus_reports")) {
        localStorage.setItem("campus_reports", JSON.stringify(defaultReports));
    }
    
    if (!localStorage.getItem("current_user")) {
        localStorage.setItem("current_user", JSON.stringify(defaultUsers[0]));
    }

    if (localStorage.getItem("isLoggedIn") === null) {
        localStorage.setItem("isLoggedIn", "true");
    }

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
        return Array.isArray(users) && users.length > 0 ? users : defaultUsers;
    } catch (e) {
        return defaultUsers;
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

// Get logged in user
function getCurrentUser() {
    initStorage();
    try {
        let user = localStorage.getItem("current_user");
        return user ? JSON.parse(user) : defaultUsers[0];
    } catch (e) {
        return defaultUsers[0];
    }
}

// Reset sample data helper
function resetData() {
    localStorage.setItem("users", JSON.stringify(defaultUsers));
    localStorage.setItem("campus_reports", JSON.stringify(defaultReports));
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("current_user", JSON.stringify(defaultUsers[0]));
    localStorage.setItem("campus_claims", JSON.stringify([]));
    localStorage.setItem("campus_notifications", JSON.stringify([]));
}

// Initialize on file load
initStorage();
