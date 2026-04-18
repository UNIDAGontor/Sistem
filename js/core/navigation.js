/**
 * ========================================
 * NAVIGATION.JS - Sidebar & Page Navigation
 * ========================================
 * Traditional script version (no import/export)
 * Functions exposed to window for inline onclick handlers
 */

// Page title mappings
const PAGE_TITLES = {
    'dashboard': ['Dashboard', 'Selamat datang di Sistem Biro Kerjasama'],
    'tata-usaha': ['Tata Usaha', 'Manajemen surat dan administrasi'],
    'kerjasama': ['Kerjasama', 'Pengelolaan MoU dan kerjasama institusi'],
    'international': ['Urusan International', 'Kerjasama dan hubungan internasional'],
    'surat': ['Surat Masuk/Keluar', 'Manajemen surat menyurat'],
    'agenda': ['Agenda Kegiatan', 'Jadwal kegiatan dan kunjungan'],
    'laporan': ['Laporan', 'Laporan dan statistik sistem'],
    'pengguna': ['Manajemen Pengguna', 'Kelola akun dan hak akses'],
    'pengaturan': ['Pengaturan', 'Konfigurasi sistem']
};

/**
 * Navigate to a specific page
 * @param {string} pageId - ID of the page to navigate to
 */
function navigateTo(pageId) {
    // Update sidebar active state
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`.menu-item[data-page="${pageId}"]`);
    if (activeItem) activeItem.classList.add('active');

    // Update page visibility
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) targetPage.classList.add('active');

    // Update header title
    if (PAGE_TITLES[pageId]) {
        const [title, subtitle] = PAGE_TITLES[pageId];
        const pageTitleEl = document.getElementById('pageTitle');
        const pageSubtitleEl = document.getElementById('pageSubtitle');
        if (pageTitleEl) pageTitleEl.textContent = title;
        if (pageSubtitleEl) pageSubtitleEl.textContent = subtitle;
    }

    // Close mobile sidebar
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('mobile-open');
    }

    // Trigger page-specific initializations
    triggerPageInit(pageId);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    if (window.innerWidth <= 768) {
        sidebar?.classList.toggle('mobile-open');
    } else {
        sidebar?.classList.toggle('collapsed');
        mainContent?.classList.toggle('expanded');
    }
}


/**
 * Trigger initialization for specific pages
 * @private
 */
function triggerPageInit(pageId) {
    const pageInitMap = {
        'kerjasama': () => { if (typeof window.initKerjasamaChart === 'function') window.initKerjasamaChart(); },
        'international': () => { if (typeof window.initIntlChart === 'function') window.initIntlChart(); },
        'laporan': () => { if (typeof window.initLaporanChart === 'function') window.initLaporanChart(); }
    };
    
    if (pageInitMap[pageId]) {
        pageInitMap[pageId]();
    }
}

/**
 * Initialize navigation event listeners
 */
function initNavigation() {
    // Attach click handlers to sidebar menu items
    document.querySelectorAll('.menu-item[data-page]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.dataset.page;
            navigateTo(pageId);
        });
    });
    
    // Attach toggle sidebar button
    const toggleBtn = document.querySelector('.toggle-sidebar');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleSidebar);
    }
    
    console.log('🧭 Navigation initialized');
}

// ========================================
// GLOBAL EXPOSURE FOR INLINE ONCLICK
// ========================================
// Makes functions available for onclick="..." in HTML
if (typeof window !== 'undefined') {
    window.navigateTo = navigateTo;
    window.toggleSidebar = toggleSidebar;
    window.initNavigation = initNavigation;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
} else {
    // DOM already ready
    initNavigation();
}