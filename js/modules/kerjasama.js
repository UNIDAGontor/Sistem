/**
 * ========================================
 * KERJASAMA.JS - MoU & Partnership Module
 * ========================================
 * Traditional script version (Merged with Kegiatan Module)
 */

/**
 * ========================================
 * KONFIGURASI DATA SOURCE
 * ========================================
 */
// URL Apps Script (Shared untuk Kerjasama & Kegiatan)
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzHzKcm-fPEVOfKeU9iWoC3OcaDiR-G2hoMEh868zO1d0KpGeTUXI8sA1ljP658gjSWxQ/exec";

// Global variables untuk cache data
let globalKerjasamaData = [];
let globalKegiatanData = [];

/**
 * ========================================
 * FUNGSI FETCH DATA
 * ========================================
 */

/**
 * Fetch data kerjasama dari Google Apps Script (Sheet: INPUT KERJASAMA)
 */
async function fetchKerjasamaData() {
  try {
    const url = `${APPS_SCRIPT_URL}?t=${Date.now()}`;
    const response = await fetch(url, { method: "GET" });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Berhasil mengambil ${data.length} data kerjasama`);
    globalKerjasamaData = data;
    return data;
  } catch (error) {
    console.error("❌ Gagal fetch data kerjasama:", error);
    if (typeof window.showToast === "function") {
      window.showToast(
        "warning",
        "Peringatan",
        "Menggunakan data lokal (gagal sync dengan server)",
      );
    }
    // Fallback dummy data
    return [
      {
        tahunMulai: "2020",
        jenisDokumen: "MoU (Memorandum of Understanding)",
        jenisMitra: "Universitas",
      },
      {
        tahunMulai: "2020",
        jenisDokumen: "MoA (Memorandum of Agreement)",
        jenisMitra: "Perusahaan",
      },
      {
        tahunMulai: "2021",
        jenisDokumen: "MoU (Memorandum of Understanding)",
        jenisMitra: "Universitas",
      },
      {
        tahunMulai: "2021",
        jenisDokumen: "MoU (Memorandum of Understanding)",
        jenisMitra: "Pemerintah",
      },
      {
        tahunMulai: "2021",
        jenisDokumen: "IA (Implementation Arrangement)",
        jenisMitra: "Universitas",
      },
      {
        tahunMulai: "2022",
        jenisDokumen: "MoU (Memorandum of Understanding)",
        jenisMitra: "LSM",
      },
      {
        tahunMulai: "2022",
        jenisDokumen: "MoA (Memorandum of Agreement)",
        jenisMitra: "Perusahaan",
      },
      {
        tahunMulai: "2022",
        jenisDokumen: "MoU (Memorandum of Understanding)",
        jenisMitra: "Universitas",
      },
      {
        tahunMulai: "2023",
        jenisDokumen: "MoU (Memorandum of Understanding)",
        jenisMitra: "Universitas",
      },
      {
        tahunMulai: "2023",
        jenisDokumen: "MoA (Memorandum of Agreement)",
        jenisMitra: "Perusahaan",
      },
      {
        tahunMulai: "2023",
        jenisDokumen: "IA (Implementation Arrangement)",
        jenisMitra: "Pemerintah",
      },
      {
        tahunMulai: "2023",
        jenisDokumen: "MoU (Memorandum of Understanding)",
        jenisMitra: "Universitas",
      },
      {
        tahunMulai: "2024",
        jenisDokumen: "MoU (Memorandum of Understanding)",
        jenisMitra: "Universitas",
      },
      {
        tahunMulai: "2024",
        jenisDokumen: "MoA (Memorandum of Agreement)",
        jenisMitra: "Perusahaan",
      },
      {
        tahunMulai: "2024",
        jenisDokumen: "MoU (Memorandum of Understanding)",
        jenisMitra: "Universitas",
      },
      {
        tahunMulai: "2024",
        jenisDokumen: "IA (Implementation Arrangement)",
        jenisMitra: "LSM",
      },
      {
        tahunMulai: "2024",
        jenisDokumen: "MoU (Memorandum of Understanding)",
        jenisMitra: "Pemerintah",
      },
      {
        tahunMulai: "2025",
        jenisDokumen: "MoU (Memorandum of Understanding)",
        jenisMitra: "Universitas",
      },
      {
        tahunMulai: "2025",
        jenisDokumen: "MoA (Memorandum of Agreement)",
        jenisMitra: "Perusahaan",
      },
    ];
  }
}

/**
 * Fetch data kegiatan dari Google Apps Script (Sheet: INPUT KEGIATAN)
 */
async function fetchKegiatanData() {
  try {
    // Tambahkan parameter sheet=INPUT KEGIATAN
    const url = `${APPS_SCRIPT_URL}?sheet=INPUT%20KEGIATAN&t=${Date.now()}`;

    const response = await fetch(url, { method: "GET" });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();

    // Handle jika response berupa error dari Apps Script
    if (data.error) {
      throw new Error(data.error);
    }

    console.log(`✅ Berhasil mengambil ${data.length} data kegiatan`);

    // Debug: Log sample data dan headers
    if (data.length > 0) {
      console.log("📋 Sample data kegiatan:", data[0]);
      console.log("📑 Headers tersedia:", Object.keys(data[0]));
    }

    globalKegiatanData = data;
    return data;
  } catch (error) {
    console.error("❌ Gagal fetch data kegiatan:", error);
    if (typeof window.showToast === "function") {
      window.showToast("warning", "Peringatan", "Menggunakan data lokal");
    }
    // Dummy data fallback - SESUAI DENGAN HEADER INPUT KEGIATAN
    return [
      {
        no: 1,
        mitra: "Universitas Tokyo",
        deskripsi: "Kuliah tamu tentang AI",
        tanggal: "2024-01-15",
        tingkat: "Internasional",
        jenisMitra: "Perguruan Tinggi",
        jenisDokumen: "MoU",
        bentuk: "Kuliah Tamu", // ✅ Field ini yang dicari!
        bidang: "Teknologi",
        pendanaan: "Mandiri",
        fakultas: "Fasilkom",
        pj: "Dr. Budi",
        tahun: "2024",
      },
      {
        no: 2,
        mitra: "NUS Singapore",
        deskripsi: "Penelitian bersama",
        tanggal: "2024-02-20",
        tingkat: "Internasional",
        jenisMitra: "Perguruan Tinggi QS200 by Subject", // ✅ Untuk filter QS200
        jenisDokumen: "MoA",
        bentuk: "Penelitian Bersama",
        bidang: "Riset",
        pendanaan: "Hibah",
        fakultas: "Teknik",
        pj: "Prof. Siti",
        tahun: "2024",
      },
      {
        no: 3,
        mitra: "Google Indonesia",
        deskripsi: "Workshop cloud",
        tanggal: "2024-03-10",
        tingkat: "Nasional",
        jenisMitra: "Perusahaan",
        jenisDokumen: "IA",
        bentuk: "Workshop",
        bidang: "Teknologi",
        pendanaan: "Sponsor",
        fakultas: "Fasilkom",
        pj: "Dr. Andi",
        tahun: "2024",
      },
      {
        no: 4,
        mitra: "KAIST Korea",
        deskripsi: "Student exchange",
        tanggal: "2024-04-05",
        tingkat: "Internasional",
        jenisMitra: "Perguruan Tinggi QS200 by Subject",
        jenisDokumen: "MoU",
        bentuk: "Student Exchange",
        bidang: "Pendidikan",
        pendanaan: "Beasiswa",
        fakultas: "Internasional",
        pj: "Dr. Lia",
        tahun: "2024",
      },
      {
        no: 5,
        mitra: "Kemdikbud",
        deskripsi: "Seminar kebijakan",
        tanggal: "2024-05-12",
        tingkat: "Nasional",
        jenisMitra: "Pemerintah",
        jenisDokumen: "MoU",
        bentuk: "Seminar",
        bidang: "Kebijakan",
        pendanaan: "APBN",
        fakultas: "FIP",
        pj: "Dr. Rina",
        tahun: "2024",
      },
    ];
  }
}

/**
 * ========================================
 * FUNGSI PROCESSING DATA - KERJASAMA
 * ========================================
 */

/**
 * Proses data untuk chart jenis mitra (Pie Chart)
 */
function processMitraData(data) {
  const mitraCount = {};
  data.forEach((item) => {
    const jenisMitra = item.jenisMitra || "Lainnya";
    mitraCount[jenisMitra] = (mitraCount[jenisMitra] || 0) + 1;
  });

  const labels = Object.keys(mitraCount);
  const values = Object.values(mitraCount);

  const truncateLabel = (label, maxLength = 40) => {
    if (label.length <= maxLength) return label;
    return label.substring(0, maxLength) + "...";
  };

  const truncatedLabels = labels.map((label) => truncateLabel(label, 40));
  const colors = [
    "#4169E1",
    "#28A745",
    "#FFA500",
    "#DC3545",
    "#6F42C1",
    "#20C997",
    "#FD7E14",
    "#E83E8C",
    "#17A2B8",
    "#6C757D",
  ];
  const backgroundColors = truncatedLabels.map(
    (_, index) => colors[index % colors.length],
  );

  return {
    labels: truncatedLabels,
    datasets: [
      {
        data: values,
        backgroundColor: backgroundColors,
        borderColor: "#fff",
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  };
}

/**
 * Proses data untuk chart pertumbuhan per tahun (NON-KUMULATIF)
 */
function processGrowthData(data) {
  const yearlyData = {};
  const years = new Set();

  data.forEach((item) => {
    const tahun =
      item.tahunMulai || item.tahunMulai === 0 ? String(item.tahunMulai) : null;
    if (!tahun) return;
    years.add(parseInt(tahun));
    const jenis = (item.jenisDokumen || "").toLowerCase();
    if (!yearlyData[tahun]) yearlyData[tahun] = { mou: 0, moa: 0, ia: 0 };

    if (jenis.includes("mou") && jenis.includes("memorandum of understanding"))
      yearlyData[tahun].mou++;
    else if (jenis.includes("moa") && jenis.includes("memorandum of agreement"))
      yearlyData[tahun].moa++;
    else if (
      jenis.includes("ia") &&
      jenis.includes("implementation arrangement")
    )
      yearlyData[tahun].ia++;
  });

  const sortedYears = Array.from(years).sort((a, b) => a - b);
  const mouData = [],
    moaData = [],
    iaData = [];

  sortedYears.forEach((year) => {
    const yearStr = String(year);
    if (yearlyData[yearStr]) {
      mouData.push(yearlyData[yearStr].mou);
      moaData.push(yearlyData[yearStr].moa);
      iaData.push(yearlyData[yearStr].ia);
    } else {
      mouData.push(0);
      moaData.push(0);
      iaData.push(0);
    }
  });

  return {
    labels: sortedYears,
    datasets: [
      {
        label: "MoU",
        data: mouData,
        borderColor: "#4169E1",
        backgroundColor: "rgba(65, 105, 225, 0.1)",
        tension: 0.4,
        fill: false,
      },
      {
        label: "MoA",
        data: moaData,
        borderColor: "#FFA500",
        backgroundColor: "rgba(255, 165, 0, 0.1)",
        tension: 0.4,
        fill: false,
      },
      {
        label: "IA",
        data: iaData,
        borderColor: "#28A745",
        backgroundColor: "rgba(40, 167, 69, 0.1)",
        tension: 0.4,
        fill: false,
      },
    ],
  };
}

/**
 * ========================================
 * FUNGSI PROCESSING DATA - KEGIATAN (TOP 5)
 * ========================================
 */

function processBentukKegiatanData(data) {
  const count = {};
  let emptyCount = 0;

  console.log("🔍 Processing Bentuk Kegiatan dari", data.length, "data");

  data.forEach((item, index) => {
    // Coba berbagai kemungkinan nama field
    let bentuk =
      item.bentuk ||
      item.bentukKegiatan ||
      item.jenisKegiatan ||
      item.aktivitas ||
      item["Bentuk"] ||
      item["Bentuk Kegiatan"] ||
      null;

    // Debug untuk 5 data pertama
    if (index < 5) {
      console.log(`Item ${index}:`, {
        bentuk: bentuk,
        allKeys: Object.keys(item),
      });
    }

    if (bentuk) {
      const bentukClean = String(bentuk).trim();
      if (bentukClean) {
        count[bentukClean] = (count[bentukClean] || 0) + 1;
      } else {
        emptyCount++;
      }
    } else {
      emptyCount++;
    }
  });

  console.log("📊 Counting result:", count);
  console.log("⚠️ Data kosong/null:", emptyCount);

  const sorted = Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  console.log("✅ Top 5 Bentuk:", sorted);

  return {
    labels: sorted.map((i) => i[0]),
    values: sorted.map((i) => i[1]),
  };
}

/**
 * Proses data untuk Top 5 Jenis Mitra Kegiatan
 */
function processJenisMitraKegiatanData(data) {
  const count = {};

  data.forEach((item) => {
    let jenisMitra =
      item.jenisMitra ||
      item.jenis_mitra ||
      item.tipeMitra ||
      item["Jenis Mitra"] ||
      "Lainnya";

    const clean = String(jenisMitra).trim();
    count[clean] = (count[clean] || 0) + 1;
  });

  const sorted = Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return {
    labels: sorted.map((i) => i[0]),
    values: sorted.map((i) => i[1]),
  };
}

/**
 * Proses data untuk Top 5 Mitra Kegiatan
 */
function processMitraKegiatanData(data) {
  const count = {};

  data.forEach((item) => {
    let no =
      item.no ||
      item.namaMitra ||
      item.institusi ||
      item.universitas ||
      item["No"] ||
      item["Nama Mitra"] ||
      "Lainnya";

    const clean = String(no).trim();
    count[clean] = (count[clean] || 0) + 1;
  });

  const sorted = Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return {
    labels: sorted.map((i) => i[0]),
    values: sorted.map((i) => i[1]),
  };
}

/**
 * Proses data untuk Top 5 Mitra QS200 by Subject
 */
function processMitraQS200Data(data) {
  const count = {};

  data.forEach((item) => {
    let jenisMitra =
      item.jenisMitra || item.jenis_mitra || item["Jenis Mitra"] || "";

    const jenisLower = String(jenisMitra).toLowerCase();

    // Filter yang mengandung QS200 atau QS 200
    if (jenisLower.includes("qs200") || jenisLower.includes("qs 200")) {
      let no = item.no || item.namaMitra || item["no"] || "Lainnya";

      const clean = String(no).trim();
      count[clean] = (count[clean] || 0) + 1;
    }
  });

  const sorted = Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return {
    labels: sorted.map((i) => i[0]),
    values: sorted.map((i) => i[1]),
  };
}

/**
 * ========================================
 * FUNGSI RENDER CHART
 * ========================================
 */

/**
 * Render chart lingkaran jenis mitra
 */
function renderMitraChart(chartData) {
  const canvas = document.getElementById("mitraChartCanvas");
  if (!canvas) return;
  if (window.mitraChartInstance) {
    try {
      window.mitraChartInstance.destroy();
    } catch (e) {}
  }
  if (typeof Chart === "undefined") return;
  if (!chartData || !chartData.labels || chartData.labels.length === 0) return;

  canvas.width = 300;
  canvas.height = 300;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  try {
    window.mitraChartInstance = new Chart(ctx, {
      type: "doughnut",
      data: chartData,
      options: {
        responsive: false,
        maintainAspectRatio: false,
        layout: { padding: 10 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const value = context.parsed;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
        animation: { animateScale: true, animateRotate: true, duration: 1000 },
        cutout: "60%",
      },
    });
  } catch (error) {
    console.error("❌ Error creating chart:", error);
  }
}

/**
 * Render chart pertumbuhan kerjasama (Line Chart)
 */
function renderGrowthChart(chartData) {
  const ctx = document.getElementById("growthChartCanvas");
  if (!ctx) return;
  if (window.growthChartInstance) window.growthChartInstance.destroy();
  if (typeof Chart === "undefined") return;

  window.growthChartInstance = new Chart(ctx, {
    type: "line",
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          position: "bottom",
          labels: { usePointStyle: true, padding: 15, font: { size: 12 } },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: 12,
          titleFont: { size: 14 },
          bodyFont: { size: 13 },
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${context.parsed.y} kerjasama`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: true, color: "rgba(0, 0, 0, 0.05)" },
          ticks: {
            maxRotation: 0,
            minRotation: 0,
            autoSkip: true,
            maxTicksLimit: 10,
            font: { size: 10 },
          },
          title: {
            display: true,
            text: "Tahun",
            font: { size: 12, weight: "bold" },
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(0, 0, 0, 0.05)" },
          ticks: {
            stepSize: 100,
            font: { size: 10 },
            callback: function (value) {
              return value % 100 === 0 ? value : "";
            },
          },
          title: {
            display: true,
            text: "Jumlah Kerjasama per Tahun",
            font: { size: 12, weight: "bold" },
          },
        },
      },
    },
  });
}

