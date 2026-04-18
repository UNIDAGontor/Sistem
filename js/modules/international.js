/**
 * ========================================
 * INTERNATIONAL.JS - Global Affairs Module
 * ========================================
 * Traditional script version - Multi Sheet Support
 */

/**
 * ========================================
 * KONFIGURASI DATA SOURCE
 * ========================================
 */
const APPS_SCRIPT_URL_INTL =
  "https://script.google.com/macros/s/AKfycby6eEFKYKlCH8lu1AEwXHoViRUNtxw0hf69BFG-MYx7IembhZTSOhzI2zQIHXxnF3pL/exec";

// Cache data global
let globalDataMahasiswa = [];
let globalDataNonDegree = [];
let globalDataCalon = [];

/**
 * Fetch data dari Google Apps Script dengan parameter sheet
 */
/**
 * Fetch data dari Google Apps Script dengan parameter sheet
 */
async function fetchSheetData(sheetName) {
  try {
    const url = `${APPS_SCRIPT_URL_INTL}?sheet=${encodeURIComponent(sheetName)}&t=${Date.now()}`;

    const response = await fetch(url, { method: "GET" });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();

    console.log(`\n=== DEBUG ${sheetName} ===`);
    console.log(`📦 Raw response:`, result);

    // ✅ Handle response yang berbentuk object {success, total, data}
    let data;
    if (result.data && Array.isArray(result.data)) {
      // Response berbentuk object dengan property 'data'
      data = result.data;
      console.log(`✅ Extracted array from result.data: ${data.length} items`);
    } else if (Array.isArray(result)) {
      // Response langsung array
      data = result;
      console.log(`✅ Response is array: ${data.length} items`);
    } else {
      console.warn(`⚠️ Response bukan array atau object dengan data array`);
      return getDummyData(sheetName);
    }

    // Debug struktur data
    if (data.length > 0) {
      console.log(`📋 Sample item:`, data[0]);
      console.log(`📋 Keys:`, Object.keys(data[0]));
    }

    console.log(
      `✅ Berhasil mengambil ${data.length} data dari ${sheetName}\n`,
    );
    return data;
  } catch (error) {
    console.error(`❌ Gagal fetch data dari ${sheetName}:`, error);
    return getDummyData(sheetName);
  }
}

/**
 * Hitung statistik Mahasiswa Degree dari sheet DATA MAHASISWA
 */
function processMahasiswaDegree(data) {
  if (!Array.isArray(data)) {
    console.error("❌ processMahasiswaDegree: data bukan array!", data);
    return { negaraCount: 0, degreeCount: 0 };
  }

  const negaraSet = new Set();
  let degreeCount = 0;
  let namaFoundCount = 0;
  let emptyNamaCount = 0;

  data.forEach((item, index) => {
    if (!item) return;

    // 🔍 Debug: Cari field nama dengan berbagai kemungkinan
    const namaValue =
      item.nama ||
      item.Nama ||
      item.name ||
      item.Name ||
      item["nama"] ||
      item["Nama"] ||
      item["Name"] ||
      item["Full Name"] ||
      item["full_name"] ||
      null;

    // Debug 5 item pertama
    if (index < 5) {
      console.log(`Item ${index}:`, {
        nama: namaValue,
        negara: item.negara || item.Negara || item.country,
        hasNama: namaValue !== null,
        allKeys: Object.keys(item),
      });
    }

    // ✅ Hitung jika ada nama (dengan berbagai kemungkinan field)
    if (namaValue && String(namaValue).trim()) {
      degreeCount++;
      namaFoundCount++;
    } else {
      emptyNamaCount++;
    }

    // Hitung negara
    const negara = item.negara || item.Negara || item.country || null;
    if (negara && String(negara).trim()) {
      negaraSet.add(String(negara).trim());
    }
  });

  console.log(`\n📊 STATISTIK DATA MAHASISWA:`);
  console.log(`  ✅ Total records: ${data.length}`);
  console.log(`  ✅ Nama ditemukan: ${namaFoundCount}`);
  console.log(`  ⚠️ Nama kosong: ${emptyNamaCount}`);
  console.log(`  ✅ Negara unik: ${negaraSet.size}`);
  console.log(`  🎯 Degree count: ${degreeCount}\n`);

  return {
    negaraCount: negaraSet.size,
    degreeCount: degreeCount,
  };
}

