/**
 * ========================================
 * UTILS.JS - Helper Functions & Utilities
 * ========================================
 * Traditional script version
 */

/**
 * Format date to Indonesian format
 */
function formatDate(date) {
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Generate unique ID
 */
function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Filter surat table by type
 */
function filterSurat(btn, type) {
    document.querySelectorAll('.tab-btn').forEach(function(b) {
        b.classList.remove('active');
    });
    btn.classList.add('active');
    
    if (typeof window.showToast === 'function') {
        window.showToast('info', 'Filter', `Menampilkan ${type.charAt(0).toUpperCase() + type.slice(1)}`);
    }
}

/**
 * Export table data (mock)
 */
function exportTable(type) {
    if (typeof window.showToast === 'function') {
        window.showToast('success', 'Export', `Data ${type} berhasil di-export ke Excel`);
    }
}

/**
 * Initialize utility event listeners
 */
function initUtils() {
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function(e) {
            const query = e.target.value.toLowerCase();
            if (query.length > 2 && typeof window.showToast === 'function') {
                window.showToast('info', 'Pencarian', `Mencari: "${e.target.value}"`);
            }
        }, 300));
    }
    
    console.log('🔧 Utilities initialized');
}

// ========================================
// GLOBAL EXPOSURE
// ========================================
if (typeof window !== 'undefined') {
    window.formatDate = formatDate;
    window.generateId = generateId;
    window.debounce = debounce;
    window.filterSurat = filterSurat;
    window.exportTable = exportTable;
    window.initUtils = initUtils;
}

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUtils);
} else {
    initUtils();
}