/**
 * Render Horizontal Bar Chart (Generic untuk Chart Kegiatan)
 */
function renderHorizontalBarChart(canvasId, chartData, color, label) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  if (window[canvasId + "Instance"]) window[canvasId + "Instance"].destroy();
  if (typeof Chart === "undefined") return;

  window[canvasId + "Instance"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: chartData.labels,
      datasets: [
        {
          label: label,
          data: chartData.values,
          backgroundColor: color,
          borderRadius: 4,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: 12,
          callbacks: {
            label: function (context) {
              return `${context.parsed.x} kegiatan`;
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: "rgba(0, 0, 0, 0.05)" },
          ticks: { stepSize: 1, font: { size: 10 } },
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 10 }, maxTicksLimit: 5 },
        },
      },
    },
  });
}

/**
 * ========================================
 * FUNGSI LOAD & REFRESH
 * ========================================
 */

async function loadMitraChart() {
  try {
    const data = await fetchKerjasamaData();
    if (data.length > 0) {
      const chartData = processMitraData(data);
      renderMitraChart(chartData);
      return chartData;
    }
  } catch (error) {
    console.error("❌ Error loading mitra chart:", error);
  }
  return null;
}

function refreshMitraChart() {
  if (typeof window.showToast === "function")
    window.showToast("info", "Refreshing", "Memuat data terbaru...");
  loadMitraChart();
}

