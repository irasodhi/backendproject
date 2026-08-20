// Main Application Logic (app.js)
// Handles page rendering, card displays, user session state, matching views, notifications, and claim approval flow

let uploadedImageBase64 = null;

// Image preview and dropzone helper function
function previewImage(event) {
    let file = (event && event.target && event.target.files) ? event.target.files[0] : (event && event.dataTransfer ? event.dataTransfer.files[0] : null);
    if (file) {
        let reader = new FileReader();
        reader.onload = function(e) {
            uploadedImageBase64 = e.target.result;
            let preview = document.getElementById("img-preview");
            let previewContainer = document.getElementById("dropzone-preview-container");
            let defaultContent = document.getElementById("dropzone-default-content");
            if (preview) {
                preview.src = e.target.result;
                preview.classList.remove("d-none");
            }
            if (previewContainer) previewContainer.classList.remove("d-none");
            if (defaultContent) defaultContent.classList.add("d-none");
        };
        reader.readAsDataURL(file);
    }
}

// Remove uploaded image helper
function removeUploadedImage() {
    uploadedImageBase64 = null;
    let input = document.getElementById("itemImage");
    if (input) input.value = "";
    let preview = document.getElementById("img-preview");
    if (preview) {
        preview.src = "";
        preview.classList.add("d-none");
    }
    let previewContainer = document.getElementById("dropzone-preview-container");
    let defaultContent = document.getElementById("dropzone-default-content");
    if (previewContainer) previewContainer.classList.add("d-none");
    if (defaultContent) defaultContent.classList.remove("d-none");
}

// Quick set date today helper
function setDateToday() {
    let dateInput = document.getElementById("date");
    if (dateInput) {
        let today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        dateInput.dispatchEvent(new Event('change'));
    }
}

window.onload = function() {
    renderNavbarUser();

    let path = window.location.pathname;
    if (path.includes("report.html")) {
        initReportPage();
    } else if (path.includes("matches.html")) {
        initMatchesPage();
    } else if (path.includes("dashboard.html")) {
        initDashboardPage();
    } else if (path.includes("admin.html")) {
        initAdminPage();
    } else {
        initHomePage();
    }
};

// ─── Count-Up Animation ─────────────────────────────────────────────────────
function animateCountUp(element, target, duration = 900) {
    if (!element) return;
    let start = 0;
    let startTime = null;
    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        let progress = Math.min((timestamp - startTime) / duration, 1);
        // Ease out cubic
        let eased = 1 - Math.pow(1 - progress, 3);
        element.innerText = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(step);
        else element.innerText = target;
    }
    requestAnimationFrame(step);
}

// ─── Animated Progress Bars ─────────────────────────────────────────────────
function animateProgressBars() {
    document.querySelectorAll('[data-target-width]').forEach(bar => {
        let targetW = bar.getAttribute('data-target-width');
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.width = targetW;
            bar.classList.add('progress-bar-animated-fill');
        }, 80);
    });
}

// ─── Navbar Bell Badge ──────────────────────────────────────────────────────
function updateNavBellBadge() {
    let currentUser = getCurrentUser();
    let badge = document.getElementById('nav-notif-badge');
    if (!badge) return;
    if (!currentUser || !currentUser.useremail) {
        badge.classList.add('d-none');
        return;
    }
    let notifs = getNotifications(currentUser.useremail);
    // Count unread: claim requests + owner notifications
    let unread = notifs.filter(n =>
        n.type === 'claim_request' ||
        n.type === 'owner_notification' ||
        (n.message && (n.message.includes('Good News') || n.message.includes('Hidden Details')))
    ).length;
    if (unread > 0) {
        badge.textContent = unread > 99 ? '99+' : unread;
        badge.classList.remove('d-none');
    } else {
        badge.classList.add('d-none');
    }
}

// ─── Render Navbar User ──────────────────────────────────────────────────────
function renderNavbarUser() {
    let currentUser = getCurrentUser();
    let allUsers = getUsers();
    let userDisplay = document.getElementById("nav-user-display");
    if (!userDisplay) return;

    if (!currentUser) {
        userDisplay.innerHTML = `
            <a class="btn btn-sm btn-outline-primary fw-semibold" href="login.html">
                <i class="bi bi-person me-1"></i>Sign In / Switch User
            </a>
        `;
        updateNavBellBadge();
        return;
    }

    let userOptionsHtml = allUsers.map(u => {
        let isCurrent = u.useremail && currentUser.useremail && u.useremail.toLowerCase().trim() === currentUser.useremail.toLowerCase().trim();
        return `
            <li>
                <a class="dropdown-item d-flex align-items-center justify-content-between py-2 ${isCurrent ? 'bg-light fw-bold' : ''}" href="#" onclick="switchAccount('${u.useremail}')">
                    <div class="d-flex align-items-center">
                        <div class="rounded-circle fw-bold me-2 d-flex align-items-center justify-content-center" style="width:28px;height:28px;font-size:0.72rem;background:var(--primary-light);color:var(--primary-color);">
                            ${u.username ? u.username.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase() : 'U'}
                        </div>
                        <div>
                            <div class="small fw-semibold">${u.username}</div>
                            <div class="extra-small text-muted">${u.useremail}</div>
                        </div>
                    </div>
                    ${isCurrent ? '<span class="badge bg-primary rounded-pill ms-2" style="font-size:0.62rem;">Active</span>' : ''}
                </a>
            </li>
        `;
    }).join('');

    userDisplay.innerHTML = `
        <div class="dropdown">
            <button class="btn btn-sm btn-light dropdown-toggle border shadow-sm fw-bold text-dark px-3" type="button" data-bs-toggle="dropdown">
                <i class="bi bi-person-circle text-primary me-1"></i><span>${currentUser.username}</span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow p-2" style="min-width:260px;">
                <li class="px-3 py-2 rounded-3 mb-2 border" style="background:var(--primary-light);">
                    <small class="text-muted d-block text-uppercase extra-small fw-bold">Active Account</small>
                    <strong class="text-dark small d-block">${currentUser.username}</strong>
                    <span class="extra-small text-muted d-block text-truncate">${currentUser.useremail}</span>
                </li>
                <li class="px-2 pb-1"><small class="text-muted fw-bold extra-small text-uppercase">Switch Account</small></li>
                ${userOptionsHtml}
                <li><hr class="dropdown-divider my-2"></li>
                <li>
                    <a class="dropdown-item small rounded-2 py-2" href="login.html">
                        <i class="bi bi-person-plus text-success me-2"></i>Sign In / Add User
                    </a>
                </li>
                <li>
                    <a class="dropdown-item small text-danger fw-bold rounded-2 py-2" href="#" onclick="handleLogout()">
                        <i class="bi bi-box-arrow-right me-2"></i>Log Out
                    </a>
                </li>
            </ul>
        </div>
    `;

    updateNavBellBadge();
}

function switchAccount(email) {
    let u = switchUser(email);
    if (u) {
        if (window.location.pathname.includes("matches.html")) {
            window.location.href = "matches.html";
        } else {
            window.location.reload();
        }
    }
}

function handleLogout() {
    localStorage.removeItem("isLoggedIn");
    window.location.href = "login.html";
}

// =============================================================
// 1. HOME PAGE LOGIC & INTERACTIVE 3D ANIMATIONS
// =============================================================
function initHomePage() {
    let reports = getReports();

    let totalEl  = document.getElementById("stat-total");
    let lostEl   = document.getElementById("stat-lost");
    let foundEl  = document.getElementById("stat-found");

    let total = reports.length;
    let lostCount  = reports.filter(r => r.type === "lost").length;
    let foundCount = reports.filter(r => r.type === "found").length;

    // Count-up on load
    animateCountUp(totalEl, total);
    animateCountUp(lostEl,  lostCount,  700);
    animateCountUp(foundEl, foundCount, 1000);

    renderRecentCards(reports);

    // Filter listeners
    let searchIn   = document.getElementById("home-search-input");
    let typeSelect = document.getElementById("home-type-filter");
    let catSelect  = document.getElementById("home-category-filter");

    let filterCards = () => {
        let q = searchIn ? searchIn.value.toLowerCase().trim() : "";
        let t = typeSelect ? typeSelect.value : "all";
        let c = catSelect  ? catSelect.value  : "all";
        let filtered = reports.filter(item => {
            let matchQ = item.itemName.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
            let matchT = t === "all" || item.type === t;
            let matchC = c === "all" || item.category === c;
            return matchQ && matchT && matchC;
        });
        renderRecentCards(filtered);
    };

    if (searchIn)   searchIn.oninput    = filterCards;
    if (typeSelect) typeSelect.onchange = filterCards;
    if (catSelect)  catSelect.onchange  = filterCards;

    // Initialize 3D Parallax Tilt, Scroll Reveal, Navbar Scroll Effect, and Simulator Tilt
    init3DParallaxTilt();
    initScrollReveal();
    initNavbarScroll();
    initSimulatorTilt();
}

// ─── 3D Parallax Tilt on Hero Mockup ────────────────────────────────────────
function init3DParallaxTilt() {
    let container = document.getElementById("hero-mockup-container");
    let mockup = document.getElementById("hero-mockup-element");
    if (!container || !mockup) return;

    container.addEventListener("mousemove", (e) => {
        let rect = container.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

        let centerX = rect.width / 2;
        let centerY = rect.height / 2;

        let rotateX = ((y - centerY) / centerY) * -12; // tilt up/down
        let rotateY = ((x - centerX) / centerX) * 14;  // tilt left/right

        mockup.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    container.addEventListener("mouseleave", () => {
        mockup.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    });
}

// ─── Navbar Scroll Blur / Solid Effect ──────────────────────────────────────
function initNavbarScroll() {
    let nav = document.getElementById("main-nav");
    if (!nav) return;
    window.addEventListener("scroll", () => {
        if (window.scrollY > 40) {
            nav.classList.add("navbar-scrolled");
        } else {
            nav.classList.remove("navbar-scrolled");
        }
    });
}

// ─── Scroll Reveal via IntersectionObserver ─────────────────────────────────
function initScrollReveal() {
    if (!('IntersectionObserver' in window)) return;
    let observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-revealed");
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal-item').forEach(el => observer.observe(el));
}

// ─── Global Text Selection Lock ───────────────────────────────────────────────
document.addEventListener("selectstart", function (e) {
    let tag = e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable || e.target.classList.contains("user-select-text")) {
        return true;
    }
    e.preventDefault();
    return false;
});

// ─── Interactive AI Matching Simulator Handler (Ultra-Animated) ──────────────
let currentSimScore = 96;

function animateScoreCount(targetVal, targetColor, textShadow) {
    let scoreEl = document.getElementById("sim-score-num");
    if (!scoreEl) return;
    scoreEl.style.color = targetColor;
    if (textShadow) scoreEl.style.textShadow = textShadow;
    
    let startVal = currentSimScore;
    let startTime = null;
    let duration = 650;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        let progress = Math.min((timestamp - startTime) / duration, 1);
        let ease = 1 - Math.pow(1 - progress, 3);
        let current = Math.round(startVal + (targetVal - startVal) * ease);
        scoreEl.innerText = current + "%";
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            currentSimScore = targetVal;
            scoreEl.innerText = targetVal + "%";
        }
    }
    requestAnimationFrame(step);
}

function updateSvgMeter(scorePct, color1, color2) {
    let svgBar = document.getElementById("sim-svg-progress");
    let stop1  = document.getElementById("sim-grad-stop-1");
    let stop2  = document.getElementById("sim-grad-stop-2");

    if (stop1 && color1) stop1.setAttribute("stop-color", color1);
    if (stop2 && color2) stop2.setAttribute("stop-color", color2);

    if (svgBar) {
        let circumference = 414.7; // 2 * PI * 66
        let offset = circumference - (scorePct / 100) * circumference;
        svgBar.style.strokeDashoffset = offset;
        svgBar.style.filter = `drop-shadow(0 0 10px ${color1})`;
    }
}

