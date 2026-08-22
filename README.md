# 🎓 CampusLost&Found — Intelligent Campus Recovery System

[![License: MIT](https://img.shields.io/badge/License-MIT-00e676.svg)](https://opensource.org/licenses/MIT)
[![Bootstrap 5](https://img.shields.io/badge/Bootstrap-5.3.2-purple.svg)](https://getbootstrap.com/)
[![Pure JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success.svg)]()

> An intelligent, privacy-first campus recovery web application powered by **multi-attribute similarity scoring**, **zero-knowledge claim verification**, **real-time chat**, and **tamper-proof QR handover authentication**.

---

## 🌟 Table of Contents
1. [Key Features](#-key-features)
2. [Intelligent Matching Engine](#-intelligent-matching-engine)
3. [System Architecture & File Structure](#-system-architecture--file-structure)
4. [User Flow & Handover Security](#-user-flow--handover-security)
5. [Getting Started & Local Setup](#-getting-started--local-setup)
6. [Pages & Routing Overview](#-pages--routing-overview)
7. [Default Seed Data & Demo Accounts](#-default-seed-data--demo-accounts)
8. [Browser Support & Tech Stack](#-browser-support--tech-stack)

---

## Key Features

###  1. Multi-Attribute AI Similarity Match Engine
- Evaluates lost and found reports using a **mathematical 6-factor weighted algorithm** (Category, Campus Zone, Item Name/Brand NLP, Color Ontology, Temporal Date Decay, Semantic Description).
- Ranked confidence tiers: **High Match (70%+)**, **Moderate Match (45–69%)**, and **Low Match (<45%)**.
- Interactive **Live Matching Simulator** on the homepage to test attribute weightings dynamically.

### 2. Zero-Knowledge Proof Claims
- Claimants must provide **hidden identifying details** (e.g. engravings, keychain design, lockscreen wallpaper, serial numbers) before finder contact information is revealed.
- Protects student belongings from false or fraudulent claims.

###  3. Tamper-Proof QR Handover Pass & Security Authenticator
- Generates dynamic **digital QR Handover Passes** with 6-digit security verification PINs upon meeting approval.
- Integrated **Security Authenticator modal** with PIN validation and simulated camera scanner to securely finalize handovers at campus security checkpoints.

###  4. In-App Direct Handover Chat
- Built-in live messaging modal between Finder and Claimant to coordinate safe on-campus meetings.
- Live timestamped message threads with system confirmation alerts.

###  5. Real-Time In-App Notification Center
- Animated dropdown flyout with CSS spring entrance physics (`cubic-bezier(0.34, 1.56, 0.64, 1)`).
- Visual category pills for *Direct Messages*, *Found Item Alerts*, *Claim Approvals*, and *More Info Requests*.
- Embedded **1-click direct conversation action buttons** and individual/batch clear controls.

###  6. Full-Width Personal Recovery Dashboard
- Centralized command center tracking:
  - **Found Alerts**: Reports matching your lost belongings.
  - **Claims Received**: Review secret proofs submitted for items you found.
  - **My Claims**: Track status, chat with finders, and generate QR passes.
  - **My Reports**: Manage and edit your active posts.

###  7. Proactive Authentication Gating
- Instant modal gate on report submission preventing guest users from losing form progress before signing in.
- Automatic preservation of `returnUrl` parameters.

###  8. Campus Administration Portal
- Real-time campus inventory metrics, audit logs, item status overrides, and quick moderation actions.

---

##  Intelligent Matching Engine

The matching core (`js/matching.js`) computes item similarity ($S$) between target report ($A$) and candidate report ($B$) across 6 weighted dimensions:

$$\text{Similarity Score} = w_1 S_{\text{Name}} + w_2 S_{\text{Category}} + w_3 S_{\text{Zone}} + w_4 S_{\text{Color}} + w_5 S_{\text{Date}} + w_6 S_{\text{NLP}}$$

| Attribute Factor | Max Weight | Evaluation Logic & Rules |
| :--- | :---: | :--- |
| **Item Name & Brand NLP** | **25%** | Token matching, recognized brand detection (Apple, Dell, Nike, etc.), Levenshtein distance similarity. |
| **Category & Device Type** | **20%** | Category ontology matching + specific device-class alignment for electronics (Laptops, Phones, Earbuds). |
| **Campus Zone Proximity** | **20%** | Exact zone match = 100%; Adjacent campus topological zones (e.g. *Library* $\leftrightarrow$ *Main Block*) = 60%; Non-adjacent = 15%. |
| **Color Ontology** | **15%** | Color family distance (e.g., *Charcoal* $\leftrightarrow$ *Black* = 75%, *Navy* $\leftrightarrow$ *Black* = 65%). |
| **Temporal Date Interval** | **10%** | Exponential time decay based on days elapsed between reports ($100\%$ for same-day, decreasing over 14 days). |
| **Semantic Description** | **10%** | Tokenized Jaccard keyword overlap with stop-word elimination. |

---

## 📁 System Architecture & File Structure

```
campuslostandfound/
│
├── index.html            # Landing page with AI simulator, live feed & category explorer
├── dashboard.html        # Personal recovery dashboard with full-width tabs
├── report.html           # Multi-step item reporting form with instant auth checks
├── matches.html          # Intelligent match engine HUD and gathered filter grid
├── admin.html            # Campus administrator management console
├── login.html            # Sign-in portal with returnUrl preservation
├── signup.html           # Student registration page
│
├── css/
│   └── style.css         # Complete TenFore-inspired dark emerald design system & animations
│
├── js/
│   ├── app.js            # Main application controller, UI event bindings & rendering
│   ├── matching.js       # 6-factor multi-attribute similarity matching algorithm
│   ├── storage.js        # LocalStorage persistence layer, models & seed data
│   ├── validation.js     # Form validation engine & input sanity rules
│   └── ui.js             # Notification toasts, image dropzones & dynamic chips
│
└── README.md             # Project documentation
```


## 💻 Getting Started & Local Setup

This project is built using standard **HTML5**, **CSS3**, and **ES6 JavaScript** with client-side persistence in `localStorage`. No database setup or build tools are required!

### Option 1: Run with VS Code Live Server
1. Clone or download this repository:
   ```bash
   git clone https://github.com/irasodhi/backendproject.git
   cd backendproject
   ```
2. Open the folder in **Visual Studio Code**.
3. Install the **Live Server** extension (if not already installed).
4. Right-click `index.html` and select **"Open with Live Server"**.

### Option 2: Run with Python HTTP Server
```bash
# Python 3
python -m http.server 5500
```
Then visit `http://localhost:5500` in your web browser.

---

## 📄 Pages & Routing Overview

| Page | URL Path | Description |
| :--- | :--- | :--- |
| **Home / Landing** | [`index.html`](file:///c:/Users/hp/OneDrive/Documents/Desktop/campuslostandfound/index.html) | Hero banner, AI simulator, category quick chips, live inventory search, and security trust ecosystem. |
| **Report Item** | [`report.html`](file:///c:/Users/hp/OneDrive/Documents/Desktop/campuslostandfound/report.html) | Multi-step reporting for Lost/Found items with live image drag-and-drop and auth gating. |
| **Match Engine** | [`matches.html`](file:///c:/Users/hp/OneDrive/Documents/Desktop/campuslostandfound/matches.html) | Candidate probability radar HUD, score breakdowns, and unified search/filter bar. |
| **Dashboard** | [`dashboard.html`](file:///c:/Users/hp/OneDrive/Documents/Desktop/campuslostandfound/dashboard.html) | Full-width command center for alerts, claims received/sent, meetings, and reports. |
| **Admin Portal** | [`admin.html`](file:///c:/Users/hp/OneDrive/Documents/Desktop/campuslostandfound/admin.html) | Management view with global report filters, claim review, and status moderation. |
| **Authentication** | [`login.html`](file:///c:/Users/hp/OneDrive/Documents/Desktop/campuslostandfound/login.html), [`signup.html`](file:///c:/Users/hp/OneDrive/Documents/Desktop/campuslostandfound/signup.html) | Student access portal with automatic return redirect. |

---


## 🛠️ Browser Support & Tech Stack

- **Markup & Layout**: Semantic HTML5, Bootstrap 5.3.2 Grid & Components
- **Styling**: Vanilla CSS3 (Custom Design Tokens, HSL Palette, Glassmorphism, Micro-Animations)
- **Typography**: Google Fonts ([Sora](https://fonts.google.com/specimen/Sora) & [Inter](https://fonts.google.com/specimen/Inter))
- **Icons**: [Bootstrap Icons v1.11.1](https://icons.getbootstrap.com/)
- **Logic & State**: Modular Vanilla JavaScript (ES6+), Web Storage API (`localStorage` & `sessionStorage`)
- **Compatibility**: Chrome 90+, Edge 90+, Firefox 88+, Safari 14+, iOS & Android Mobile Browsers

---


