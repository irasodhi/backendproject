/**
 * ui.js — Campus Lost & Found
 * In-app Toast notification system + Custom Confirm dialog
 * Replaces all native alert() and confirm() calls
 */

/* ─── Toast System ─────────────────────────────────────────────────────────── */

(function () {
    // Inject toast container into DOM once
    function getOrCreateContainer() {
        let c = document.getElementById('toast-container');
        if (!c) {
            c = document.createElement('div');
            c.id = 'toast-container';
            document.body.appendChild(c);
        }
        return c;
    }

    const ICONS = {
        success: 'bi-check-circle-fill',
        error:   'bi-x-circle-fill',
        warning: 'bi-exclamation-triangle-fill',
        info:    'bi-info-circle-fill'
    };

    /**
     * showToast(message, type, duration)
     * @param {string} message  - Text to display
     * @param {string} type     - 'success' | 'error' | 'warning' | 'info'
     * @param {number} duration - Auto-dismiss ms (default 4000)
     */
    window.showToast = function (message, type = 'info', duration = 4000) {
        const container = getOrCreateContainer();
        const icon = ICONS[type] || ICONS.info;

        const toast = document.createElement('div');
        toast.className = `app-toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <i class="bi ${icon} toast-icon"></i>
            <div class="toast-body">${message}</div>
            <button class="toast-close" aria-label="Close">
                <i class="bi bi-x-lg"></i>
            </button>
        `;

        // Dismiss on click anywhere on toast
        toast.addEventListener('click', () => dismissToast(toast));

        container.appendChild(toast);

        // Auto dismiss
        const timer = setTimeout(() => dismissToast(toast), duration);

        // Store timer ref to cancel if manually dismissed
        toast._dismissTimer = timer;

        return toast;
    };

    function dismissToast(toast) {
        if (toast._dismissed) return;
        toast._dismissed = true;
        clearTimeout(toast._dismissTimer);
        toast.classList.add('toast-leaving');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
        // Fallback removal
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 400);
    }
})();


/* ─── Custom Confirm Dialog ────────────────────────────────────────────────── */

/**
 * showConfirm(options) → Promise<boolean>
 * @param {object} options
 *   message    {string}  — Main message text
 *   title      {string}  — Dialog title (optional)
 *   icon       {string}  — 'danger' | 'warning' | 'info' (optional)
 *   confirmText {string} — Confirm button text (default 'Yes, Confirm')
 *   cancelText  {string} — Cancel button text (default 'Cancel')
 * @returns Promise resolving to true (confirmed) or false (cancelled)
 *
 * Usage:
 *   const ok = await showConfirm({ message: 'Delete this report?', icon: 'danger' });
 *   if (ok) { ... }
 *
 * Callback style (for non-async contexts):
 *   showConfirm({ message: '...' }, onConfirm, onCancel);
 */
window.showConfirm = function (options, onConfirm, onCancel) {
    if (typeof options === 'string') {
        options = { message: options };
    }

    const {
        message    = 'Are you sure?',
        title      = 'Confirm Action',
        icon       = 'warning',
        confirmText = 'Yes, Confirm',
        cancelText  = 'Cancel'
    } = options;

    const iconMap = {
        danger:  { cls: 'confirm-icon-danger',  bi: 'bi-trash3-fill' },
        warning: { cls: 'confirm-icon-warning', bi: 'bi-exclamation-triangle-fill' },
        info:    { cls: 'confirm-icon-info',    bi: 'bi-info-circle-fill' }
    };
    const iconInfo = iconMap[icon] || iconMap.warning;

    const confirmBtnClass = icon === 'danger' ? 'btn-danger' : (icon === 'info' ? 'btn-primary' : 'btn-warning text-dark');

    const overlay = document.createElement('div');
    overlay.id = 'confirm-overlay';
    overlay.innerHTML = `
        <div id="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <div class="confirm-icon-wrap ${iconInfo.cls}">
                <i class="bi ${iconInfo.bi}"></i>
            </div>
            <h5 id="confirm-title" class="fw-bold text-center mb-2" style="font-family:'Sora',sans-serif;color:#1e1b4b;">${title}</h5>
            <p class="text-muted text-center small mb-4" style="line-height:1.6;">${message}</p>
            <div class="d-flex gap-3">
                <button id="confirm-cancel-btn" class="btn btn-light fw-semibold flex-fill">
                    <i class="bi bi-x-circle me-1"></i>${cancelText}
                </button>
                <button id="confirm-ok-btn" class="btn ${confirmBtnClass} fw-bold flex-fill">
                    <i class="bi bi-check-circle me-1"></i>${confirmText}
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    function cleanup() {
        document.body.style.overflow = '';
        if (overlay.parentNode) overlay.remove();
    }

    // Promise-based
    if (!onConfirm && !onCancel) {
        return new Promise((resolve) => {
            overlay.querySelector('#confirm-ok-btn').addEventListener('click', () => {
                cleanup(); resolve(true);
            });
            overlay.querySelector('#confirm-cancel-btn').addEventListener('click', () => {
                cleanup(); resolve(false);
            });
            // Click outside dialog to cancel
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) { cleanup(); resolve(false); }
            });
            // Escape key
            function onKey(e) {
                if (e.key === 'Escape') { cleanup(); resolve(false); document.removeEventListener('keydown', onKey); }
            }
            document.addEventListener('keydown', onKey);
        });
    }

    // Callback style
    overlay.querySelector('#confirm-ok-btn').addEventListener('click', () => {
        cleanup();
        if (onConfirm) onConfirm();
    });
    overlay.querySelector('#confirm-cancel-btn').addEventListener('click', () => {
        cleanup();
        if (onCancel) onCancel();
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) { cleanup(); if (onCancel) onCancel(); }
    });
};