function switchSimScenario(scenarioKey) {
    // Update scenario selector dropdown if exists
    let selectEl = document.getElementById("sim-scenario-select");
    if (selectEl && selectEl.value !== scenarioKey) {
        selectEl.value = scenarioKey;
    }

    // Update pill buttons active state
    document.querySelectorAll(".sim-pill-btn").forEach(btn => {
        if (btn.getAttribute("data-scenario") === scenarioKey) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    let brandVal = document.getElementById("sim-val-brand");
    let brandBar = document.getElementById("sim-bar-brand");
    let zoneVal  = document.getElementById("sim-val-zone");
    let zoneBar  = document.getElementById("sim-bar-zone");
    let catVal   = document.getElementById("sim-val-cat");
    let catBar   = document.getElementById("sim-bar-cat");
    let colorVal = document.getElementById("sim-val-color");
    let colorBar = document.getElementById("sim-bar-color");
    let dateVal  = document.getElementById("sim-val-date");
    let dateBar  = document.getElementById("sim-bar-date");
    let descVal  = document.getElementById("sim-val-desc");
    let descBar  = document.getElementById("sim-bar-desc");
    let statusPill = document.getElementById("sim-status-pill");

    if (scenarioKey === "high") {
        // High confidence match
        animateScoreCount(96, "var(--emerald-primary)", "0 0 18px rgba(0,230,118,0.75)");
        updateSvgMeter(96, "#00e676", "#00f0ff");

        if (statusPill) {
            statusPill.textContent = "MATCH FOUND";
            statusPill.className = "sim-status-pill tier-high";
        }

        if (brandVal) { brandVal.innerText = "25.0 pts (Exact Brand: Nike)"; brandVal.style.color = "var(--emerald-primary)"; }
        if (brandBar) { brandBar.style.width = "100%"; brandBar.style.background = "linear-gradient(90deg, #10b981, #00e676, #00f0ff)"; }
        if (zoneVal)  { zoneVal.innerText  = "20.0 pts (Exact Zone: Library)"; zoneVal.style.color = "var(--emerald-primary)"; }
        if (zoneBar)  { zoneBar.style.width  = "100%"; zoneBar.style.background = "linear-gradient(90deg, #10b981, #00e676, #00f0ff)"; }
        if (catVal)   { catVal.innerText   = "20.0 pts (100% Bags)"; catVal.style.color = "var(--emerald-primary)"; }
        if (catBar)   { catBar.style.width   = "100%"; catBar.style.background = "linear-gradient(90deg, #10b981, #00e676, #00f0ff)"; }
        if (colorVal) { colorVal.innerText = "15.0 pts (Identical: Black)"; colorVal.style.color = "var(--emerald-primary)"; }
        if (colorBar) { colorBar.style.width = "100%"; colorBar.style.background = "linear-gradient(90deg, #10b981, #00e676, #00f0ff)"; }
        if (dateVal)  { dateVal.innerText  = "8.8 pts (1 Day Apart)"; dateVal.style.color = "var(--emerald-primary)"; }
        if (dateBar)  { dateBar.style.width  = "88%"; dateBar.style.background = "linear-gradient(90deg, #10b981, #00e676, #00f0ff)"; }
        if (descVal)  { descVal.innerText  = "9.2 pts (Keywords: XPS, zipper)"; descVal.style.color = "var(--emerald-primary)"; }
        if (descBar)  { descBar.style.width  = "92%"; descBar.style.background = "linear-gradient(90deg, #10b981, #00e676, #00f0ff)"; }
    } else if (scenarioKey === "med") {
        // Medium confidence match
        animateScoreCount(74, "#38bdf8", "0 0 18px rgba(56,189,248,0.75)");
        updateSvgMeter(74, "#38bdf8", "#818cf8");

        if (statusPill) {
            statusPill.textContent = "PROBABLE MATCH";
            statusPill.className = "sim-status-pill tier-med";
        }

        if (brandVal) { brandVal.innerText = "25.0 pts (Brand: Apple)"; brandVal.style.color = "#38bdf8"; }
        if (brandBar) { brandBar.style.width = "100%"; brandBar.style.background = "linear-gradient(90deg, #0284c7, #38bdf8, #818cf8)"; }
        if (zoneVal)  { zoneVal.innerText  = "14.0 pts (Adjacent Zone: SAC)"; zoneVal.style.color = "#38bdf8"; }
        if (zoneBar)  { zoneBar.style.width  = "70%"; zoneBar.style.background = "linear-gradient(90deg, #0284c7, #38bdf8, #818cf8)"; }
        if (catVal)   { catVal.innerText   = "20.0 pts (Electronics)"; catVal.style.color = "#38bdf8"; }
        if (catBar)   { catBar.style.width   = "100%"; catBar.style.background = "linear-gradient(90deg, #0284c7, #38bdf8, #818cf8)"; }
        if (colorVal) { colorVal.innerText = "9.0 pts (Similar Tone)"; colorVal.style.color = "#38bdf8"; }
        if (colorBar) { colorBar.style.width = "60%"; colorBar.style.background = "linear-gradient(90deg, #0284c7, #38bdf8, #818cf8)"; }
        if (dateVal)  { dateVal.innerText  = "6.5 pts (3 Days Apart)"; dateVal.style.color = "#38bdf8"; }
        if (dateBar)  { dateBar.style.width  = "65%"; dateBar.style.background = "linear-gradient(90deg, #0284c7, #38bdf8, #818cf8)"; }
        if (descVal)  { descVal.innerText  = "6.5 pts (Partial Model Match)"; descVal.style.color = "#38bdf8"; }
        if (descBar)  { descBar.style.width  = "65%"; descBar.style.background = "linear-gradient(90deg, #0284c7, #38bdf8, #818cf8)"; }
    } else {
        // Low confidence match
        animateScoreCount(12, "#f43f5e", "0 0 18px rgba(244,63,94,0.75)");
        updateSvgMeter(12, "#f43f5e", "#fb7185");

        if (statusPill) {
            statusPill.textContent = "MISMATCH";
            statusPill.className = "sim-status-pill tier-low";
        }

        if (brandVal) { brandVal.innerText = "0.0 pts (Casio vs Milton)"; brandVal.style.color = "#f43f5e"; }
        if (brandBar) { brandBar.style.width = "4%"; brandBar.style.background = "linear-gradient(90deg, #e11d48, #f43f5e, #fda4af)"; }
        if (zoneVal)  { zoneVal.innerText  = "6.0 pts (Distant Zone)"; zoneVal.style.color = "#f43f5e"; }
        if (zoneBar)  { zoneBar.style.width  = "30%"; zoneBar.style.background = "linear-gradient(90deg, #e11d48, #f43f5e, #fda4af)"; }
        if (catVal)   { catVal.innerText   = "0.0 pts (Accessories vs Bottle)"; catVal.style.color = "#f43f5e"; }
        if (catBar)   { catBar.style.width   = "4%"; catBar.style.background = "linear-gradient(90deg, #e11d48, #f43f5e, #fda4af)"; }
        if (colorVal) { colorVal.innerText = "0.0 pts (Different Color)"; colorVal.style.color = "#f43f5e"; }
        if (colorBar) { colorBar.style.width = "4%"; colorBar.style.background = "linear-gradient(90deg, #e11d48, #f43f5e, #fda4af)"; }
        if (dateVal)  { dateVal.innerText  = "2.0 pts (10 Days Apart)"; dateVal.style.color = "#f43f5e"; }
        if (dateBar)  { dateBar.style.width  = "20%"; dateBar.style.background = "linear-gradient(90deg, #e11d48, #f43f5e, #fda4af)"; }
        if (descVal)  { descVal.innerText  = "1.0 pts (No Overlap)"; descVal.style.color = "#f43f5e"; }
        if (descBar)  { descBar.style.width  = "10%"; descBar.style.background = "linear-gradient(90deg, #e11d48, #f43f5e, #fda4af)"; }
    }
}

// Alias for backwards-compatibility with existing inline onchange
function updateSimulatorScenario(scenarioKey) {
    switchSimScenario(scenarioKey);
}

// ─── 3D Parallax Tilt for AI Simulator Card ───────────────────────────────
function initSimulatorTilt() {
    let card = document.getElementById("ai-simulator-card");
    if (!card) return;

    card.addEventListener("mousemove", (e) => {
        let rect = card.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        let centerX = rect.width / 2;
        let centerY = rect.height / 2;

        let rotateX = ((y - centerY) / centerY) * -5;
        let rotateY = ((x - centerX) / centerX) * 5;

        card.style.transform = `perspective(1200px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
    });

    card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0px)";
    });
}

function renderRecentCards(list) {
    let container = document.getElementById("recent-reports-grid");
    if (!container) return;

    if (list.length === 0) {
        container.innerHTML = `<div class="col-12 text-center py-5 text-muted">
            <i class="bi bi-search fs-2 d-block mb-2 text-success opacity-50"></i>
            <strong>No items found matching current filters.</strong>
        </div>`;
        return;
    }

    let currentUser = getCurrentUser();
    container.innerHTML = "";

    list.slice(0, 6).forEach((item, idx) => {
        let isMine = currentUser && item.postedByEmail && currentUser.useremail &&
                     item.postedByEmail.toLowerCase().trim() === currentUser.useremail.toLowerCase().trim();

        let actionBtnHtml = "";
        if (isMine) {
            actionBtnHtml = `<a href="matches.html?id=${item.id}" class="btn btn-sm btn-matching fw-semibold">View Matches <i class="bi bi-arrow-right"></i></a>`;
        } else if (item.type === "lost") {
            actionBtnHtml = `<a href="matches.html?id=${item.id}" class="btn btn-sm btn-found fw-semibold"><i class="bi bi-bell-fill me-1"></i>I Found This</a>`;
        } else {
            actionBtnHtml = `<a href="matches.html?id=${item.id}" class="btn btn-sm btn-matching fw-semibold"><i class="bi bi-shield-check me-1"></i>Claim Item</a>`;
        }

        let delay = idx < 6 ? `delay-${idx + 1}` : '';
        container.innerHTML += `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card card-item-emerald h-100 fade-in-up ${delay}">
                    <div style="position:relative;overflow:hidden;">
                        <img src="${item.image || getDefaultImage(item.category)}" class="card-img-top" style="height:180px;object-fit:cover;transition:transform 0.4s ease;" 
                             onmouseover="this.style.transform='scale(1.06)'" onmouseout="this.style.transform='scale(1)'">
                        <span class="badge ${item.type === 'lost' ? 'badge-lost' : 'badge-found'}" style="position:absolute;top:12px;left:12px;box-shadow:0 2px 8px rgba(0,0,0,0.25);">
                            ${item.type === 'lost' ? 'Lost Item' : 'Found Item'}
                        </span>
                    </div>
                    <div class="card-body d-flex flex-column p-3">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="badge rounded-pill" style="background:var(--mint-light);color:#059669;font-weight:600;font-size:0.75rem;">
                                <i class="bi bi-tag me-1"></i>${item.category}
                            </span>
                            <small class="text-muted"><i class="bi bi-geo-alt text-success"></i> ${item.zone}</small>
                        </div>
                        <h5 class="fw-bold mb-1" style="font-family:'Sora',sans-serif;font-size:1.08rem;">${item.itemName}</h5>
                        <p class="small mb-2">
                            ${isMine ? `<span class="badge" style="background:var(--mint-light);color:#059669;border:1px solid var(--mint-border);">
                                <i class="bi bi-person-check-fill me-1"></i>You (${item.postedBy})
                            </span>` : `<span class="badge bg-light text-dark border">
                                <i class="bi bi-person me-1 text-muted"></i>${item.postedBy}
                            </span>`}
                        </p>
                        <p class="card-text text-muted small mb-3 flex-grow-1">${item.description.substring(0, 95)}…</p>
                        <div class="d-flex justify-content-between align-items-center pt-2 border-top mt-auto">
                            <span class="small text-muted"><i class="bi bi-calendar me-1"></i>${item.date}</span>
                            ${actionBtnHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

// =============================================================
// 2. REPORT ITEM FORM LOGIC + INLINE VALIDATION & ACCOUNT SYNC
// =============================================================
function initReportPage() {
    let form = document.getElementById("report-form");
    if (!form) return;

    let lostBtn   = document.getElementById("btn-type-lost");
    let foundBtn  = document.getElementById("btn-type-found");
    let typeInput = document.getElementById("report-type-input");

    function setReportType(type) {
        if (!typeInput) return;
        typeInput.value = type;
        if (type === "found") {
            if (foundBtn) foundBtn.classList.add("active-found");
            if (lostBtn)  lostBtn.classList.remove("active-lost");
        } else {
            if (lostBtn)  lostBtn.classList.add("active-lost");
            if (foundBtn) foundBtn.classList.remove("active-found");
        }
    }

    let urlParams  = new URLSearchParams(window.location.search);
    let presetType = urlParams.get("type");
    setReportType(presetType === "found" ? "found" : "lost");

    if (lostBtn)  lostBtn.onclick  = () => setReportType("lost");
    if (foundBtn) foundBtn.onclick = () => setReportType("found");

    // ── Dynamic Reporter Profile & Switch Account Logic ────────
    function populateReporterProfile() {
        let activeUser = getCurrentUser();
        let nameEl = document.getElementById("report-user-name");
        let emailEl = document.getElementById("report-user-email");
        let avatarEl = document.getElementById("report-user-avatar");
        let dropdownEl = document.getElementById("report-users-dropdown");

        if (activeUser) {
            if (nameEl) nameEl.textContent = activeUser.username || "Student";
            if (emailEl) emailEl.textContent = activeUser.useremail || "user@campus.edu";
            if (avatarEl) {
                let initials = activeUser.username
                    ? activeUser.username.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
                    : "U";
                avatarEl.textContent = initials;
            }
        }

        if (dropdownEl) {
            let allUsers = getUsers();
            dropdownEl.innerHTML = `
                <li class="px-2 pb-1"><small class="text-muted fw-bold extra-small text-uppercase">Switch Active Account</small></li>
            ` + allUsers.map(u => {
                let isCurrent = activeUser && u.useremail && activeUser.useremail &&
                                u.useremail.toLowerCase().trim() === activeUser.useremail.toLowerCase().trim();
                return `
                    <li>
                        <a class="dropdown-item d-flex align-items-center justify-content-between py-2 ${isCurrent ? 'bg-light fw-bold' : ''}" href="#" onclick="switchReportAccount('${u.useremail}')">
                            <div class="d-flex align-items-center">
                                <div class="rounded-circle fw-bold me-2 d-flex align-items-center justify-content-center" style="width:26px;height:26px;font-size:0.7rem;background:var(--primary-light);color:var(--primary-color);">
                                    ${u.username ? u.username.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase() : 'U'}
                                </div>
                                <div>
                                    <div class="small fw-semibold">${u.username}</div>
                                    <div class="extra-small text-muted">${u.useremail}</div>
                                </div>
                            </div>
                            ${isCurrent ? '<span class="badge bg-success rounded-pill ms-2" style="font-size:0.6rem;">Active</span>' : ''}
                        </a>
                    </li>
                `;
            }).join('') + `
                <li><hr class="dropdown-divider my-2"></li>
                <li>
                    <a class="dropdown-item small rounded-2 py-2" href="login.html">
                        <i class="bi bi-person-plus text-success me-2"></i>Sign In with Another Account
                    </a>
                </li>
            `;
        }
    }

    window.switchReportAccount = function(email) {
        let u = switchUser(email);
        if (u) {
            populateReporterProfile();
            renderNavbarUser();
            showToast(`Active reporter switched to: ${u.username}`, 'success', 2500);
        }
    };

    populateReporterProfile();

    // ── Quick Category Chips Sync ───────────────────────────────
    let categorySelect = form.querySelector('#category');
    let categoryChips  = form.querySelectorAll('#category-chips .quick-chip-btn');
    
    // ── Dynamic Electronics Specific Device Type Logic ─────────
    let electronicsContainer     = form.querySelector('#electronics-spec-container');
    let electronicTypeSelect     = form.querySelector('#electronicType');
    let electronicChips          = form.querySelectorAll('#electronics-device-chips .quick-chip-btn');
    let otherElectronicContainer = form.querySelector('#other-electronic-type-container');
    let otherElectronicInput     = form.querySelector('#otherElectronicType');

    function checkElectronicsCategory() {
        if (!categorySelect || !electronicsContainer) return;
        if (categorySelect.value === 'Electronics') {
            electronicsContainer.classList.remove('d-none');
            if (electronicTypeSelect) electronicTypeSelect.required = true;
        } else {
            electronicsContainer.classList.add('d-none');
            if (electronicTypeSelect) {
                electronicTypeSelect.required = false;
                electronicTypeSelect.value = '';
            }
            if (otherElectronicContainer) otherElectronicContainer.classList.add('d-none');
            if (otherElectronicInput) otherElectronicInput.value = '';
            electronicChips.forEach(c => c.classList.remove('active'));
        }
    }

    categoryChips.forEach(chip => {
        chip.addEventListener('click', () => {
            let cat = chip.getAttribute('data-category');
            if (categorySelect) {
                categorySelect.value = cat;
                categorySelect.dispatchEvent(new Event('change'));
            }
            categoryChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            checkElectronicsCategory();
        });
    });

    if (categorySelect) {
        categorySelect.addEventListener('change', () => {
            categoryChips.forEach(chip => {
                if (chip.getAttribute('data-category') === categorySelect.value) {
                    chip.classList.add('active');
                } else {
                    chip.classList.remove('active');
                }
            });
            checkElectronicsCategory();
        });
    }

    // Wire Electronics Device Chips
    electronicChips.forEach(chip => {
        chip.addEventListener('click', () => {
            let dev = chip.getAttribute('data-device');
            if (electronicTypeSelect) {
                electronicTypeSelect.value = dev;
                electronicTypeSelect.dispatchEvent(new Event('change'));
            }
            electronicChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            // Smart placeholder suggestions for item name
            let nameInput = form.querySelector('#itemName');
            if (nameInput && !nameInput.value.trim()) {
                if (dev === 'Laptop') nameInput.placeholder = 'e.g. Dell XPS 15, MacBook Pro 14 M2, Lenovo ThinkPad';
                else if (dev === 'Smartphone') nameInput.placeholder = 'e.g. Apple iPhone 14 Pro, Samsung Galaxy S23, OnePlus 11';
                else if (dev === 'Headphones / Earbuds') nameInput.placeholder = 'e.g. Apple AirPods Pro 2, Boat Airdopes, Sony WH-1000XM4';
                else if (dev === 'Tablet / iPad') nameInput.placeholder = 'e.g. Apple iPad Air 5th Gen, Samsung Galaxy Tab S8';
                else if (dev === 'Smartwatch') nameInput.placeholder = 'e.g. Apple Watch Series 8, Fossil Gen 6, Noise ColorFit';
                else if (dev === 'Charger & Cable') nameInput.placeholder = 'e.g. Apple 20W USB-C Adapter, Dell 65W Laptop Charger';
                else if (dev === 'Power Bank') nameInput.placeholder = 'e.g. Mi 20000mAh Power Bank, Anker 10000mAh Portable Charger';
                else if (dev === 'Scientific Calculator') nameInput.placeholder = 'e.g. Casio fx-991EX Classwiz, Texas Instruments TI-84';
            }
        });
    });

    if (electronicTypeSelect) {
        electronicTypeSelect.addEventListener('change', () => {
            let val = electronicTypeSelect.value;
            electronicChips.forEach(chip => {
                if (chip.getAttribute('data-device') === val) {
                    chip.classList.add('active');
                } else {
                    chip.classList.remove('active');
                }
            });

            if (val === 'Other Device') {
                if (otherElectronicContainer) otherElectronicContainer.classList.remove('d-none');
                if (otherElectronicInput) {
                    otherElectronicInput.required = true;
                    otherElectronicInput.focus();
                }
            } else {
                if (otherElectronicContainer) otherElectronicContainer.classList.add('d-none');
                if (otherElectronicInput) otherElectronicInput.required = false;
            }

            if (val) {
                setFieldValid('electronicType');
            }
        });
    }

    // ── Quick Color Swatches Sync ───────────────────────────────
    let colorSelect = form.querySelector('#color');
    let colorSwatches = form.querySelectorAll('#color-swatches .color-swatch-btn, #color-swatches .quick-chip-btn');
    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            let col = swatch.getAttribute('data-color');
            if (colorSelect) {
                colorSelect.value = col;
                colorSelect.dispatchEvent(new Event('change'));
            }
            colorSwatches.forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
        });
    });
    if (colorSelect) {
        colorSelect.addEventListener('change', () => {
            colorSwatches.forEach(swatch => {
                if (swatch.getAttribute('data-color') === colorSelect.value) {
                    swatch.classList.add('active');
                } else {
                    swatch.classList.remove('active');
                }
            });
        });
    }

    // ── Quick Campus Zone Chips Sync ────────────────────────────
    let zoneSelect = form.querySelector('#zone');
    let zoneChips  = form.querySelectorAll('#zone-chips .quick-chip-btn');
    zoneChips.forEach(chip => {
        chip.addEventListener('click', () => {
            let zn = chip.getAttribute('data-zone');
            if (zoneSelect) {
                zoneSelect.value = zn;
                zoneSelect.dispatchEvent(new Event('change'));
            }
            zoneChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
        });
    });
    if (zoneSelect) {
        zoneSelect.addEventListener('change', () => {
            zoneChips.forEach(chip => {
                if (chip.getAttribute('data-zone') === zoneSelect.value) {
                    chip.classList.add('active');
                } else {
                    chip.classList.remove('active');
                }
            });
        });
    }

    // ── Description Character Counter ───────────────────────────
    let descriptionEl = form.querySelector('#description');
    let descCharCount = document.getElementById('desc-char-count');
    if (descriptionEl && descCharCount) {
        descriptionEl.addEventListener('input', () => {
            let len = descriptionEl.value.length;
            descCharCount.textContent = `${len} / 500`;
            if (len >= 480) {
                descCharCount.className = 'char-counter-badge limit-reached';
            } else if (len >= 400) {
                descCharCount.className = 'char-counter-badge limit-warning';
            } else {
                descCharCount.className = 'char-counter-badge';
            }
        });
    }

    // ── Image Upload Dropzone Drag & Drop ───────────────────────
    let dropzone = document.getElementById('image-dropzone');
    if (dropzone) {
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.add('dragover');
            });
        });
        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.remove('dragover');
            });
        });
        dropzone.addEventListener('drop', (e) => {
            let dt = e.dataTransfer;
            let files = dt.files;
            if (files && files[0]) {
                previewImage({ target: { files: files } });
            }
        });
    }

    // ── Inline Validation Helpers ──────────────────────────────
    function setFieldValid(fieldId) {
        let el  = form.querySelector(`#${fieldId}`);
        let err = form.querySelector(`#${fieldId}-error`);
        if (el)  { el.classList.remove('is-invalid'); el.classList.add('is-valid'); }
        if (err) { err.textContent = ''; }
    }
    function setFieldInvalid(fieldId, msg) {
        let el  = form.querySelector(`#${fieldId}`);
        let err = form.querySelector(`#${fieldId}-error`);
        if (el)  { el.classList.add('is-invalid'); el.classList.remove('is-valid'); }
        if (err) { err.textContent = msg; }
    }
    function clearField(fieldId) {
        let el  = form.querySelector(`#${fieldId}`);
        let err = form.querySelector(`#${fieldId}-error`);
        if (el)  { el.classList.remove('is-invalid', 'is-valid'); }
        if (err) { err.textContent = ''; }
    }

    // ── Dynamic 'Other' Input Toggles ─────────────────────────
    function setupOtherToggle(selectId, containerId, inputId) {
        let select = form.querySelector(`#${selectId}`);
        let container = form.querySelector(`#${containerId}`);
        let input = form.querySelector(`#${inputId}`);
        if (!select || !container) return;

        function checkOther() {
            if (select.value === "Other") {
                container.classList.remove("d-none");
                if (input) {
                    input.required = true;
                    input.focus();
                }
            } else {
                container.classList.add("d-none");
                if (input) {
                    input.required = false;
                }
            }
        }
        select.addEventListener("change", checkOther);
        checkOther(); // Initial state check
    }

    setupOtherToggle("category", "other-category-container", "otherCategory");
    setupOtherToggle("color", "other-color-container", "otherColor");
    setupOtherToggle("zone", "other-zone-container", "otherZone");

    // Wire live validation
    let itemNameEl = form.querySelector('#itemName');
    let colorEl    = form.querySelector('#color');
    let zoneEl     = form.querySelector('#zone');
    let dateEl     = form.querySelector('#date');

    if (itemNameEl) itemNameEl.addEventListener('input', () => {
        itemNameEl.value.trim().length >= 3
            ? setFieldValid('itemName')
            : (itemNameEl.value.trim().length > 0 ? setFieldInvalid('itemName', 'Item name must be at least 3 characters.') : clearField('itemName'));
    });
    if (categorySelect) categorySelect.addEventListener('change', () => {
        categorySelect.value ? setFieldValid('category') : setFieldInvalid('category', 'Please select a category.');
    });
    if (colorEl) colorEl.addEventListener('change', () => {
        colorEl.value ? setFieldValid('color') : setFieldInvalid('color', 'Please select a color.');
    });
    if (zoneEl) zoneEl.addEventListener('change', () => {
        zoneEl.value ? setFieldValid('zone') : setFieldInvalid('zone', 'Please select a campus zone.');
    });
    if (dateEl) dateEl.addEventListener('change', () => {
        if (!dateEl.value) { setFieldInvalid('date', 'Please select a date.'); return; }
        let d = new Date(dateEl.value), today = new Date();
        today.setHours(23,59,59,999);
        d > today ? setFieldInvalid('date', 'Date cannot be in the future.') : setFieldValid('date');
    });
    if (descriptionEl) descriptionEl.addEventListener('input', () => {
        let len = descriptionEl.value.trim().length;
        if (len === 0)     clearField('description');
        else if (len < 10) setFieldInvalid('description', 'Description must be at least 10 characters.');
        else if (len > 500) setFieldInvalid('description', 'Description cannot exceed 500 characters.');
        else               setFieldValid('description');
    });

    // ── Form Submit ────────────────────────────────────────────
    form.onsubmit = function(e) {
        e.preventDefault();

        let activeUser = getCurrentUser();
        if (!activeUser) {
            showToast('Please sign in before submitting a report.', 'warning');
            return;
        }

        let cat = document.getElementById("category").value;
        if (cat === "Other") {
            let otherCatInput = document.getElementById("otherCategory");
            cat = (otherCatInput && otherCatInput.value.trim()) ? otherCatInput.value.trim() : "Other";
        }

        let elecType = "";
        if (cat === "Electronics") {
            let elecSelect = document.getElementById("electronicType");
            if (elecSelect && elecSelect.value === "Other Device") {
                let otherElecInput = document.getElementById("otherElectronicType");
                elecType = (otherElecInput && otherElecInput.value.trim()) ? otherElecInput.value.trim() : "Other Electronic Device";
            } else if (elecSelect && elecSelect.value) {
                elecType = elecSelect.value;
            }
        }

        let col = document.getElementById("color").value;
        if (col === "Other") {
            let otherColInput = document.getElementById("otherColor");
            col = (otherColInput && otherColInput.value.trim()) ? otherColInput.value.trim() : "Other";
        }

        let zn = document.getElementById("zone").value;
        if (zn === "Other") {
            let otherZnInput = document.getElementById("otherZone");
            zn = (otherZnInput && otherZnInput.value.trim()) ? otherZnInput.value.trim() : "Other";
        }

        let formData = {
            itemName:     document.getElementById("itemName").value,
            category:     cat,
            color:        col,
            zone:         zn,
            date:         document.getElementById("date").value,
            description:  document.getElementById("description").value,
            contactName:  activeUser.username,
            contactEmail: activeUser.useremail
        };

        let validation = ValidationModule.validateReportForm(formData);
        if (!validation.isValid) {
            ValidationModule.displayFormErrors(validation.errors, form);
            showToast('Please fix the highlighted errors before submitting.', 'error');
            return;
        }

        let reportType  = typeInput ? typeInput.value : "lost";
        let hiddenInput = document.getElementById("hiddenDetails") || document.getElementById("hiddenInput");
        let hiddenVal   = (reportType === "lost" && hiddenInput) ? hiddenInput.value.trim() : "";
        let itemImg     = uploadedImageBase64 || getDefaultImage(cat);

        // Submit animation state
        let submitBtn = document.getElementById("btn-submit-report");
        let submitText = document.getElementById("btn-submit-text");
        let submitIcon = document.getElementById("btn-submit-icon");
        if (submitBtn) submitBtn.disabled = true;
        if (submitText) submitText.textContent = "RUNNING 6-FACTOR NEURAL ENGINE...";
        if (submitIcon) submitIcon.className = "spinner-border spinner-border-sm ms-2";

        let newReport = {
            id:           "REP-" + Math.floor(1000 + Math.random() * 9000),
            type:         reportType,
            itemName:     formData.itemName,
            category:     cat,
            electronicType: elecType,
            subcategory:  elecType,
            color:        formData.color,
            zone:         formData.zone,
            date:         formData.date,
            description:  formData.description,
            hiddenDetails: hiddenVal,
            postedBy:     activeUser.username,
            postedByEmail: activeUser.useremail,
            contactPhone: "+91 98765 43210",
            image:        itemImg,
            status:       "Searching"
        };

        saveReport(newReport);
        uploadedImageBase64 = null;

        showToast(`Report for "${newReport.itemName}" submitted! Running vector match engine…`, 'success', 3000);
        setTimeout(() => {
            window.location.href = "matches.html?id=" + newReport.id;
        }, 750);
    };
}