/**
 * Generate dummy data fallback untuk testing
 */
function getDummyData(sheetName) {
  console.log(`📋 Generating dummy data for: ${sheetName}`);

  if (sheetName === "DATA MAHASISWA") {
    return [
      { negara: "Mesir", status: "Aktif" },
      { negara: "Tiongkok", status: "Aktif" },
      { negara: "Korea Selatan", status: "Aktif" },
      { negara: "Jepang", status: "Non-Aktif" },
      { negara: "Arab Saudi", status: "Aktif" },
      { negara: "Pakistan", status: "Aktif" },
      { negara: "Thailand", status: "Aktif" },
      { negara: "Malaysia", status: "Non-Aktif" },
      { negara: "India", status: "Aktif" },
      { negara: "Nigeria", status: "Aktif" },
      { negara: "Turki", status: "Aktif" },
      { negara: "Iran", status: "Aktif" },
      { negara: "Sudan", status: "Aktif" },
      { negara: "Yaman", status: "Non-Aktif" },
      { negara: "Palestina", status: "Aktif" },
    ];
  }

  if (sheetName === "DATA MAHASISWA NON DEGREE") {
    return [
      { Negara: "Jepang", "Reguler/Kmi": "Non-Degree" },
      { Negara: "Korea Selatan", "Reguler/Kmi": "Non-Degree" },
      { Negara: "Tiongkok", "Reguler/Kmi": "Non-Degree" },
      { Negara: "Thailand", "Reguler/Kmi": "Non-Degree" },
      { Negara: "Vietnam", "Reguler/Kmi": "Non-Degree" },
      { Negara: "Malaysia", "Reguler/Kmi": "Non-Degree" },
      { Negara: "Brunei", "Reguler/Kmi": "Non-Degree" },
      { Negara: "Filipina", "Reguler/Kmi": "Non-Degree" },
      { Negara: "Kamboja", "Reguler/Kmi": "Non-Degree" },
      { Negara: "Laos", "Reguler/Kmi": "Non-Degree" },
      { Negara: "Myanmar", "Reguler/Kmi": "Non-Degree" },
      { Negara: "India", "Reguler/Kmi": "Non-Degree" },
    ];
  }

  if (sheetName === "DATA CALON MAHASISWA ASING") {
    return [
      { Nationality: "Mesir", status: "Diterima" },
      { Nationality: "Pakistan", status: "Diterima" },
      { Nationality: "Sudan", status: "Diterima" },
      { Nationality: "Palestina", status: "Proses" },
      { Nationality: "Yaman", status: "Diterima" },
      { Nationality: "Somalia", status: "Ditolak" },
      { Nationality: "Chad", status: "Diterima" },
      { Nationality: "Nigeria", status: "Proses" },
      { Nationality: "Kenya", status: "Diterima" },
      { Nationality: "Tanzania", status: "Diterima" },
      { Nationality: "Uganda", status: "Ditolak" },
      { Nationality: "Ethiopia", status: "Diterima" },
    ];
  }

  return [];
}

/**
 * ========================================
 * FUNGSI PROCESSING DATA (Dengan Validasi)
 * ========================================
 */

/**
 * Hitung statistik Mahasiswa Degree dari sheet DATA MAHASISWA
 * - Count berdasarkan field 'nama' (semua entri yang punya nama)
 * - Hitung negara unik dari field 'negara'
 */
function processMahasiswaDegree(data) {
  if (!Array.isArray(data)) return { negaraCount: 0, degreeCount: 0 };

  const negaraSet = new Set();
  let degreeCount = 0;

  data.forEach((item, index) => {
    // Jika item adalah object
    if (typeof item === "object") {
      // Coba semua kemungkinan field
      const nama =
        item.nama || item.Nama || item.name || Object.values(item)[1]; // Kolom ke-2 (B)
      const negara =
        item.negara || item.Negara || item.country || Object.values(item)[2]; // Kolom ke-3 (C)

      if (nama && String(nama).trim()) degreeCount++;
      if (negara && String(negara).trim()) negaraSet.add(String(negara).trim());
    }
    // Jika item adalah array
    else if (Array.isArray(item)) {
      const nama = item[1]; // Kolom B (index 1)
      const negara = item[2]; // Kolom C (index 2)

      if (nama && String(nama).trim()) degreeCount++;
      if (negara && String(negara).trim()) negaraSet.add(String(negara).trim());
    }
  });

  return { negaraCount: negaraSet.size, degreeCount: degreeCount };
}

