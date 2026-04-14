/**
 * ========================================
 * TATA-USAHA.JS - Surat Management Module
 * ========================================
 * Integrated with Google Apps Script Backend
 */

// Konfigurasi
const APPS_SCRIPT_URL_SURAT =
  "https://script.google.com/macros/s/AKfycbxI9Ew-lICjHRbwWrj7ZFir6AqFsg3M-aWz0VmfziwY_c4gez1yTgVw6-GF0SATWx3_/exec";
let suratData = [];
let currentPage = 1;
const rowsPerPage = 10;
let currentFilter = "semua";

/**
 * Fetch data surat dari Google Apps Script
 */
async function fetchSuratData() {
  try {
    const url = `${APPS_SCRIPT_URL_SURAT}?t=${Date.now()}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = await response.json();

    // Handle GViz JSONP format jika digunakan
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

/**
 * Format tanggal dari Google Sheets
 */
function formatDateGS(value) {
  if (!value) return "-";

  // Handle Date object string from GViz
  if (typeof value === "string" && value.startsWith("Date(")) {
    const parts = value
      .replace("Date(", "")
      .replace(")", "")
      .split(",")
      .map((p) => p.trim());
    const y = parseInt(parts[0]),
      mo = parseInt(parts[1]),
      d = parseInt(parts[2]);
    const h = parts[3] ? parseInt(parts[3]) : 0,
      min = parts[4] ? parseInt(parts[4]) : 0;
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

  // Handle normal date
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

/**
 * Render tabel surat dengan pagination
 */
function renderSuratTable(data, page = 1) {
  const tbody = document.getElementById("suratTableBody");
  const container = document.getElementById("suratTableContainer");
  const loading = document.getElementById("suratLoading");
  const pagination = document.getElementById("suratPagination");

  if (!tbody || !container) return;

  // Filter data
  let filtered = data.filter((row) => {
    if (currentFilter === "semua") return true;
    const sumber = (row[1] || "").toLowerCase();
    if (currentFilter === "masuk")
      return sumber.includes("masuk") || sumber.includes("tata usaha");
    if (currentFilter === "keluar")
      return sumber.includes("keluar") || sumber.includes("mitra");
    if (currentFilter === "disposisi")
      return (row[4] || "").toLowerCase().includes("disposisi");
    return true;
  });

  // Search filter
  const search =
    document.getElementById("searchSurat")?.value?.toLowerCase() || "";
  if (search) {
    filtered = filtered.filter((row) =>
      row.join(" ").toLowerCase().includes(search),
    );
  }

  // Reverse untuk tampilkan terbaru di atas
  filtered.reverse();

  if (filtered.length === 0) {
    container.style.display = "none";
    loading.style.display = "block";
    loading.innerHTML =
      '<i class="fas fa-inbox" style="font-size: 48px; opacity: 0.3;"></i><p style="margin-top: 12px;">Tidak ada data surat</p>';
    pagination.innerHTML = "";
    return;
  }

  // Pagination
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const start = (page - 1) * rowsPerPage;
  const paged = filtered.slice(start, start + rowsPerPage);

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
        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${keterangan || "-"}</td>
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

  // Render pagination
  renderPagination(pagination, page, totalPages);
}

/**
 * Render pagination controls
 */
function renderPagination(container, currentPage, totalPages) {
  if (!container) return;

  let html = "";

  // Prev button
  html += `<button class="btn btn-outline btn-sm" ${currentPage === 1 ? "disabled" : ""} onclick="changeSuratPage(${currentPage - 1})">« Prev</button>`;

  // Page info
  html += `<span style="font-size: 12px; color: var(--text-muted); padding: 0 8px;">Hal ${currentPage} dari ${totalPages}</span>`;

  // Next button
  html += `<button class="btn btn-outline btn-sm" ${currentPage === totalPages ? "disabled" : ""} onclick="changeSuratPage(${currentPage + 1})">Next »</button>`;

  // Page numbers (if not too many)
  if (totalPages <= 7) {
    html += '<span style="margin-left: 12px;">';
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="btn btn-sm ${i === currentPage ? "btn-primary" : "btn-outline"}" onclick="changeSuratPage(${i})" style="padding: 4px 10px; margin: 0 2px;">${i}</button>`;
    }
    html += "</span>";
  }

  container.innerHTML = html;
}

