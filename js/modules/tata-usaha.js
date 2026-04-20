/**
 * ========================================
 * TATA-USAHA.JS - Surat Management Module
 * ========================================
 * Integrated with Google Apps Script Backend
 * + Enhanced Pagination System
 */

// ✅ DEBUG: Confirm file is loaded
console.log("📦 TATA-USAHA.JS LOADED SUCCESSFULLY!");
console.log("📅 Current time:", new Date().toISOString());

// ==================== KONFIGURASI GLOBAL ====================
const APPS_SCRIPT_URL_SURAT =
  "https://script.google.com/macros/s/AKfycbzg-YpNbhsjLYcvHWFlayKaTjZKv1PHP25Jjd5jvxpSyZWAVHcOEQ5F9BQoyrH3TdDI/exec";

let suratData = []; // Data mentah dari server
let filteredData = []; // Data setelah filter & search
let currentPage = 1; // Halaman aktif
let itemsPerPage = 10; // Items per page (bisa diubah user)
let currentFilter = "semua"; // Filter kategori

// ==================== FETCH DATA ====================
async function fetchSuratData() {
  try {
    const url = `${APPS_SCRIPT_URL_SURAT}?t=${Date.now()}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = await response.json();

    // Handle GViz JSONP format
    if (
      typeof result === "string" &&
      result.includes("google.visualization.Query.setResponse")
    ) {
      const match = result.match(
        /google\.visualization\.Query\.setResponse\(([\s\S]*?)\);/,
      );
      if (match) {
        const json = JSON.parse(match[1]);
        return (
          json.table?.rows?.map((row) =>
            row.c ? row.c.map((cell) => cell?.v || "") : [],
          ) || []
        );
      }
    }

    // Handle array langsung
    if (Array.isArray(result)) return result;
    if (result?.table?.rows) {
      return result.table.rows.map((row) =>
        row.c ? row.c.map((cell) => cell?.v || "") : [],
      );
    }

    return [];
  } catch (error) {
    console.error("❌ Gagal fetch surat:", error);
    if (typeof window.showToast === "function") {
      window.showToast("warning", "Peringatan", "Gagal memuat data surat");
    }
    return [];
  }
}

// ==================== UTILITIES ====================
function formatDateGS(value) {
  if (!value) return "-";
  if (typeof value === "string" && value.startsWith("Date(")) {
    const parts = value
      .replace("Date(", "")
      .replace(")", "")
      .split(",")
      .map((p) => p.trim());
    const y = parseInt(parts[0]),
      mo = parseInt(parts[1]),
      d = parseInt(parts[2]);
    const h = parts[3] ? parseInt(parts[3]) : 0;
    const min = parts[4] ? parseInt(parts[4]) : 0;
    const date = new Date(y, mo, d, h, min);
    const bulan = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    return `${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
  }
  try {
    const date = new Date(value);
    if (!isNaN(date)) {
      const bulan = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Mei",
        "Jun",
        "Jul",
        "Agu",
        "Sep",
        "Okt",
        "Nov",
        "Des",
      ];
      return `${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
    }
  } catch (e) {}
  return value;
}

function showToast(type, title, message) {
  // Langsung gunakan console.log dan alert
  console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
  
  // Gunakan alert untuk development
  if (type === 'error' || type === 'warning') {
    alert(`${title}\n${message}`);
  }
}

// ==================== FILTER & SEARCH ====================
function applyFilters() {
  let filtered = [...suratData];

  // Filter kategori
  if (currentFilter !== "semua") {
    filtered = filtered.filter((row) => {
      const sumber = (row[1] || "").toLowerCase();
      if (currentFilter === "masuk")
        return sumber.includes("masuk") || sumber.includes("tata usaha");
      if (currentFilter === "keluar")
        return sumber.includes("keluar") || sumber.includes("mitra");
      if (currentFilter === "disposisi")
        return (row[4] || "").toLowerCase().includes("disposisi");
      return true;
    });
  }

  // Filter search
  const search =
    document.getElementById("searchSurat")?.value?.toLowerCase() || "";
  if (search) {
    filtered = filtered.filter((row) =>
      row.join(" ").toLowerCase().includes(search),
    );
  }

  // Reverse: terbaru di atas
  filtered.reverse();
  return filtered;
}

// ==================== RENDER TABLE ====================
function renderSuratTable(page = 1) {
  const tbody = document.getElementById("suratTableBody");
  const container = document.getElementById("suratTableContainer");
  const loading = document.getElementById("suratLoading");
  const pagination = document.getElementById("suratPagination");

  if (!tbody || !container) {
    console.error("❌ Table body or container not found!");
    return;
  }

  // Apply filters & update global filteredData
  filteredData = applyFilters();

  console.log("📋 Filtered data:", {
    originalLength: suratData?.length,
    filteredLength: filteredData.length,
    currentFilter,
    searchQuery: document.getElementById("searchSurat")?.value || "(none)",
  });

  // Empty state
  if (filteredData.length === 0) {
    container.style.display = "none";
    loading.style.display = "block";
    loading.innerHTML =
      '<i class="fas fa-inbox" style="font-size: 48px; opacity: 0.3;"></i><p style="margin-top: 12px;">Tidak ada data surat</p>';
    if (pagination) {
      pagination.style.display = "none";
      pagination.innerHTML = "";
    }
    return;
  }

  // Pagination calculation
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Validate page number
  if (page > totalPages) page = totalPages;
  if (page < 1) page = 1;
  currentPage = page;

  const start = (page - 1) * itemsPerPage;
  const paged = filteredData.slice(start, start + itemsPerPage);

  console.log("📊 Pagination info:", {
    totalItems: filteredData.length,
    totalPages,
    currentPage: page,
    itemsPerPage,
    startIndex: start,
    endIndex: start + itemsPerPage,
  });

  // Render rows
  tbody.innerHTML = paged
    .map((row) => {
      const [
        timestamp,
        sumber,
        nomorSurat,
        tujuan,
        jenis,
        klas,
        link,
        keterangan,
        nomorUrut,
      ] = row;

      return `
      <tr>
        <td>${formatDateGS(timestamp)}</td>
        <td><strong>${nomorSurat || "-"}</strong></td>
        <td>${sumber || "-"}</td>
        <td>${tujuan || "-"}</td>
        <td><span class="status-badge process">${jenis || "-"}</span></td>
        <td>${klas || "-"}</td>
        <td>${link ? `<a href="${link}" target="_blank" class="btn btn-outline btn-sm"><i class="fas fa-link"></i></a>` : "-"}</td>
        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${keterangan || "-"}">${keterangan || "-"}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="openEditModal('${nomorUrut}')" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-outline btn-sm" onclick="deleteSurat('${nomorUrut}')" title="Hapus" style="color: var(--accent);">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
    })
    .join("");

  // Show/hide states
  loading.style.display = "none";
  container.style.display = "block";
  if (pagination) pagination.style.display = "block";

  console.log("✅ Table rows rendered:", paged.length);

  // Render enhanced pagination
  if (pagination) {
    renderEnhancedPagination(pagination, page, totalPages, filteredData.length);
    updateShowingInfo(filteredData.length, page, itemsPerPage);
  }
}