// =============================================================
// 3. MATCHES PAGE LOGIC + ADVANCED MULTI-FACTOR ENGINE & FILTERING
// =============================================================

// State stored in sessionStorage
let _matchSortBy      = sessionStorage.getItem('match_sort')   || 'score';
let _matchCategory    = sessionStorage.getItem('match_cat')    || 'all';
let _matchConfidence  = sessionStorage.getItem('match_conf')   || 'all';
let _matchSearchQuery = '';

function initMatchesPage() {
    let reports    = getReports();
    let urlParams  = new URLSearchParams(window.location.search);
    let urlTargetId = urlParams.get("id");
    let currentUser = getCurrentUser();

    let myReports    = [];
    let otherReports = [];

    reports.forEach(r => {
        let isMine = currentUser && r.postedByEmail && currentUser.useremail &&
                     r.postedByEmail.toLowerCase().trim() === currentUser.useremail.toLowerCase().trim();
        if (isMine) myReports.push(r); else otherReports.push(r);
    });

    let targetReport = null;

    if (urlTargetId) {
        let requested = reports.find(r => r.id === urlTargetId);
        if (requested) {
            let isMine = currentUser && requested.postedByEmail && currentUser.useremail &&
                         requested.postedByEmail.toLowerCase().trim() === currentUser.useremail.toLowerCase().trim();
            if (isMine) {
                targetReport = requested;
            } else {
                let myOpposite = myReports.find(r => r.type !== requested.type);
                targetReport = myOpposite || (myReports.length > 0 ? myReports[0] : requested);
            }
        }
    }

    if (!targetReport && myReports.length > 0) targetReport = myReports[0];

    // Populate report selector
    let selectEl = document.getElementById("target-report-select");
    if (selectEl) {
        selectEl.innerHTML = "";
        if (myReports.length > 0) {
            let g = `<optgroup label="⭐ My Reports (${currentUser ? currentUser.username : 'You'})">`;
            myReports.forEach(r => {
                g += `<option value="${r.id}" ${targetReport && r.id === targetReport.id ? 'selected' : ''}>[${r.type.toUpperCase()}] ${r.itemName} (Mine)</option>`;
            });
            g += `</optgroup>`;
            selectEl.innerHTML += g;
        }
        if (otherReports.length > 0) {
            let g = `<optgroup label="🏫 Other Campus Reports">`;
            otherReports.forEach(r => {
                g += `<option value="${r.id}" ${targetReport && r.id === targetReport.id ? 'selected' : ''}>[${r.type.toUpperCase()}] ${r.itemName} (by ${r.postedBy})</option>`;
            });
            g += `</optgroup>`;
            selectEl.innerHTML += g;
        }
        selectEl.onchange = (e) => {
            if (e.target.value) window.location.href = "matches.html?id=" + e.target.value;
        };
    }

    if (!targetReport && myReports.length === 0) {
        renderNoUserReportsState(currentUser);
        return;
    }

    if (targetReport) {
        renderTargetBanner(targetReport, currentUser);
        renderMatchCardsList(targetReport, reports);
    }

    // Wire search, sort and filter controls
    let searchIn   = document.getElementById('match-search-input');
    let sortSelect = document.getElementById('match-sort-select');
    let catFilter  = document.getElementById('match-cat-filter');
    let confFilter = document.getElementById('match-confidence-filter');

    if (searchIn) {
        searchIn.addEventListener('input', () => {
            _matchSearchQuery = searchIn.value.toLowerCase().trim();
            if (targetReport) renderMatchCardsList(targetReport, reports);
        });
    }

    if (sortSelect) {
        sortSelect.value = _matchSortBy;
        sortSelect.onchange = () => {
            _matchSortBy = sortSelect.value;
            sessionStorage.setItem('match_sort', _matchSortBy);
            if (targetReport) renderMatchCardsList(targetReport, reports);
        };
    }

    if (catFilter) {
        catFilter.value = _matchCategory;
        catFilter.onchange = () => {
            _matchCategory = catFilter.value;
            sessionStorage.setItem('match_cat', _matchCategory);
            if (targetReport) renderMatchCardsList(targetReport, reports);
        };
    }

    if (confFilter) {
        confFilter.value = _matchConfidence;
        confFilter.onchange = () => {
            _matchConfidence = confFilter.value;
            sessionStorage.setItem('match_conf', _matchConfidence);
            if (targetReport) renderMatchCardsList(targetReport, reports);
        };
    }
}

function renderNoUserReportsState(currentUser) {
    let banner    = document.getElementById("target-item-banner");
    let container = document.getElementById("matches-grid");
    let countEl   = document.getElementById("matches-count");

    if (countEl) countEl.innerText = "0";

    let userName  = currentUser ? currentUser.username  : "Student";
    let userEmail = currentUser ? currentUser.useremail : "";

    if (banner) {
        banner.innerHTML = `
            <div class="target-radar-hud text-center fade-in-up">
                <div class="py-3">
                    <div class="badge mb-3 px-3 py-2 rounded-pill fw-bold" style="background:rgba(0,230,118,0.2);color:var(--emerald-primary);border:1px solid rgba(0,230,118,0.4);">
                        <i class="bi bi-person-circle me-1"></i>${userName} (${userEmail})
                    </div>
                    <h3 class="fw-bold mb-2 text-white" style="font-family:'Sora',sans-serif;">No Target Reports by ${userName}</h3>
                    <p class="small text-light opacity-75 mb-4 mx-auto" style="max-width:500px;">Submit a Lost or Found item report to activate the 6-factor neural similarity matching engine.</p>
                    <div class="d-flex justify-content-center gap-3 flex-wrap">
                        <a href="report.html?type=lost" class="btn btn-lost"><i class="bi bi-plus-circle me-1"></i>Post Lost Item</a>
                        <a href="report.html?type=found" class="btn btn-found"><i class="bi bi-plus-circle me-1"></i>Post Found Item</a>
                    </div>
                </div>
            </div>`;
    }
    if (container) {
        container.innerHTML = `
            <div class="col-12 text-center py-5 bg-white rounded-3 border fade-in-up delay-2 shadow-sm">
                <i class="bi bi-cpu fs-1 d-block mb-3 text-success opacity-40"></i>
                <h5 class="fw-bold text-dark" style="font-family:'Sora',sans-serif;">Neural Match Engine Standing By</h5>
                <p class="small text-muted mb-0">Post a report and ranked probability matches will appear here automatically.</p>
            </div>`;
    }
}