/**
 * Hitung statistik Mahasiswa Non-Degree
 * ✅ Menghitung SEMUA records sebagai Non-Degree
 */
function processMahasiswaNonDegree(data) {
  // Validasi data adalah array
  if (!Array.isArray(data)) {
    console.error("❌ processMahasiswaNonDegree: data bukan array!", data);
    return { negaraCount: 0, nonDegreeCount: 0 };
  }

  const negaraSet = new Set();

  data.forEach((item) => {
    if (!item) return;

    // Hitung negara (dengan berbagai kemungkinan field)
    const negara =
      item["Negara"] ||
      item.negara ||
      item.country ||
      item.Nationality ||
      item.nationality ||
      null;

    if (negara && String(negara).trim()) {
      negaraSet.add(String(negara).trim());
    }
  });

  // ✅ Hitung SEMUA records sebagai Non-Degree
  return {
    negaraCount: negaraSet.size,
    nonDegreeCount: data.length,
  };
}

/**
 * Hitung statistik Penerimaan Mahasiswa Asing
 */
/**
 * Hitung statistik Penerimaan Mahasiswa Asing
 */
function processCalonMahasiswaAsing(data) {
  if (!Array.isArray(data)) {
    return { negaraCount: 0, penerimaanCount: 0 };
  }

  const negaraSet = new Set();

  data.forEach((item) => {
    if (!item) return;

    // Hitung negara
    const nationality = item["Nationality"] || item.nationality || null;
    if (nationality && String(nationality).trim()) {
      negaraSet.add(String(nationality).trim());
    }
  });

  // ✅ Hitung SEMUA records sebagai penerimaan
  return {
    negaraCount: negaraSet.size,
    penerimaanCount: data.length,
  };
}

/**
 * Hitung negara mitra unik dari sheet DATA MAHASISWA saja
 */
function countTotalNegaraMitra(dataDegree, dataNonDegree, dataCalon) {
  // Validasi dataDegree adalah array
  if (!Array.isArray(dataDegree)) {
    console.error(
      "❌ countTotalNegaraMitra: dataDegree bukan array!",
      dataDegree,
    );
    return 0;
  }

  const allNegara = new Set();

  // ✅ Hanya hitung dari DATA MAHASISWA (dataDegree)
  dataDegree.forEach((item) => {
    if (!item) return;

    const negara = item.negara || item.Negara || item.country || null;
    if (negara && String(negara).trim()) {
      allNegara.add(String(negara).trim());
    }
  });

  // Exclude empty values
  allNegara.delete("");
  allNegara.delete("null");
  allNegara.delete("undefined");

  console.log(`🌍 Negara mitra unik dari DATA MAHASISWA: ${allNegara.size}`);

  return allNegara.size;
}

/**
 * ========================================
 * FUNGSI RENDER & ANIMASI
 * ========================================
 */

