/**
 * ========================================
 * LAPORAN.JS - Reports & Statistics Module
 * ========================================
 * Traditional script version
 */

/**
 * Export report function
 */
function exportLaporan(format = 'pdf') {
    const messages = {
        'pdf': 'Laporan berhasil di-generate dan diunduh',
        'excel': 'Laporan Excel berhasil diunduh'
    };
    
    if (typeof window.showToast === 'function') {
        window.showToast('success', 'Laporan', messages[format] || messages.pdf);
    }
}

/**
 * Initialize laporan chart
 */
function initLaporanChart() {
    if (typeof window.createBarChart === 'function' && window.CHART_DATA) {
        window.createBarChart('laporanChart', window.CHART_DATA.laporan, {
            maxHeight: 230,
            showLabels: true
        });
    }
}

/**
 * Initialize laporan module
 */
function initLaporan() {
    document.querySelectorAll('#page-laporan .btn-success, #page-laporan .btn-primary').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const format = this.classList.contains('btn-success') ? 'pdf' : 'excel';
            exportLaporan(format);
        });
    });
    
    console.log('📈 Laporan module initialized');
    
    return {
        export: exportLaporan,
        refreshChart: initLaporanChart,
        getStats: function() {
            return {
                totalSurat: 156,
                mouAktif: 42,
                negaraMitra: 18,
                agendaTerjadwal: 27
            };
        }
    };
}

// ========================================
// GLOBAL EXPOSURE
// ========================================
if (typeof window !== 'undefined') {
    window.exportLaporan = exportLaporan;
    window.initLaporanChart = initLaporanChart;
    window.initLaporan = initLaporan;
}