function renderTargetBanner(item, currentUser) {
    let banner = document.getElementById("target-item-banner");
    if (!banner) return;

    let isMyReport = currentUser && item.postedByEmail && currentUser.useremail &&
                     item.postedByEmail.toLowerCase().trim() === currentUser.useremail.toLowerCase().trim();

    banner.innerHTML = `
        <div class="target-radar-hud fade-in-up">
            <div class="row align-items-center g-4">
                <div class="col-md-2 text-center">
                    <div style="position:relative;display:inline-block;">
                        <img src="${item.image || getDefaultImage(item.category)}" class="img-fluid rounded-3 border" style="max-height:105px;width:105px;object-fit:cover;border-color:var(--emerald-primary)!important;box-shadow:0 0 16px rgba(0,230,118,0.3);">
                        <span class="badge ${item.type === 'lost' ? 'badge-lost' : 'badge-found'}" style="position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);font-size:0.65rem;white-space:nowrap;">
                            ${item.type.toUpperCase()}
                        </span>
                    </div>
                </div>
                <div class="col-md-7">
                    <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
                        <span class="badge rounded-pill" style="background:rgba(0,230,118,0.18);color:var(--emerald-primary);border:1px solid rgba(0,230,118,0.4);font-size:0.75rem;">
                            <i class="bi bi-radar me-1"></i>Active Vector Target
                        </span>
                        ${isMyReport
                            ? `<span class="badge rounded-pill text-white" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);font-size:0.75rem;"><i class="bi bi-person-check-fill text-success me-1"></i>You (${currentUser.username})</span>`
                            : `<span class="badge rounded-pill text-white" style="background:rgba(255,255,255,0.1);font-size:0.75rem;"><i class="bi bi-person me-1"></i>${item.postedBy}</span>`
                        }
                    </div>
                    <h3 class="fw-bold mb-2 text-white" style="font-family:'Sora',sans-serif;">${item.itemName}</h3>
                    <div class="d-flex flex-wrap gap-2 small">
                        <span class="badge bg-dark border border-secondary text-light"><i class="bi bi-tag text-success me-1"></i>${item.category}</span>
                        <span class="badge bg-dark border border-secondary text-light"><i class="bi bi-geo-alt text-success me-1"></i>${item.zone}</span>
                        <span class="badge bg-dark border border-secondary text-light"><i class="bi bi-palette text-success me-1"></i>${item.color}</span>
                        <span class="badge bg-dark border border-secondary text-light"><i class="bi bi-calendar text-success me-1"></i>${item.date}</span>
                    </div>
                </div>
                <div class="col-md-3 text-md-end">
                    <a href="report.html" class="btn btn-glass-pill btn-arrow-slide py-2 px-3 fs-6">
                        <span>Post New Report</span> <i class="bi bi-plus-circle"></i>
                    </a>
                </div>
            </div>
        </div>`;
}

function renderMatchCardsList(targetReport, reports) {
    let container = document.getElementById("matches-grid");
    if (!container) return;

    let allMatches = findMatches(targetReport, reports);

    // ── Filter by category ──────────────────────────────────────
    let filtered = allMatches;
    if (_matchCategory !== 'all') {
        filtered = filtered.filter(m => m.candidate.category === _matchCategory);
    }

    // ── Filter by confidence tier ───────────────────────────────
    if (_matchConfidence === 'high') {
        filtered = filtered.filter(m => m.score >= 70);
    } else if (_matchConfidence === 'med') {
        filtered = filtered.filter(m => m.score >= 45);
    }

    // ── Filter by keyword search ────────────────────────────────
    if (_matchSearchQuery) {
        filtered = filtered.filter(m => {
            let item = m.candidate;
            let combined = `${item.itemName} ${item.category} ${item.zone} ${item.color} ${item.description}`.toLowerCase();
            return combined.includes(_matchSearchQuery) || (m.brandMatch && m.brandMatch.toLowerCase().includes(_matchSearchQuery));
        });
    }

    // ── Sort ────────────────────────────────────────────────────
    if (_matchSortBy === 'score') {
        filtered.sort((a, b) => b.score - a.score);
    } else if (_matchSortBy === 'name') {
        filtered.sort((a, b) => a.candidate.itemName.localeCompare(b.candidate.itemName));
    } else if (_matchSortBy === 'zone') {
        filtered.sort((a, b) => a.candidate.zone.localeCompare(b.candidate.zone));
    } else if (_matchSortBy === 'date') {
        filtered.sort((a, b) => new Date(b.candidate.date) - new Date(a.candidate.date));
    }

    let countEl = document.getElementById("matches-count");
    if (countEl) countEl.innerText = filtered.length;

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5 text-muted bg-white rounded-3 border fade-in-up shadow-sm">
                <i class="bi bi-search fs-2 d-block mb-2 text-success opacity-50"></i>
                <h5 class="fw-bold text-dark" style="font-family:'Sora',sans-serif;">No Candidate Matches Found</h5>
                <p class="small mb-0">Try clearing filters or post a corresponding item report.</p>
            </div>`;
        return;
    }

    container.innerHTML = "";
    filtered.forEach((m, idx) => {
        let item = m.candidate;
        let b    = m.breakdown;

        let isCandidateFound = item.type === "found";
        let btnText  = isCandidateFound
            ? `<span>Claim Item (Verify)</span> <i class="bi bi-shield-check"></i>`
            : `<span>Notify Owner</span> <i class="bi bi-bell-fill"></i>`;
        
        let tierClass = m.score >= 75 ? 'tier-high' : (m.score >= 50 ? 'tier-med' : 'tier-low');
        let tierText  = m.score >= 75 ? 'High Confidence Match' : (m.score >= 50 ? 'Probable Match' : 'Low Similarity');
        let delay = idx < 4 ? `delay-${idx + 1}` : '';

        container.innerHTML += `
            <div class="col-12 mb-4">
                <div class="card match-card-futuristic fade-in-up ${delay}">
                    <div class="row g-0">
                        <!-- Image Column -->
                        <div class="col-md-3">
                            <div class="card-img-wrap position-relative">
                                <img src="${item.image || getDefaultImage(item.category)}">
                                <span class="badge ${item.type === 'lost' ? 'badge-lost' : 'badge-found'}" style="position:absolute;top:12px;left:12px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
                                    ${item.type.toUpperCase()} ITEM
                                </span>
                                ${m.brandMatch ? `<span class="badge rounded-pill bg-dark text-white border border-light position-absolute" style="bottom:12px;left:12px;font-size:0.65rem;"><i class="bi bi-award-fill text-warning me-1"></i>${m.brandMatch}</span>` : ''}
                            </div>
                        </div>

                        <!-- Info & Neural Match Factors Column -->
                        <div class="col-md-5 p-4 d-flex flex-column justify-content-between">
                            <div>
                                <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
                                    <span class="badge bg-light text-dark border"><i class="bi bi-person-fill text-success me-1"></i>${item.postedBy}</span>
                                    <span class="badge bg-light text-dark border"><i class="bi bi-calendar text-muted me-1"></i>${item.date}</span>
                                    <button type="button" class="btn btn-sm btn-outline-success rounded-pill py-0 px-2 ms-auto" style="font-size:0.7rem;" onclick="openCompareModal('${targetReport.id}','${item.id}')">
                                        <i class="bi bi-layout-split me-1"></i>Compare Attributes
                                    </button>
                                </div>
                                <h4 class="fw-bold mb-1 text-dark" style="font-family:'Sora',sans-serif;">${item.itemName}</h4>
                                <p class="small text-muted mb-2"><i class="bi bi-geo-alt text-success me-1"></i>${item.zone} &nbsp;·&nbsp; <i class="bi bi-tag text-success me-1"></i>${item.category} &nbsp;·&nbsp; Color: ${item.color}</p>
                                <p class="card-text text-muted small mb-3">${item.description}</p>
                            </div>

                            <!-- Neural Breakdown Chips -->
                            <div class="p-3 rounded-3" style="background:#f8fafc;border:1px solid #e2e8f0;">
                                <strong class="extra-small d-block mb-1 text-uppercase text-muted fw-bold" style="letter-spacing:0.04em;">
                                    <i class="bi bi-cpu text-success me-1"></i>AI Similarity Signals:
                                </strong>
                                <div class="d-flex flex-wrap">
                                    ${m.reasons.length > 0
                                        ? m.reasons.map(r => `<span class="match-factor-chip"><i class="bi bi-check-circle-fill text-success"></i> ${r}</span>`).join('')
                                        : '<span class="extra-small text-muted">Partial attribute correlation</span>'}
                                </div>
                            </div>
                        </div>

                        <!-- Score & Segmented Gauges Column -->
                        <div class="col-md-4 p-4 border-start d-flex flex-column justify-content-between" style="background:#fafbfc;">
                            <div>
                                <!-- Holographic Score Header -->
                                <div class="score-hud-box mb-3">
                                    <div class="small fw-semibold text-light opacity-75 mb-1" style="font-size:0.75rem;letter-spacing:0.04em;">SIMILARITY PROBABILITY</div>
                                    <div class="score-hud-number">${m.score}%</div>
                                    <span class="score-hud-tier ${tierClass}">${tierText}</span>
                                </div>

                                <!-- Segmented 6-Attribute Gauges -->
                                <div class="mb-3">
                                    ${[
                                        { label: 'Item Name & Brand (25%)', pts: b.name ? b.name.pts : 0,        max: 25 },
                                        { label: 'Campus Zone (20%)',       pts: b.location ? b.location.pts : 0, max: 20 },
                                        { label: 'Category (20%)',          pts: b.category ? b.category.pts : 0, max: 20 },
                                        { label: 'Color Match (15%)',       pts: b.color ? b.color.pts : 0,       max: 15 },
                                        { label: 'Date Interval (10%)',     pts: b.date ? b.date.pts : 0,         max: 10 },
                                        { label: 'Description NLP (10%)',   pts: b.description ? b.description.pts : 0, max: 10 }
                                    ].map(row => {
                                        let pct = Math.round((row.pts / row.max) * 100);
                                        return `
                                            <div class="neon-progress-item">
                                                <div class="neon-progress-header">
                                                    <span>${row.label}</span>
                                                    <span class="fw-bold" style="color:#059669;">${row.pts}/${row.max} pts</span>
                                                </div>
                                                <div class="neon-progress-track">
                                                    <div class="neon-progress-fill" data-target-width="${pct}%" style="width:${pct}%;"></div>
                                                </div>
                                            </div>`;
                                    }).join('')}
                                </div>
                            </div>

                            <!-- Action CTA -->
                            <div class="d-flex gap-2">
                                <button class="btn btn-outline-secondary rounded-pill py-2 px-3 fs-6" onclick="openCompareModal('${targetReport.id}','${item.id}')" title="Compare Side-by-Side">
                                    <i class="bi bi-layout-split"></i>
                                </button>
                                <button class="btn btn-emerald-pill btn-arrow-slide flex-grow-1 justify-content-center py-2 fs-6 shadow-sm" onclick="openClaimModal('${targetReport.id}','${item.id}')">
                                    ${btnText}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    });

    // Smoothly animate progress bars after render
    setTimeout(animateProgressBars, 80);
}

// ── Side-by-Side Comparison Modal Logic ─────────────────────
function openCompareModal(targetReportId, candidateItemId) {
    let reports       = getReports();
    let targetReport  = reports.find(r => r.id === targetReportId);
    let candidateItem = reports.find(r => r.id === candidateItemId);

    if (!targetReport || !candidateItem) return;

    let matchInfo = calculateMatchScore(targetReport, candidateItem);
    let modalEl   = document.getElementById("compareModal");
    let modalBody = document.getElementById("compare-modal-body");
    if (!modalEl || !modalBody) return;

    let isTargetLost = targetReport.type === "lost";

    modalBody.innerHTML = `
        <div class="text-center mb-4">
            <span class="badge rounded-pill px-3 py-2 fs-6 mb-2" style="background:var(--mint-light);color:#059669;border:1px solid var(--mint-border);">
                <i class="bi bi-cpu-fill me-1"></i>Overall Similarity Score: ${matchInfo.score}%
            </span>
            <p class="small text-muted mb-0">Detailed attribute-by-attribute comparison generated by the 6-factor similarity engine.</p>
        </div>

        <div class="compare-grid-box mb-4">
            <!-- Target Item Column -->
            <div class="compare-col-card is-target">
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <span class="badge ${isTargetLost ? 'badge-lost' : 'badge-found'}">YOUR ${targetReport.type.toUpperCase()} ITEM</span>
                    <small class="text-muted"><i class="bi bi-person me-1"></i>${targetReport.postedBy}</small>
                </div>
                <div class="text-center mb-3">
                    <img src="${targetReport.image || getDefaultImage(targetReport.category)}" class="img-fluid rounded-3 border" style="max-height:140px;width:100%;object-fit:cover;">
                </div>
                <h5 class="fw-bold text-dark mb-2" style="font-family:'Sora',sans-serif;">${targetReport.itemName}</h5>
                <div class="compare-attr-item">
                    <span class="text-muted">Category:</span>
                    <strong>${targetReport.category}</strong>
                </div>
                <div class="compare-attr-item">
                    <span class="text-muted">Color:</span>
                    <strong>${targetReport.color}</strong>
                </div>
                <div class="compare-attr-item">
                    <span class="text-muted">Campus Zone:</span>
                    <strong>${targetReport.zone}</strong>
                </div>
                <div class="compare-attr-item">
                    <span class="text-muted">Incident Date:</span>
                    <strong>${targetReport.date}</strong>
                </div>
                <div class="pt-2">
                    <small class="text-muted d-block">Public Description:</small>
                    <p class="small text-dark mb-0">${targetReport.description}</p>
                </div>
            </div>

            <!-- Candidate Match Column -->
            <div class="compare-col-card">
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <span class="badge ${candidateItem.type === 'lost' ? 'badge-lost' : 'badge-found'}">MATCHED ${candidateItem.type.toUpperCase()} ITEM</span>
                    <small class="text-muted"><i class="bi bi-person me-1"></i>${candidateItem.postedBy}</small>
                </div>
                <div class="text-center mb-3">
                    <img src="${candidateItem.image || getDefaultImage(candidateItem.category)}" class="img-fluid rounded-3 border" style="max-height:140px;width:100%;object-fit:cover;">
                </div>
                <h5 class="fw-bold text-dark mb-2" style="font-family:'Sora',sans-serif;">${candidateItem.itemName}</h5>
                <div class="compare-attr-item">
                    <span class="text-muted">Category:</span>
                    <strong>${candidateItem.category}</strong>
                </div>
                <div class="compare-attr-item">
                    <span class="text-muted">Color:</span>
                    <strong>${candidateItem.color}</strong>
                </div>
                <div class="compare-attr-item">
                    <span class="text-muted">Campus Zone:</span>
                    <strong>${candidateItem.zone}</strong>
                </div>
                <div class="compare-attr-item">
                    <span class="text-muted">Incident Date:</span>
                    <strong>${candidateItem.date}</strong>
                </div>
                <div class="pt-2">
                    <small class="text-muted d-block">Public Description:</small>
                    <p class="small text-dark mb-0">${candidateItem.description}</p>
                </div>
            </div>
        </div>

        <div class="p-3 rounded-3 mb-3" style="background:#f8fafc;border:1px solid #e2e8f0;">
            <div class="small fw-bold text-uppercase text-muted mb-2"><i class="bi bi-check-all text-success me-1"></i>Verified Similarity Points:</div>
            <div class="d-flex flex-wrap gap-1">
                ${matchInfo.reasons.map(r => `<span class="match-factor-chip"><i class="bi bi-check-circle-fill text-success"></i> ${r}</span>`).join('')}
            </div>
        </div>

        <div class="d-flex gap-3 justify-content-end">
            <button type="button" class="btn btn-light rounded-pill px-4" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-emerald-pill rounded-pill px-4" onclick="bootstrap.Modal.getInstance(document.getElementById('compareModal')).hide(); openClaimModal('${targetReport.id}','${candidateItem.id}');">
                Proceed with Claim & Contact <i class="bi bi-arrow-right"></i>
            </button>
        </div>
    `;

    let bsModal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    bsModal.show();
}

// =============================================================
// 4. INTERACTIVE CLAIM & CONTACT MODAL FLOW
// =============================================================
function openClaimModal(targetReportId, candidateItemId) {
    let reports       = getReports();
    let targetReport  = reports.find(r => r.id === targetReportId);
    let candidateItem = reports.find(r => r.id === candidateItemId);

    if (!candidateItem && targetReportId) candidateItem = reports.find(r => r.id === targetReportId);
    if (!candidateItem) return;

    let currentUser = getCurrentUser();
    let modalEl     = document.getElementById("claimModal");
    let modalBody   = document.getElementById("claim-modal-body");
    if (!modalEl || !modalBody) return;

    let isCandidateLost = candidateItem.type === "lost";

    if (isCandidateLost) {
        let lostReport = candidateItem;
        let ownerEmail = lostReport.postedByEmail;
        let ownerName  = lostReport.postedBy;
        let isSelf     = currentUser && ownerEmail && currentUser.useremail &&
                         ownerEmail.toLowerCase().trim() === currentUser.useremail.toLowerCase().trim();

        if (isSelf) {
            modalBody.innerHTML = `
                <div class="alert alert-warning border-0 shadow-sm mb-3">
                    <h6 class="fw-bold mb-2"><i class="bi bi-exclamation-triangle-fill me-1"></i>Self-Reported Lost Item</h6>
                    <p class="small mb-0">This is your own report. Switch to another account to test the finder flow.</p>
                </div>
                <button type="button" class="btn btn-secondary w-100 fw-bold" data-bs-dismiss="modal">Close</button>`;
        } else {
            modalBody.innerHTML = `
                <div class="mb-3">
                    <span class="badge badge-lost me-2">LOST ITEM</span>
                    <h5 class="fw-bold text-dark mb-1 fs-5">${lostReport.itemName}</h5>
                    <div class="p-2 rounded border mt-2 small text-dark" style="background:var(--primary-light);">
                        <i class="bi bi-person-circle me-1" style="color:var(--primary-color)"></i>Owner: <strong>${ownerName}</strong> (${ownerEmail})
                    </div>
                </div>
                <div class="p-3 rounded-3 border mb-3 small text-muted" style="background:#f8fafc;">
                    <strong>Lost Item Description:</strong> ${lostReport.description}
                    ${targetReport && targetReport.type === 'found' ? `<div class="mt-2" style="color:var(--primary-color);"><strong>Your Found Report:</strong> ${targetReport.itemName} (${targetReport.zone})</div>` : ''}
                </div>
                <form id="notify-owner-form" onsubmit="handleNotifyOwnerSubmit(event,'${lostReport.id}','${targetReport ? targetReport.id : ''}')">
                    <div class="mb-3">
                        <label class="form-label fw-semibold small">Your Name (Finder)</label>
                        <input type="text" id="finder-name-input" class="form-control form-control-sm" value="${currentUser ? currentUser.username : ''}" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold small">Your Contact Phone (Optional)</label>
                        <input type="tel" id="finder-phone-input" class="form-control form-control-sm" value="${currentUser && currentUser.contactPhone ? currentUser.contactPhone : '+91 98123 45678'}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold small">Notification Message for ${ownerName}</label>
                        <textarea id="found-notice-message" rows="3" class="form-control form-control-sm" required>Hi ${ownerName}, I found an item matching your lost report "${lostReport.itemName}"! Please contact me to arrange return.</textarea>
                    </div>
                    <button type="submit" class="btn btn-found w-100 fw-bold btn-sm py-2">
                        <i class="bi bi-bell-fill me-1"></i>Send Notification to Owner (${ownerName})
                    </button>
                </form>
                <div id="unlocked-contact-info" class="mt-3"></div>`;
        }
    } else {
        let foundReport = candidateItem;
        let finderEmail = foundReport.postedByEmail;
        let finderName  = foundReport.postedBy;
        let isSelf      = currentUser && finderEmail && currentUser.useremail &&
                          finderEmail.toLowerCase().trim() === currentUser.useremail.toLowerCase().trim();

        if (isSelf) {
            modalBody.innerHTML = `
                <div class="alert alert-warning border-0 shadow-sm mb-3">
                    <h6 class="fw-bold mb-2"><i class="bi bi-exclamation-triangle-fill me-1"></i>Self-Reported Found Item</h6>
                    <p class="small mb-0">You reported finding this item. Switch to another account to claim it.</p>
                </div>
                <button type="button" class="btn btn-secondary w-100 fw-bold" data-bs-dismiss="modal">Close</button>`;
        } else {
            modalBody.innerHTML = `
                <div class="mb-3">
                    <span class="badge badge-found me-2">FOUND ITEM</span>
                    <h5 class="fw-bold text-dark mb-1 fs-5">${foundReport.itemName}</h5>
                    <div class="p-2 rounded border mt-2 small text-dark" style="background:var(--found-bg);">
                        <i class="bi bi-person-circle me-1" style="color:var(--found-color)"></i>Finder: <strong>${finderName}</strong> (${finderEmail})
                    </div>
                </div>
                <div class="p-3 rounded-3 border mb-3 small text-muted" style="background:#f8fafc;">
                    <strong>Found Item Details:</strong> ${foundReport.description}
                </div>
                <form id="claim-submit-form" onsubmit="handleClaimSubmit(event,'${foundReport.id}')">
                    <div class="mb-3">
                        <label class="form-label fw-semibold small">Your Name (Claimant)</label>
                        <input type="text" id="claimant-name-input" class="form-control form-control-sm" value="${currentUser ? currentUser.username : ''}" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold small">
                            <i class="bi bi-shield-lock-fill me-1" style="color:var(--primary-color)"></i>Hidden Identifying Details <span class="text-danger">*</span>
                        </label>
                        <textarea id="provided-proof" rows="3" class="form-control form-control-sm" placeholder="e.g. Engraved initials, keychain design, screen lock wallpaper, serial number…" required></textarea>
                        <small class="text-muted" style="font-size:0.75rem;">Sent directly to Finder <strong>${finderName}</strong> for verification.</small>
                    </div>
                    <button type="submit" class="btn btn-matching w-100 fw-bold btn-sm py-2">
                        <i class="bi bi-shield-lock me-1"></i>Submit Hidden Details to Finder
                    </button>
                </form>
                <div id="unlocked-contact-info" class="mt-3"></div>`;
        }
    }

    let bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
}

function handleClaimSubmit(event, foundReportId) {
    event.preventDefault();
    let reports   = getReports();
    let item      = reports.find(r => r.id === foundReportId);
    let proof     = document.getElementById("provided-proof").value.trim();
    let claimantName = document.getElementById("claimant-name-input").value.trim();
    if (!item) return;

    let currentUser  = getCurrentUser();
    let claimantEmail = currentUser ? currentUser.useremail : "claimant@example.com";
    let claimId = "CLM-" + Math.floor(1000 + Math.random() * 9000);

    saveClaim({
        claimId, itemId: item.id, itemName: item.itemName,
        claimedBy: claimantName, claimedByEmail: claimantEmail,
        reporter: item.postedBy, reporterEmail: item.postedByEmail,
        providedProof: proof, status: "Pending Founder Approval",
        date: new Date().toLocaleDateString()
    });

    sendNotification({
        id: "NOTIF-" + Date.now(),
        recipientEmail: item.postedByEmail,
        senderName: claimantName, senderEmail: claimantEmail,
        itemId: item.id, itemName: item.itemName,
        message: `🔐 Hidden Details Submitted! ${claimantName} submitted hidden details to claim your found item "${item.itemName}". Review on your Dashboard.`,
        date: new Date().toLocaleString(),
        type: "claim_request", claimId
    });

    let outputArea = document.getElementById("unlocked-contact-info");
    outputArea.innerHTML = `
        <div class="alert alert-success border-0 shadow-sm mb-0">
            <h6 class="fw-bold mb-2"><i class="bi bi-check-circle-fill me-1"></i>Hidden Details Sent!</h6>
            <p class="small mb-3">Finder <strong>${item.postedBy}</strong> will verify your details and schedule the campus handover meeting.</p>
            <div class="p-3 bg-white rounded border small text-dark mb-3">
                <strong class="d-block mb-2" style="color:var(--primary-color);"><i class="bi bi-person-lines-fill me-1"></i>Finder Contact:</strong>
                <div class="mb-1"><strong>Name:</strong> ${item.postedBy}</div>
                <div class="mb-1"><strong>Email:</strong> <a href="mailto:${item.postedByEmail}">${item.postedByEmail}</a></div>
                <div><strong>Phone:</strong> ${item.contactPhone || '+91 98123 45678'}</div>
            </div>
            <div class="d-flex gap-2">
                <a href="dashboard.html" class="btn btn-sm btn-matching fw-bold flex-fill"><i class="bi bi-speedometer2 me-1"></i>Go to Dashboard</a>
                <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        </div>`;

    let formEl = document.getElementById("claim-submit-form");
    if (formEl) formEl.style.display = "none";
}

function handleNotifyOwnerSubmit(event, lostReportId, matchingFoundReportId) {
    event.preventDefault();
    let reports   = getReports();
    let item      = reports.find(r => r.id === lostReportId);
    let messageText = document.getElementById("found-notice-message").value.trim();
    if (!item) return;

    let currentUser = getCurrentUser();
    let finderName  = document.getElementById("finder-name-input")?.value.trim() || (currentUser ? currentUser.username : "A student");
    let finderEmail = currentUser ? currentUser.useremail : "finder@example.com";
    let finderPhone = document.getElementById("finder-phone-input")?.value.trim() || "+91 98123 45678";

    sendNotification({
        id: "NOTIF-" + Date.now(),
        recipientEmail: item.postedByEmail,
        senderName: finderName, senderEmail: finderEmail, senderPhone: finderPhone,
        itemId: item.id, itemName: item.itemName,
        message: `🎉 Good News! ${finderName} reported finding an item matching your lost report "${item.itemName}": "${messageText}"`,
        matchingFoundId: matchingFoundReportId || null,
        type: "owner_notification",
        date: new Date().toLocaleString()
    });

    let outputArea = document.getElementById("unlocked-contact-info");
    outputArea.innerHTML = `
        <div class="alert alert-success border-0 shadow-sm mb-0">
            <h6 class="fw-bold mb-2"><i class="bi bi-check-circle-fill me-1"></i>Notification Sent!</h6>
            <p class="small mb-3"><strong>${item.postedBy}</strong> (${item.postedByEmail}) has been notified you found their item.</p>
            <div class="p-3 bg-white rounded border small text-dark mb-3">
                <strong class="d-block mb-2" style="color:var(--primary-color);"><i class="bi bi-person-lines-fill me-1"></i>Owner Contact:</strong>
                <div class="mb-1"><strong>Name:</strong> ${item.postedBy}</div>
                <div class="mb-1"><strong>Email:</strong> <a href="mailto:${item.postedByEmail}">${item.postedByEmail}</a></div>
                <div><strong>Phone:</strong> ${item.contactPhone || '+91 98765 43210'}</div>
            </div>
            <div class="d-flex gap-2">
                <a href="dashboard.html" class="btn btn-sm btn-matching fw-bold flex-fill"><i class="bi bi-speedometer2 me-1"></i>Go to Dashboard</a>
                <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        </div>`;

    let formEl = document.getElementById("notify-owner-form");
    if (formEl) formEl.style.display = "none";
}

// =============================================================
// 5. DASHBOARD LOGIC — TABBED
// =============================================================
function initDashboardPage() {
    let currentUser = getCurrentUser();
    let nameEl = document.getElementById("dash-user-name");
    if (nameEl) nameEl.innerText = currentUser.username;

    // Update user profile avatar badge initials
    let avatarEl = document.getElementById("dash-user-avatar-badge");
    if (avatarEl && currentUser.username) {
        let initials = currentUser.username.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
        avatarEl.innerText = initials;
    }

    // Calculate Summary Stats
    let reports = getReports();
    let claims  = getClaims();
    let notifs  = getNotifications(currentUser.useremail);

    let myReportsCount = reports.filter(r => r.postedByEmail?.toLowerCase().trim() === currentUser.useremail?.toLowerCase().trim()).length;
    let alertsCount    = notifs.filter(n => n.type === "owner_notification" || (n.message && n.message.includes("Good News"))).length;
    let claimsCount    = claims.filter(c => c.claimedByEmail?.toLowerCase().trim() === currentUser.useremail?.toLowerCase().trim()).length;
    let handoversCount = claims.filter(c => 
        (c.claimedByEmail?.toLowerCase().trim() === currentUser.useremail?.toLowerCase().trim() || c.reporterEmail?.toLowerCase().trim() === currentUser.useremail?.toLowerCase().trim()) &&
        (c.status === "Approved & Meeting Scheduled" || c.status === "Meeting Confirmed by Both Parties")
    ).length;

    let elMyReports = document.getElementById("dash-stat-myreports");
    let elAlerts    = document.getElementById("dash-stat-alerts");
    let elClaims    = document.getElementById("dash-stat-claims");
    let elHandovers = document.getElementById("dash-stat-handovers");

    if (elMyReports) animateCountUp(elMyReports, myReportsCount, 600);
    if (elAlerts)    animateCountUp(elAlerts, alertsCount, 750);
    if (elClaims)    animateCountUp(elClaims, claimsCount, 900);
    if (elHandovers) animateCountUp(elHandovers, handoversCount, 1050);

    renderNotificationsFeed(currentUser.useremail);
    renderFoundNotices(currentUser.useremail);
    renderReceivedClaims(currentUser.useremail);
    renderSubmittedClaims(currentUser.useremail);
    renderMyReports(currentUser.useremail);

    // Restore last active tab from sessionStorage
    let lastTab = sessionStorage.getItem('dash_active_tab') || 'tab-alerts';
    let tabEl = document.getElementById(lastTab + '-btn');
    if (tabEl) {
        let bsTab = new bootstrap.Tab(tabEl);
        bsTab.show();
    }

    // Save tab on change
    document.querySelectorAll('#dashTabs .nav-link').forEach(btn => {
        btn.addEventListener('shown.bs.tab', () => {
            sessionStorage.setItem('dash_active_tab', btn.id.replace('-btn', ''));
        });
    });
}

function renderFoundNotices(userEmail) {
    let container = document.getElementById("found-notices-container");
    let badge     = document.getElementById("tab-alerts-badge");
    if (!container) return;

    let notifs       = getNotifications(userEmail);
    let foundNotices = notifs.filter(n => n.type === "owner_notification" || (n.message && n.message.includes("Good News")));

    if (badge) {
        badge.textContent = foundNotices.length;
        badge.className   = foundNotices.length > 0 ? 'tab-badge badge-alert' : 'tab-badge';
    }

    if (foundNotices.length === 0) {
        container.innerHTML = `<div class="text-center py-5 text-muted">
            <i class="bi bi-bell-slash fs-2 d-block mb-3 opacity-40"></i>
            <p class="mb-0 small">No found item alerts yet. When someone finds your item, it appears here.</p>
        </div>`;
        return;
    }

    let allClaims = getClaims();
    container.innerHTML = "";

    foundNotices.forEach(n => {
        let finderPhone = n.senderPhone || "+91 98123 45678";
        let finderEmail = n.senderEmail || "finder@example.com";
        let finderName  = n.senderName  || "Founder";
        let itemName    = n.itemName    || "Lost Item";

        let existingClaim = allClaims.find(c =>
            c.claimedByEmail?.toLowerCase().trim() === userEmail.toLowerCase().trim() &&
            c.reporterEmail?.toLowerCase().trim()  === finderEmail.toLowerCase().trim() &&
            (c.itemId === n.itemId || c.itemName === itemName)
        );

        let actionHtml = "";
        if (existingClaim) {
            if (existingClaim.status === "Approved & Meeting Scheduled" && existingClaim.meetingDetails) {
                actionHtml = `<div class="w-100 p-2 rounded border small fw-bold" style="background:var(--found-bg);color:var(--found-color);">
                    <i class="bi bi-check2-circle me-1"></i>Approved! Meeting at ${existingClaim.meetingDetails.location} | ${existingClaim.meetingDetails.time}
                </div>`;
            } else if (existingClaim.status === "More Info Requested") {
                actionHtml = `<div class="w-100 p-2 rounded border small" style="background:#fef3c7;">
                    <div class="fw-bold mb-1"><i class="bi bi-exclamation-triangle-fill text-warning me-1"></i>${finderName} needs more info:</div>
                    <div class="mb-2">"${existingClaim.founderFeedback || 'Please provide more details'}"</div>
                    <button class="btn btn-sm btn-warning text-dark fw-bold" onclick="openUpdateDetailsModal('${existingClaim.claimId}')">
                        <i class="bi bi-pencil-square me-1"></i>Provide Updated Details
                    </button>
                </div>`;
            } else if (existingClaim.status === "Rejected") {
                actionHtml = `<div class="w-100 p-2 rounded border small" style="background:var(--lost-bg);color:var(--lost-color);">
                    <i class="bi bi-x-circle-fill me-1"></i><strong>Claim Rejected:</strong> ${existingClaim.rejectionReason || 'Details did not match'}
                </div>`;
            } else {
                actionHtml = `<div class="w-100 p-2 rounded border small text-dark" style="background:#fef3c7;">
                    <i class="bi bi-hourglass-split text-warning me-1"></i><strong>Details Submitted.</strong> Awaiting ${finderName} to verify & schedule.
                </div>`;
            }
        } else {
            actionHtml = `<button class="btn btn-sm btn-matching fw-bold ms-auto" onclick="openProvideHiddenDetailsModal('${n.id}')">
                <i class="bi bi-shield-lock me-1"></i>Provide Hidden Details
            </button>`;
        }

        container.innerHTML += `
            <div class="card p-3 mb-3 border-0 shadow-sm rounded-3 fade-in-up" style="border-left:4px solid #f59e0b !important;">
                <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <span class="badge fw-bold" style="background:#fef3c7;color:#92400e;border:1px solid #fde68a;">
                        <i class="bi bi-bell-fill me-1"></i>Finder Found Your Item!
                    </span>
                    <small class="text-muted"><i class="bi bi-clock me-1"></i>${n.date}</small>
                </div>
                <h6 class="fw-bold mb-1 text-dark" style="font-family:'Sora',sans-serif;">
                    <i class="bi bi-search-heart me-1" style="color:var(--primary-color)"></i>${itemName}
                </h6>
                <p class="small text-muted mb-2"><strong>Finder:</strong> ${finderName} (${finderEmail})</p>
                <div class="p-3 rounded-3 border mb-3 small text-dark" style="background:#fafafa;">
                    <div class="extra-small text-muted text-uppercase fw-bold mb-1">Message from Finder:</div>
                    ${n.message}
                </div>
                <div class="d-flex flex-wrap gap-2 align-items-center">
                    <a href="tel:${finderPhone}" class="btn btn-sm btn-outline-success fw-semibold">
                        <i class="bi bi-telephone-fill me-1"></i>Call
                    </a>
                    <a href="mailto:${finderEmail}?subject=Re: ${encodeURIComponent(itemName)}" class="btn btn-sm btn-outline-primary fw-semibold">
                        <i class="bi bi-envelope-fill me-1"></i>Email
                    </a>
                    ${actionHtml}
                </div>
            </div>`;
    });
}

function openProvideHiddenDetailsModal(notifId) {
    let notifs = JSON.parse(localStorage.getItem("campus_notifications")) || [];
    let notif  = notifs.find(n => n.id === notifId);
    if (!notif) return;

    let currentUser = getCurrentUser();
    let el = id => document.getElementById(id);

    if (el('handover-notif-id'))         el('handover-notif-id').value     = notif.id;
    if (el('handover-finder-email'))      el('handover-finder-email').value = notif.senderEmail || "";
    if (el('handover-hidden-details'))    el('handover-hidden-details').value = "";
    if (el('handover-claimant-phone') && currentUser) el('handover-claimant-phone').value = currentUser.contactPhone || "+91 98765 43210";
    if (el('handover-finder-name'))       el('handover-finder-name').innerText = notif.senderName || "Founder";
    if (el('handover-finder-name-label')) el('handover-finder-name-label').innerText = notif.senderName || "Founder";
    if (el('handover-item-name'))         el('handover-item-name').innerText = `"${notif.itemName || 'Lost Item'}"`;

    let modalEl = document.getElementById("provideHiddenDetailsModal");
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

function handleProvideHiddenDetailsSubmit(event) {
    event.preventDefault();
    let notifId      = document.getElementById("handover-notif-id").value;
    let finderEmail  = document.getElementById("handover-finder-email").value;
    let hiddenDetails = document.getElementById("handover-hidden-details").value.trim();
    let claimantPhone = document.getElementById("handover-claimant-phone")?.value.trim() || "";

    if (!hiddenDetails) {
        showToast("Please enter the hidden identifying details to prove ownership.", "warning");
        return;
    }

    let currentUser = getCurrentUser();
    let notifs  = JSON.parse(localStorage.getItem("campus_notifications")) || [];
    let notif   = notifs.find(n => n.id === notifId);
    let itemName = notif ? notif.itemName : "Lost Item";
    let claimId = "CLM-" + Math.floor(1000 + Math.random() * 9000);

    saveClaim({
        claimId, itemId: notif ? notif.itemId : "ITEM-" + Date.now(),
        itemName,
        claimedBy: currentUser ? currentUser.username : "Owner",
        claimedByEmail: currentUser ? currentUser.useremail : "",
        claimantPhone: claimantPhone || (currentUser ? currentUser.contactPhone : ""),
        reporter: notif ? notif.senderName : "Finder",
        reporterEmail: finderEmail,
        providedProof: hiddenDetails,
        status: "Pending Founder Approval",
        date: new Date().toLocaleDateString()
    });

    sendNotification({
        id: "NOTIF-" + Date.now(),
        recipientEmail: finderEmail,
        senderName: currentUser ? currentUser.username : "Owner",
        senderEmail: currentUser ? currentUser.useremail : "",
        senderPhone: claimantPhone,
        itemName,
        message: `🔐 Hidden Details Submitted! ${currentUser ? currentUser.username : 'Owner'} submitted hidden details to claim "${itemName}": "${hiddenDetails}". Review on your Dashboard.`,
        date: new Date().toLocaleString(),
        type: "claim_request", claimId
    });

    showToast(`Hidden details submitted to Finder (${finderEmail})!`, 'success');

    let modalEl = document.getElementById("provideHiddenDetailsModal");
    if (modalEl) {
        let m = bootstrap.Modal.getInstance(modalEl);
        if (m) m.hide();
    }

    setTimeout(() => window.location.reload(), 800);
}

function renderSubmittedClaims(userEmail) {
    let container = document.getElementById("submitted-claims-container");
    let badge     = document.getElementById("tab-myclaims-badge");
    if (!container) return;

    let claims = getClaims();
    let sent   = claims.filter(c => c.claimedByEmail?.toLowerCase().trim() === userEmail.toLowerCase().trim());

    if (badge) badge.textContent = sent.length;

    if (sent.length === 0) {
        container.innerHTML = `<div class="text-center py-5 text-muted">
            <i class="bi bi-send fs-2 d-block mb-3 opacity-40"></i>
            <p class="mb-0 small">No claim requests submitted yet.</p>
        </div>`;
        return;
    }

    container.innerHTML = "";
    sent.forEach(c => {
        let isCompleted = c.status === "Handover Completed & Verified";
        let isApproved  = c.status === "Approved & Meeting Scheduled" || c.status === "Meeting Confirmed by Both Parties" || c.status === "Reschedule Requested" || isCompleted;
        let isConfirmed = c.status === "Meeting Confirmed by Both Parties" || c.meetingConfirmedBy === 'both' || isCompleted;
        let isResched   = c.status === "Reschedule Requested";
        let isRejected  = c.status === "Rejected";
        let isMoreInfo  = c.status === "More Info Requested";

        let badgeStyle = isCompleted
            ? 'background:var(--found-bg);color:var(--found-color);border:1.5px solid var(--found-border);'
            : isConfirmed
            ? 'background:var(--found-bg);color:var(--found-color);border:1px solid var(--found-border);'
            : isResched
            ? 'background:#fef3c7;color:#92400e;border:1px solid #fde68a;'
            : isApproved
            ? 'background:var(--found-bg);color:var(--found-color);border:1px solid var(--found-border);'
            : isRejected
            ? 'background:var(--lost-bg);color:var(--lost-color);border:1px solid var(--lost-border);'
            : isMoreInfo
            ? 'background:#fef3c7;color:#92400e;border:1px solid #fde68a;'
            : 'background:#fef3c7;color:#92400e;border:1px solid #fde68a;';

        container.innerHTML += `
            <div class="card p-3 mb-3 border shadow-sm rounded-3 fade-in-up">
                <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <span class="badge fw-semibold" style="${badgeStyle}">
                        ${isCompleted ? '<i class="bi bi-shield-check me-1"></i>Handover Completed & Verified' : (isConfirmed ? '<i class="bi bi-check-all me-1"></i>Meeting Confirmed' : (isResched ? '<i class="bi bi-clock-history me-1"></i>Reschedule Requested' : c.status))}
                    </span>
                    <small class="text-muted"><i class="bi bi-clock me-1"></i>${c.date}</small>
                </div>
                <h6 class="fw-bold mb-1" style="font-family:'Sora',sans-serif;">${c.itemName}</h6>
                <p class="small text-muted mb-2"><strong>Finder:</strong> ${c.reporter} (${c.reporterEmail})</p>
                <div class="p-2 rounded border mb-2 small text-muted" style="background:#fafafa;">
                    <strong class="text-dark"><i class="bi bi-shield-lock me-1" style="color:var(--primary-color)"></i>My Verification Details:</strong> "${c.providedProof}"
                </div>
                ${isApproved && c.meetingDetails ? `
                    <div class="p-3 rounded-3 border small mb-3" style="background:var(--found-bg);color:var(--found-color);">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div class="fw-bold fs-6"><i class="bi bi-geo-alt-fill me-1"></i>Campus Handover Meeting</div>
                            ${isCompleted 
                                ? `<span class="badge bg-success text-white rounded-pill"><i class="bi bi-check-circle-fill me-1"></i>Handover Verified & Item Returned</span>`
                                : isConfirmed 
                                ? `<span class="badge bg-success text-white rounded-pill"><i class="bi bi-check-circle-fill me-1"></i>Time Agreed & Confirmed</span>`
                                : isResched
                                ? `<span class="badge bg-warning text-dark rounded-pill"><i class="bi bi-clock-history me-1"></i>Change Pending</span>`
                                : `<span class="badge bg-white text-success border border-success-subtle rounded-pill"><i class="bi bi-hourglass-split me-1"></i>Awaiting Your Confirmation</span>`}
                        </div>
                        <div class="mb-1"><strong>Location:</strong> ${c.meetingDetails.location}</div>
                        <div class="mb-1"><strong>Time:</strong> ${c.meetingDetails.time}</div>
                        ${c.meetingDetails.note ? `<div class="text-muted mt-1"><strong>Instructions:</strong> ${c.meetingDetails.note}</div>` : ''}
                    </div>
                    <div class="d-flex flex-wrap gap-2 pt-1">
                        ${!isCompleted ? `
                            <button type="button" class="btn btn-sm btn-dark rounded-pill px-3 fw-bold shadow-sm" onclick="openQRPassModal('${c.claimId}')">
                                <i class="bi bi-qr-code-scan me-1 text-success"></i>My QR Handover Pass
                            </button>
                        ` : ''}
                        ${!isConfirmed && !isCompleted ? `
                            <button class="btn btn-sm btn-success fw-bold rounded-pill px-3 shadow-sm" onclick="handleQuickConfirmMeetingTime('${c.claimId}')">
                                <i class="bi bi-check2-circle me-1"></i>Confirm Time
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-emerald-pill flex-fill justify-content-center fw-bold shadow-sm" onclick="openMeetingChatModal('${c.claimId}')">
                            <i class="bi bi-chat-dots-fill me-1"></i>${isCompleted ? 'View Return Chat' : 'Message Founder'}
                        </button>
                    </div>`
                : isMoreInfo ? `
                    <div class="p-3 rounded border small mb-2" style="background:#fef3c7;">
                        <div class="fw-bold mb-1"><i class="bi bi-exclamation-triangle-fill text-warning me-1"></i>${c.reporter} needs more details:</div>
                        <div class="mb-2">"${c.founderFeedback || 'Please provide more details.'}"</div>
                        <button class="btn btn-sm btn-warning text-dark fw-bold w-100 mb-2" onclick="openUpdateDetailsModal('${c.claimId}')">
                            <i class="bi bi-pencil-square me-1"></i>Update Details
                        </button>
                        <button class="btn btn-sm btn-outline-dark w-100 fw-semibold" onclick="openMeetingChatModal('${c.claimId}')">
                            <i class="bi bi-chat-left-text me-1"></i>Text ${c.reporter} Directly
                        </button>
                    </div>`
                : isRejected ? `
                    <div class="p-3 rounded border small" style="background:var(--lost-bg);color:var(--lost-color);">
                        <div class="fw-bold mb-1"><i class="bi bi-x-circle-fill me-1"></i>Claim Rejected by ${c.reporter}</div>
                        <div class="text-dark"><strong>Reason:</strong> ${c.rejectionReason || 'Details did not match.'}</div>
                    </div>`
                : `
                    <div class="p-2 rounded border small text-muted mb-2" style="background:#fafafa;">
                        <i class="bi bi-hourglass-split text-warning me-1"></i>
                        <strong>Awaiting Founder Approval.</strong> ${c.reporter} is reviewing your details.
                    </div>
                    <button class="btn btn-sm btn-outline-success w-100 rounded-pill py-1 small fw-semibold" onclick="openMeetingChatModal('${c.claimId}')">
                        <i class="bi bi-chat-dots me-1"></i>Text ${c.reporter} Regarding Item
                    </button>`}
            </div>`;
    });
}

