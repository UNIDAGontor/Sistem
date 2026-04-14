/**
 * ========================================
 * CHART-MANAGER.JS - Chart Rendering Utility
 * ========================================
 * Traditional script version
 */

/**
 * Create animated bar chart
 */
function createBarChart(containerId, data, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const maxHeight = options.maxHeight || 180;
    const animationDelay = options.animationDelay || 100;
    const showLabels = options.showLabels !== false;
    
    const maxValue = Math.max(...data.map(d => d.value));
    container.innerHTML = '';
    
    data.forEach(function(item, index) {
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        
        const height = maxValue > 0 ? (item.value / maxValue) * maxHeight : 0;
        
        bar.style.height = '0px';
        bar.style.background = item.color || 'var(--primary-lighter)';
        
        if (showLabels) {
            bar.setAttribute('data-label', item.label);
            bar.setAttribute('data-value', item.value);
        }
        
        container.appendChild(bar);
        
        setTimeout(function() {
            bar.style.height = `${height}px`;
        }, animationDelay + (index * 50));
    });
}

/**
 * Chart data configurations
 */
const CHART_DATA = {
    dashboard: [
        { label: 'Jan', value: 18, color: 'linear-gradient(180deg, #3182ce, #63b3ed)' },
        { label: 'Feb', value: 25, color: 'linear-gradient(180deg, #3182ce, #63b3ed)' },
        { label: 'Mar', value: 32, color: 'linear-gradient(180deg, #38a169, #68d391)' },
        { label: 'Apr', value: 28, color: 'linear-gradient(180deg, #38a169, #68d391)' },
        { label: 'Mei', value: 35, color: 'linear-gradient(180deg, #38a169, #68d391)' },
        { label: 'Jun', value: 22, color: 'linear-gradient(180deg, #3182ce, #63b3ed)' },
        { label: 'Jul', value: 30, color: 'linear-gradient(180deg, #d69e2e, #f6e05e)' },
        { label: 'Ags', value: 27, color: 'linear-gradient(180deg, #d69e2e, #f6e05e)' },
        { label: 'Sep', value: 38, color: 'linear-gradient(180deg, #e53e3e, #fc8181)' },
        { label: 'Okt', value: 42, color: 'linear-gradient(180deg, #e53e3e, #fc8181)' },
        { label: 'Nov', value: 36, color: 'linear-gradient(180deg, #3182ce, #63b3ed)' },
        { label: 'Des', value: 31, color: 'linear-gradient(180deg, #3182ce, #63b3ed)' }
    ],
    kerjasama: [
        { label: 'Pendidikan', value: 15, color: 'linear-gradient(180deg, #3182ce, #63b3ed)' },
        { label: 'Riset', value: 22, color: 'linear-gradient(180deg, #38a169, #68d391)' },
        { label: 'Exchange', value: 18, color: 'linear-gradient(180deg, #d69e2e, #f6e05e)' },
        { label: 'Joint Degree', value: 8, color: 'linear-gradient(180deg, #e53e3e, #fc8181)' },
        { label: 'SDM', value: 12, color: 'linear-gradient(180deg, #805ad5, #b794f4)' },
        { label: 'Teknologi', value: 20, color: 'linear-gradient(180deg, #3182ce, #63b3ed)' }
    ],
    international: [
        { label: '🇯🇵 Jepang', value: 35, color: 'linear-gradient(180deg, #e53e3e, #fc8181)' },
        { label: '🇰🇷 Korea', value: 28, color: 'linear-gradient(180deg, #3182ce, #63b3ed)' },
        { label: '🇨🇳 Tiongkok', value: 25, color: 'linear-gradient(180deg, #d69e2e, #f6e05e)' },
        { label: '🇲🇾 Malaysia', value: 18, color: 'linear-gradient(180deg, #38a169, #68d391)' },
        { label: '🇦🇺 Australia', value: 15, color: 'linear-gradient(180deg, #805ad5, #b794f4)' },
        { label: '🇺🇸 AS', value: 12, color: 'linear-gradient(180deg, #3182ce, #63b3ed)' },
        { label: '🇪🇺 Eropa', value: 12, color: 'linear-gradient(180deg, #d69e2e, #f6e05e)' }
    ],
    laporan: [
        { label: 'Jan', value: 45, color: 'linear-gradient(180deg, #3182ce, #63b3ed)' },
        { label: 'Feb', value: 52, color: 'linear-gradient(180deg, #3182ce, #63b3ed)' },
        { label: 'Mar', value: 68, color: 'linear-gradient(180deg, #38a169, #68d391)' },
        { label: 'Apr', value: 55, color: 'linear-gradient(180deg, #38a169, #68d391)' },
        { label: 'Mei', value: 72, color: 'linear-gradient(180deg, #d69e2e, #f6e05e)' },
        { label: 'Jun', value: 60, color: 'linear-gradient(180deg, #d69e2e, #f6e05e)' },
        { label: 'Jul', value: 48, color: 'linear-gradient(180deg, #3182ce, #63b3ed)' },
        { label: 'Ags', value: 58, color: 'linear-gradient(180deg, #38a169, #68d391)' },
        { label: 'Sep', value: 75, color: 'linear-gradient(180deg, #e53e3e, #fc8181)' },
        { label: 'Okt', value: 82, color: 'linear-gradient(180deg, #e53e3e, #fc8181)' },
        { label: 'Nov', value: 65, color: 'linear-gradient(180deg, #3182ce, #63b3ed)' },
        { label: 'Des', value: 55, color: 'linear-gradient(180deg, #3182ce, #63b3ed)' }
    ]
};

// ========================================
// GLOBAL EXPOSURE
// ========================================
if (typeof window !== 'undefined') {
    window.createBarChart = createBarChart;
    window.CHART_DATA = CHART_DATA;
}