function animateValue(element, start, end, duration = 800) {
  if (!element) return;

  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const value = Math.floor(easeOut * (end - start) + start);
    element.textContent = value;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

function renderInternationalStats(stats) {
  console.log("📊 Rendering stats:", stats);

  const mappings = [
    { id: "count-negara-mitra", value: stats.negaraMitra },
    { id: "count-mahasiswa-degree", value: stats.mahasiswaDegree },
    { id: "count-mahasiswa-non-degree", value: stats.mahasiswaNonDegree },
    { id: "count-penerimaan-asing", value: stats.penerimaanAsing },
  ];

  mappings.forEach(({ id, value }) => {
    const el = document.getElementById(id);
    if (el) {
      animateValue(el, 0, value || 0, 1000);
    } else {
      console.warn(`⚠️ Element dengan id '${id}' tidak ditemukan`);
    }
  });
}

/**
 * ========================================
 * FUNGSI LOAD DATA UTAMA
 * ========================================
 */

async function loadInternationalStats() {
  try {
    console.log("🔄 Loading international stats...");

    const [dataDegree, dataNonDegree, dataCalon] = await Promise.all([
      fetchSheetData("DATA MAHASISWA"),
      fetchSheetData("DATA MAHASISWA NON DEGREE"),
      fetchSheetData("DATA CALON MAHASISWA ASING"),
    ]);

    globalDataMahasiswa = Array.isArray(dataDegree) ? dataDegree : [];
    globalDataNonDegree = Array.isArray(dataNonDegree) ? dataNonDegree : [];
    globalDataCalon = Array.isArray(dataCalon) ? dataCalon : [];

    const statsDegree = processMahasiswaDegree(globalDataMahasiswa);
    const statsNonDegree = processMahasiswaNonDegree(globalDataNonDegree);
    const statsCalon = processCalonMahasiswaAsing(globalDataCalon);
    const totalNegara = countTotalNegaraMitra(
      globalDataMahasiswa,
      globalDataNonDegree,
      globalDataCalon,
    );

    const finalStats = {
      negaraMitra: totalNegara,
      mahasiswaDegree: statsDegree.degreeCount,
      mahasiswaNonDegree: statsNonDegree.nonDegreeCount,
      penerimaanAsing: statsCalon.penerimaanCount,
    };

    renderInternationalStats(finalStats);

    // ✅ Render country map
    setTimeout(() => {
      console.log("🗺️ Initializing country map...");
      const mapSuccess = initCountryMap();
      if (!mapSuccess) {
        console.error("❌ Failed to initialize country map");
      }

      // ✅ Render trend chart AFTER map
      console.log("📈 Initializing trend chart...");
      renderTrendChart();
    }, 500);

    return finalStats;
  } catch (error) {
    console.error("❌ Error:", error);
    return null;
  }
}

function refreshInternationalStats() {
  if (typeof window.showToast === "function") {
    window.showToast("info", "Refreshing", "Memuat data terbaru...");
  }
  loadInternationalStats();
}

/**
 * ========================================
 * FUNGSI UTILITAS & CRUD
 * ========================================
 */

function simpanNegara() {
  const negara = document.getElementById("inputNegara")?.value;
  const institusi = document.getElementById("inputInstitusiMitra")?.value;

  if (!negara) {
    if (typeof window.showToast === "function") {
      window.showToast("warning", "Peringatan", "Nama negara wajib diisi!");
    }
    return;
  }

  if (typeof window.closeModal === "function") window.closeModal("modalNegara");
  if (typeof window.showToast === "function") {
    window.showToast(
      "success",
      "Berhasil",
      `Negara mitra ${negara} berhasil ditambahkan`,
    );
  }

  ["inputNegara", "inputInstitusiMitra", "inputJumlahMouNegara"].forEach(
    function (id) {
      const el = document.getElementById(id);
      if (el) el.value = "";
    },
  );

  setTimeout(() => {
    loadInternationalStats();
  }, 500);
}

function initIntlChart() {
  if (typeof window.createBarChart === "function" && window.CHART_DATA) {
    window.createBarChart("intlChart", window.CHART_DATA.international, {
      maxHeight: 180,
      showLabels: true,
    });
  }
}

function initInternational() {
  const saveBtn = document.querySelector("#modalNegara .btn-primary");
  if (saveBtn) {
    saveBtn.addEventListener("click", simpanNegara);
  }

  // Load stats & map
  loadInternationalStats();

  console.log("🌍 International module initialized");

  return {
    addCountry: simpanNegara,
    refreshChart: initIntlChart,
    refreshStats: loadInternationalStats,
    refreshMap: initCountryMap, // ✅ Tambahkan ini
    getStats: function () {
      return {
        negaraMitra: countTotalNegaraMitra(
          globalDataMahasiswa,
          globalDataNonDegree,
          globalDataCalon,
        ),
        mahasiswaDegree:
          processMahasiswaDegree(globalDataMahasiswa).degreeCount,
        mahasiswaNonDegree:
          processMahasiswaNonDegree(globalDataNonDegree).nonDegreeCount,
        penerimaanAsing:
          processCalonMahasiswaAsing(globalDataCalon).penerimaanCount,
      };
    },
  };
}

// ========================================
// GLOBAL EXPOSURE
// ========================================
if (typeof window !== "undefined") {
  window.simpanNegara = simpanNegara;
  window.initIntlChart = initIntlChart;
  window.initInternational = initInternational;
  window.loadInternationalStats = loadInternationalStats;
  window.refreshInternationalStats = refreshInternationalStats;
}

// Auto-load saat DOM ready
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initInternational);
  } else {
    initInternational();
  }
}
/**
 * 🌍 COUNTRY DISTRIBUTION MAP - Versi dengan Error Handling Lengkap
 */