function renderNotificationsFeed(userEmail) {
    let container = document.getElementById("notifications-container");
    let clearBtn  = document.getElementById("btn-clear-notifications");
    if (!container) return;

    let notifs = getNotifications(userEmail);

    if (clearBtn) {
        clearBtn.disabled     = notifs.length === 0;
        clearBtn.style.opacity = notifs.length === 0 ? "0.5" : "1";
    }

    if (notifs.length === 0) {
        container.innerHTML = `
            <div class="p-4 text-muted text-center small">
                <i class="bi bi-bell-slash fs-3 d-block mb-2 opacity-40"></i>
                No notifications yet.<br>
                <span class="extra-small">When another student submits verification details or finds your item, it appears here.</span>
            </div>`;
        return;
    }

    container.innerHTML = "";
    notifs.forEach(n => {
        let isOwnerAlert = n.type === "owner_notification" || (n.message && n.message.includes("Good News"));
        let isApproved   = n.type === "claim_approved"    || (n.message && n.message.includes("Claim Approved"));
        let isMoreInfo   = n.type === "more_info_requested";
        let isRejected   = n.type === "claim_rejected"    || (n.message && n.message.includes("Claim Rejected"));
        let isChatMsg    = n.type === "chat_message"      || (n.message && n.message.includes("New Message"));

        let iconClass = isOwnerAlert ? "bi-bell-fill text-warning"
                      : isApproved   ? "bi-check-circle-fill text-success"
                      : isMoreInfo   ? "bi-question-circle text-warning"
                      : isRejected   ? "bi-x-circle text-danger"
                      : isChatMsg    ? "bi-chat-dots-fill text-success"
                      : "bi-shield-check text-primary";

        let badgeText  = isOwnerAlert ? "Item Found Alert" : isApproved ? "Approved" : isMoreInfo ? "More Info" : isRejected ? "Rejected" : isChatMsg ? "Direct Message" : "Details Received";
        let badgeStyle = isOwnerAlert ? "background:#fef3c7;color:#92400e;" : isApproved ? "background:var(--found-bg);color:var(--found-color);" : isRejected ? "background:var(--lost-bg);color:var(--lost-color);" : isChatMsg ? "background:#ecfdf5;color:#059669;border:1px solid var(--mint-border);" : "background:var(--primary-light);color:var(--primary-color);";

        container.innerHTML += `
            <div class="p-3 mb-2 rounded-3 border position-relative" style="background:#fafafa;">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="badge extra-small" style="${badgeStyle}">${badgeText}</span>
                    <div class="d-flex align-items-center gap-2">
                        <small class="text-muted" style="font-size:0.72rem;"><i class="bi bi-clock me-1"></i>${n.date}</small>
                        <button class="btn btn-link text-muted p-0 lh-1" onclick="handleDeleteSingleNotification('${n.id}')" title="Delete" style="font-size:0.8rem;">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="small mb-1 text-dark fw-medium"><i class="bi ${iconClass} me-1"></i>${n.message}</p>
                ${n.claimId ? `
                    <div class="mt-2">
                        <button class="btn btn-sm btn-outline-success rounded-pill py-0 px-2 extra-small" onclick="openMeetingChatModal('${n.claimId}')">
                            <i class="bi bi-chat-dots me-1"></i>Open Direct Conversation
                        </button>
                    </div>` : ''}
                ${n.senderPhone || n.senderEmail ? `
                    <div class="small text-muted border-top pt-1 mt-1 extra-small">
                        ${n.senderPhone ? `<span class="me-2"><i class="bi bi-telephone-fill me-1" style="color:var(--primary-color)"></i>${n.senderPhone}</span>` : ''}
                        ${n.senderEmail ? `<span><i class="bi bi-envelope me-1" style="color:var(--primary-color)"></i><a href="mailto:${n.senderEmail}">${n.senderEmail}</a></span>` : ''}
                    </div>` : ''}
            </div>`;
    });
}

