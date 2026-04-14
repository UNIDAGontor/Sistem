/**
 * ========================================
 * DASHBOARD.JS - Dashboard Module
 * ========================================
 * Final version - Real-time Activities + 4 Stats
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

// Global variable untuk menyimpan activities
let recentActivities = [];
let activitiesLoaded = false;

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

    if (result?.error) {
      console.error(`❌ Apps Script error: ${result.error}`);
      return [];
    }

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
 * Format timestamp menjadi "X waktu yang lalu"
 */
function timeAgo(timestamp) {
  if (!timestamp) return "Baru saja";

  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit yang lalu`;
  if (diffHour < 24) return `${diffHour} jam yang lalu`;
  if (diffDay < 7) return `${diffDay} hari yang lalu`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} minggu yang lalu`;

  return past.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Get icon class berdasarkan jenis aktivitas
 */
function getActivityIcon(type, jenis = "") {
  const typeLower = type?.toLowerCase() || "";
  const jenisLower = jenis?.toLowerCase() || "";

  if (jenisLower.includes("mou") || jenisLower.includes("memorandum")) {
    return { class: "green", icon: "fa-handshake" };
  }
  if (typeLower.includes("surat")) {
    return { class: "blue", icon: "fa-file" };
  }
  if (typeLower.includes("kerjasama") || typeLower.includes("mou")) {
    return { class: "blue", icon: "fa-link" };
  }
  if (typeLower.includes("mahasiswa")) {
    return { class: "yellow", icon: "fa-user-graduate" };
  }
  if (typeLower.includes("kunjungan")) {
    return { class: "red", icon: "fa-plane-arrival" };
  }
  if (typeLower.includes("rapat")) {
    return { class: "purple", icon: "fa-users" };
  }

  return { class: "blue", icon: "fa-circle" };
}
/**
 * Generate unique ID untuk activity
 */
function generateActivityId(type, item, index) {
  const timestamp = item.Timestamp || item.timestamp || item.tanggal || "";

  // ✅ Gunakan bracket notation untuk field dengan spasi
  const identifier =
    item["Nomor Surat"] ||
    item["Nama Mitra"] ||
    item.nama ||
    item["Full Name"] || // ✅ Bracket notation!
    item.full_name || // ✅ Fallback ke snake_case
    index;

  return `${type}_${identifier}_${timestamp}`.replace(/\s+/g, "_");
}
/**
 * Parse aktivitas dari sheet DataSurat
 */
function parseSuratActivities(data, limit = 10) {
  if (!Array.isArray(data) || data.length === 0) return [];

  console.log(`📧 Parsing ${data.length} surat activities...`);

  return data.slice(0, limit).map((item, index) => {
    const timestamp =
      item.Timestamp || item.timestamp || item.tanggal || new Date();
    const nomorSurat = item["Nomor Surat"] || item.nomor_surat || "";
    const perihal = item.Perihal || item.perihal || "Surat baru";
    const asal = item["Asal/Tujuan"] || item.asal || item.tujuan || "";

    return {
      id: generateActivityId("surat", item, index),
      type: "surat",
      title: `Surat: ${perihal}`,
      description: nomorSurat
        ? `${nomorSurat}`
        : asal
          ? `Dari: ${asal}`
          : "Surat masuk/keluar",
      timestamp: timestamp,
      timeAgo: timeAgo(timestamp),
      icon: getActivityIcon("surat"),
      rawDate: new Date(timestamp),
    };
  });
}

/**
 * Parse aktivitas dari sheet INPUT KERJASAMA
 */
function parseKerjasamaActivities(data, limit = 10) {
  if (!Array.isArray(data) || data.length === 0) return [];

  console.log(`🤝 Parsing ${data.length} kerjasama activities...`);

  return data.slice(0, limit).map((item, index) => {
    const timestamp =
      item.Timestamp || item.timestamp || item.tanggal || new Date();
    const mitra =
      item.Mitra || item.mitra || item["Nama Mitra"] || "Mitra baru";
    const jenis =
      item["Jenis Kerjasama"] ||
      item.jenis ||
      item.jenisDokumen ||
      item["Jenis Dokumen"] ||
      "";
    const status = item.Status || item.status || "";

    let title, description;

    if (
      jenis &&
      (jenis.toLowerCase().includes("mou") ||
        jenis.toLowerCase().includes("memorandum"))
    ) {
      title = `MoU dengan ${mitra}`;
      description = status ? `Status: ${status}` : "MoU ditandatangani";
    } else {
      title = `Kerjasama dengan ${mitra}`;
      description = jenis || "Dokumen kerjasama baru";
    }

    return {
      id: generateActivityId("kerjasama", item, index),
      type: "kerjasama",
      title: title,
      description: description,
      timestamp: timestamp,
      timeAgo: timeAgo(timestamp),
      icon: getActivityIcon("kerjasama", jenis),
      rawDate: new Date(timestamp),
    };
  });
}

/**
 * Parse aktivitas dari sheet DATA MAHASISWA
 */
function parseMahasiswaActivities(data, limit = 10) {
  if (!Array.isArray(data) || data.length === 0) return [];

  console.log(`👨‍ Parsing ${data.length} mahasiswa activities...`);

  return data.slice(0, limit).map((item, index) => {
    const timestamp =
      item.Timestamp || item.timestamp || item.tanggal || new Date();
    const nama =
      item.nama ||
      item.Nama ||
      item["Full Name"] ||
      item.full_name ||
      "Mahasiswa baru";
    const negara =
      item.negara || item.Negara || item.country || item.Nationality || "";

    return {
      id: generateActivityId("mahasiswa", item, index),
      type: "mahasiswa",
      title: `Mahasiswa baru: ${nama}`,
      description: negara ? `Dari: ${negara}` : "Pendaftaran mahasiswa",
      timestamp: timestamp,
      timeAgo: timeAgo(timestamp),
      icon: getActivityIcon("mahasiswa"),
      rawDate: new Date(timestamp),
    };
  });
}

/**
 * Gabungkan dan urutkan semua aktivitas berdasarkan timestamp (terbaru pertama)
 * Dengan deduplikasi untuk menghindari data ganda
 */
function mergeAndSortActivities(...activityArrays) {
  const all = activityArrays.flat().filter((a) => a && a.title && a.id);

  // Deduplikasi berdasarkan ID
  const uniqueMap = new Map();
  all.forEach((activity) => {
    if (!uniqueMap.has(activity.id)) {
      uniqueMap.set(activity.id, activity);
    }
  });

  const unique = Array.from(uniqueMap.values());

  // Sort by timestamp descending (newest first)
  // Jika timestamp sama, sort by ID untuk konsistensi
  unique.sort((a, b) => {
    const timeDiff = b.rawDate - a.rawDate;
    if (timeDiff !== 0) return timeDiff;
    return a.id.localeCompare(b.id);
  });

  console.log(
    `📊 Merged ${all.length} activities → ${unique.length} unique activities`,
  );
  return unique;
}

/**
 * Render satu item aktivitas ke HTML
 */
function renderActivityItem(activity) {
  return `
    <li class="activity-item" data-id="${activity.id}">
      <div class="activity-icon ${activity.icon.class}">
        <i class="fas ${activity.icon.icon}"></i>
      </div>
      <div class="activity-content">
        <h4 style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin: 0 0 4px 0; line-height: 1.4;">
          ${activity.title}
        </h4>
        <p style="font-size: 12px; color: var(--text-muted); margin: 0;">
          ${activity.description}
        </p>
        <span style="font-size: 11px; color: var(--text-secondary); margin-top: 4px; display: block;">
          ${activity.timeAgo}
        </span>
      </div>
    </li>
  `;
}

/**
 * Render daftar aktivitas ke UI
 */
function renderActivities(activities, containerId = "activityList") {
  const container = document.getElementById(containerId);
  const loading = document.getElementById("activityLoading");
  const empty = document.getElementById("activityEmpty");

  if (!container) {
    console.warn("⚠️ Activity container not found");
    return;
  }

  // Hide loading, show container
  if (loading) loading.style.display = "none";
  container.style.display = "block";

  if (!activities || activities.length === 0) {
    container.style.display = "none";
    if (empty) {
      empty.style.display = "block";
      empty.innerHTML =
        '<i class="fas fa-inbox" style="font-size: 32px; opacity: 0.3; margin-bottom: 8px;"></i><p style="font-size: 13px; margin: 0;">Belum ada aktivitas terbaru</p>';
    }
    return;
  }

  if (empty) empty.style.display = "none";

  // Render items (limit to 5 for display)
  const displayItems = activities.slice(0, 5);
  const items = displayItems.map(renderActivityItem).join("");
  container.innerHTML = items;

  console.log(
    `✅ Rendered ${displayItems.length} of ${activities.length} activities`,
  );
  activitiesLoaded = true;
}

/**
 * Load recent activities dari 3 sumber
 */
async function loadRecentActivities() {
  console.log("🔄 Loading recent activities...");

  const loading = document.getElementById("activityLoading");
  const list = document.getElementById("activityList");
  const empty = document.getElementById("activityEmpty");

  // Show loading state
  if (loading) {
    loading.style.display = "block";
    loading.innerHTML =
      '<i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 8px;"></i><p style="font-size: 13px; margin: 0;">Memuat aktivitas...</p>';
  }

  if (list) list.style.display = "none";
  if (empty) empty.style.display = "none";

  try {
    // Clear previous activities
    recentActivities = [];

    // Fetch dari 3 sources secara paralel
    const [suratData, kerjasamaData, mahasiswaData] = await Promise.all([
      fetchDashboardData("DataSurat", APPS_SCRIPT_URL_SURAT_TU),
      fetchDashboardData("INPUT KERJASAMA", APPS_SCRIPT_URL_MOU),
      fetchDashboardData("DATA MAHASISWA", APPS_SCRIPT_URL_MAHASISWA),
    ]);

    console.log(
      `📥 Data fetched: Surat=${suratData.length}, Kerjasama=${kerjasamaData.length}, Mahasiswa=${mahasiswaData.length}`,
    );

    // Parse activities dari masing-masing source
    const suratActivities = parseSuratActivities(suratData, 10);
    const kerjasamaActivities = parseKerjasamaActivities(kerjasamaData, 10);
    const mahasiswaActivities = parseMahasiswaActivities(mahasiswaData, 10);

    // Merge dan sort by timestamp (terbaru pertama)
    recentActivities = mergeAndSortActivities(
      suratActivities,
      kerjasamaActivities,
      mahasiswaActivities,
    );

    console.log(`📊 Total unique activities: ${recentActivities.length}`);

    // Render ke UI
    renderActivities(recentActivities);

    return recentActivities;
  } catch (error) {
    console.error("❌ Error loading activities:", error);

    // Show error state
    if (loading) loading.style.display = "none";
    if (empty) {
      empty.style.display = "block";
      empty.innerHTML = `
        <i class="fas fa-exclamation-circle" style="font-size: 32px; opacity: 0.3; margin-bottom: 8px;"></i>
        <p style="font-size: 13px; margin: 0;">Gagal memuat aktivitas</p>
        <button class="btn btn-outline btn-sm" onclick="loadRecentActivities()" style="margin-top: 12px;">
          <i class="fas fa-sync"></i> Coba Lagi
        </button>
      `;
    }

    return [];
  }
}
/**
 * Load more activities (untuk pagination)
 */
function loadMoreActivities() {
  // Render semua activities (tidak dibatasi 5)
  if (recentActivities.length > 0) {
    renderActivities(recentActivities);

    if (typeof window.showToast === "function") {
      window.showToast(
        "info",
        "Info",
        `Menampilkan ${recentActivities.length} aktivitas terbaru`,
      );
    }
  } else {
    loadRecentActivities();
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
 * Hitung TOTAL SURAT dari sheet DataSurat
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
  animateDashboardStat("dashboard-total-surat", stats.totalSurat || 0);
}

/**
 * Load dan render semua stats dashboard (4 stats)
 */
async function loadDashboardStats() {
  try {
    console.log("🔄 Loading dashboard stats...");

    const [dataKerjasama, dataMahasiswa, dataCalon, dataSurat] =
      await Promise.all([
        fetchDashboardData("INPUT KERJASAMA", APPS_SCRIPT_URL_MOU),
        fetchDashboardData("DATA MAHASISWA", APPS_SCRIPT_URL_MAHASISWA),
        fetchDashboardData(
          "DATA CALON MAHASISWA ASING",
          APPS_SCRIPT_URL_MAHASISWA,
        ),
        fetchDashboardData("DataSurat", APPS_SCRIPT_URL_SURAT_TU),
      ]);

    const mouCount = countMoUActive(dataKerjasama);
    const degreeCount = countMahasiswaDegree(dataMahasiswa);
    const penerimaanCount = countPenerimaanAsing(dataCalon);
    const totalSuratCount = countTotalSurat(dataSurat);

    const stats = {
      mou: mouCount,
      mahasiswaDegree: degreeCount,
      penerimaanAsing: penerimaanCount,
      totalSurat: totalSuratCount,
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
      totalSurat: 0,
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

  // Load stats dan activities secara paralel
  Promise.all([loadDashboardStats(), loadRecentActivities()])
    .then(([stats, activities]) => {
      console.log("✅ Dashboard fully loaded");
      console.log("📊 Stats:", stats);
      console.log("📋 Activities:", activities);
    })
    .catch((error) => {
      console.error("❌ Dashboard init error:", error);
    });

  // Auto-refresh setiap 5 menit
  setInterval(
    () => {
      console.log("🔄 Auto-refreshing dashboard...");
      loadDashboardStats();
      loadRecentActivities();
    },
    5 * 60 * 1000,
  );

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
      console.log("🔄 Manual refresh triggered");
      initDashboardChart();
      loadDashboardStats();
      loadRecentActivities();
    },
    updateStats: (newData) => renderDashboardStats(newData),
    getStats: async () => await loadDashboardStats(),
    getActivities: () => recentActivities,
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
  window.countTotalSurat = countTotalSurat;
  window.loadRecentActivities = loadRecentActivities;
  window.loadMoreActivities = loadMoreActivities;
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