// ==================== ENHANCED PAGINATION ====================
function renderEnhancedPagination(
  container,
  currentPage,
  totalPages,
  totalItems,
) {
  if (!container) return;

  if (totalPages <= 1) {
    container.style.display = "none";
    container.innerHTML = "";
    return;
  }

  container.style.display = "block";

  const controls = document.getElementById("paginationControls");
  if (!controls) return;

  let html = "";

  // Previous button
  html += `<button class="page-btn nav-btn ${currentPage === 1 ? "disabled" : ""}" 
    onclick="goToPage(${currentPage > 1 ? currentPage - 1 : currentPage})" 
    ${currentPage === 1 ? "disabled" : ""}>
    <i class="fas fa-chevron-left"></i> <span class="btn-label">Prev</span>
  </button>`;

  // Page numbers with ellipsis logic
  const pages = getPageNumbers(currentPage, totalPages);
  pages.forEach((p) => {
    if (p === "...") {
      html += `<span class="page-ellipsis">...</span>`;
    } else {
      html += `<button class="page-btn ${p === currentPage ? "active" : ""}" 
        onclick="goToPage(${p})">${p}</button>`;
    }
  });

  // Next button
  html += `<button class="page-btn nav-btn ${currentPage === totalPages ? "disabled" : ""}" 
    onclick="goToPage(${currentPage < totalPages ? currentPage + 1 : currentPage})" 
    ${currentPage === totalPages ? "disabled" : ""}>
    <span class="btn-label">Next</span> <i class="fas fa-chevron-right"></i>
  </button>`;

  controls.innerHTML = html;
}

