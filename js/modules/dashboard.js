/**
 * ========================================
 * DASHBOARD.JS - Dashboard Module
 * ========================================
 * Final version - 4 Stats + Dual URL Support
 */

// ✅ URL untuk INPUT KERJASAMA (MoU counting)
const APPS_SCRIPT_URL_MOU =
  "https://script.google.com/macros/s/AKfycbzHzKcm-fPEVOfKeU9iWoC3OcaDiR-G2hoMEh868zO1d0KpGeTUXI8sA1ljP658gjSWxQ/exec";

// ✅ URL untuk DATA MAHASISWA & DATA CALON MAHASISWA ASING
const APPS_SCRIPT_URL_MAHASISWA =
  "https://script.google.com/macros/s/AKfycby6eEFKYKlCH8lu1AEwXHoViRUNtxw0hf69BFG-MYx7IembhZTSOhzI2zQIHXxnF3pL/exec";

// ✅ URL untuk DataSurat (Total Surat counting)
const APPS_SCRIPT_URL_SURAT_TU =
  "https://script.google.com/macros/s/AKfycbxI9Ew-lICjHRbwWrj7ZFir6AqFsg3M-aWz0VmfziwY_c4gez1yTgVw6-GF0SATWx3_/exec";

/**
 * Fetch data dari Google Apps Script dengan parameter sheet
 */
async function fetchDashboardData(sheetName, baseUrl) {
  try {
    const url = `${baseUrl}?sheet=${encodeURIComponent(sheetName)}&t=${Date.now()}`;
    console.log(`📡 Fetching ${sheetName} from ${baseUrl.substring(0, 50)}...`);

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`❌ HTTP ${response.status} for ${sheetName}`);
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    // Handle error dari Apps Script
    if (result?.error) {
      console.error(`❌ Apps Script error: ${result.error}`);
      return [];
    }

    // Handle response {success, total, data}
    if (result?.data && Array.isArray(result.data)) {
      console.log(`✅ ${sheetName}: ${result.data.length} records`);
      return result.data;
    }
    if (Array.isArray(result)) {
      console.log(`✅ ${sheetName}: ${result.length} records (direct array)`);
      return result;
    }

    console.warn(`⚠️ Unexpected format for ${sheetName}:`, result);
    return [];
  } catch (error) {
    console.error(`❌ Fetch failed ${sheetName}:`, error);
    return [];
  }
}

/**
 * Hitung jumlah MoU (Memorandum of Understanding) dari sheet INPUT KERJASAMA
 */
function countMoUActive(data) {
  if (!Array.isArray(data)) return 0;
  if (data.length === 0) return 0;

  console.log(`🔍 Processing ${data.length} records for MoU...`);

  const targetValue = "mou (memorandum of understanding)";
  let count = 0;

  data.forEach((item, index) => {
    if (!item) return;

    const jenisDokumen = String(
      item.jenisDokumen ||
        item["jenisDokumen"] ||
        item.JenisDokumen ||
        item["Jenis Dokumen"] ||
        item.jenis_dokumen ||
        "",
    )
      .trim()
      .toLowerCase();

    if (index < 3) {
      console.log(`  📋 Item ${index}: jenisDokumen = "${jenisDokumen}"`);
    }

    if (jenisDokumen.includes(targetValue)) {
      count++;
      console.log(`✅ MoU Match #${count}: "${jenisDokumen}"`);
    }
  });

  console.log(`📊 MoU Result: ${count} found`);
  return count;
}

/**
 * Hitung jumlah Mahasiswa Degree dari sheet DATA MAHASISWA
 */
function countMahasiswaDegree(data) {
  if (!Array.isArray(data)) return 0;
  if (data.length === 0) return 0;

  console.log(`🔍 Processing ${data.length} records for Mahasiswa Degree...`);

  const count = data.filter((item) => {
    const nama =
      item.nama || item.Nama || item.name || item["Full Name"] || null;
    return nama && String(nama).trim() !== "";
  }).length;

  console.log(`📊 Mahasiswa Degree Result: ${count} found`);
  return count;
}

/**
 * Hitung jumlah Penerimaan Mahasiswa Asing dari sheet DATA CALON MAHASISWA ASING
 */
function countPenerimaanAsing(data) {
  if (!Array.isArray(data)) return 0;
  if (data.length === 0) return 0;

  console.log(`🔍 Processing ${data.length} records for Penerimaan Asing...`);

  const count = data.filter((item) => {
    const fullName =
      item["Full Name"] ||
      item["full_name"] ||
      item.fullname ||
      item.fullName ||
      item.nama ||
      item.Nama ||
      null;
    return fullName && String(fullName).trim() !== "";
  }).length;

  console.log(`📊 Penerimaan Asing Result: ${count} found`);
  return count;
}

/**
 * ✅ Hitung TOTAL SURAT dari sheet DataSurat
 * Filter: hitung SEMUA records (array length)
 */
function countTotalSurat(data) {
  if (!Array.isArray(data)) {
    console.error("❌ countTotalSurat: data bukan array!", data);
    return 0;
  }

  console.log(`📊 Total Surat Result: ${data.length} records`);
  return data.length;
}