async function handleClearAllNotifications() {
    let currentUser = getCurrentUser();
    if (!currentUser || !currentUser.useremail) return;

    let notifs = getNotifications(currentUser.useremail);
    if (notifs.length === 0) {
        showToast("No notifications to delete.", "info");
        return;
    }

    let confirmed = await showConfirm({
        message: `Delete all ${notifs.length} notification(s)?`,
        title: 'Clear Notifications',
        icon: 'danger',
        confirmText: 'Yes, Delete All'
    });

    if (confirmed) {
        clearNotifications(currentUser.useremail);
        renderNotificationsFeed(currentUser.useremail);
        renderFoundNotices(currentUser.useremail);
        showToast("All notifications cleared.", "success");
    }
}

function handleDeleteSingleNotification(notifId) {
    let currentUser = getCurrentUser();
    if (!currentUser || !currentUser.useremail) return;
    deleteNotification(notifId);
    renderNotificationsFeed(currentUser.useremail);
    renderFoundNotices(currentUser.useremail);
    updateNavBellBadge();
}

function renderReceivedClaims(userEmail) {
    let container = document.getElementById("received-claims-container");
    let badge     = document.getElementById("tab-received-badge");
    if (!container) return;

    let claims   = getClaims();
    let received = claims.filter(c => c.reporterEmail?.toLowerCase().trim() === userEmail.toLowerCase().trim());
    let pending  = received.filter(c => c.status === "Pending Founder Approval" || c.status === "Pending Approval" || c.status === "More Info Requested" || c.status === "Reschedule Requested").length;

    if (badge) {
        badge.textContent = pending;
        badge.style.background = pending > 0 ? 'var(--lost-color)' : '';
        badge.style.color = pending > 0 ? '#fff' : '';
    }

    if (received.length === 0) {
        container.innerHTML = `<div class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-2 d-block mb-3 opacity-40"></i>
            <p class="mb-0 small">No claim requests received for your found items yet.</p>
        </div>`;
        return;
    }

    container.innerHTML = "";
    received.forEach(c => {
        let isCompleted = c.status === "Handover Completed & Verified";
        let isPending   = c.status === "Pending Founder Approval" || c.status === "Pending Approval";
        let isMoreInfo  = c.status === "More Info Requested";
        let isApproved  = c.status === "Approved & Meeting Scheduled" || c.status === "Meeting Confirmed by Both Parties" || c.status === "Reschedule Requested" || isCompleted;
        let isConfirmed = c.status === "Meeting Confirmed by Both Parties" || c.meetingConfirmedBy === 'both' || isCompleted;
        let isResched   = c.status === "Reschedule Requested";
        let isRejected  = c.status === "Rejected";

        let badgeStyle = isCompleted ? 'background:var(--found-bg);color:var(--found-color);border:1.5px solid var(--found-border);'
                        : isConfirmed ? 'background:var(--found-bg);color:var(--found-color);border:1px solid var(--found-border);'
                        : isResched ? 'background:#fef3c7;color:#92400e;border:1px solid #fde68a;'
                        : isApproved ? 'background:var(--found-bg);color:var(--found-color);border:1px solid var(--found-border);'
                        : isRejected ? 'background:var(--lost-bg);color:var(--lost-color);border:1px solid var(--lost-border);'
                        : 'background:#fef3c7;color:#92400e;border:1px solid #fde68a;';

        container.innerHTML += `
            <div class="card p-3 mb-3 border shadow-sm rounded-3 fade-in-up">
                <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <span class="badge fw-semibold" style="${badgeStyle}">
                        ${isCompleted ? '<i class="bi bi-shield-check me-1"></i>Handover Completed & Verified' : (isConfirmed ? '<i class="bi bi-check-all me-1"></i>Meeting Confirmed by Both' : (isResched ? '<i class="bi bi-clock-history me-1"></i>Claimant Requested Reschedule' : c.status))}
                    </span>
                    <small class="text-muted"><i class="bi bi-clock me-1"></i>${c.date}</small>
                </div>
                <h6 class="fw-bold mb-1" style="font-family:'Sora',sans-serif;">${c.itemName}</h6>
                <p class="small text-muted mb-2"><strong>Claimant:</strong> ${c.claimedBy} (${c.claimedByEmail})</p>
                <div class="p-3 rounded-3 border mb-3 small" style="background:#fafafa;">
                    <strong class="d-block mb-1 text-dark"><i class="bi bi-shield-lock-fill me-1" style="color:var(--primary-color)"></i>Submitted Verification Proof:</strong>
                    <div class="p-2 bg-white rounded border text-dark fw-medium">"${c.providedProof}"</div>
                    <small class="text-muted mt-1 d-block"><i class="bi bi-info-circle me-1"></i>Verify these details match the item in your possession.</small>
                </div>
                ${isMoreInfo ? `
                    <div class="p-2 rounded border small mb-3" style="background:#fef3c7;">
                        <i class="bi bi-hourglass-split text-warning me-1"></i>
                        <strong>You requested more info:</strong> "${c.founderFeedback || 'Please provide more details'}". Awaiting claimant response.
                    </div>` : ''}
                ${(isPending || isMoreInfo) ? `
                    <div class="d-flex flex-wrap gap-2 pt-2 border-top">
                        <button class="btn btn-sm btn-success fw-bold flex-fill shadow-sm" onclick="openScheduleModal('${c.claimId}')">
                            <i class="bi bi-check2-circle me-1"></i>1. Accept & Schedule Meeting
                        </button>
                        <button class="btn btn-sm btn-outline-warning text-dark fw-bold flex-fill" onclick="openRequestInfoModal('${c.claimId}')">
                            <i class="bi bi-question-circle me-1"></i>2. Need More Info
                        </button>
                        <button class="btn btn-sm btn-outline-danger fw-bold flex-fill" onclick="openRejectModal('${c.claimId}')">
                            <i class="bi bi-x-circle me-1"></i>3. Reject
                        </button>
                    </div>
                    <div class="mt-2">
                        <button class="btn btn-sm btn-outline-success w-100 rounded-pill py-1 small fw-semibold" onclick="openMeetingChatModal('${c.claimId}')">
                            <i class="bi bi-chat-dots me-1"></i>Text Claimant (${c.claimedBy}) Directly
                        </button>
                    </div>`
                : isApproved ? `
                    <div class="p-3 rounded-3 border small mb-2" style="background:var(--found-bg);color:var(--found-color);">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <div class="fw-bold fs-6"><i class="bi bi-geo-alt-fill me-1"></i>Handover Meeting Scheduled</div>
                            ${isCompleted
                                ? `<span class="badge bg-success text-white rounded-pill"><i class="bi bi-check-circle-fill me-1"></i>Item Returned & Verified</span>`
                                : isConfirmed 
                                ? `<span class="badge bg-success text-white rounded-pill"><i class="bi bi-check-circle-fill me-1"></i>Claimant Agreed</span>`
                                : isResched
                                ? `<span class="badge bg-warning text-dark rounded-pill"><i class="bi bi-clock-history me-1"></i>Reschedule Requested</span>`
                                : `<span class="badge bg-white text-success border border-success-subtle rounded-pill">Awaiting Claimant Confirmation</span>`}
                        </div>
                        <div class="mb-1"><strong>Location:</strong> ${c.meetingDetails?.location || 'Campus'}</div>
                        <div class="mb-1"><strong>Time:</strong> ${c.meetingDetails?.time || ''}</div>
                        ${c.meetingDetails?.note ? `<div><strong>Instructions:</strong> ${c.meetingDetails.note}</div>` : ''}
                    </div>
                    <div class="d-flex flex-wrap gap-2">
                        ${!isCompleted ? `
                            <button type="button" class="btn btn-sm btn-warning rounded-pill fw-bold text-dark px-3 shadow-sm" onclick="openQRScannerModal('${c.claimId}')">
                                <i class="bi bi-camera-fill me-1"></i>Scan Claimant's QR Pass
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-emerald-pill flex-fill justify-content-center fw-bold shadow-sm" onclick="openMeetingChatModal('${c.claimId}')">
                            <i class="bi bi-chat-dots-fill me-1"></i>${isCompleted ? 'View Return Chat' : 'Open Direct Chat with Claimant'}
                        </button>
                        ${isResched && !isCompleted ? `
                            <button class="btn btn-sm btn-outline-warning text-dark fw-bold rounded-pill px-3 shadow-sm" onclick="openScheduleModal('${c.claimId}')">
                                <i class="bi bi-pencil-square me-1"></i>Update Schedule
                            </button>` : ''}
                    </div>` : `
                    <div class="p-2 rounded border small" style="background:var(--lost-bg);color:var(--lost-color);">
                        <i class="bi bi-x-circle-fill me-1"></i>Rejected: ${c.rejectionReason || 'Details did not match'}
                    </div>`}
            </div>`;
    });
}

// ─── Meeting Location & Time Helpers ────────────────────────
function toggleOtherMeetingLocation(value) {
    let container = document.getElementById("other-meeting-location-container");
    let input = document.getElementById("otherMeetingLocation");
    if (!container) return;
    if (value === "Other") {
        container.classList.remove("d-none");
        if (input) { input.required = true; input.focus(); }
    } else {
        container.classList.add("d-none");
        if (input) { input.required = false; input.value = ""; }
    }
}

function setQuickMeetingTime(timeStr) {
    let input = document.getElementById("meeting-time");
    if (input) {
        input.value = timeStr;
        input.dispatchEvent(new Event('input'));
    }
}

// ─── Founder: Accept & Schedule Handover ────────────────────
function openScheduleModal(claimId) {
    let claims = getClaims();
    let claim  = claims.find(c => c.claimId === claimId);
    if (!claim) return;

    let el = id => document.getElementById(id);
    if (el('modal-claim-id')) el('modal-claim-id').value = claimId;
    if (el('modal-claimant-details-display')) el('modal-claimant-details-display').innerHTML = `
        <div class="mb-1"><strong>Item:</strong> <span style="color:var(--primary-color);font-weight:700;">${claim.itemName}</span></div>
        <div class="mb-1"><strong>Claimant:</strong> ${claim.claimedBy} (${claim.claimedByEmail})</div>
        <div class="p-2 bg-white rounded border mt-2">
            <strong class="text-dark">Submitted Proof:</strong>
            <div style="color:var(--primary-color);font-weight:700;margin-top:4px;">"${claim.providedProof}"</div>
        </div>`;

    // Pre-populate if already scheduled
    if (claim.meetingDetails) {
        let locSelect = el('meeting-location');
        if (locSelect) {
            let exists = Array.from(locSelect.options).some(o => o.value === claim.meetingDetails.location);
            if (exists) {
                locSelect.value = claim.meetingDetails.location;
                toggleOtherMeetingLocation(locSelect.value);
            } else {
                locSelect.value = "Other";
                toggleOtherMeetingLocation("Other");
                if (el('otherMeetingLocation')) el('otherMeetingLocation').value = claim.meetingDetails.location;
            }
        }
        if (el('meeting-time')) el('meeting-time').value = claim.meetingDetails.time || 'Today at 4:30 PM';
        if (el('meeting-note')) el('meeting-note').value = claim.meetingDetails.note || '';
    }

    let modalEl = document.getElementById("scheduleMeetingModal");
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

function handleScheduleSubmit(event) {
    event.preventDefault();
    let claimId  = document.getElementById("modal-claim-id").value;
    let locVal   = document.getElementById("meeting-location").value;
    if (locVal === "Other") {
        let otherLocInput = document.getElementById("otherMeetingLocation");
        locVal = (otherLocInput && otherLocInput.value.trim()) ? otherLocInput.value.trim() : "Custom Campus Location";
    }
    let time     = document.getElementById("meeting-time").value.trim();
    let note     = document.getElementById("meeting-note").value.trim();

    let claims = getClaims();
    let claim  = claims.find(c => c.claimId === claimId);
    if (!claim) return;

    let meetingDetails = { location: locVal, time, note };
    updateClaimStatus(claimId, "Approved & Meeting Scheduled", { meetingDetails, meetingConfirmedBy: "founder_scheduled" });

    // Add initial meeting scheduled system message in chat
    addClaimMessage(claimId, {
        sender: claim.reporter,
        senderEmail: claim.reporterEmail,
        text: `📅 Handover Meeting Scheduled by Finder:\n📍 Location: ${locVal}\n⏰ Time: ${time}\n📝 Instructions: ${note}`,
        type: "status"
    });

    sendNotification({
        id: "NOTIF-" + Date.now(),
        recipientEmail: claim.claimedByEmail,
        senderName: claim.reporter, senderEmail: claim.reporterEmail,
        itemName: claim.itemName,
        message: `🎉 Claim Approved! Finder ${claim.reporter} scheduled the handover meeting for "${claim.itemName}" at ${locVal} on ${time}. Please confirm if the time is suitable or message in chat.`,
        date: new Date().toLocaleString(),
        type: "claim_approved", claimId
    });

    showToast(`Meeting scheduled at ${locVal}! Notification sent to ${claim.claimedBy}.`, 'success', 3500);

    let modalEl = document.getElementById("scheduleMeetingModal");
    if (modalEl) { let m = bootstrap.Modal.getInstance(modalEl); if (m) m.hide(); }

    setTimeout(() => {
        let activeTab = sessionStorage.getItem('dash_active_tab') || 'tab-received';
        window.location.reload();
    }, 600);
}

// ─── Direct Chat & Meeting Coordination Modal Logic ─────────
function openMeetingChatModal(claimId) {
    let claim = getClaimById(claimId);
    if (!claim) {
        showToast("Claim not found.", "warning");
        return;
    }

    let currentUser = getCurrentUser();
    let modalEl = document.getElementById("meetingChatModal");
    if (!modalEl) return;

    let hiddenClaimInput = document.getElementById("chat-current-claim-id");
    if (hiddenClaimInput) hiddenClaimInput.value = claimId;

    let isClaimant = currentUser && claim.claimedByEmail && currentUser.useremail &&
                     claim.claimedByEmail.toLowerCase().trim() === currentUser.useremail.toLowerCase().trim();
    let partnerName  = isClaimant ? claim.reporter : claim.claimedBy;
    let partnerRole  = isClaimant ? "Finder" : "Lost Owner";
    let partnerInit  = partnerName ? partnerName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'P';

    let titleEl    = document.getElementById("chat-modal-title");
    let subtitleEl = document.getElementById("chat-modal-subtitle");
    let avatarEl   = document.getElementById("chat-partner-avatar");

    if (titleEl)    titleEl.textContent = `Chat with ${partnerName} (${partnerRole})`;
    if (subtitleEl) subtitleEl.textContent = `Item: "${claim.itemName}" • End-to-End Encrypted Session`;
    if (avatarEl)   avatarEl.textContent = partnerInit;

    renderMeetingChatContent(claim, currentUser);

    let bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
    bsModal.show();
}

function renderMeetingChatContent(claim, currentUser) {
    let summaryBox   = document.getElementById("chat-meeting-summary-box");
    let msgContainer = document.getElementById("chat-messages-container");
    if (!summaryBox || !msgContainer) return;

    let isClaimant = currentUser && claim.claimedByEmail && currentUser.useremail &&
                     claim.claimedByEmail.toLowerCase().trim() === currentUser.useremail.toLowerCase().trim();
    let isReporter = currentUser && claim.reporterEmail && currentUser.useremail &&
                     claim.reporterEmail.toLowerCase().trim() === currentUser.useremail.toLowerCase().trim();

    let isConfirmed = claim.status === "Meeting Confirmed by Both Parties" || claim.meetingConfirmedBy === 'both';
    let isResched   = claim.status === "Reschedule Requested";
    let isScheduled = Boolean(claim.meetingDetails);

    // 1. Render Meeting Summary Header
    if (isScheduled && claim.meetingDetails) {
        let agreementBadge = isConfirmed
            ? `<span class="badge bg-success text-white rounded-pill px-3 py-1"><i class="bi bi-check-all me-1"></i>Time Confirmed by Both Parties</span>`
            : isResched
            ? `<span class="badge bg-warning text-dark rounded-pill px-3 py-1"><i class="bi bi-clock-history me-1"></i>Reschedule Requested</span>`
            : `<span class="badge bg-white text-success border border-success-subtle rounded-pill px-3 py-1"><i class="bi bi-hourglass-split me-1"></i>Awaiting Lost Owner Confirmation</span>`;

        summaryBox.innerHTML = `
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <div class="d-flex align-items-center gap-2">
                    <div class="meeting-detail-icon"><i class="bi bi-calendar2-check-fill"></i></div>
                    <strong class="text-dark fs-6">Campus Handover Meeting Plan</strong>
                </div>
                ${agreementBadge}
            </div>

            <div class="row g-2 mb-3">
                <div class="col-md-6">
                    <div class="meeting-detail-row">
                        <div class="meeting-detail-icon"><i class="bi bi-geo-alt-fill"></i></div>
                        <div>
                            <small class="text-muted d-block extra-small">MEETING LOCATION</small>
                            <strong class="text-dark">${claim.meetingDetails.location}</strong>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="meeting-detail-row">
                        <div class="meeting-detail-icon"><i class="bi bi-clock-fill"></i></div>
                        <div>
                            <small class="text-muted d-block extra-small">PROPOSED TIME</small>
                            <strong class="text-dark">${claim.meetingDetails.time}</strong>
                        </div>
                    </div>
                </div>
            </div>

            ${claim.meetingDetails.note ? `
                <div class="p-2 bg-white rounded-2 border small text-muted mb-3">
                    <strong class="text-dark">Instructions:</strong> ${claim.meetingDetails.note}
                </div>` : ''}

            <!-- Claimant Action Bar: Confirm Time or Request Change -->
            ${isClaimant ? `
                <div class="d-flex flex-wrap gap-2 pt-2 border-top">
                    ${!isConfirmed ? `
                        <button type="button" class="btn btn-sm btn-success rounded-pill px-3 fw-bold shadow-sm" onclick="handleConfirmMeetingTime('${claim.claimId}')">
                            <i class="bi bi-check2-circle me-1"></i>Confirm Time is Suitable
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-warning text-dark rounded-pill px-3 fw-bold" onclick="toggleRescheduleBox(true)">
                            <i class="bi bi-clock-history me-1"></i>Request Time / Location Change
                        </button>
                    ` : `
                        <span class="text-success small fw-semibold d-flex align-items-center">
                            <i class="bi bi-check-circle-fill me-1"></i>You confirmed this meeting time. See you there!
                        </span>
                        <button type="button" class="btn btn-sm btn-link text-muted extra-small ms-auto p-0" onclick="toggleRescheduleBox(true)">Need to change time?</button>
                    `}
                </div>`
            : isReporter ? `
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-2 border-top small">
                    <span class="text-muted">
                        ${isConfirmed ? '<i class="bi bi-check2-all text-success me-1"></i>Claimant agreed to this schedule.' : (isResched ? '<i class="bi bi-exclamation-circle text-warning me-1"></i>Claimant requested a different time. Check messages below.' : '<i class="bi bi-hourglass-split text-muted me-1"></i>Waiting for claimant to confirm suitable time.')}
                    </span>
                    <button type="button" class="btn btn-sm btn-outline-success rounded-pill py-0 px-2 extra-small" onclick="bootstrap.Modal.getInstance(document.getElementById('meetingChatModal')).hide(); openScheduleModal('${claim.claimId}');">
                        <i class="bi bi-pencil-square me-1"></i>Edit Schedule
                    </button>
                </div>`
            : ''}
        `;
    } else {
        summaryBox.innerHTML = `
            <div class="p-2 text-center text-muted small">
                <i class="bi bi-chat-left-dots fs-4 d-block mb-1 text-success opacity-50"></i>
                Discuss item details and coordinate a meeting time via direct messaging.
            </div>
        `;
    }

    // 2. Render Chat Messages Stream
    let messages = claim.messages || [];
    if (messages.length === 0) {
        msgContainer.innerHTML = `
            <div class="text-center py-4 text-muted my-auto">
                <div class="chat-date-divider">Today</div>
                <i class="bi bi-chat-heart fs-3 d-block mb-2 text-success opacity-40"></i>
                <div class="small fw-semibold text-dark mb-1">Direct Chat Started</div>
                <div class="extra-small">Send a message to coordinate meeting location, clothing, or schedule changes.</div>
            </div>
        `;
    } else {
        msgContainer.innerHTML = `<div class="chat-date-divider">Today</div>`;
        messages.forEach(msg => {
            if (msg.type === "status" || msg.type === "confirmed" || msg.type === "reschedule") {
                let pillClass = msg.type === "confirmed" ? "confirmed" : (msg.type === "reschedule" ? "reschedule" : "");
                let icon = msg.type === "confirmed" ? "bi-check2-all" : (msg.type === "reschedule" ? "bi-clock-history" : "bi-info-circle");
                msgContainer.innerHTML += `
                    <div class="chat-system-pill ${pillClass}">
                        <i class="bi ${icon}"></i> <span>${msg.text}</span> <small class="opacity-75 ms-1">(${msg.time})</small>
                    </div>
                `;
            } else {
                let isMine = currentUser && msg.senderEmail && currentUser.useremail &&
                             msg.senderEmail.toLowerCase().trim() === currentUser.useremail.toLowerCase().trim();
                let senderInitials = msg.sender ? msg.sender.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'U';

                msgContainer.innerHTML += `
                    <div class="chat-bubble-row ${isMine ? 'outgoing' : 'incoming'}">
                        <div class="chat-avatar-mini" title="${msg.sender}">${senderInitials}</div>
                        <div class="chat-bubble ${isMine ? 'chat-bubble-outgoing' : 'chat-bubble-incoming'}">
                            ${!isMine ? `<span class="chat-sender-tag text-muted">${msg.sender}</span>` : ''}
                            <div>${msg.text}</div>
                            <span class="chat-meta-time">
                                ${msg.time} ${isMine ? '<span class="chat-tick-mark ms-1">✓✓</span>' : ''}
                            </span>
                        </div>
                    </div>
                `;
            }
        });
    }

    // Scroll to bottom
    setTimeout(() => {
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }, 50);
}

// ─── Lost Owner: Confirm Meeting Time is Suitable ───────────
function handleConfirmMeetingTime(claimId) {
    let claim = getClaimById(claimId);
    if (!claim) return;

    let currentUser = getCurrentUser();
    let claimantName = currentUser ? currentUser.username : claim.claimedBy;

    updateClaimStatus(claimId, "Meeting Confirmed by Both Parties", { meetingConfirmedBy: "both" });

    addClaimMessage(claimId, {
        sender: claimantName,
        senderEmail: currentUser ? currentUser.useremail : claim.claimedByEmail,
        text: `✅ ${claimantName} (Lost Owner) confirmed that the meeting time (${claim.meetingDetails?.time || 'Scheduled Time'}) and location (${claim.meetingDetails?.location || 'Scheduled Spot'}) are suitable!`,
        type: "confirmed"
    });

    sendNotification({
        id: "NOTIF-" + Date.now(),
        recipientEmail: claim.reporterEmail,
        senderName: claimantName,
        senderEmail: currentUser ? currentUser.useremail : claim.claimedByEmail,
        itemName: claim.itemName,
        message: `✅ Meeting Confirmed! Lost Owner ${claimantName} confirmed the scheduled handover time for "${claim.itemName}" at ${claim.meetingDetails?.location || 'Campus'} on ${claim.meetingDetails?.time || 'scheduled time'}.`,
        date: new Date().toLocaleString(),
        type: "chat_message", claimId
    });

    showToast("Meeting time confirmed! Notification sent to Founder.", "success");

    let updatedClaim = getClaimById(claimId);
    renderMeetingChatContent(updatedClaim, currentUser);
}

function handleQuickConfirmMeetingTime(claimId) {
    handleConfirmMeetingTime(claimId);
    setTimeout(() => {
        let currentUser = getCurrentUser();
        if (currentUser) {
            renderSubmittedClaims(currentUser.useremail);
            renderReceivedClaims(currentUser.useremail);
        }
    }, 400);
}

// ─── Reschedule Request Helpers ─────────────────────────────
function toggleRescheduleBox(show) {
    let box = document.getElementById("inline-reschedule-box");
    if (!box) return;
    if (show) {
        box.classList.remove("d-none");
        let input = document.getElementById("reschedule-time-input");
        if (input) input.focus();
    } else {
        box.classList.add("d-none");
    }
}

function submitRescheduleRequest() {
    let claimId = document.getElementById("chat-current-claim-id")?.value;
    let claim = getClaimById(claimId);
    if (!claim) return;

    let timeVal = document.getElementById("reschedule-time-input")?.value.trim();
    let locVal  = document.getElementById("reschedule-location-input")?.value.trim();
    let noteVal = document.getElementById("reschedule-note-input")?.value.trim();

    if (!timeVal) {
        showToast("Please provide your proposed suitable time.", "warning");
        return;
    }

    let currentUser = getCurrentUser();
    let claimantName = currentUser ? currentUser.username : claim.claimedBy;

    updateClaimStatus(claimId, "Reschedule Requested", {
        proposedReschedule: { time: timeVal, location: locVal, note: noteVal }
    });

    let detailsMsg = `⏰ Reschedule Requested by ${claimantName}:\nProposed Time: ${timeVal}` + 
                     (locVal ? `\nProposed Location: ${locVal}` : '') + 
                     (noteVal ? `\nReason: ${noteVal}` : '');

    addClaimMessage(claimId, {
        sender: claimantName,
        senderEmail: currentUser ? currentUser.useremail : claim.claimedByEmail,
        text: detailsMsg,
        type: "reschedule"
    });

    sendNotification({
        id: "NOTIF-" + Date.now(),
        recipientEmail: claim.reporterEmail,
        senderName: claimantName,
        senderEmail: currentUser ? currentUser.useremail : claim.claimedByEmail,
        itemName: claim.itemName,
        message: `⏰ Time Change Request! ${claimantName} proposed a new meeting time for "${claim.itemName}": "${timeVal}". Open chat to reply or update schedule.`,
        date: new Date().toLocaleString(),
        type: "chat_message", claimId
    });

    showToast("Reschedule request sent to Founder!", "info");
    toggleRescheduleBox(false);

    let updatedClaim = getClaimById(claimId);
    renderMeetingChatContent(updatedClaim, currentUser);
}

// ─── Send Direct Chat Message ───────────────────────────────
function handleSendChatMessage(event) {
    event.preventDefault();
    let inputEl = document.getElementById("chat-input-text");
    let claimId = document.getElementById("chat-current-claim-id")?.value;
    if (!inputEl || !claimId) return;

    let text = inputEl.value.trim();
    if (!text) return;

    let claim = getClaimById(claimId);
    if (!claim) return;

    let currentUser = getCurrentUser();
    if (!currentUser) {
        showToast("Please sign in to send messages.", "warning");
        return;
    }

    let isClaimant = claim.claimedByEmail && currentUser.useremail &&
                     claim.claimedByEmail.toLowerCase().trim() === currentUser.useremail.toLowerCase().trim();
    let recipientEmail = isClaimant ? claim.reporterEmail : claim.claimedByEmail;

    addClaimMessage(claimId, {
        sender: currentUser.username,
        senderEmail: currentUser.useremail,
        text: text,
        type: "text"
    });

    // Notify recipient
    sendNotification({
        id: "NOTIF-" + Date.now(),
        recipientEmail: recipientEmail,
        senderName: currentUser.username,
        senderEmail: currentUser.useremail,
        itemName: claim.itemName,
        message: `💬 ${currentUser.username}: "${text.length > 50 ? text.substring(0, 50) + '…' : text}" regarding "${claim.itemName}"`,
        date: new Date().toLocaleString(),
        type: "chat_message", claimId
    });

    inputEl.value = "";

    let updatedClaim = getClaimById(claimId);
    renderMeetingChatContent(updatedClaim, currentUser);
}

function sendQuickReply(replyText) {
    let inputEl = document.getElementById("chat-input-text");
    if (inputEl) {
        inputEl.value = replyText;
        handleSendChatMessage(new Event("submit"));
    }
}

// ─── Founder: Request More Info ──────────────────────────────
function openRequestInfoModal(claimId) {
    let claims = getClaims();
    let claim  = claims.find(c => c.claimId === claimId);
    if (!claim) return;

    let el = id => document.getElementById(id);
    if (el('modal-request-info-claim-id')) el('modal-request-info-claim-id').value = claimId;
    if (el('modal-request-info-display')) el('modal-request-info-display').innerHTML = `
        <div class="mb-1"><strong>Item:</strong> <span style="color:var(--primary-color);font-weight:700;">${claim.itemName}</span></div>
        <div class="mb-1"><strong>Claimant:</strong> ${claim.claimedBy} (${claim.claimedByEmail})</div>
        <div class="p-2 bg-white rounded border mt-2">
            <strong>Current Details:</strong> <span class="text-dark">"${claim.providedProof}"</span>
        </div>`;
    if (el('request-info-message')) el('request-info-message').value = "";

    let modalEl = document.getElementById("requestInfoModal");
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

function handleRequestInfoSubmit(event) {
    event.preventDefault();
    let claimId = document.getElementById("modal-request-info-claim-id").value;
    let message = document.getElementById("request-info-message").value.trim();
    if (!message) { showToast("Please specify what details are needed.", "warning"); return; }

    let claims = getClaims();
    let claim  = claims.find(c => c.claimId === claimId);
    if (!claim) return;

    updateClaimStatus(claimId, "More Info Requested", { founderFeedback: message });

    sendNotification({
        id: "NOTIF-" + Date.now(),
        recipientEmail: claim.claimedByEmail,
        senderName: claim.reporter, senderEmail: claim.reporterEmail,
        itemName: claim.itemName,
        message: `⚠️ More Info Needed! Finder ${claim.reporter} requested additional details for "${claim.itemName}": "${message}". Update details on your Dashboard.`,
        date: new Date().toLocaleString(),
        type: "more_info_requested", claimId
    });

    showToast(`Request for more info sent to ${claim.claimedBy}!`, 'info');

    let modalEl = document.getElementById("requestInfoModal");
    if (modalEl) { let m = bootstrap.Modal.getInstance(modalEl); if (m) m.hide(); }

    setTimeout(() => window.location.reload(), 600);
}

// ─── Founder: Reject Claim ───────────────────────────────────
function openRejectModal(claimId) {
    let claims = getClaims();
    let claim  = claims.find(c => c.claimId === claimId);
    if (!claim) return;

    let el = id => document.getElementById(id);
    if (el('modal-reject-claim-id')) el('modal-reject-claim-id').value = claimId;
    if (el('modal-reject-display')) el('modal-reject-display').innerHTML = `
        <div class="mb-1"><strong>Item:</strong> <span style="color:var(--primary-color);font-weight:700;">${claim.itemName}</span></div>
        <div class="mb-1"><strong>Claimant:</strong> ${claim.claimedBy} (${claim.claimedByEmail})</div>
        <div class="p-2 bg-white rounded border mt-2">
            <strong>Verification Details:</strong> <span style="color:var(--lost-color);">"${claim.providedProof}"</span>
        </div>`;

    let modalEl = document.getElementById("rejectClaimModal");
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

function handleRejectClaimSubmit(event) {
    event.preventDefault();
    let claimId = document.getElementById("modal-reject-claim-id").value;
    let reason  = document.getElementById("reject-reason").value.trim();
    if (!reason) { showToast("Please enter a reason for rejecting this claim.", "warning"); return; }

    let claims = getClaims();
    let claim  = claims.find(c => c.claimId === claimId);
    if (!claim) return;

    updateClaimStatus(claimId, "Rejected", { rejectionReason: reason });

    sendNotification({
        id: "NOTIF-" + Date.now(),
        recipientEmail: claim.claimedByEmail,
        senderName: claim.reporter, senderEmail: claim.reporterEmail,
        itemName: claim.itemName,
        message: `❌ Claim Rejected! Finder ${claim.reporter} declined your claim for "${claim.itemName}". Reason: "${reason}"`,
        date: new Date().toLocaleString(),
        type: "claim_rejected", claimId
    });

    showToast(`Claim rejected. Notification sent to ${claim.claimedBy}.`, 'info');

    let modalEl = document.getElementById("rejectClaimModal");
    if (modalEl) { let m = bootstrap.Modal.getInstance(modalEl); if (m) m.hide(); }

    setTimeout(() => window.location.reload(), 600);
}

// ─── Claimant: Update Details ────────────────────────────────
function openUpdateDetailsModal(claimId) {
    let claims = getClaims();
    let claim  = claims.find(c => c.claimId === claimId);
    if (!claim) return;

    let el = id => document.getElementById(id);
    if (el('modal-update-claim-id')) el('modal-update-claim-id').value = claimId;
    if (el('modal-update-feedback-display')) el('modal-update-feedback-display').innerHTML = `
        <div class="mb-1"><strong>Founder (${claim.reporter}) Asked:</strong></div>
        <div class="fw-medium text-dark">"${claim.founderFeedback || 'Please provide more details.'}"</div>
        <div class="mt-2 text-muted extra-small">Your previous details: "${claim.providedProof}"</div>`;
    if (el('update-hidden-details-text')) el('update-hidden-details-text').value = "";

    let modalEl = document.getElementById("updateHiddenDetailsModal");
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

function handleUpdateDetailsSubmit(event) {
    event.preventDefault();
    let claimId    = document.getElementById("modal-update-claim-id").value;
    let newDetails = document.getElementById("update-hidden-details-text").value.trim();
    if (!newDetails) { showToast("Please enter the updated hidden details.", "warning"); return; }

    let claims = getClaims();
    let claim  = claims.find(c => c.claimId === claimId);
    if (!claim) return;

    updateClaimStatus(claimId, "Pending Founder Approval", { providedProof: newDetails });

    sendNotification({
        id: "NOTIF-" + Date.now(),
        recipientEmail: claim.reporterEmail,
        senderName: claim.claimedBy, senderEmail: claim.claimedByEmail,
        itemName: claim.itemName,
        message: `🔄 Updated Details! ${claim.claimedBy} provided updated hidden details for "${claim.itemName}": "${newDetails}". Please review to Accept, Reject, or Request Info.`,
        date: new Date().toLocaleString(),
        type: "claim_request", claimId
    });

    showToast(`Updated details submitted to Finder (${claim.reporter})!`, 'success');

    let modalEl = document.getElementById("updateHiddenDetailsModal");
    if (modalEl) { let m = bootstrap.Modal.getInstance(modalEl); if (m) m.hide(); }

    setTimeout(() => window.location.reload(), 600);
}

function renderMyReports(userEmail) {
    let container = document.getElementById("my-lost-container");
    let badge     = document.getElementById("tab-reports-badge");
    if (!container) return;

    let reports   = getReports();
    let myReports = reports.filter(r => r.postedByEmail?.toLowerCase().trim() === userEmail.toLowerCase().trim());

    if (badge) badge.textContent = myReports.length;

    if (myReports.length === 0) {
        container.innerHTML = `<div class="text-center py-5 text-muted">
            <i class="bi bi-collection fs-2 d-block mb-3 opacity-40"></i>
            <p class="mb-0 small">No reports submitted yet.</p>
            <div class="d-flex justify-content-center gap-2 mt-3">
                <a href="report.html?type=lost" class="btn btn-sm btn-lost">Post Lost Item</a>
                <a href="report.html?type=found" class="btn btn-sm btn-found">Post Found Item</a>
            </div>
        </div>`;
        return;
    }

    container.innerHTML = "";
    myReports.forEach(item => {
        container.innerHTML += `
            <div class="card p-3 mb-3 border shadow-sm rounded-3 fade-in-up">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <span class="badge ${item.type === 'lost' ? 'badge-lost' : 'badge-found'} mb-1">${item.type.toUpperCase()}</span>
                        <h6 class="fw-bold mb-0" style="font-family:'Sora',sans-serif;">${item.itemName}</h6>
                        <small class="text-muted"><i class="bi bi-geo-alt me-1"></i>${item.zone} &nbsp;·&nbsp; <i class="bi bi-calendar me-1"></i>${item.date}</small>
                    </div>
                    <div class="d-flex gap-2">
                        <a href="matches.html?id=${item.id}" class="btn btn-sm btn-matching">View Matches</a>
                        <button class="btn btn-sm btn-outline-danger" onclick="removeReport('${item.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>`;
    });
}