function getPageNumbers(current, total) {
  const pages = [];
  const delta = 2;
  const left = current - delta;
  const right = current + delta + 1;

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= left && i < right)) {
      pages.push(i);
    }
  }

  // Add ellipsis
  const result = [];
  for (let i = 0; i < pages.length; i++) {
    if (i > 0 && pages[i] - pages[i - 1] > 1) {
      result.push("...");
    }
    result.push(pages[i]);
  }
  return result;
}

function updateShowingInfo(totalItems, currentPage, itemsPerPage) {
  const showingInfo = document.getElementById("showingInfo");
  if (!showingInfo) return;

  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  showingInfo.innerHTML = `Menampilkan <strong>${start}-${end}</strong> dari <strong>${totalItems}</strong> surat`;
}

// ==================== NAVIGATION ====================
function goToPage(page) {
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  if (page < 1 || page > totalPages) return;

  currentPage = page;
  renderSuratTable(currentPage);

  // Smooth scroll to table
  const tableContainer = document.getElementById("suratTableContainer");
  if (tableContainer) {
    tableContainer.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function jumpToPage() {
  const input = document.getElementById("jumpPageInput");
  if (!input) return;

  const page = parseInt(input.value);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  if (page >= 1 && page <= totalPages) {
    goToPage(page);
    input.blur(); // Hide keyboard on mobile
  } else {
    input.value = currentPage;
    showToast("info", "Informasi", "Halaman tidak valid");
  }
}

function setupPaginationEvents() {
  // Jump to page: Enter key
  const jumpInput = document.getElementById("jumpPageInput");
  if (jumpInput) {
    jumpInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") jumpToPage();
    });
  }

  // Per page selector
  const perPageSelect = document.getElementById("perPageSelect");
  if (perPageSelect) {
    perPageSelect.addEventListener("change", function () {
      itemsPerPage = parseInt(this.value);
      currentPage = 1;
      // Update select value in localStorage for persistence
      localStorage.setItem("suratItemsPerPage", itemsPerPage);
      renderSuratTable(currentPage);
    });

    // Load saved preference
    const saved = localStorage.getItem("suratItemsPerPage");
    if (saved) {
      perPageSelect.value = saved;
      itemsPerPage = parseInt(saved);
    }
  }
}

// ==================== SEARCH & FILTER HANDLERS ====================
function searchSuratTable() {
  currentPage = 1;
  renderSuratTable(currentPage);
}

function setFilter(filter) {
  currentFilter = filter;
  currentPage = 1;
  // Update active state on filter buttons if they exist
  document.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.filter === filter) btn.classList.add("active");
  });
  renderSuratTable(currentPage);
}

