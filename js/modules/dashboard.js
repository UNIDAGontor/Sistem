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
  "https://script.google.com/macros/s/AKfycbzaeVukY02SSvA4MvbkiMlqLyi2bEYjynMVi3ilYK_ES9x00eKv_xAU-Ftzs0UI9KXc/exec";

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

  try {
    const now = new Date();
    const past = new Date(timestamp);

    // Check if date is valid
    if (isNaN(past.getTime())) {
      console.warn("⚠️ Invalid timestamp:", timestamp);
      return "Baru saja";
    }

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
  } catch (error) {
    console.error("❌ Error in timeAgo:", error, timestamp);
    return "Baru saja";
  }
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
 * ✅ Tanpa Timestamp: Ambil 3 records terbaru (baris terakhir) yang Tujuan-nya terisi
 */
function parseSuratActivities(data) {
  if (!Array.isArray(data) || data.length === 0) {
    console.log("⚠️ parseSuratActivities: No data");
    return [];
  }

  console.log(`📧 Filtering surat activities... Total data: ${data.length}`);

  // 🔍 DEBUG: Cek struktur data pertama
  if (data.length > 0) {
    const first = data[0];
    console.log("📋 Sample DataSurat item:", first);
    console.log("🔑 All keys:", Object.keys(first));

    // Cek semua kemungkinan field "Tujuan"
    const possibleTujuan = {
      Tujuan: first.Tujuan,
      tujuan: first.tujuan,
      "Tujuan Surat": first["Tujuan Surat"],
      tujuan_surat: first["tujuan_surat"],
      recipient: first.recipient,
      Recipient: first.Recipient,
    };
    console.log("🎯 Possible 'Tujuan' fields:", possibleTujuan);
  }

  // ✅ FILTER: Hanya yang kolom "Tujuan" terisi (dengan semua kemungkinan field name)
  const withTujuan = data.filter((item) => {
    const tujuan =
      item.Tujuan ||
      item.tujuan ||
      item["Tujuan Surat"] ||
      item["tujuan_surat"] ||
      item.recipient ||
      item.Recipient ||
      "";

    const isFilled = tujuan && String(tujuan).trim() !== "";

    // Debug: log item yang lolos/tidak lolos filter
    if (!isFilled && Math.random() < 0.01) {
      // Log 1% yang tidak lolos untuk sampling
      console.log("  ❌ Filtered out - Tujuan empty:", {
        Tujuan: item.Tujuan,
        tujuan: item.tujuan,
      });
    }

    return isFilled;
  });

  console.log(
    `  - Records with Tujuan filled: ${withTujuan.length} of ${data.length}`,
  );

  if (withTujuan.length === 0) {
    console.warn(
      "⚠️ No surat records with Tujuan filled! Check column name in Google Sheets.",
    );
    return [];
  }

  // ✅ Ambil 3 TERBARU (asumsi: data terbaru ada di baris terakhir)
  const latest = withTujuan.slice(-3).reverse();

  console.log(`✅ Surat: Showing ${latest.length} latest records`);

  // 🔍 DEBUG: Log detail dari 3 terbaru
  latest.forEach((item, i) => {
    const tujuan = item.Tujuan || item.tujuan || item["Tujuan Surat"] || "";
    const nomor = item["Nomor Surat"] || item.nomor_surat || "";
    console.log(`  📄 #${i + 1}: "${tujuan}" - ${nomor}`);
  });

  return latest.map((item, index) => {
    // ✅ Fallback timestamp dari field yang ada
    let timestampValue =
      item.Timestamp ||
      item.timestamp ||
      item.Tanggal ||
      item.tanggal ||
      item["Date Created"] ||
      item.date_created ||
      item.created_at ||
      new Date();

    const rawDate = new Date(timestampValue);
    if (isNaN(rawDate.getTime())) {
      console.warn("⚠️ Invalid date, using now:", timestampValue);
      rawDate = new Date();
    }

    const nomorSurat =
      item["Nomor Surat"] || item.nomor_surat || item.nomorSurat || "";
    const perihal =
      item.Perihal ||
      item.perihal ||
      item.Subject ||
      item.Judul ||
      "Surat baru";
    const tujuan =
      item.Tujuan ||
      item.tujuan ||
      item["Tujuan Surat"] ||
      item["tujuan_surat"] ||
      "";

    return {
      id: `surat_${nomorSurat || perihal}_${rawDate.getTime()}_${index}`,
      type: "surat",
      title: `Surat: ${perihal}`,
      description: nomorSurat ? `${nomorSurat}` : `Tujuan: ${tujuan}`,
      timestamp: rawDate.toISOString(),
      timeAgo: timeAgo(rawDate),
      icon: getActivityIcon("surat"),
      rawDate: rawDate,
    };
  });
}
/**
 * Parse aktivitas dari sheet INPUT KERJASAMA
 * ✅ Tanpa Timestamp: Ambil 10 records terbaru (baris terakhir) yang mitra-nya terisi
 */