async function loadGrowthChart() {
  const data = await fetchKerjasamaData();
  if (data.length > 0) {
    const chartData = processGrowthData(data);
    renderGrowthChart(chartData);
    const counts = countByJenisDokumen(data);
    renderStats(counts);
    return chartData;
  }
  return null;
}

function refreshGrowthChart() {
  if (typeof window.showToast === "function")
    window.showToast("info", "Refreshing", "Memuat data terbaru...");
  loadGrowthChart();
}

/**
 * Load dan render semua chart kegiatan
 */
async function loadKegiatanCharts() {
  try {
    console.log("🔄 Loading kegiatan charts...");

    // Fetch data kegiatan (bukan kerjasama!)
    const data = await fetchKegiatanData();

    console.log("📦 Data kegiatan loaded:", data.length, "items");
    console.log("📋 Sample data kegiatan:", data.slice(0, 2));

    if (data.length > 0) {
      // Debug: Cek kolom yang tersedia
      if (data[0]) {
        console.log(" Kolom yang tersedia:", Object.keys(data[0]));
      }

      // Top 5 Bentuk Kegiatan
      const bentukData = processBentukKegiatanData(data);
      console.log("📊 Bentuk Kegiatan Data:", bentukData);
      renderHorizontalBarChart(
        "bentukKegiatanChart",
        bentukData,
        "#4169E1",
        "Jumlah Kegiatan",
      );

      // Top 5 Jenis Mitra Kegiatan
      const jenisMitraData = processJenisMitraKegiatanData(data);
      renderHorizontalBarChart(
        "jenisMitraKegiatanChart",
        jenisMitraData,
        "#8B5CF6",
        "Jumlah Kegiatan",
      );

      // Top 5 Mitra Kegiatan
      const mitraData = processMitraKegiatanData(data);
      renderHorizontalBarChart(
        "mitraKegiatanChart",
        mitraData,
        "#F59E0B",
        "Jumlah Kegiatan",
      );

      // Top 5 Mitra QS200 by Subject
      const qs200Data = processMitraQS200Data(data);
      renderHorizontalBarChart(
        "mitraQS200Chart",
        qs200Data,
        "#10B981",
        "Jumlah Kegiatan",
      );

      console.log("✅ Semua chart kegiatan berhasil di-render");
    } else {
      console.error("❌ Tidak ada data kegiatan");
    }
  } catch (error) {
    console.error("❌ Error loading kegiatan charts:", error);
  }
}