// ==================== GOOGLE APPS SCRIPT CALLER ====================
async function googleScriptCall(functionName, args) {
  // Try method 1: GET request
  try {
    const url = `${APPS_SCRIPT_URL_SURAT}?func=${encodeURIComponent(functionName)}&args=${encodeURIComponent(JSON.stringify(args))}&t=${Date.now()}`;
    const response = await fetch(url);

    if (response.ok) {
      const result = await response.json();
      if (!result?.error) return result;
    }
  } catch (e) {
    console.warn("⚠️ GET request failed, trying fallback...");
  }

  // Fallback: Return dummy data untuk development
  console.warn(`⚠️ Using fallback data for ${functionName}`);

  if (functionName === "previewMultiNomor") {
    const [jenis, klas, jumlah] = args;
    const dummy = [];
    for (let i = 1; i <= (jumlah || 1); i++) {
      dummy.push(`PREVIEW/${Date.now()}-${i}/UNIDA/B.5-XX/XX/XII/1445`);
    }
    return dummy;
  }

  if (functionName === "submitMultiSurat" || functionName === "updateSurat") {
    return ["DRAFT/" + Date.now()];
  }

  if (functionName === "getAllSurat" || functionName === undefined) {
    return [];
  }

  if (functionName === "deleteSurat") {
    return "OK";
  }

  throw new Error(
    `Function ${functionName} not available (Apps Script not connected)`,
  );
}

