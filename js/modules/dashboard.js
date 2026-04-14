/**
 * ========================================
 * DASHBOARD.JS - Dashboard Module
 * ========================================
 * Traditional script version
 */

/**
 * Initialize dashboard chart
 */
function initDashboardChart() {
    if (typeof window.createBarChart === 'function' && window.CHART_DATA) {
        window.createBarChart('dashboardChart', window.CHART_DATA.dashboard, {
            maxHeight: 180,
            showLabels: true
        });
    }
}

/**
 * Quick action handlers
 */
const quickActions = {
    buatSurat: function() {
        if (typeof window.navigateTo === 'function') window.navigateTo('tata-usaha');
    },
    tambahKerjasama: function() {
        if (typeof window.navigateTo === 'function') window.navigateTo('kerjasama');
    },
    ajukanKunjungan: function() {
        if (typeof window.navigateTo === 'function') window.navigateTo('international');
    },
    buatAgenda: function() {
        if (typeof window.navigateTo === 'function') window.navigateTo('agenda');
    },
    cetakLaporan: function() {
        if (typeof window.navigateTo === 'function') window.navigateTo('laporan');
    },
    tambahPengguna: function() {
        if (typeof window.navigateTo === 'function') window.navigateTo('pengguna');
    }
};

/**
 * Initialize dashboard module
 */
function initDashboard() {
    // Initialize chart on load
    initDashboardChart();
    
    // Attach quick action handlers
    document.querySelectorAll('.quick-action-btn').forEach(function(btn, index) {
        const actions = Object.values(quickActions);
        if (actions[index]) {
            btn.addEventListener('click', actions[index]);
        }
    });
    
    console.log('📊 Dashboard module initialized');
    
    return {
        refresh: initDashboardChart,
        updateStats: function(newData) {
            console.log('Updating stats:', newData);
        }
    };
}

// ========================================
// GLOBAL EXPOSURE
// ========================================
if (typeof window !== 'undefined') {
    window.initDashboardChart = initDashboardChart;
    window.initDashboard = initDashboard;
}

// Auto-init if on dashboard page
if (document.getElementById('page-dashboard')) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDashboard);
    } else {
        initDashboard();
    }
}