/**
 * Change page handler
 */
function changeSuratPage(page) {
  currentPage = Math.max(
    1,
    Math.min(page, Math.ceil(suratData.length / rowsPerPage)),
  );
  renderSuratTable(suratData, currentPage);
}

/**
 * Search handler
 */
function searchSuratTable() {
  currentPage = 1;
  renderSuratTable(suratData, currentPage);
}

/**
 * Preview nomor surat
 */
async function previewNomorSurat() {
  const jenis = document.getElementById("jenisNaskah")?.value;
  const klas = document.getElementById("klasArsip")?.value;
  const jumlah = parseInt(document.getElementById("jumlahSurat")?.value) || 1;

  if (!jenis || !klas) {
    if (typeof window.showToast === "function") {
      window.showToast(
        "warning",
        "Peringatan",
        "Jenis Naskah dan Klasifikasi Arsip wajib dipilih!",
      );
    }
    return;
  }

  const previewBox = document.getElementById("previewBox");
  previewBox.style.display = "block";
  previewBox.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> Memuat preview...';

  try {
    // Call Apps Script
    const result = await googleScriptCall("previewMultiNomor", [
      jenis,
      klas,
      jumlah,
    ]);

    if (Array.isArray(result) && result.length > 0) {
      previewBox.innerHTML = `
        <strong>📋 Preview ${result.length} Nomor Surat:</strong><br><br>
        ${result.map((n, i) => `<div style="padding: 4px 0;">${i + 1}. ${n}</div>`).join("")}
      `;
    } else {
      previewBox.innerHTML = "⚠️ Tidak ada nomor yang dihasilkan";
    }
  } catch (error) {
    console.error("Preview error:", error);
    previewBox.innerHTML = "❌ Gagal memuat preview";
  }
}