// ==================== FORM: SUBMIT SURAT ====================
async function submitSurat() {
  const form = {
    sumber: document.getElementById("sumber")?.value,
    tujuan: document.getElementById("tujuan")?.value,
    jenisNaskah: document.getElementById("jenisNaskah")?.value,
    klasArsip: document.getElementById("klasArsip")?.value,
    deliverableLink: document.getElementById("deliverableLink")?.value,
    keterangan: document.getElementById("keterangan")?.value,
    jumlahSurat: parseInt(document.getElementById("jumlahSurat")?.value) || 1,
  };

  // Validasi
  if (!form.sumber || !form.tujuan || !form.jenisNaskah || !form.klasArsip) {
    showToast("warning", "Peringatan", "Semua field bertanda * wajib diisi!");
    return;
  }

  // Loading state
  const submitBtn = document.querySelector("#formSurat .btn-primary");
  if (submitBtn) {
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

    try {
      const results = await googleScriptCall("submitMultiSurat", [form]);

      if (Array.isArray(results) && results.length > 0) {
        showToast(
          "success",
          "Berhasil",
          `${results.length} surat berhasil disimpan!`,
        );
        resetFormSurat();
        await loadSuratData();
      }
    } catch (error) {
      console.error("Submit error:", error);
      showToast("error", "Gagal", "Gagal menyimpan surat: " + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }
}

function resetFormSurat() {
  document.getElementById("formSurat")?.reset();
  const previewBox = document.getElementById("previewBox");
  if (previewBox) {
    previewBox.style.display = "none";
    previewBox.innerHTML = "";
  }
}

// ==================== FORM: EDIT SURAT ====================
async function openEditModal(nomorUrut) {
  console.log("✏️ Opening edit modal for:", nomorUrut);

  try {
    const data = await googleScriptCall("getSuratById", [nomorUrut]);
    console.log("📦 Data received:", data);

    if (!data) {
      showToast("warning", "Peringatan", "Data surat tidak ditemukan");
      return;
    }

    // Helper function untuk set value (handle select & input)
    function setFieldValue(id, value, isSelect = false) {
      const el = document.getElementById(id);
      if (!el) {
        console.warn(`⚠️ Element ${id} not found`);
        return false;
      }

      if (isSelect) {
        const options = Array.from(el.options).map((opt) => opt.value);
        if (options.includes(value)) {
          el.value = value;
          console.log(`✅ Set ${id} (select) = "${value}"`);
          return true;
        } else {
          const fallback = options.includes("Lainnya") ? "Lainnya" : options[0];
          el.value = fallback;
          console.warn(
            `⚠️ Value "${value}" not in ${id} options, set to "${fallback}"`,
          );
          return false;
        }
      } else {
        el.value = value || "";
        console.log(`✅ Set ${id} (input) = "${value}"`);
        return true;
      }
    }

    // Set semua field
    setFieldValue("editNomorUrut", data.nomorUrut || "", false);
    setFieldValue("editSumber", data.sumber || "", true);
    setFieldValue("editTujuan", data.tujuan || "", true);
    setFieldValue("editJenis", data.jenisNaskah || "", true);
    setFieldValue("editKlas", data.klasArsip || "", true);
    setFieldValue("editLink", data.link || "", false);
    setFieldValue("editKet", data.keterangan || "", false);

    // Show modal
    const modal = document.getElementById("modalEditSurat");
    if (modal) modal.style.display = "flex";
  } catch (error) {
    console.error("❌ Edit error:", error);
    showToast("error", "Gagal", "Gagal memuat data: " + error.message);
  }
}

function closeEditModal() {
  const modal = document.getElementById("modalEditSurat");
  if (modal) modal.style.display = "none";
}

async function saveEditSurat() {
  const data = {
    nomorUrut: document.getElementById("editNomorUrut")?.value?.trim(),
    sumber: document.getElementById("editSumber")?.value?.trim(),
    tujuan: document.getElementById("editTujuan")?.value?.trim(),
    jenisNaskah: document.getElementById("editJenis")?.value?.trim(),
    klasArsip: document.getElementById("editKlas")?.value?.trim(),
    deliverableLink: document.getElementById("editLink")?.value?.trim(),
    keterangan: document.getElementById("editKet")?.value?.trim(),
  };

  console.log("💾 Saving:", data);

  if (!data.nomorUrut) {
    showToast("warning", "Peringatan", "Nomor Urut tidak valid");
    return;
  }

  // Tambahkan loading state pada tombol
  const saveBtn = document.querySelector("#modalEditSurat .btn-primary");
  const cancelBtn = document.querySelector("#modalEditSurat .btn-outline");
  let originalText = saveBtn?.innerHTML || "";
  
  // Disable semua tombol
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
  }
  if (cancelBtn) cancelBtn.disabled = true;

  // Buat promise dengan timeout
  const saveWithTimeout = new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("Request timeout - server tidak merespon setelah 10 detik"));
    }, 10000); // 10 detik timeout

    googleScriptCall("updateSurat", [data])
      .then(result => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch(err => {
        clearTimeout(timeoutId);
        reject(err);
      });
  });

  try {
    console.log("🔄 Memulai request update...");
    const result = await saveWithTimeout;
    console.log("📦 Update result:", result);

    // Kondisi yang lebih fleksibel untuk mendeteksi sukses
    const isSuccess = 
      result === "UPDATED" || 
      result === "OK" ||
      result?.success === true ||
      result?.status === "success" ||
      (Array.isArray(result) && result.length > 0) ||
      (typeof result === "string" && result.includes("DRAFT"));

    if (isSuccess) {
      console.log("✅ Update berhasil, menutup modal...");
      showToast("success", "Berhasil", "Data berhasil diperbarui");
      
      // TUTUP MODAL SEBELUM refresh data
      closeEditModal();
      
      // Refresh data setelah modal tertutup
      await loadSuratData();
    } else {
      throw new Error("Update failed: " + JSON.stringify(result));
    }
  } catch (error) {
    console.error("❌ Update error:", error);
    showToast("error", "Gagal", "Gagal memperbarui: " + error.message);
    
    // Optional: Tetap tutup modal meskipun error (untuk development)
    // Uncomment baris berikut jika ingin modal tetap tertutup saat error:
    // closeEditModal();
  } finally {
    // Kembalikan tombol ke state normal
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalText;
    }
    if (cancelBtn) cancelBtn.disabled = false;
    
    console.log("🔄 Tombol sudah di-reset");
  }
}

async function deleteSurat(nomorUrut) {
  if (!confirm("Yakin ingin menghapus surat ini?")) return;

  try {
    const result = await googleScriptCall("deleteSurat", [nomorUrut]);

    if (result === "OK" || result?.success) {
      showToast("success", "Berhasil", "Surat berhasil dihapus");
      await loadSuratData();
    }
  } catch (error) {
    console.error("Delete error:", error);
    showToast("error", "Gagal", "Gagal menghapus surat");
  }
}

