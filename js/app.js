/**
 * ========================================
 * APP.JS - Main Entry Point
 * ========================================
 * Traditional script version - NO import/export
 * All functions accessed via window.functionName
 */

// === Global App State ===
const App = {
    config: {
        mobileBreakpoint: 768,
        toastDuration: 3500,
        animationDuration: 300
    },
    
    modules: {},
    
    init: function() {
        console.log('🚀 Initializing Biro Kerjasama System...');
        
        // Initialize core functionality (already auto-init in their files)
        if (typeof window.initNavigation === 'function') window.initNavigation();
        if (typeof window.initUI === 'function') window.initUI();
        if (typeof window.initUtils === 'function') window.initUtils();
        
        // Initialize feature modules
        if (typeof window.initDashboard === 'function') {
            this.modules.dashboard = window.initDashboard();
        }
        if (typeof window.initTataUsaha === 'function') {
            this.modules.tataUsaha = window.initTataUsaha();
        }
        if (typeof window.initKerjasama === 'function') {
            this.modules.kerjasama = window.initKerjasama();
        }
        if (typeof window.initInternational === 'function') {
            this.modules.international = window.initInternational();
        }
        if (typeof window.initAgenda === 'function') {
            this.modules.agenda = window.initAgenda();
        }
        if (typeof window.initLaporan === 'function') {
            this.modules.laporan = window.initLaporan();
        }
        // TAMBAHKAN INI - Inisialisasi Buat Surat
    if (typeof window.initBuatSurat === 'function') {
        this.modules.buatSurat = window.initBuatSurat();
    }
        if (typeof window.initPengguna === 'function') {
            this.modules.pengguna = window.initPengguna();
        }
        
        // Setup global event listeners
        this.setupGlobalEvents();
        
        // Load default page
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('dashboard');
        }
        
        console.log('✅ System ready!');
    },
    
    setupGlobalEvents: function() {
        const self = this;
        
        // Responsive sidebar handler
        window.addEventListener('resize', function() {
            if (window.innerWidth > self.config.mobileBreakpoint) {
                const sidebar = document.getElementById('sidebar');
                if (sidebar) sidebar.classList.remove('mobile-open');
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-overlay.show').forEach(function(modal) {
                    if (typeof window.closeModal === 'function') {
                        window.closeModal(modal.id);
                    }
                });
            }
        });
    }
};

// === Initialize App when DOM is ready ===
function initApp() {
    App.init();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// ========================================
// GLOBAL EXPOSURE FOR DEBUGGING
// ========================================
if (typeof window !== 'undefined') {
    window.App = App;
    
    // Debug helper
    console.log('🔍 Debug: App loaded:', typeof App !== 'undefined');
    console.log('🔍 Debug: Functions available:', {
        navigateTo: typeof window.navigateTo,
        showToast: typeof window.showToast,
        openModal: typeof window.openModal,
        simpanSurat: typeof window.simpanSurat
    });
}
// ========================================
// DEBUG: Cek fungsi global tersedia
// ========================================
setTimeout(function() {
    console.log('🔍 Debug Check - Functions:');
    console.log('  toggleSidebar:', typeof window.toggleSidebar);
    console.log('  navigateTo:', typeof window.navigateTo);
    console.log('  showToast:', typeof window.showToast);
    
    // Test button exists
    const btn = document.querySelector('.toggle-sidebar');
    console.log('  Toggle button found:', !!btn);
    
    if (btn) {
        console.log('  Button onclick:', btn.onclick ? 'inline handler' : 'no inline');
        console.log('  Button listeners:', btn.addEventListener ? 'can add listeners' : 'cannot');
    }
}, 1000);