/**
 * Animasi counting angka untuk stat cards
 */
function animateDashboardStat(elementId, targetValue, duration = 1000) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`⚠️ Element ${elementId} not found`);
    return;
  }

  const startValue = parseInt(element.textContent) || 0;
  const startTime = performance.now();

  function step(currentTime) {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.floor(
      easeOut * (targetValue - startValue) + startValue,
    );

    element.textContent = currentValue;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      element.textContent = targetValue;
    }
  }

  requestAnimationFrame(step);
}

/**
 * Render semua stats ke UI (4 stats)
 */
function renderDashboardStats(stats) {
  console.log("📊 Rendering dashboard stats:", stats);

  animateDashboardStat("dashboard-mou", stats.mou || 0);
  animateDashboardStat(
    "dashboard-mahasiswa-degree",
    stats.mahasiswaDegree || 0,
  );
  animateDashboardStat(
    "dashboard-penerimaan-asing",
    stats.penerimaanAsing || 0,
  );
  animateDashboardStat("dashboard-total-surat", stats.totalSurat || 0); // ✅ New
}

/**
 * Load dan render semua stats dashboard (4 stats)
 */
async function loadDashboardStats() {
  try {
    console.log("🔄 Loading dashboard stats...");

    // ✅ Fetch dari 3 URL berbeda (4 sheets total)
    const [dataKerjasama, dataMahasiswa, dataCalon, dataSurat] =
      await Promise.all([
        // MoU: URL khusus INPUT KERJASAMA
        fetchDashboardData("INPUT KERJASAMA", APPS_SCRIPT_URL_MOU),
        // Mahasiswa: URL khusus DATA MAHASISWA & DATA CALON
        fetchDashboardData("DATA MAHASISWA", APPS_SCRIPT_URL_MAHASISWA),
        fetchDashboardData(
          "DATA CALON MAHASISWA ASING",
          APPS_SCRIPT_URL_MAHASISWA,
        ),
        // ✅ Surat: URL khusus DataSurat
        fetchDashboardData("DataSurat", APPS_SCRIPT_URL_SURAT_TU),
      ]);

    // ✅ Process counting
    const mouCount = countMoUActive(dataKerjasama);
    const degreeCount = countMahasiswaDegree(dataMahasiswa);
    const penerimaanCount = countPenerimaanAsing(dataCalon);
    const totalSuratCount = countTotalSurat(dataSurat); // ✅ New

    const stats = {
      mou: mouCount,
      mahasiswaDegree: degreeCount,
      penerimaanAsing: penerimaanCount,
      totalSurat: totalSuratCount, // ✅ New
    };

    console.log("✅ Final stats:", stats);
    renderDashboardStats(stats);

    return stats;
  } catch (error) {
    console.error("❌ Error loading dashboard stats:", error);
    renderDashboardStats({
      mou: 0,
      mahasiswaDegree: 0,
      penerimaanAsing: 0,
      totalSurat: 0, // ✅ New fallback
    });
    return null;
  }
}

/**
 * Initialize dashboard chart
 */
function initDashboardChart() {
  if (typeof window.createBarChart === "function" && window.CHART_DATA) {
    window.createBarChart("dashboardChart", window.CHART_DATA.dashboard, {
      maxHeight: 180,
      showLabels: true,
    });
  }
}

/**
 * Quick action handlers
 */
const quickActions = {
  buatSurat: () => window.navigateTo?.("tata-usaha"),
  tambahKerjasama: () => window.navigateTo?.("kerjasama"),
  ajukanKunjungan: () => window.navigateTo?.("international"),
  buatAgenda: () => window.navigateTo?.("agenda"),
  cetakLaporan: () => window.navigateTo?.("laporan"),
  tambahPengguna: () => window.navigateTo?.("pengguna"),
};

/**
 * Initialize dashboard module
 */
function initDashboard() {
  initDashboardChart();
  loadDashboardStats();

  // Auto-refresh setiap 5 menit
  setInterval(loadDashboardStats, 5 * 60 * 1000);

  // Attach quick action handlers
  document.querySelectorAll(".quick-action-btn").forEach((btn, index) => {
    const actions = Object.values(quickActions);
    if (actions[index]) {
      btn.addEventListener("click", actions[index]);
    }
  });

  console.log("📊 Dashboard module initialized");

  return {
    refresh: () => {
      initDashboardChart();
      loadDashboardStats();
    },
    updateStats: (newData) => renderDashboardStats(newData),
    getStats: async () => await loadDashboardStats(),
  };
}

// ========================================
// GLOBAL EXPOSURE
// ========================================
if (typeof window !== "undefined") {
  window.initDashboardChart = initDashboardChart;
  window.initDashboard = initDashboard;
  window.loadDashboardStats = loadDashboardStats;
  window.renderDashboardStats = renderDashboardStats;
  window.animateDashboardStat = animateDashboardStat;
  window.countTotalSurat = countTotalSurat; // ✅ Expose new function
}

// Auto-init if on dashboard page
if (
  typeof document !== "undefined" &&
  document.getElementById("page-dashboard")
) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDashboard);
  } else {
    initDashboard();
  }
}