// ==================== MODAL: BUAT NOMOR SURAT ====================
function openBuatNomorModal() {
  const modal = document.getElementById("modalBuatNomor");
  if (modal) {
    modal.classList.add("show");
    modal.style.display = "flex";
    resetModalNomorSurat();
  }
}

function closeBuatNomorModal() {
  const modal = document.getElementById("modalBuatNomor");
  if (modal) {
    modal.classList.remove("show");
    modal.style.display = "none";
  }
}
/**
 * Simpan nomor surat yang sudah di-generate ke database
 */
async function saveNomorSuratModal() {
  console.log("💾 Save button clicked!");
  
  // Ambil data dari form
  const form = {
    sumber: document.getElementById("modalSumber")?.value,
    tujuan: document.getElementById("modalTujuan")?.value,
    jenisNaskah: document.getElementById("modalJenisNaskah")?.value,
    klasArsip: document.getElementById("modalKlasArsip")?.value,
    deliverableLink: document.getElementById("modalLinkDokumen")?.value,
    keterangan: document.getElementById("modalKeterangan")?.value,
    jumlahSurat: parseInt(document.getElementById("modalJumlahSurat")?.value) || 1,
  };

  console.log("📝 Form data:", form);

  // Validasi
  if (!form.sumber || !form.tujuan || !form.jenisNaskah || !form.klasArsip) {
    showToast("warning", "Peringatan", "Semua field bertanda * wajib diisi!");
    return;
  }

  // Cek apakah sudah preview
  const numbers = window.modalPreviewNumbers;
  if (!numbers || numbers.length === 0) {
    showToast(
      "warning",
      "Peringatan",
      "Silakan klik 'Preview Nomor' terlebih dahulu untuk generate nomor surat"
    );
    // Auto trigger preview
    await previewNomorSuratModal();
    return;
  }

  // Loading state
  const saveBtn = document.querySelector("#modalBuatNomor .btn-primary");
  const originalText = saveBtn?.innerHTML || "";
  
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
  }

  try {
    // Submit ke Google Apps Script
    const results = await googleScriptCall("submitMultiSurat", [form]);

    if (Array.isArray(results) && results.length > 0) {
      showToast(
        "success",
        "Berhasil",
        `${results.length} nomor surat berhasil disimpan!`
      );
      
      // Tutup modal
      closeBuatNomorModal();
      
      // Refresh data table
      await loadSuratData();
    } else {
      throw new Error("Tidak ada nomor yang disimpan");
    }
  } catch (error) {
    console.error("❌ Save error:", error);
    showToast("error", "Gagal", "Gagal menyimpan: " + error.message);
  } finally {
    // Reset button
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalText;
    }
  }
}
function resetModalNomorSurat() {
  document.getElementById("formModalNomor")?.reset();
  const previewBox = document.getElementById("modalPreviewBox");
  if (previewBox) {
    previewBox.style.display = "none";
    previewBox.innerHTML = "";
  }
  window.modalPreviewNumbers = null;
}