/**
 * Submit surat baru
 */
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
    if (typeof window.showToast === "function") {
      window.showToast(
        "warning",
        "Peringatan",
        "Semua field bertanda * wajib diisi!",
      );
    }
    return;
  }

  // Loading state
  const submitBtn = document.querySelector("#formSurat .btn-primary");
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

  try {
    // Call Apps Script
    const results = await googleScriptCall("submitMultiSurat", [form]);

    if (Array.isArray(results) && results.length > 0) {
      if (typeof window.showToast === "function") {
        window.showToast(
          "success",
          "Berhasil",
          `${results.length} surat berhasil disimpan!`,
        );
      }

      // Reset form & reload data
      resetFormSurat();
      await loadSuratData();
    }
  } catch (error) {
    console.error("Submit error:", error);
    if (typeof window.showToast === "function") {
      window.showToast(
        "error",
        "Gagal",
        "Gagal menyimpan surat: " + error.message,
      );
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

/**
 * Reset form
 */
function resetFormSurat() {
  document.getElementById("formSurat")?.reset();
  document.getElementById("previewBox").style.display = "none";
}

/**
 * Load data surat + render stats
 */
async function loadSuratData() {
  const loading = document.getElementById("suratLoading");
  if (loading) {
    loading.style.display = "block";
    loading.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memuat data...';
  }

  try {
    suratData = await fetchSuratData();
    
    // ✅ Load stats setelah data tersedia
    const counts = countSuratPerSumber(suratData);
    renderSuratStats(counts);
    
    // Render table
    currentPage = 1;
    renderSuratTable(suratData, currentPage);
    
  } catch (error) {
    console.error("❌ Error loading data:", error);
    if (loading) {
      loading.innerHTML = '<i class="fas fa-exclamation-circle"></i><p>Gagal memuat data</p>';
    }
  }
}
/**
 * Open modal Buat Nomor Surat
 */
function openNomorSuratModal() {
  const modal = document.getElementById('modalNomorSurat');
  if (modal) {
    modal.style.display = 'flex';
    
    // Reset form
    document.getElementById('modalJenisNaskah').value = '';
    document.getElementById('modalKlasArsip').value = '';
    document.getElementById('modalJumlah').value = '1';
    document.getElementById('modalPreviewBox').style.display = 'none';
    document.getElementById('modalPreviewBox').innerHTML = '';
  }
}

/**
 * Close modal Buat Nomor Surat
 */
function closeNomorSuratModal() {
  const modal = document.getElementById('modalNomorSurat');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Preview nomor surat di modal
 */
async function previewNomorSuratModal() {
  const jenis = document.getElementById('modalJenisNaskah')?.value;
  const klas = document.getElementById('modalKlasArsip')?.value;
  const jumlah = parseInt(document.getElementById('modalJumlah')?.value) || 1;
  const previewBox = document.getElementById('modalPreviewBox');
  
  if (!jenis || !klas) {
    previewBox.style.display = 'block';
    previewBox.innerHTML = '<i class="fas fa-info-circle"></i> Pilih Jenis Naskah dan Klasifikasi Arsip untuk preview';
    previewBox.style.color = 'var(--text-muted)';
    return;
  }
  
  previewBox.style.display = 'block';
  previewBox.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memuat preview...';
  previewBox.style.color = 'var(--text-secondary)';
  
  try {
    const result = await googleScriptCall('previewMultiNomor', [jenis, klas, jumlah]);
    
    if (Array.isArray(result) && result.length > 0) {
      previewBox.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 8px; color: var(--success);">
          ✅ Preview ${result.length} Nomor Surat:
        </div>
        <div style="font-family: monospace; font-size: 11px; line-height: 1.6;">
          ${result.map((n, i) => 
            `<div style="padding: 4px 0; border-bottom: 1px dashed var(--border);">
              ${i + 1}. ${n}
            </div>`
          ).join('')}
        </div>
      `;
      previewBox.style.color = 'var(--text-primary)';
      
      // Simpan hasil preview untuk fungsi copy
      window.lastPreviewNumbers = result;
    } else {
      previewBox.innerHTML = '⚠️ Tidak ada nomor yang dihasilkan';
      previewBox.style.color = 'var(--warning)';
    }
  } catch (error) {
    console.error('Preview error:', error);
    previewBox.innerHTML = '❌ Gagal memuat preview. Pastikan Apps Script terkoneksi.';
    previewBox.style.color = 'var(--accent)';
  }
}
/**
 * Simpan surat dari modal Buat Nomor Surat
 */
async function saveNomorSuratModal() {
  // Collect data dari form modal
  const form = {
    sumber: document.getElementById("modalSumber")?.value?.trim(),
    tujuan: document.getElementById("modalTujuan")?.value?.trim(),
    jenisNaskah: document.getElementById("modalJenisNaskah")?.value?.trim(),
    klasArsip: document.getElementById("modalKlasArsip")?.value?.trim(),
    deliverableLink: document.getElementById("modalDeliverableLink")?.value?.trim(),
    keterangan: document.getElementById("modalKeterangan")?.value?.trim(),
    jumlahSurat: parseInt(document.getElementById("modalJumlahSurat")?.value) || 1,
  };

  console.log("💾 Saving from modal:", form);

  // Validasi field wajib
  if (!form.sumber || !form.tujuan || !form.jenisNaskah || !form.klasArsip) {
    if (typeof window.showToast === "function") {
      window.showToast("warning", "Peringatan", "Semua field bertanda * wajib diisi!");
    } else {
      alert("Semua field bertanda * wajib diisi!");
    }
    return;
  }

  // Loading state pada tombol Simpan
  const saveBtn = document.querySelector("#formModalNomor .btn-primary");
  const originalText = saveBtn?.innerHTML;
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
  }

  try {
    // Call Apps Script untuk submit
    const results = await googleScriptCall("submitMultiSurat", [form]);

    if (Array.isArray(results) && results.length > 0) {
      if (typeof window.showToast === "function") {
        window.showToast("success", "Berhasil", `${results.length} surat berhasil disimpan!`);
      } else {
        alert(`${results.length} surat berhasil disimpan!\n\nNomor:\n${results.join('\n')}`);
      }

      // Reset form & close modal & refresh table
      resetModalNomorSurat();
      closeBuatNomorModal();
      await loadSuratData(); // Refresh tabel riwayat
    }
  } catch (error) {
    console.error("Submit modal error:", error);
    if (typeof window.showToast === "function") {
      window.showToast("error", "Gagal", "Gagal menyimpan surat: " + error.message);
    } else {
      alert("Gagal menyimpan: " + error.message);
    }
  } finally {
    // Restore tombol
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalText || '<i class="fas fa-save"></i> Simpan';
    }
  }
}
/**
 * Generate dan copy nomor surat ke clipboard
 */
function generateAndCopyNomorSurat() {
  const numbers = window.lastPreviewNumbers;
  
  if (!numbers || numbers.length === 0) {
    alert('Silakan preview nomor surat terlebih dahulu');
    previewNomorSuratModal();
    return;
  }
  
  // Format untuk copy
  const textToCopy = numbers.join('\n');
  
  // Copy to clipboard
  navigator.clipboard.writeText(textToCopy).then(() => {
    if (typeof window.showToast === 'function') {
      window.showToast('success', 'Berhasil', `${numbers.length} nomor surat disalin ke clipboard!`);
    } else {
      alert(`✅ ${numbers.length} nomor surat disalin:\n\n${textToCopy}`);
    }
    closeNomorSuratModal();
  }).catch(err => {
    console.error('Copy failed:', err);
    alert('Gagal menyalin. Silakan copy manual:\n\n' + textToCopy);
  });
}

/**
 * Close modal when clicking outside
 */
document.addEventListener('click', function(e) {
  const modal = document.getElementById('modalNomorSurat');
  if (modal && e.target === modal) {
    closeNomorSuratModal();
  }
});
/**
 * Open edit modal - dengan handling select elements yang benar
 */
async function openEditModal(nomorUrut) {
  console.log("✏️ Opening edit modal for:", nomorUrut);
  
  try {
    const data = await googleScriptCall("getSuratById", [nomorUrut]);
    console.log("📦 Data received:", data);

    if (!data) {
      console.error("❌ No data found");
      alert("Data surat tidak ditemukan");
      return;
    }

    // ✅ Helper function untuk set value (handle select & input)
    function setFieldValue(id, value, isSelect = false) {
      const el = document.getElementById(id);
      if (!el) {
        console.warn(`⚠️ Element ${id} not found`);
        return false;
      }
      
      if (isSelect) {
        // Untuk select: cek apakah value ada di options
        const options = Array.from(el.options).map(opt => opt.value);
        if (options.includes(value)) {
          el.value = value;
          console.log(`✅ Set ${id} (select) = "${value}"`);
          return true;
        } else {
          // Jika value tidak ada, set ke option pertama atau "Lainnya"
          const fallback = options.includes("Lainnya") ? "Lainnya" : options[0];
          el.value = fallback;
          console.warn(`⚠️ Value "${value}" not in ${id} options, set to "${fallback}"`);
          return false;
        }
      } else {
        // Untuk input/textarea
        el.value = value || "";
        console.log(`✅ Set ${id} (input) = "${value}"`);
        return true;
      }
    }

    // ✅ Set semua field dengan mapping yang benar
    setFieldValue("editNomorUrut", data.nomorUrut || "", false);
    setFieldValue("editSumber", data.sumber || "", true);  // ✅ Select
    setFieldValue("editTujuan", data.tujuan || "", true);  // ✅ Select
    setFieldValue("editJenis", data.jenisNaskah || "", true);  // ✅ Select
    setFieldValue("editKlas", data.klasArsip || "", true);  // ✅ Select
    setFieldValue("editLink", data.link || "", false);
    setFieldValue("editKet", data.keterangan || "", false);

    // Show modal
    const modal = document.getElementById("modalEditSurat");
    if (modal) {
      modal.style.display = "flex";
      console.log("✅ Modal displayed");
    }

  } catch (error) {
    console.error("❌ Edit error:", error);
    alert("Gagal memuat data: " + error.message);
  }
}

/**
 * Close edit modal
 */
function closeEditModal() {
  document.getElementById("modalEditSurat").style.display = "none";
}

/**
 * Save edit - pastikan field names match dengan Code.gs
 */
async function saveEditSurat() {
  const data = {
    nomorUrut: document.getElementById("editNomorUrut")?.value?.trim(),
    sumber: document.getElementById("editSumber")?.value?.trim(),
    tujuan: document.getElementById("editTujuan")?.value?.trim(),
    jenisNaskah: document.getElementById("editJenis")?.value?.trim(),
    klasArsip: document.getElementById("editKlas")?.value?.trim(),
    deliverableLink: document.getElementById("editLink")?.value?.trim(),
    keterangan: document.getElementById("editKet")?.value?.trim()
  };

  console.log("💾 Saving:", data);

  if (!data.nomorUrut) {
    alert("Nomor Urut tidak valid");
    return;
  }

  try {
    const result = await googleScriptCall("updateSurat", [data]);
    console.log("📦 Update result:", result);

    if (result === "UPDATED") {
      alert("Data berhasil diperbarui");
      closeEditModal();
      await loadSuratData(); // Refresh table
    } else {
      throw new Error("Update failed: " + result);
    }
  } catch (error) {
    console.error("❌ Update error:", error);
    alert("Gagal memperbarui: " + error.message);
  }
}

/**
 * Delete surat
 */
async function deleteSurat(nomorUrut) {
  if (!confirm("Yakin ingin menghapus surat ini?")) return;

  try {
    const result = await googleScriptCall("deleteSurat", [nomorUrut]);

    if (result === "OK") {
      if (typeof window.showToast === "function") {
        window.showToast("success", "Berhasil", "Surat berhasil dihapus");
      }
      await loadSuratData();
    }
  } catch (error) {
    console.error("Delete error:", error);
    if (typeof window.showToast === "function") {
      window.showToast("error", "Gagal", "Gagal menghapus surat");
    }
  }
}

/**
 * Export table to CSV
 */
function exportTable(type) {
  if (!suratData || suratData.length === 0) {
    if (typeof window.showToast === "function") {
      window.showToast(
        "warning",
        "Peringatan",
        "Tidak ada data untuk diexport",
      );
    }
    return;
  }

  // Headers
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

  // Convert to CSV
  const csv = [
    headers.join(","),
    ...suratData.map((row) =>
      row
        .map((cell) => {
          const val = cell?.toString() || "";
          // Escape commas and quotes
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(","),
    ),
  ].join("\n");

  // Download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `DataSurat_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  if (typeof window.showToast === "function") {
    window.showToast("success", "Export", "Data berhasil diexport");
  }
}

/**
 * Helper: Call Google Apps Script function dengan fallback
 */
async function googleScriptCall(functionName, args) {
  // Coba method 1: GET request
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
  
  if (functionName === 'previewMultiNomor') {
    const [jenis, klas, jumlah] = args;
    const dummy = [];
    for (let i = 1; i <= (jumlah || 1); i++) {
      dummy.push(`PREVIEW/${Date.now()}-${i}/UNIDA/B.5-XX/XX/XII/1445`);
    }
    return dummy;
  }
  
  if (functionName === 'submitMultiSurat') {
    return [`DRAFT/${Date.now()}`];
  }
  
  if (functionName === 'getAllSurat' || functionName === undefined) {
    return [];
  }
  
  throw new Error(`Function ${functionName} not available (Apps Script not connected)`);
}

/**
 * Initialize tata usaha module
 */
function initTataUsaha() {
  // Load data on init
  loadSuratData();

  // Auto-refresh every 5 minutes
  setInterval(loadSuratData, 5 * 60 * 1000);
  // ✅ Attach event listener untuk tombol Buat Nomor Surat
  const btnBuatNomor = document.getElementById('btnBuatNomorSurat');
  if (btnBuatNomor) {
    btnBuatNomor.addEventListener('click', openBuatNomorModal);
  }

  console.log("📁 Tata Usaha module initialized");

  return {
    refresh: loadSuratData,
    addSurat: submitSurat,
    export: exportTable,
  };
}

// ========================================
// GLOBAL EXPOSURE
// ========================================
if (typeof window !== "undefined") {
  window.simpanSurat = submitSurat;
  window.initTataUsaha = initTataUsaha;
  window.previewNomorSurat = previewNomorSurat;
  window.searchSuratTable = searchSuratTable;
  window.filterSuratTable = filterSuratTable;
  window.changeSuratPage = changeSuratPage;
  window.openEditModal = openEditModal;
  window.closeEditModal = closeEditModal;
  window.saveEditSurat = saveEditSurat;
  window.deleteSurat = deleteSurat;
  window.exportTable = exportTable;
  
  // ✅ TAMBAHKAN FUNGSI MODAL BUAT NOMOR SURAT
  window.openBuatNomorModal = openBuatNomorModal;
  window.closeBuatNomorModal = closeBuatNomorModal;
  window.previewNomorSuratModal = previewNomorSuratModal;
  window.copyNomorSuratModal = copyNomorSuratModal;
  window.resetModalNomorSurat = resetModalNomorSurat;
  window.saveNomorSuratModal = saveNomorSuratModal;
}

// Auto-init when page is ready
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTataUsaha);
  } else {
    initTataUsaha();
  }
}
/**
 * Open modal Buat Nomor Surat
 */
function openBuatNomorModal() {
  const modal = document.getElementById('modalBuatNomor');
  if (modal) {
    modal.classList.add('show');
    modal.style.display = 'flex';
    
    // Reset form modal
    resetModalNomorSurat();
  }
}

/**
 * Close modal Buat Nomor Surat
 */
function closeBuatNomorModal() {
  const modal = document.getElementById('modalBuatNomor');
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
  }
}

/**
 * Reset form modal
 */
function resetModalNomorSurat() {
  document.getElementById('formModalNomor')?.reset();
  const previewBox = document.getElementById('modalPreviewBox');
  if (previewBox) {
    previewBox.style.display = 'none';
    previewBox.innerHTML = '';
  }
  // Clear cached preview
  window.modalPreviewNumbers = null;
}

/**
 * Preview nomor surat di modal
 */
async function previewNomorSuratModal() {
  const jenis = document.getElementById('modalJenisNaskah')?.value;
  const klas = document.getElementById('modalKlasArsip')?.value;
  const jumlah = parseInt(document.getElementById('modalJumlahSurat')?.value) || 1;
  const previewBox = document.getElementById('modalPreviewBox');
  
  // Validasi
  if (!jenis || !klas) {
    previewBox.style.display = 'block';
    previewBox.innerHTML = '<i class="fas fa-exclamation-circle" style="color: var(--warning);"></i> Pilih Jenis Naskah dan Klasifikasi Arsip untuk preview';
    previewBox.style.color = 'var(--text-muted)';
    return;
  }
  
  previewBox.style.display = 'block';
  previewBox.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memuat preview...';
  previewBox.style.color = 'var(--text-secondary)';
  
  try {
    const result = await googleScriptCall('previewMultiNomor', [jenis, klas, jumlah]);
    
    if (Array.isArray(result) && result.length > 0) {
      // Cache untuk fungsi copy
      window.modalPreviewNumbers = result;
      
      previewBox.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 8px; color: var(--success);">
          ✅ Preview ${result.length} Nomor Surat:
        </div>
        <div style="font-family: monospace; font-size: 11px; line-height: 1.6; background: white; padding: 10px; border-radius: 6px;">
          ${result.map((n, i) => 
            `<div style="padding: 4px 0; border-bottom: ${i < result.length - 1 ? '1px dashed var(--border)' : 'none'};">
              <span style="color: var(--text-muted); margin-right: 8px;">${i + 1}.</span>
              <strong>${n}</strong>
            </div>`
          ).join('')}
        </div>
        <div style="margin-top: 8px; font-size: 11px; color: var(--text-muted);">
          <i class="fas fa-info-circle"></i> Klik "Salin Nomor" untuk copy ke clipboard
        </div>
      `;
      previewBox.style.color = 'var(--text-primary)';
    } else {
      previewBox.innerHTML = '⚠️ Tidak ada nomor yang dihasilkan';
      previewBox.style.color = 'var(--warning)';
    }
  } catch (error) {
    console.error('Preview error:', error);
    previewBox.innerHTML = '❌ Gagal memuat preview. Pastikan Apps Script terkoneksi.';
    previewBox.style.color = 'var(--accent)';
  }
}

/**
 * Copy nomor surat ke clipboard dari modal
 */
function copyNomorSuratModal() {
  const numbers = window.modalPreviewNumbers;
  
  if (!numbers || numbers.length === 0) {
    alert('Silakan preview nomor surat terlebih dahulu');
    previewNomorSuratModal();
    return;
  }
  
  // Format untuk copy (satu per baris)
  const textToCopy = numbers.join('\n');
  
  // Copy to clipboard
  if (navigator.clipboard) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      if (typeof window.showToast === 'function') {
        window.showToast('success', 'Berhasil', `${numbers.length} nomor surat disalin ke clipboard!`);
      } else {
        alert(`✅ ${numbers.length} nomor surat disalin:\n\n${textToCopy}`);
      }
      // Auto close modal setelah copy (opsional)
      // closeBuatNomorModal();
    }).catch(err => {
      console.error('Copy failed:', err);
      fallbackCopy(textToCopy);
    });
  } else {
    fallbackCopy(textToCopy);
  }
}

/**
 * Fallback copy untuk browser lama
 */
function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  
  try {
    document.execCommand('copy');
    if (typeof window.showToast === 'function') {
      window.showToast('success', 'Berhasil', 'Nomor surat disalin!');
    } else {
      alert('✅ Nomor surat disalin ke clipboard');
    }
  } catch (err) {
    console.error('Fallback copy failed:', err);
    alert('Gagal menyalin. Silakan copy manual:\n\n' + text);
  }
  
  document.body.removeChild(textarea);
}

/**
 * Close modal when clicking outside
 */
document.addEventListener('click', function(e) {
  const modal = document.getElementById('modalBuatNomor');
  if (modal && e.target === modal) {
    closeBuatNomorModal();
  }
});

/**
 * Close modal on Escape key
 */
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeBuatNomorModal();
  }
});
/**
 * Hitung jumlah surat per Sumber dari data
 * Kolom "Sumber" ada di index 1 (berdasarkan struktur data)
 */
function countSuratPerSumber(data) {
  if (!Array.isArray(data)) return {};
  
  const counts = {
    "Tata Usaha": 0,
    "Kerjasama": 0,
    "Urusan Mahasiswa Internasional": 0,
    "Mobilitas Internasional": 0,
    "Lainnya": 0
  };
  
  data.forEach(row => {
    // Kolom Sumber = index 1
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

/**
 * Animasi counting angka untuk stat cards
 */
function animateStatValue(elementId, targetValue, duration = 800) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const startValue = 0;
  const startTime = performance.now();
  
  function step(currentTime) {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    // Easing function untuk animasi smooth
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.floor(easeOut * (targetValue - startValue) + startValue);
    
    element.textContent = currentValue;
    
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      // Ensure final value is exact
      element.textContent = targetValue;
    }
  }
  
  requestAnimationFrame(step);
}

/**
 * Render stats ke UI elements
 */
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

/**
 * Load dan render stats surat per sumber
 */
async function loadSuratStats() {
  try {
    const data = await fetchSuratData();
    const counts = countSuratPerSumber(data);
    renderSuratStats(counts);
    return counts;
  } catch (error) {
    console.error("❌ Error loading stats:", error);
    // Fallback: render 0 untuk semua
    renderSuratStats({
      "Tata Usaha": 0,
      "Kerjasama": 0,
      "Urusan Mahasiswa Internasional": 0,
      "Mobilitas Internasional": 0
    });
    return null;
  }
}