function refreshKegiatanCharts() {
  if (typeof window.showToast === "function")
    window.showToast("info", "Refreshing", "Memuat data terbaru...");
  loadKegiatanCharts();
}

/**
 * ========================================
 * FUNGSI UTILITAS & STATS
 * ========================================
 */

function countByJenisDokumen(data) {
  const counts = { mou: 0, moa: 0, ia: 0 };
  data.forEach((item) => {
    const jenis = (item.jenisDokumen || "").toLowerCase();
    if (jenis.includes("mou") && jenis.includes("memorandum of understanding"))
      counts.mou++;
    else if (jenis.includes("moa") && jenis.includes("memorandum of agreement"))
      counts.moa++;
    else if (
      jenis.includes("ia") &&
      jenis.includes("implementation arrangement")
    )
      counts.ia++;
  });
  return counts;
}

function renderStats(counts) {
  const mouEl = document.getElementById("count-mou");
  const moaEl = document.getElementById("count-moa");
  const iaEl = document.getElementById("count-ia");
  if (mouEl) mouEl.textContent = counts.mou;
  if (moaEl) moaEl.textContent = counts.moa;
  if (iaEl) iaEl.textContent = counts.ia;
  console.log(
    `📊 Statistik: MoU=${counts.mou}, MoA=${counts.moa}, IA=${counts.ia}`,
  );
}