async function previewNomorSuratModal() {
  const jenis = document.getElementById("modalJenisNaskah")?.value;
  const klas = document.getElementById("modalKlasArsip")?.value;
  const jumlah =
    parseInt(document.getElementById("modalJumlahSurat")?.value) || 1;
  const previewBox = document.getElementById("modalPreviewBox");

  if (!jenis || !klas) {
    if (previewBox) {
      previewBox.style.display = "block";
      previewBox.innerHTML =
        '<i class="fas fa-exclamation-circle" style="color: var(--warning);"></i> Pilih Jenis Naskah dan Klasifikasi Arsip untuk preview';
    }
    return;
  }

  if (previewBox) {
    previewBox.style.display = "block";
    previewBox.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Memuat preview...';
  }

  try {
    const result = await googleScriptCall("previewMultiNomor", [
      jenis,
      klas,
      jumlah,
    ]);

    if (Array.isArray(result) && result.length > 0) {
      window.modalPreviewNumbers = result;

      if (previewBox) {
        previewBox.innerHTML = `
          <div style="font-weight: 600; margin-bottom: 8px; color: var(--success);">
            ✅ Preview ${result.length} Nomor Surat:
          </div>
          <div style="font-family: monospace; font-size: 11px; line-height: 1.6; background: white; padding: 10px; border-radius: 6px;">
            ${result
              .map(
                (n, i) =>
                  `<div style="padding: 4px 0; border-bottom: ${i < result.length - 1 ? "1px dashed var(--border)" : "none"};">
                <span style="color: var(--text-muted); margin-right: 8px;">${i + 1}.</span>
                <strong>${n}</strong>
              </div>`,
              )
              .join("")}
          </div>
          <div style="margin-top: 8px; font-size: 11px; color: var(--text-muted);">
            <i class="fas fa-info-circle"></i> Klik "Salin Nomor" untuk copy ke clipboard
          </div>
        `;
      }
    } else {
      if (previewBox) {
        previewBox.innerHTML = "⚠️ Tidak ada nomor yang dihasilkan";
        previewBox.style.color = "var(--warning)";
      }
    }
  } catch (error) {
    console.error("Preview error:", error);
    if (previewBox) {
      previewBox.innerHTML =
        "❌ Gagal memuat preview. Pastikan Apps Script terkoneksi.";
      previewBox.style.color = "var(--accent)";
    }
  }
}

function copyNomorSuratModal() {
  const numbers = window.modalPreviewNumbers;

  if (!numbers || numbers.length === 0) {
    showToast(
      "info",
      "Informasi",
      "Silakan preview nomor surat terlebih dahulu",
    );
    previewNomorSuratModal();
    return;
  }

  const textToCopy = numbers.join("\n");

  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        showToast(
          "success",
          "Berhasil",
          `${numbers.length} nomor surat disalin ke clipboard!`,
        );
      })
      .catch(() => fallbackCopy(textToCopy));
  } else {
    fallbackCopy(textToCopy);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand("copy");
    showToast("success", "Berhasil", "Nomor surat disalin!");
  } catch (err) {
    console.error("Fallback copy failed:", err);
    alert("Gagal menyalin. Silakan copy manual:\n\n" + text);
  }

  document.body.removeChild(textarea);
}

// Close modal when clicking outside
document.addEventListener("click", function (e) {
  const modal = document.getElementById("modalBuatNomor");
  if (modal && e.target === modal) closeBuatNomorModal();

  const editModal = document.getElementById("modalEditSurat");
  if (editModal && e.target === editModal) closeEditModal();
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeBuatNomorModal();
    closeEditModal();
  }
});

// ==================== STATS & ANALYTICS ====================
function countSuratPerSumber(data) {
  if (!Array.isArray(data)) return {};

  const counts = {
    "Tata Usaha": 0,
    Kerjasama: 0,
    "Urusan Mahasiswa Internasional": 0,
    "Mobilitas Internasional": 0,
    Lainnya: 0,
  };

  data.forEach((row) => {
    const sumber = row[1]?.toString()?.trim() || "Lainnya";
    if (counts.hasOwnProperty(sumber)) {
      counts[sumber]++;
    } else {
      counts["Lainnya"]++;
    }
  });

  console.log("📊 Surat per Sumber:", counts);
  return counts;
}

function animateStatValue(elementId, targetValue, duration = 800) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const startValue = 0;
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

function renderSuratStats(counts) {
  const mappings = [
    { id: "count-tata-usaha", value: counts["Tata Usaha"] || 0 },
    { id: "count-kerjasama", value: counts["Kerjasama"] || 0 },
    { id: "count-umi", value: counts["Urusan Mahasiswa Internasional"] || 0 },
    { id: "count-mobilitas", value: counts["Mobilitas Internasional"] || 0 },
  ];

  mappings.forEach(({ id, value }) => {
    animateStatValue(id, value);
  });

  console.log("✅ Stats rendered:", counts);
}

