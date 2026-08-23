

(function () {
    
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

        toast.addEventListener('click', () => dismissToast(toast));

        container.appendChild(toast);

        const timer = setTimeout(() => dismissToast(toast), duration);

        toast._dismissTimer = timer;

        return toast;
    };

    function dismissToast(toast) {
        if (toast._dismissed) return;
        toast._dismissed = true;
        clearTimeout(toast._dismissTimer);
        toast.classList.add('toast-leaving');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
        
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 400);
    }
})();

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

    document.body.style.overflow = 'hidden';

    function cleanup() {
        document.body.style.overflow = '';
        if (overlay.parentNode) overlay.remove();
    }

    if (!onConfirm && !onCancel) {
        return new Promise((resolve) => {
            overlay.querySelector('#confirm-ok-btn').addEventListener('click', () => {
                cleanup(); resolve(true);
            });
            overlay.querySelector('#confirm-cancel-btn').addEventListener('click', () => {
                cleanup(); resolve(false);
            });
            
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) { cleanup(); resolve(false); }
            });
            
            function onKey(e) {
                if (e.key === 'Escape') { cleanup(); resolve(false); document.removeEventListener('keydown', onKey); }
            }
            document.addEventListener('keydown', onKey);
        });
    }

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