async function loadKerjasamaStats() {
  const data = await fetchKerjasamaData();
  if (data.length > 0) {
    const counts = countByJenisDokumen(data);
    renderStats(counts);
    return counts;
  }
  return { mou: 0, moa: 0, ia: 0 };
}

/**
 * ========================================
 * FUNGSI SIMPAN DATA (CRUD)
 * ========================================
 */

function simpanKerjasama() {
  const nomor = document.getElementById("inputNomorMou")?.value;
  const mitra = document.getElementById("inputMitra")?.value;
  const jenis = document.getElementById("inputJenisKerjasama")?.value;
  const bidang = document.getElementById("inputBidang")?.value;

  if (!nomor || !mitra) {
    if (typeof window.showToast === "function") {
      window.showToast(
        "warning",
        "Peringatan",
        "Nomor MoU dan nama mitra wajib diisi!",
      );
    }
    return;
  }

  const tbody = document.getElementById("kerjasamaTableBody");
  if (!tbody) return;

  const newRow = document.createElement("tr");
  newRow.innerHTML = `
        <td><strong>${nomor}</strong></td>
        <td>${mitra}</td>
        <td>${jenis}</td>
        <td>${typeof window.formatDate === "function" ? window.formatDate(new Date()) : new Date().toLocaleDateString("id-ID")}</td>
        <td>—</td>
        <td>${bidang || "Umum"}</td>
        <td><span class="status-badge process"><span class="status-dot"></span>Negosiasi</span></td>
        <td>
            <button class="btn btn-outline btn-sm" onclick="window.showToast('success', 'Detail', 'Membuka detail ${nomor}')">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-outline btn-sm" onclick="window.showToast('warning', 'Edit', 'Membuka form edit')">
                <i class="fas fa-edit"></i>
            </button>
        </td>
    `;

  tbody.insertBefore(newRow, tbody.firstChild);

  if (typeof window.closeModal === "function")
    window.closeModal("modalKerjasama");
  if (typeof window.showToast === "function") {
    window.showToast(
      "success",
      "Berhasil",
      `Kerjasama ${nomor} dengan ${mitra} berhasil ditambahkan`,
    );
  }

  ["inputNomorMou", "inputMitra", "inputBidang", "inputDeskripsiMou"].forEach(
    function (id) {
      const el = document.getElementById(id);
      if (el) el.value = "";
    },
  );

  // Refresh semua charts
  setTimeout(() => {
    loadGrowthChart();
    loadMitraChart();
    loadKegiatanCharts();
  }, 500);
}