function initCountryMap() {
  console.log("\n=== 🗺️ INIT COUNTRY MAP ===");

  const container = document.getElementById("countryMap");
  if (!container) {
    console.error("❌ Element #countryMap tidak ditemukan!");
    return false;
  }

  // Deteksi mobile
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    ) || window.innerWidth < 768;

  console.log("📱 Is mobile:", isMobile);
  console.log("📐 Screen width:", window.innerWidth);

  if (typeof jsVectorMap === "undefined") {
    console.error("❌ jsVectorMap belum ter-load!");
    container.innerHTML = `
      <div style="padding: 40px; text-align: center; color: #ef4444;">
        <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
        <p>Library jsVectorMap belum ter-load</p>
      </div>
    `;
    return false;
  }

  // Destroy instance lama
  if (window.countryMapInstance) {
    try {
      window.countryMapInstance.destroy();
    } catch (e) {}
  }

  const students = globalDataMahasiswa || [];
  if (students.length === 0) {
    container.innerHTML = `
      <div style="padding: 40px; text-align: center; color: #6b7280;">
        <p>Tidak ada data mahasiswa</p>
      </div>
    `;
    return false;
  }

  // Hitung distribusi
  const counts = {};
  students.forEach((student) => {
    if (!student.negara) return;
    const country = String(student.negara).trim();
    if (country) {
      counts[country] = (counts[country] || 0) + 1;
    }
  });

  // Mapping negara (sama seperti sebelumnya)
  const countryISOMap = {
    Afghanistan: "AF",
    Albania: "AL",
    Algeria: "DZ",
    Argentina: "AR",
    Australia: "AU",
    Austria: "AT",
    Bahrain: "BH",
    Bangladesh: "BD",
    Belarus: "BY",
    Bolivia: "BO",
    Brazil: "BR",
    "Brunei Darussalam": "BN",
    Cambodia: "KH",
    Cameroon: "CM",
    Canada: "CA",
    Chad: "TD",
    Chile: "CL",
    China: "CN",
    Colombia: "CO",
    "Costa Rica": "CR",
    Croatia: "HR",
    Cuba: "CU",
    Cyprus: "CY",
    "Czech Republic": "CZ",
    Denmark: "DK",
    Ecuador: "EC",
    Egypt: "EG",
    Estonia: "EE",
    Ethiopia: "ET",
    Finland: "FI",
    France: "FR",
    Georgia: "GE",
    Germany: "DE",
    Ghana: "GH",
    Greece: "GR",
    Hungary: "HU",
    Iceland: "IS",
    India: "IN",
    Indonesia: "ID",
    Iran: "IR",
    Iraq: "IQ",
    Ireland: "IE",
    Israel: "IL",
    Italy: "IT",
    Japan: "JP",
    Jordan: "JO",
    Kazakhstan: "KZ",
    Kenya: "KE",
    Kuwait: "KW",
    Latvia: "LV",
    Lebanon: "LB",
    Libya: "LY",
    Lithuania: "LT",
    Luxembourg: "LU",
    Malaysia: "MY",
    Maldives: "MV",
    Malta: "MT",
    Mexico: "MX",
    Moldova: "MD",
    Monaco: "MC",
    Mongolia: "MN",
    Montenegro: "ME",
    Morocco: "MA",
    Myanmar: "MM",
    Nepal: "NP",
    Netherlands: "NL",
    "New Zealand": "NZ",
    Nigeria: "NG",
    "North Macedonia": "MK",
    Norway: "NO",
    Oman: "OM",
    Pakistan: "PK",
    Palestine: "PS",
    Panama: "PA",
    Paraguay: "PY",
    Peru: "PE",
    Philippines: "PH",
    Poland: "PL",
    Portugal: "PT",
    Qatar: "QA",
    Romania: "RO",
    Russia: "RU",
    "Saudi Arabia": "SA",
    Senegal: "SN",
    Serbia: "RS",
    Singapore: "SG",
    Slovakia: "SK",
    Slovenia: "SI",
    Somalia: "SO",
    "South Africa": "ZA",
    "South Korea": "KR",
    Spain: "ES",
    "Sri Lanka": "LK",
    Sudan: "SD",
    Sweden: "SE",
    Switzerland: "CH",
    Syria: "SY",
    Taiwan: "TW",
    Tajikistan: "TJ",
    Tanzania: "TZ",
    Thailand: "TH",
    Tunisia: "TN",
    Turkey: "TR",
    Turkmenistan: "TM",
    Uganda: "UG",
    Ukraine: "UA",
    "United Arab Emirates": "AE",
    "United Kingdom": "GB",
    "United States": "US",
    Uruguay: "UY",
    Uzbekistan: "UZ",
    Venezuela: "VE",
    Vietnam: "VN",
    Yemen: "YE",
  };

  const isoToCountry = Object.fromEntries(
    Object.entries(countryISOMap).map(([name, iso]) => [iso, name]),
  );

  const mapData = {};
  Object.keys(counts).forEach((country) => {
    const iso = countryISOMap[country];
    if (iso) {
      mapData[iso] = counts[country];
    }
  });

  console.log(`📊 Mapped: ${Object.keys(mapData).length} countries`);

  // ✅ KONFIGURASI RESPONSIVE
  try {
    window.countryMapInstance = new jsVectorMap({
      selector: "#countryMap",
      map: "world",

      // ✅ MOBILE OPTIMIZATION
      zoomButtons: !isMobile, // Hide zoom buttons on mobile
      zoomOnScroll: !isMobile,
      zoomOnPinch: isMobile, // Enable pinch zoom on mobile
      panOnDrag: true,

      // ✅ RESPONSIVE SETTINGS
      zoomMax: isMobile ? 3 : 5,
      zoomMin: 1,
      defaultZoom: 1,

      // ✅ TOUCH SUPPORT
      touch: {
        enabled: true,
        pinchZoom: isMobile,
        pan: true,
      },

      regionStyle: {
        initial: {
          fill: "#E5E7EB",
          fillOpacity: 1,
          stroke: "none",
          strokeWidth: 0,
        },
        hover: {
          fill: "#3B82F6",
          fillOpacity: 0.8,
          cursor: isMobile ? "default" : "pointer",
        },
        selected: {
          fill: "#1D4ED8",
        },
      },

      series: {
        regions: [
          {
            values: mapData,
            scale: ["#93C5FD", "#1D4ED8"],
            normalizeFunction: "polynomial",
            attribute: "fill",
          },
        ],
      },

      // ✅ TOOLTIP UNTUK MOBILE & DESKTOP
      onRegionTooltipShow: function (event, tooltip, code) {
        const value = mapData[code] || 0;
        const totalStudents = students.length;
        const percent = totalStudents
          ? ((value / totalStudents) * 100).toFixed(1)
          : 0;
        const countryName = isoToCountry[code] || code;

        const barLength = isMobile ? 8 : 10;
        const filled = Math.round((percent / 100) * barLength);
        const progressBar = "█".repeat(filled) + "░".repeat(barLength - filled);

        // Set tooltip dengan setTimeout untuk memastikan element ada
        setTimeout(() => {
          const tooltipEl = document.querySelector(".jvm-tooltip");
          if (tooltipEl) {
            tooltipEl.innerHTML = `
              <div style="font-family: system-ui, sans-serif; line-height: 1.4;">
                <div style="font-weight: 600; margin-bottom: 4px; color: #1f2937; font-size: ${isMobile ? "13px" : "14px"};">
                  🌍 ${countryName}
                </div>
                <div style="margin-bottom: 4px; color: #374151;">
                  👨‍🎓 <strong>${value}</strong> Mahasiswa
                </div>
                ${
                  isMobile
                    ? ""
                    : `
                  <div style="font-family: monospace; color: #6b7280; margin-bottom: 4px; font-size: 11px; letter-spacing: 1px;">
                    ${progressBar}
                  </div>
                  
                `
                }
              </div>
            `;
          }
        }, 0);
      },

      onRegionClick: function (event, code) {
        const countryName = isoToCountry[code] || code;
        const count = mapData[code] || 0;

        if (isMobile) {
          // Show alert untuk mobile (lebih user-friendly)
          alert(`${countryName}\n👨‍🎓 ${count} Mahasiswa`);
        } else {
          console.log(`📍 Clicked: ${countryName} (${count} students)`);
        }
      },

      // ✅ HANDLE RESIZE
      onResize: function () {
        console.log("📐 Map resized");
      },
    });

    console.log("✅ Map rendered successfully!");

    // ✅ HANDLE WINDOW RESIZE
    let resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (window.countryMapInstance) {
          window.countryMapInstance.updateSize();
          console.log("📐 Map updated for new size");
        }
      }, 250);
    });

    return true;
  } catch (error) {
    console.error("❌ Error rendering map:", error);
    container.innerHTML = `
      <div style="padding: 40px; text-align: center; color: #ef4444;">
        <p>Error: ${error.message}</p>
      </div>
    `;
    return false;
  }
}
// Handle screen rotation
window.addEventListener("orientationchange", function () {
  setTimeout(function () {
    if (window.countryMapInstance) {
      window.countryMapInstance.updateSize();
      console.log("📱 Orientation changed, map updated");
    }
  }, 300);
});
/**
 * Proses data untuk Tren Penerimaan per Tahun
 * Mengambil tahun dari field Timestamp
 */