function parseKerjasamaActivities(data) {
  if (!Array.isArray(data) || data.length === 0) return [];

  console.log(
    `🤝 Filtering kerjasama activities... Total data: ${data.length}`,
  );

  // ✅ FILTER: Hanya yang kolom "mitra" terisi
  const withMitra = data.filter((item) => {
    const mitra = item.mitra || item.Mitra || item["Nama Mitra"] || "";
    return mitra && String(mitra).trim() !== "";
  });

  console.log(`  - Records with mitra filled: ${withMitra.length}`);

  // ✅ Ambil 10 TERBARU (asumsi: data terbaru ada di baris terakhir)
  const latest = withMitra.slice(-3).reverse();

  console.log(`✅ Kerjasama: Showing ${latest.length} latest records`);

  return latest.map((item, index) => {
    // ✅ Fallback timestamp dari field yang ada
    let timestampValue =
      item.tglMulai || item["tglMulai"] || item.tahunMulai
        ? `${item.tahunMulai}-01-01`
        : new Date();

    const rawDate = new Date(timestampValue);
    if (isNaN(rawDate.getTime())) rawDate = new Date();

    const mitra =
      item.mitra || item.Mitra || item["Nama Mitra"] || "Mitra baru";
    const jenis =
      item.jenisDokumen ||
      item["Jenis Dokumen"] ||
      item.jenis ||
      item["Jenis Kerjasama"] ||
      item.tipe ||
      "";
    const status = item.status || item.Status || item.Keterangan || "";

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
      id: `kerjasama_${mitra}_${rawDate.getTime()}_${index}`,
      type: "kerjasama",
      title: title,
      description: description,
      timestamp: rawDate.toISOString(),
      timeAgo: timeAgo(rawDate),
      icon: getActivityIcon("kerjasama", jenis),
      rawDate: rawDate,
    };
  });
}

/**
 * Parse aktivitas dari sheet DATA MAHASISWA
 * ✅ Tanpa Timestamp: Ambil 10 records terbaru (baris terakhir) yang nama-nya terisi
 */
function parseMahasiswaActivities(data) {
  if (!Array.isArray(data) || data.length === 0) return [];

  console.log(`👨‍ Filtering mahasiswa activities... Total  ${data.length}`);

  // ✅ FILTER: Hanya yang kolom "nama" terisi
  const withNama = data.filter((item) => {
    const nama = item.nama || item.Nama || item.name || item["Full Name"] || "";
    return nama && String(nama).trim() !== "";
  });

  console.log(`  - Records with nama filled: ${withNama.length}`);

  // ✅ Ambil 10 TERBARU (asumsi: data terbaru ada di baris terakhir)
  const latest = withNama.slice(-3).reverse();

  console.log(`✅ Mahasiswa: Showing ${latest.length} latest records`);

  return latest.map((item, index) => {
    // ✅ Fallback timestamp dari tahun_masuk
    let timestampValue = item.tahun_masuk
      ? `${item.tahun_masuk}-01-01`
      : new Date();

    const rawDate = new Date(timestampValue);
    if (isNaN(rawDate.getTime())) rawDate = new Date();

    const nama =
      item.nama || item.Nama || item["Full Name"] || "Mahasiswa baru";
    const negara =
      item.negara || item.Negara || item.country || item.Nationality || "";

    return {
      id: `mahasiswa_${nama}_${rawDate.getTime()}_${index}`,
      type: "mahasiswa",
      title: `Mahasiswa baru: ${nama}`,
      description: negara ? `Dari: ${negara}` : "Pendaftaran mahasiswa",
      timestamp: rawDate.toISOString(),
      timeAgo: timeAgo(rawDate),
      icon: getActivityIcon("mahasiswa"),
      rawDate: rawDate,
    };
  });
}

/**
 * Gabungkan dan urutkan aktivitas
 */
