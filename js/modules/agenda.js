/**
 * ========================================
 * AGENDA.JS - Activity Schedule Module
 * ========================================
 * Traditional script version
 */

/**
 * Add new agenda item (mock)
 */
function tambahAgenda(data) {
    console.log('Adding agenda:', data);
    
    if (typeof window.showToast === 'function') {
        window.showToast('success', 'Agenda', 'Fitur tambah agenda akan segera tersedia');
    }
}

/**
 * Initialize agenda module
 */
function initAgenda() {
    const addBtn = document.querySelector('#page-agenda .btn-primary');
    if (addBtn) {
        addBtn.addEventListener('click', function() { tambahAgenda({}); });
    }
    
    console.log('📅 Agenda module initialized');
    
    return {
        add: tambahAgenda,
        getUpcoming: function() {
            return Array.from(document.querySelectorAll('.timeline-item')).slice(0, 3);
        }
    };
}

// ========================================
// GLOBAL EXPOSURE
// ========================================
if (typeof window !== 'undefined') {
    window.tambahAgenda = tambahAgenda;
    window.initAgenda = initAgenda;
}