function processTrenPenerimaan(data) {
  if (!Array.isArray(data)) {
    console.error("❌ processTrenPenerimaan: data bukan array!", data);
    return { labels: [], values: [] };
  }

  const yearlyCount = {};

  data.forEach((item) => {
    if (!item) return;

    // Ambil tahun dari Timestamp
    // Format Timestamp bisa berbagai macam, coba extract tahun
    let year = null;

    // Coba field Timestamp
    const timestamp =
      item.Timestamp || item.timestamp || item["Timestamp"] || null;

    if (timestamp) {
      // Jika timestamp dalam format Date object atau string
      const date = new Date(timestamp);
      if (!isNaN(date.getFullYear())) {
        year = date.getFullYear();
      }
    }

    // Fallback: coba field tahun lainnya
    if (!year) {
      year = item.tahun || item.year || item["Year"] || null;
    }

    if (year) {
      yearlyCount[year] = (yearlyCount[year] || 0) + 1;
    }
  });

  // Urutkan berdasarkan tahun
  const sortedYears = Object.keys(yearlyCount).sort(
    (a, b) => parseInt(a) - parseInt(b),
  );
  const values = sortedYears.map((year) => yearlyCount[year]);

  console.log("📊 Tren Penerimaan:", { years: sortedYears, counts: values });

  return {
    labels: sortedYears,
    values: values,
  };
}