function mergeAndSortActivities(...activityArrays) {
  // Flatten semua arrays
  const all = activityArrays.flat().filter((a) => {
    if (!a || !a.title || !a.id) {
      console.warn("⚠️ Filtered out - missing title/id:", a);
      return false;
    }
    if (!a.rawDate || isNaN(a.rawDate.getTime())) {
      console.warn("⚠️ Filtered out - invalid date:", a);
      return false;
    }
    return true;
  });

  console.log(`📊 Total valid activities: ${all.length}`);

  // Log breakdown by type
  const byType = all.reduce((acc, act) => {
    acc[act.type] = (acc[act.type] || 0) + 1;
    return acc;
  }, {});
  console.log("📊 Activities by type:", byType);

  // 🔍 DEBUG: Log per-type jika ada yang 0
  const types = ["surat", "kerjasama", "mahasiswa"];
  types.forEach((type) => {
    if (!byType[type]) {
      console.warn(
        `⚠️ No '${type}' activities in final list! Check parse${type.charAt(0).toUpperCase() + type.slice(1)}Activities()`,
      );
    }
  });

  // Sort by timestamp descending (newest first)
  all.sort((a, b) => b.rawDate - a.rawDate);

  // Log untuk debugging
  console.log("📋 Top activities (sorted by newest):");
  all.slice(0, 10).forEach((act, i) => {
    console.log(
      `  ${i + 1}. [${act.type}] ${act.title} - ${act.timeAgo} (${act.rawDate.toISOString()})`,
    );
  });

  // Return max 20 items untuk tampilan
  return all.slice(0, 20);
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

  if (loading) loading.style.display = "none";
  container.style.display = "block";

  if (!activities || activities.length === 0) {
    container.style.display = "none";
    if (empty) {
      empty.style.display = "block";
      empty.innerHTML =
        '<i class="fas fa-inbox"></i><p>Belum ada aktivitas terbaru</p>';
    }
    return;
  }

  if (empty) empty.style.display = "none";

  // ✅ Activities sudah di-limit di mergeAndSortActivities, render semua yang diterima
  const items = activities.map(renderActivityItem).join("");
  container.innerHTML = items;

  console.log(`✅ Rendered ${activities.length} most recent activities`);
  activitiesLoaded = true;
}

/**
 * Load recent activities dari 3 sumber
 */
async function loadRecentActivities() {
  console.log("🔄 Loading recent activities (today only)...");

  const loading = document.getElementById("activityLoading");
  const list = document.getElementById("activityList");
  const empty = document.getElementById("activityEmpty");

  if (loading) {
    loading.style.display = "block";
    loading.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i><p>Memuat aktivitas hari ini...</p>';
  }
  if (list) list.style.display = "none";
  if (empty) empty.style.display = "none";

  try {
    // Fetch dari 3 sources
    const [suratData, kerjasamaData, mahasiswaData] = await Promise.all([
      fetchDashboardData("DataSurat", APPS_SCRIPT_URL_SURAT_TU),
      fetchDashboardData("INPUT KERJASAMA", APPS_SCRIPT_URL_MOU),
      fetchDashboardData("DATA MAHASISWA", APPS_SCRIPT_URL_MAHASISWA),
    ]);

    console.log(
      `📥 Data fetched: Surat=${suratData.length}, Kerjasama=${kerjasamaData.length}, Mahasiswa=${mahasiswaData.length}`,
    );

    // ✅ Parse dengan filter "hari ini" - NO limit parameter
    const suratActivities = parseSuratActivities(suratData);
    const kerjasamaActivities = parseKerjasamaActivities(kerjasamaData);
    const mahasiswaActivities = parseMahasiswaActivities(mahasiswaData);

    console.log(
      `📦 Filtered today: Surat=${suratActivities.length}, Kerjasama=${kerjasamaActivities.length}, Mahasiswa=${mahasiswaActivities.length}`,
    );

    // Merge dan sort by timestamp (terbaru pertama)
    recentActivities = mergeAndSortActivities(
      suratActivities,
      kerjasamaActivities,
      mahasiswaActivities,
    );

    console.log(`📊 Total activities today: ${recentActivities.length}`);

    // Render ke UI
    renderActivities(recentActivities);

    return recentActivities;
  } catch (error) {
    console.error("❌ Error loading activities:", error);

    if (loading) loading.style.display = "none";
    if (empty) {
      empty.style.display = "block";
      empty.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <p>Gagal memuat aktivitas</p>
        <button class="btn btn-outline btn-sm" onclick="loadRecentActivities()">
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
