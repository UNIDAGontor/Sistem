/**
 * ========================================
 * UI.JS - Modal, Toast & UI Components
 * ========================================
 * Traditional script version (no import/export)
 */

const TOAST_ICONS = {
    'success': 'fas fa-check-circle',
    'error': 'fas fa-times-circle',
    'warning': 'fas fa-exclamation-circle',
    'info': 'fas fa-info-circle'
};

/**
 * Show toast notification
 */
function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="${TOAST_ICONS[type] || TOAST_ICONS.info}"></i>
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;
    
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        toast.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, 3500);
}

/**
 * Open modal by ID
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close modal by ID
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

/**
 * Initialize UI event listeners
 */
function initUI() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                overlay.classList.remove('show');
                document.body.style.overflow = '';
            }
        });
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.show').forEach(function(modal) {
                modal.classList.remove('show');
            });
            document.body.style.overflow = '';
        }
    });
    
    console.log('🎨 UI components initialized');
}

// ========================================
// GLOBAL EXPOSURE
// ========================================
if (typeof window !== 'undefined') {
    window.showToast = showToast;
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.initUI = initUI;
}

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
} else {
    initUI();
}