/**
 * Initialize kerjasama chart (Bar chart lama)
 */
function initKerjasamaChart() {
  if (typeof window.createBarChart === "function" && window.CHART_DATA) {
    window.createBarChart("kerjasamaChart", window.CHART_DATA.kerjasama, {
      maxHeight: 180,
      showLabels: true,
    });
  }
}

/**
 * Initialize kerjasama module
 */
function initKerjasama() {
  const saveBtn = document.querySelector("#modalKerjasama .btn-primary");
  if (saveBtn) saveBtn.addEventListener("click", simpanKerjasama);

  // Load ALL charts
  loadGrowthChart();
  loadMitraChart();
  loadKegiatanCharts();

  console.log("🤝 Kerjasama module initialized");

  return {
    addKerjasama: simpanKerjasama,
    refreshChart: initKerjasamaChart,
    refreshStats: loadKerjasamaStats,
    refreshGrowthChart: loadGrowthChart,
    refreshMitraChart: loadMitraChart,
    refreshKegiatanCharts: loadKegiatanCharts,
    getActiveMoU: function () {
      return document.querySelectorAll(
        "#kerjasamaTableBody .status-badge.active",
      ).length;
    },
  };
}

// ========================================
// GLOBAL EXPOSURE
// ========================================
if (typeof window !== "undefined") {
  window.simpanKerjasama = simpanKerjasama;
  window.initKerjasamaChart = initKerjasamaChart;
  window.initKerjasama = initKerjasama;

  // Kerjasama Charts
  window.loadGrowthChart = loadGrowthChart;
  window.refreshGrowthChart = refreshGrowthChart;
  window.loadMitraChart = loadMitraChart;
  window.refreshMitraChart = refreshMitraChart;

  // Kegiatan Charts
  window.loadKegiatanCharts = loadKegiatanCharts;
  window.refreshKegiatanCharts = refreshKegiatanCharts;
}

// Auto-load saat DOM ready
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initKerjasama);
  } else {
    initKerjasama();
  }
}