/**
 * Render Chart Tren Penerimaan - Enhanced Version
 */
function renderTrendChart() {
  const canvas = document.getElementById("trendChartCanvas");
  if (!canvas) {
    console.warn("⚠️ Canvas trendChartCanvas tidak ditemukan");
    return;
  }

  // Destroy instance lama jika ada
  if (window.trendChartInstance) {
    try {
      window.trendChartInstance.destroy();
    } catch (e) {}
  }

  // Process data dari globalDataCalon
  const trendData = processTrenPenerimaan(globalDataCalon);

  if (trendData.labels.length === 0) {
    console.warn("⚠️ Tidak ada data tren untuk ditampilkan");
    canvas.parentElement.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-muted);">
        <i class="fas fa-chart-line" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
        <p>Belum ada data penerimaan</p>
      </div>
    `;
    return;
  }

  // Cek Chart.js
  if (typeof Chart === "undefined") {
    console.error("❌ Chart.js belum ter-load!");
    return;
  }

  const ctx = canvas.getContext("2d");

  // ✅ GRADIENT MULTI-WARNA YANG LEBIH MENARIK
  const gradientPrimary = ctx.createLinearGradient(0, 0, 0, 300);
  gradientPrimary.addColorStop(0, "rgba(49, 130, 206, 0.4)"); // Biru terang
  gradientPrimary.addColorStop(0.5, "rgba(129, 140, 248, 0.2)"); // Ungu
  gradientPrimary.addColorStop(1, "rgba(49, 130, 206, 0.0)"); // Transparan

  // ✅ GRADIENT UNTUK LINE (Multi-color)
  const lineGradient = ctx.createLinearGradient(0, 0, 800, 0);
  lineGradient.addColorStop(0, "#3182ce"); // Biru
  lineGradient.addColorStop(0.5, "#818cf8"); // Ungu
  lineGradient.addColorStop(1, "#34d399"); // Hijau

  window.trendChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: trendData.labels,
      datasets: [
        {
          label: "Jumlah Penerimaan",
          data: trendData.values,
          borderColor: lineGradient,
          backgroundColor: gradientPrimary,
          borderWidth: 4,
          fill: true,
          tension: 0.4,

          // ✅ POINT STYLING YANG LEBIH MENARIK
          pointBackgroundColor: (ctx) => {
            const value = ctx.raw;
            const max = Math.max(...trendData.values);
            const intensity = value / max;

            // Warna berubah berdasarkan nilai (hijau untuk tinggi, biru untuk rendah)
            if (intensity > 0.7) return "#34d399"; // Hijau
            if (intensity > 0.4) return "#818cf8"; // Ungu
            return "#3182ce"; // Biru
          },
          pointBorderColor: "#fff",
          pointBorderWidth: 3,
          pointRadius: (ctx) => {
            const value = ctx.raw;
            const max = Math.max(...trendData.values);
            const intensity = value / max;
            return 5 + intensity * 5; // Radius 5-10px berdasarkan nilai
          },
          pointHoverRadius: 8,
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "#3182ce",
          pointHoverBorderWidth: 3,

          // ✅ SHADOW EFFECT
          borderCapStyle: "round",
          borderJoinStyle: "round",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      // ✅ ANIMASI YANG SMOOTH
      animation: {
        duration: 2000,
        easing: "easeInOutQuart",
      },
      plugins: {
        legend: {
          display: false,
        },
        // ✅ TOOLTIP YANG LEBIH INFORMATIF
        tooltip: {
          backgroundColor: "rgba(26, 54, 93, 0.95)", // Warna primary dark
          titleColor: "#fff",
          bodyColor: "#fff",
          borderColor: "rgba(255, 255, 255, 0.2)",
          borderWidth: 1,
          padding: 16,
          titleFont: { size: 15, weight: "700" },
          bodyFont: { size: 14 },
          cornerRadius: 12,
          displayColors: true,
          callbacks: {
            title: function (context) {
              return `📅 Tahun ${context[0].label}`;
            },
            label: function (context) {
              const value = context.parsed.y;
              const total = trendData.values.reduce((a, b) => a + b, 0);
              const percent = ((value / total) * 100).toFixed(1);

              return [`👨‍🎓 ${value} Mahasiswa`, `📊 ${percent}% dari total`];
            },
            afterLabel: function (context) {
              const value = context.parsed.y;
              const prevValue =
                context.dataIndex > 0 ? context.data[context.dataIndex - 1] : 0;
              const change = value - prevValue;
              const changePercent =
                prevValue > 0 ? ((change / prevValue) * 100).toFixed(1) : 0;

              if (context.dataIndex === 0) return "";

              if (change > 0) {
                return `📈 +${change} (+${changePercent}%) dari tahun sebelumnya`;
              } else if (change < 0) {
                return `📉 ${change} (${changePercent}%) dari tahun sebelumnya`;
              }
              return `➡️ Tidak ada perubahan`;
            },
          },
        },
        // ✅ ANNOTATION (Opsional - untuk highlight tahun tertentu)
        annotation: {
          annotations: {
            line1: {
              type: "line",
              yMin: Math.max(...trendData.values),
              yMax: Math.max(...trendData.values),
              borderColor: "rgba(229, 62, 62, 0.5)",
              borderWidth: 2,
              borderDash: [6, 6],
              label: {
                content: "Puncak",
                enabled: true,
                position: "end",
              },
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
            drawBorder: false,
          },
          ticks: {
            font: { size: 12, weight: "600" },
            color: "var(--text-secondary)",
            padding: 8,
          },
          title: {
            display: true,
            text: "Tahun",
            font: { size: 13, weight: "700" },
            color: "var(--text-primary)",
            padding: { top: 10 },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(49, 130, 206, 0.08)",
            drawBorder: false,
            borderDash: [5, 5],
          },
          ticks: {
            stepSize: undefined, // Auto
            font: { size: 11 },
            color: "var(--text-muted)",
            padding: 8,
            callback: function (value) {
              // Format angka dengan separator
              return value >= 1000 ? value.toLocaleString() : value;
            },
          },
          title: {
            display: true,
            text: "Jumlah Mahasiswa",
            font: { size: 13, weight: "700" },
            color: "var(--text-primary)",
            padding: { top: 10, bottom: 20 },
          },
        },
      },
      // ✅ HOVER EFFECT YANG LEBIH RESPONSIVE
      hover: {
        mode: "nearest",
        intersect: false,
        animationDuration: 200,
      },
    },
  });

  console.log("✅ Enhanced trend chart rendered successfully");
}