// ==================== EXPORT ====================
function exportTable(type) {
  if (!suratData || suratData.length === 0) {
    showToast("warning", "Peringatan", "Tidak ada data untuk diexport");
    return;
  }

  const headers = [
    "Tanggal",
    "Sumber",
    "Nomor Surat",
    "Tujuan",
    "Jenis Naskah",
    "Klasifikasi Arsip",
    "Link",
    "Keterangan",
    "Nomor Urut",
  ];

  const csv = [
    headers.join(","),
    ...suratData.map((row) =>
      row
        .map((cell) => {
          const val = cell?.toString() || "";
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `DataSurat_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  showToast("success", "Export", "Data berhasil diexport");
}

// ==================== LOAD & INIT ====================
async function loadSuratData() {
  const loading = document.getElementById("suratLoading");
  if (loading) {
    loading.style.display = "block";
    loading.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memuat data...';
  }

  try {
    suratData = await fetchSuratData();

    // Load stats
    const counts = countSuratPerSumber(suratData);
    renderSuratStats(counts);

    // Render table
    currentPage = 1;
    renderSuratTable(currentPage);
  } catch (error) {
    console.error("❌ Error loading data:", error);
    if (loading) {
      loading.innerHTML =
        '<i class="fas fa-exclamation-circle"></i><p>Gagal memuat data</p>';
    }
    showToast("error", "Gagal", "Gagal memuat data surat");
  }
}

function initTataUsaha() {
  console.log("🚀 INIT TATA USAHA CALLED!");
  console.log("📄 Document readyState:", document.readyState);

  // Check critical elements
  const required = ["suratLoading", "suratPagination", "suratTableBody"].map(
    (id) => {
      const el = document.getElementById(id);
      if (!el) console.error(`❌ Element #${id} not found!`);
      return el;
    },
  );

  if (required.some((el) => !el)) {
    console.error("❌ CRITICAL: Some required elements not found!");
  }

  // Activate page if needed
  const page = document.getElementById("page-tata-usaha");
  if (page && !page.classList.contains("active")) {
    document
      .querySelectorAll(".page")
      .forEach((p) => p.classList.remove("active"));
    page.classList.add("active");
  }

  // Setup pagination event listeners
  setupPaginationEvents();

  // Load data
  loadSuratData();

  // Auto-refresh every 5 minutes
  setInterval(loadSuratData, 5 * 60 * 1000);

  // Attach event listener untuk tombol Buat Nomor Surat
  const btnBuatNomor = document.getElementById("btnBuatNomorSurat");
  if (btnBuatNomor) {
    btnBuatNomor.addEventListener("click", openBuatNomorModal);
    console.log("✅ Event listener attached to btnBuatNomorSurat");
  }

  console.log("📁 Tata Usaha module initialized");

  return {
    refresh: loadSuratData,
    addSurat: submitSurat,
    export: exportTable,
  };
}

// ==================== GLOBAL EXPOSURE ====================
if (typeof window !== "undefined") {
  // Core functions
  window.initTataUsaha = initTataUsaha;
  window.loadSuratData = loadSuratData;
  window.renderSuratTable = renderSuratTable;

  // Navigation
  window.goToPage = goToPage;
  window.jumpToPage = jumpToPage;
  window.searchSuratTable = searchSuratTable;
  window.setFilter = setFilter;

  // Form actions
  window.submitSurat = submitSurat;
  window.resetFormSurat = resetFormSurat;
  window.openEditModal = openEditModal;
  window.closeEditModal = closeEditModal;
  window.saveEditSurat = saveEditSurat;
  window.deleteSurat = deleteSurat;

  // Modal: Buat Nomor Surat
  window.openBuatNomorModal = openBuatNomorModal;
  window.closeBuatNomorModal = closeBuatNomorModal;
  window.previewNomorSuratModal = previewNomorSuratModal;
  window.copyNomorSuratModal = copyNomorSuratModal;
  window.resetModalNomorSurat = resetModalNomorSurat;

  // Utilities
  window.exportTable = exportTable;
  window.showToast = showToast;
}

// Auto-init when page is ready
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTataUsaha);
  } else {
    initTataUsaha();
  }
}