async function removeReport(id) {
    let confirmed = await showConfirm({
        message: 'Delete this report? This action cannot be undone.',
        title: 'Delete Report',
        icon: 'danger',
        confirmText: 'Yes, Delete'
    });
    if (confirmed) {
        deleteReport(id);
        showToast('Report deleted.', 'success');
        setTimeout(() => window.location.reload(), 500);
    }
}

// =============================================================
// 6. ADMIN LOGIC
// =============================================================
function initAdminPage() {
    let reports = getReports();
    let tbody   = document.getElementById("admin-table-body");
    if (!tbody) return;

    tbody.innerHTML = "";
    reports.forEach(r => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${r.id}</strong></td>
                <td><span class="badge ${r.type === 'lost' ? 'badge-lost' : 'badge-found'}">${r.type.toUpperCase()}</span></td>
                <td>${r.itemName}</td>
                <td><span class="badge bg-light text-dark border">${r.postedBy}</span></td>
                <td>${r.zone}</td>
                <td>${r.date}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="removeReport('${r.id}')">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </td>
            </tr>`;
    });

    let resetBtn = document.getElementById("btn-reset-sample-data");
    if (resetBtn) {
        resetBtn.onclick = async () => {
            let confirmed = await showConfirm({
                message: 'Reset dataset back to sample default items? All current reports will be lost.',
                title: 'Reset Sample Data',
                icon: 'warning',
                confirmText: 'Yes, Reset'
            });
            if (confirmed) {
                resetData();
                showToast('Dataset reset to sample defaults.', 'success');
                setTimeout(() => window.location.reload(), 600);
            }
        };
    }
}

// =============================================================
// HELPERS & HANDOVER QR SECURITY VERIFICATION
// =============================================================
function getDefaultImage(cat) {
    if (cat === "Bags")        return "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80";
    if (cat === "Electronics") return "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80";
    if (cat === "Wallets")     return "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80";
    return "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80";
}

// ─── Inline High-Density 2D Canvas QR Generator ──────────────
function renderQRCodeCanvas(canvasId, textData) {
    let canvas = document.getElementById(canvasId);
    if (!canvas) return;
    let ctx = canvas.getContext('2d');
    let width = canvas.width;
    let height = canvas.height;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    let size = 21;
    let cellSize = width / size;

    function drawFinder(x, y) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x * cellSize, y * cellSize, 7 * cellSize, 7 * cellSize);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, 5 * cellSize, 5 * cellSize);
        ctx.fillStyle = '#059669';
        ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize);
    }

    drawFinder(0, 0);
    drawFinder(14, 0);
    drawFinder(0, 14);

    let hash = 0;
    for (let i = 0; i < textData.length; i++) {
        hash = ((hash << 5) - hash) + textData.charCodeAt(i);
        hash |= 0;
    }

    ctx.fillStyle = '#0f172a';
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if ((r < 8 && c < 8) || (r < 8 && c > 12) || (r > 12 && c < 8)) continue;
            let val = Math.abs(Math.sin((r * 37 + c * 19 + hash) * 1.7));
            if (val > 0.46) {
                ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
            }
        }
    }
}

// ─── Lost Owner: Display Security QR Pass ────────────────────
function openQRPassModal(claimId) {
    let claim = getClaimById(claimId);
    if (!claim) {
        showToast("Claim record not found.", "warning");
        return;
    }

    let pin = claim.securityPin || (Math.floor(100000 + Math.random() * 900000)).toString();
    claim.securityPin = pin;
    updateClaimStatus(claimId, claim.status, { securityPin: pin });

    let titleEl = document.getElementById("qr-pass-item-name");
    let infoEl  = document.getElementById("qr-pass-owner-info");
    let pinEl   = document.getElementById("qr-pass-pin");

    if (titleEl) titleEl.textContent = claim.itemName;
    if (infoEl)  infoEl.textContent = `${claim.claimedBy} (${claim.claimedByEmail})`;
    if (pinEl)   pinEl.textContent = pin;

    renderQRCodeCanvas("qr-pass-canvas", `CAMPUS_HANDOVER_TOKEN:${claim.claimId}:${claim.claimedByEmail}:${pin}`);

    let modalEl = document.getElementById("qrPassModal");
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

// ─── Founder: Open Camera QR Scanner HUD ─────────────────────
function openQRScannerModal(claimId) {
    let claim = getClaimById(claimId);
    if (!claim) {
        showToast("Claim record not found.", "warning");
        return;
    }

    let scanInput = document.getElementById("qr-scan-claim-id");
    let resultBox = document.getElementById("qr-auth-result-box");
    let pinInput  = document.getElementById("qr-pin-input");

    if (scanInput) scanInput.value = claimId;
    if (resultBox) resultBox.innerHTML = "";
    if (pinInput)  pinInput.value = "";

    let modalEl = document.getElementById("qrScannerModal");
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

function triggerSimulatedQRScan() {
    let claimId = document.getElementById("qr-scan-claim-id")?.value;
    if (!claimId) return;

    let resultBox = document.getElementById("qr-auth-result-box");
    if (resultBox) {
        resultBox.innerHTML = `
            <div class="alert alert-warning border-0 text-center py-3 my-2">
                <div class="spinner-border spinner-border-sm me-2 text-warning"></div>
                <strong>Scanning QR Code...</strong> Reading Lost Owner's phone screen.
            </div>
        `;
    }

    setTimeout(() => {
        verifyHandoverPass(claimId, 'SIMULATED_QR_SCAN');
    }, 850);
}

function handleVerifyQRPinSubmit(event) {
    event.preventDefault();
    let claimId = document.getElementById("qr-scan-claim-id")?.value;
    let pin = document.getElementById("qr-pin-input")?.value.trim();
    if (!claimId || !pin) return;

    verifyHandoverPass(claimId, pin);
}

// ─── Core Handover Security Authenticator ────────────────────
function verifyHandoverPass(claimId, tokenOrPin) {
    let claim = getClaimById(claimId);
    if (!claim) return;

    let expectedPin = claim.securityPin || "849201";
    let isMatch = tokenOrPin === 'SIMULATED_QR_SCAN' || tokenOrPin === expectedPin;

    let resultBox = document.getElementById("qr-auth-result-box");

    if (isMatch) {
        let now = new Date().toLocaleString();
        updateClaimStatus(claimId, "Handover Completed & Verified", { completedAt: now, isVerified: true });

        addClaimMessage(claimId, {
            sender: "Security Authenticator",
            senderEmail: "security@campus.edu",
            text: `🔒 SECURITY QR AUTHENTICATED! Item "${claim.itemName}" successfully returned to verified owner ${claim.claimedBy} (${claim.claimedByEmail}).`,
            type: "confirmed"
        });

        sendNotification({
            id: "NOTIF-" + Date.now(),
            recipientEmail: claim.claimedByEmail,
            senderName: claim.reporter,
            senderEmail: claim.reporterEmail,
            itemName: claim.itemName,
            message: `🎉 Handover Completed & Verified! QR Security Pass for "${claim.itemName}" was authenticated by Founder (${claim.reporter}). Thank you for using Campus Lost & Found!`,
            date: now,
            type: "chat_message", claimId
        });

        if (resultBox) {
            resultBox.innerHTML = `
                <div class="verified-handover-seal text-center my-2">
                    <i class="bi bi-shield-check display-4 d-block mb-1 text-success"></i>
                    <h6 class="fw-bold text-dark mb-1 fs-5">IDENTITY AUTHENTICATED!</h6>
                    <p class="small text-muted mb-2">Safe to hand over <strong>"${claim.itemName}"</strong> to <strong>${claim.claimedBy}</strong> (${claim.claimedByEmail}).</p>
                    <div class="badge bg-success text-white px-3 py-1 rounded-pill mb-3">Status: Handover Completed & Verified</div>
                    <div>
                        <button type="button" class="btn btn-sm btn-dark px-4 rounded-pill fw-bold" data-bs-dismiss="modal" onclick="window.location.reload()">
                            Done & Close <i class="bi bi-check2-all ms-1"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        showToast("QR Security Pass Authenticated! Item handover complete.", "success", 4000);
        setTimeout(() => {
            let currentUser = getCurrentUser();
            if (currentUser) {
                renderSubmittedClaims(currentUser.useremail);
                renderReceivedClaims(currentUser.useremail);
            }
        }, 1200);
    } else {
        if (resultBox) {
            resultBox.innerHTML = `
                <div class="alert alert-danger border-0 text-center my-2">
                    <i class="bi bi-exclamation-triangle-fill me-1"></i>
                    <strong>Verification Failed!</strong> Security PIN does not match. Please check owner's pass and try again.
                </div>
            `;
        }
        showToast("Invalid Security PIN!", "error");
    }
}
