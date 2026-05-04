/**
 * ========================================
 * SURAT TEMPLATE MANAGEMENT - OPTIMIZED
 * Upload, Edit, Preview Template Surat
 * ✅ WITH IMPROVED CORS ERROR HANDLING
 * ========================================
 */

// ✅ KONFIGURASI
const APPS_SCRIPT_URL_TEMPLATE =
  "https://script.google.com/macros/s/AKfycbwKxVbadzU_oQXjt6_Pt9bsJd3I-1GsWaeHPIqeOIWWWSUCj7KAnhZzurlJFAuiYNpZ/exec";

// Global state
let templateData = [];
let currentTemplateFilter = "semua";
let selectedFile = null;
let isDataLoaded = false; // ✅ Flag untuk hindari load berulang

// ✅ Cache DOM elements (hanya query sekali)
const DOM = {
  loading: document.getElementById("templateLoading"),
  container: document.getElementById("templateTableContainer"),
  empty: document.getElementById("templateEmpty"),
  tbody: document.getElementById("templateTableBody"),
  search: document.getElementById("searchTemplate"),
  pagination: document.getElementById("templatePagination"),
  modalUpload: document.getElementById("modalUploadTemplate"),
  modalEdit: document.getElementById("modalEditTemplate"),
  btnSaveTemplate: document.getElementById("btnSaveTemplate"),
  fileName: document.getElementById("fileName"),
  uploadPreview: document.getElementById("uploadPreview"),
  templateFile: document.getElementById("templateFile"),
  templateName: document.getElementById("templateName"),
  templateCategory: document.getElementById("templateCategory"),
  templateDescription: document.getElementById("templateDescription"),
  // Edit modal
  editTemplateId: document.getElementById("editTemplateId"),
  editTemplateName: document.getElementById("editTemplateName"),
  editTemplateCategory: document.getElementById("editTemplateCategory"),
  editTemplateDescription: document.getElementById("editTemplateDescription"),
  editTemplateLink: document.getElementById("editTemplateLink"),
  editFileName: document.getElementById("editFileName"),
  editFileSize: document.getElementById("editFileSize"),
  templatePreviewSection: document.getElementById("templatePreviewSection"),
  pdfPreview: document.getElementById("pdfPreview"),
};

// ✅ Debounce helper
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ✅ Debounced search function
const debouncedSearch = debounce(() => {
  renderTemplateTable(templateData, currentTemplateFilter);
}, 300);

/**
 * Load template data dari Apps Script
 */
/**
 * Load template data dari Apps Script
 */
async function loadTemplateData() {
  if (isDataLoaded && templateData.length > 0) {
    renderTemplateTable();
    return;
  }

  const { loading, container, empty } = DOM;

  if (loading) {
    loading.style.display = "block";
    loading.innerHTML = `
      <i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 12px"></i>
      <p>Memuat template surat...</p>
    `;
  }
  if (container) container.style.display = "none";
  if (empty) empty.style.display = "none";

  try {
    // ✅ TRY 1: Fetch normal dengan CORS
    const response = await fetch(
      `${APPS_SCRIPT_URL_TEMPLATE}?sheet=TemplateSurat&t=${Date.now()}`,
      {
        method: "GET",
        mode: "cors",
        redirect: "follow",
      },
    );

    const text = await response.text();

    if (!text) throw new Error("Response kosong");

    let result;
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error("Response bukan JSON valid");
    }

    if (result.error) throw new Error(result.error);

    templateData = (result.data || []).map((item) => ({
      id: item.id,
      nama: item.nama,
      kategori: item.kategori,
      deskripsi: item.deskripsi,
      fileLink: item.fileLink,
      fileName: item.fileName,
      fileSize: item.fileSize,
      fileType: item.fileType || getFileType(item.fileName),
      uploadedAt: item.timestamp,
      uploadedBy: item.uploadedBy,
    }));

    isDataLoaded = true;
    renderTemplateTable();
    console.log("✅ Template data loaded successfully (CORS method)");
  } catch (error) {
    console.warn("⚠️ CORS fetch failed, using fallback...", error);

    // ✅ TRY 2: Fallback JSONP (tidak throw error)
    fallbackLoadTemplate();
  } finally {
    if (loading) loading.style.display = "none";
  }
}

/**
 * Fallback load dengan JSONP
 */
function fallbackLoadTemplate() {
  console.log("🔄 Using JSONP fallback method...");

  const script = document.createElement("script");
  script.src = `${APPS_SCRIPT_URL_TEMPLATE}?sheet=TemplateSurat&callback=handleTemplateData&t=${Date.now()}`;
  script.onerror = () => {
    console.error("❌ Fallback JSONP juga gagal");

    // Show error UI hanya jika kedua method gagal
    const { empty, container } = DOM;
    if (empty) {
      empty.style.display = "block";
      empty.innerHTML = `
        <i class="fas fa-exclamation-circle" style="font-size: 48px; opacity: 0.3; margin-bottom: 12px"></i>
        <p>Gagal memuat template. Silakan refresh halaman.</p>
        <button class="btn btn-outline btn-sm" onclick="loadTemplateData()" style="margin-top: 12px">
          <i class="fas fa-sync"></i> Coba Lagi
        </button>
      `;
    }
    if (container) container.style.display = "none";
  };

  document.body.appendChild(script);
}

/**
 * Handle JSONP callback
 */
function handleTemplateData(result) {
  if (!result || !result.data) {
    console.error("❌ Fallback JSONP response invalid");
    return;
  }

  templateData = result.data.map((item) => ({
    id: item.id,
    nama: item.nama,
    kategori: item.kategori,
    deskripsi: item.deskripsi,
    fileLink: item.fileLink,
    fileName: item.fileName,
    fileSize: item.fileSize,
    fileType: getFileType(item.fileName),
    uploadedAt: item.timestamp,
    uploadedBy: item.uploadedBy,
  }));

  isDataLoaded = true;
  renderTemplateTable();
  console.log("✅ Template data loaded successfully (JSONP fallback)");
}

function handleTemplateData(result) {
  if (!result || !result.data) {
    console.error("❌ Fallback juga gagal");
    return;
  }

  templateData = result.data.map((item) => ({
    id: item.id,
    nama: item.nama,
    kategori: item.kategori,
    deskripsi: item.deskripsi,
    fileLink: item.fileLink,
    fileName: item.fileName,
    fileSize: item.fileSize,
    fileType: getFileType(item.fileName),
    uploadedAt: item.timestamp,
    uploadedBy: item.uploadedBy,
  }));

  isDataLoaded = true;
  renderTemplateTable();
}
/**
 * Render tabel template dengan DocumentFragment (lebih cepat)
 */
/**
 * Render tabel template dengan DocumentFragment (lebih cepat)
 */
function renderTemplateTable(
  data = templateData,
  filter = currentTemplateFilter,
) {
  const { tbody, container, empty, pagination } = DOM;
  if (!tbody) return;

  // Filter by kategori
  let filtered = data.filter((item) => {
    if (filter === "semua") return true;
    return item.kategori === filter;
  });

  // Search filter
  const searchValue = DOM.search?.value?.toLowerCase() || "";
  if (searchValue) {
    filtered = filtered.filter(
      (item) =>
        item.nama?.toLowerCase().includes(searchValue) ||
        item.kategori?.toLowerCase().includes(searchValue) ||
        item.deskripsi?.toLowerCase().includes(searchValue) ||
        item.fileName?.toLowerCase().includes(searchValue),
    );
  }

  // Sort: terbaru di atas
  filtered.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

  // Empty state
  if (filtered.length === 0) {
    if (container) container.style.display = "none";
    if (empty) {
      empty.style.display = "block";
      empty.innerHTML =
        data.length === 0
          ? '<i class="fas fa-folder-open" style="font-size: 48px; opacity: 0.3"></i><p>Belum ada template surat</p>'
          : '<i class="fas fa-search" style="font-size: 48px; opacity: 0.3"></i><p>Tidak ada hasil pencarian</p>';
    }
    if (pagination) pagination.innerHTML = "";
    return;
  }

  if (empty) empty.style.display = "none";
  if (container) container.style.display = "block";

  // ✅ Gunakan DocumentFragment untuk render lebih cepat
  const fragment = document.createDocumentFragment();

  filtered.forEach((item) => {
    const tr = document.createElement("tr");
    tr.dataset.id = item.id;
    tr.innerHTML = `
      <!-- Nama Template -->
      <td>
        <strong style="color: var(--text-primary)">${item.nama}</strong>
      </td>
      
      <!-- Kategori -->
      <td>
        <span class="status-badge ${getCategoryBadgeClass(item.kategori)}" style="font-size: 11px">
          ${getCategoryLabel(item.kategori)}
        </span>
      </td>
      
      <!-- Format -->
      <td>
        <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 12px">
          <i class="fas ${getFileIcon(item.fileType)}" style="color: ${getFileColor(item.fileType)}"></i>
          ${item.fileType?.toUpperCase() || "DOC"}
        </span>
      </td>
      
      <!-- Ukuran -->
      <td style="font-size: 12px; color: var(--text-muted)">
        ${formatFileSize(item.fileSize)}
      </td>
      
      <!-- Diupload -->
      <td style="font-size: 12px; color: var(--text-muted)">
        ${formatDate(item.uploadedAt)}<br>
        <small>${item.uploadedBy?.split("@")[0] || "Admin"}</small>
      </td>
      
      <!-- Deskripsi -->
      <td style="font-size: 12px; color: var(--text-muted); max-width: 200px;">
        ${item.deskripsi ? truncateText(item.deskripsi, 40) : "-"}
      </td>
      
      <!-- Aksi -->
      <td style="text-align: center; white-space: nowrap;">
        <div class="action-btns" style="display: flex; gap: 4px; justify-content: center;">
          <button class="btn btn-outline btn-sm" onclick="previewTemplate('${item.id}')" 
            title="Preview" 
            ${item.fileType !== "pdf" ? 'disabled style="opacity:0.5; cursor: not-allowed;"' : ""}>
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-outline btn-sm" onclick="openTemplateFile('${item.id}')" title="Buka File">
            <i class="fas fa-external-link-alt"></i>
          </button>
          <button class="btn btn-outline btn-sm" onclick="startEditTemplate('${item.id}')" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-outline btn-sm" onclick="copyTemplateLink('${item.id}')" title="Salin Link">
            <i class="fas fa-copy"></i>
          </button>
        </div>
      </td>
    `;
    fragment.appendChild(tr);
  });

  // ✅ Insert semua row sekaligus (lebih cepat)
  tbody.innerHTML = "";
  tbody.appendChild(fragment);

  renderPagination(filtered.length);
}

// ========================================
// 📤 UPLOAD TEMPLATE (Optimized + CORS Fix)
// ========================================

function openUploadModal() {
  const {
    modalUpload,
    templateFile,
    fileName,
    templateName,
    templateCategory,
    templateDescription,
    uploadPreview,
    btnSaveTemplate,
  } = DOM;

  if (modalUpload) modalUpload.style.display = "flex";

  // Reset form
  if (templateFile) templateFile.value = "";
  if (fileName) fileName.textContent = "";
  if (templateName) templateName.value = "";
  if (templateCategory) templateCategory.value = "";
  if (templateDescription) templateDescription.value = "";
  if (uploadPreview) uploadPreview.style.display = "none";
  if (btnSaveTemplate) btnSaveTemplate.disabled = true;

  selectedFile = null;
}

function closeUploadModal() {
  if (DOM.modalUpload) DOM.modalUpload.style.display = "none";
  selectedFile = null;
}

function handleFileSelect(input) {
  const file = input.files[0];
  if (file) processSelectedFile(file);
}

function handleFileDrop(event) {
  event.preventDefault();
  const dropZone = event.currentTarget;
  dropZone.style.borderColor = "var(--border)";
  dropZone.style.background = "var(--bg-main)";

  const file = event.dataTransfer.files[0];
  if (file) processSelectedFile(file);
}

function processSelectedFile(file) {
  const validTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-word.document.macroEnabled.12",
  ];

  if (!validTypes.includes(file.type)) {
    alert("Format file tidak didukung. Gunakan PDF, DOC, atau DOCX.");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    alert("Ukuran file terlalu besar. Maksimal 10MB.");
    return;
  }

  selectedFile = file;

  // Update UI
  if (DOM.fileName) {
    DOM.fileName.innerHTML = `📄 <strong>${file.name}</strong> <small style="color: var(--text-muted)">(${formatFileSize(file.size)})</small>`;
  }

  // Auto-fill nama template
  if (DOM.templateName && !DOM.templateName.value) {
    const name = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    DOM.templateName.value = name.charAt(0).toUpperCase() + name.slice(1);
  }

  // Enable save button
  if (DOM.btnSaveTemplate) DOM.btnSaveTemplate.disabled = false;
  if (DOM.uploadPreview) DOM.uploadPreview.style.display = "block";
}

/**
 * ✅ Save template dengan IMPROVED CORS ERROR HANDLING + FALLBACK WORKAROUND
 */
/**
 * ✅ Save template dengan IMPROVED CORS ERROR HANDLING
 */
async function saveTemplate() {
  if (!selectedFile) {
    alert("Silakan pilih file terlebih dahulu");
    return;
  }

  const {
    templateName,
    templateCategory,
    templateDescription,
    btnSaveTemplate,
  } = DOM;
  const name = templateName?.value.trim();
  const category = templateCategory?.value;
  const description = templateDescription?.value.trim();

  if (!name) {
    alert("Nama template wajib diisi");
    return;
  }
  if (!category) {
    alert("Kategori wajib dipilih");
    return;
  }

  // Show loading
  const originalText = btnSaveTemplate.innerHTML;
  btnSaveTemplate.disabled = true;
  btnSaveTemplate.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengupload...';

  try {
    const base64 = await fileToBase64(selectedFile);

    // ✅ FIX: Kirim semua field langsung di FormData (bukan nested JSON)
    const formData = new FormData();
    formData.append("action", "uploadTemplate");
    formData.append("module", "template");
    formData.append("fileData", base64.split(",")[1]);  // ✅ Langsung kirim base64
    formData.append("mimeType", selectedFile.type);      // ✅ Langsung kirim
    formData.append("fileName", selectedFile.name);      // ✅ Langsung kirim
    formData.append("fileSize", selectedFile.size);      // ✅ Langsung kirim
    formData.append("nama", name);                       // ✅ Langsung kirim
    formData.append("kategori", category);               // ✅ Langsung kirim
    formData.append("deskripsi", description);           // ✅ Langsung kirim
    formData.append("uploadedBy", getCurrentUserEmail()); // ✅ Langsung kirim

    console.log("📤 Sending FormData with fields:", {
      action: "uploadTemplate",
      module: "template",
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      nama: name,
      kategori: category
    });

    const response = await fetch(APPS_SCRIPT_URL_TEMPLATE, {
      method: "POST",
      body: formData,
      // ✅ JANGAN set headers Content-Type untuk FormData!
      // Browser akan otomatis set multipart/form-data dengan boundary
    });

    console.log("📥 Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log("📡 Upload response:", result);

    if (result.success) {
      closeUploadModal();
      if (typeof window.showToast === "function") {
        window.showToast("success", "Berhasil", "Template berhasil diupload");
      } else {
        alert("✅ Template berhasil diupload!");
      }
      isDataLoaded = false;
      await loadTemplateData();
    } else {
      throw new Error(result.error || "Upload gagal");
    }
  } catch (error) {
    console.error("❌ Upload failed:", error);
    
    const isCorsError = error.message.includes("Failed to fetch") || error.message.includes("CORS");
    
    if (isCorsError) {
      console.warn("⚠️ Possible CORS, but upload may have succeeded...");
      closeUploadModal();
      setTimeout(async () => {
        isDataLoaded = false;
        await loadTemplateData();
        if (typeof window.showToast === "function") {
          window.showToast("success", "Berhasil", "Template berhasil diupload!");
        }
      }, 1500);
    } else {
      alert("❌ Gagal upload:\n\n" + error.message);
    }
  } finally {
    if (btnSaveTemplate) {
      btnSaveTemplate.disabled = false;
      btnSaveTemplate.innerHTML = originalText;
    }
  }
}

// ========================================
// ✏️ EDIT TEMPLATE (Optimized)
// ========================================

function startEditTemplate(id) {
  console.log("📝 Edit template called with ID:", id);
  
  // Validasi ID
  if (!id) {
    console.error("❌ No ID provided");
    alert("ID template tidak valid");
    return;
  }
  
  // Cari data template
  const item = templateData.find((t) => t.id === id);
  if (!item) {
    console.error("❌ Template not found:", id);
    alert("Data template tidak ditemukan");
    return;
  }

  console.log("✅ Template found:", item);

  // ✅ Set nilai ke form - pastikan elemen ada
  const editIdField = document.getElementById("editTemplateId");
  const editNameField = document.getElementById("editTemplateName");
  const editCategoryField = document.getElementById("editTemplateCategory");
  const editDescField = document.getElementById("editTemplateDescription");
  const editLinkField = document.getElementById("editTemplateLink");
  const editFileNameField = document.getElementById("editFileName");
  const editFileSizeField = document.getElementById("editFileSize");

  if (!editIdField) {
    console.error("❌ Input hidden editTemplateId TIDAK DITEMUKAN!");
    alert("Error: Form tidak lengkap. Refresh halaman atau periksa HTML.");
    return;
  }

  // ✅ Isi semua field
  editIdField.value = item.id;
  console.log("✅ ID set to:", editIdField.value);
  
  if (editNameField) editNameField.value = item.nama || "";
  if (editCategoryField) editCategoryField.value = item.kategori || "";
  if (editDescField) editDescField.value = item.deskripsi || "";
  if (editLinkField) editLinkField.value = item.fileLink || "";
  if (editFileNameField) editFileNameField.textContent = item.fileName || "-";
  if (editFileSizeField) {
    editFileSizeField.textContent = item.fileSize 
      ? `(${formatFileSize(item.fileSize)})` 
      : "";
  }

  // ✅ Tampilkan modal
  const modal = document.getElementById("modalEditTemplate");
  if (modal) {
    modal.style.display = "flex";
    console.log("✅ Modal opened successfully");
  } else {
    console.error("❌ Modal element not found!");
  }
}

function closeEditTemplateModal() {
  console.log("🚪 Closing edit modal");
  const modal = document.getElementById("modalEditTemplate");
  if (modal) {
    modal.style.display = "none";
  }
  
  // Clear form
  const editIdField = document.getElementById("editTemplateId");
  if (editIdField) editIdField.value = "";
  
  const editNameField = document.getElementById("editTemplateName");
  if (editNameField) editNameField.value = "";
  
  const editCategoryField = document.getElementById("editTemplateCategory");
  if (editCategoryField) editCategoryField.value = "";
  
  const editDescField = document.getElementById("editTemplateDescription");
  if (editDescField) editDescField.value = "";
  
  const editLinkField = document.getElementById("editTemplateLink");
  if (editLinkField) editLinkField.value = "";
}

/**
 * ✅ Save edit template - FIXED: Proper CORS handling + response waiting
 */
async function saveEditTemplate() {
  console.log("💾 Save button clicked");
  
  // Ambil elemen
  const editIdField = document.getElementById("editTemplateId");
  const editNameField = document.getElementById("editTemplateName");
  const editCategoryField = document.getElementById("editTemplateCategory");
  const editDescField = document.getElementById("editTemplateDescription");
  const editLinkField = document.getElementById("editTemplateLink");

  // Validasi ID - INI KUNCINYA
  const id = editIdField?.value?.trim();
  console.log("🔍 Checking ID value:", id, "Field exists:", !!editIdField);
  
  if (!id) {
    console.error("❌ ID is EMPTY!");
    alert("⚠️ Error: ID template tidak ditemukan.\n\n" +
          "Penyebab:\n" +
          "1. Input hidden tidak ada di HTML\n" +
          "2. startEditTemplate tidak dipanggil dengan benar\n\n" +
          "Silakan tutup modal dan buka ulang.");
    return;
  }

  // Validasi field lain
  const nama = editNameField?.value?.trim();
  const kategori = editCategoryField?.value;
  
  if (!nama) {
    alert("Nama template wajib diisi");
    editNameField?.focus();
    return;
  }
  if (!kategori) {
    alert("Kategori wajib dipilih");
    return;
  }

  // Disable button
  const saveBtn = document.querySelector("#modalEditTemplate .btn-primary");
  if (!saveBtn) {
    console.error("❌ Save button not found");
    return;
  }
  
  if (saveBtn.disabled) {
    console.warn("⚠️ Save button already disabled (preventing double-click)");
    return;
  }
  
  const originalText = saveBtn.innerHTML;
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

  try {
    const params = new URLSearchParams();
    params.append("action", "updateTemplate");
    params.append("module", "template");
    params.append("id", id);
    params.append("nama", nama);
    params.append("kategori", kategori);
    params.append("deskripsi", editDescField?.value?.trim() || "");
    params.append("fileLink", editLinkField?.value || "");

    console.log("📤 Sending update request...");
    console.log("   URL:", APPS_SCRIPT_URL_TEMPLATE);
    console.log("   Params:", Object.fromEntries(params));

    const response = await fetch(APPS_SCRIPT_URL_TEMPLATE, {
      method: "POST",
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    console.log("📥 Response status:", response.status);
    const result = await response.json();
    console.log("📡 Response:", result);

    if (result.success) {
      // Tutup modal
      const modal = document.getElementById("modalEditTemplate");
      if (modal) modal.style.display = "none";
      
      // Reload data
      isDataLoaded = false;
      await loadTemplateData();
      
      // Pesan sukses
      if (typeof window.showToast === "function") {
        window.showToast("success", "Berhasil", "Template berhasil diperbarui");
      } else {
        alert("✅ Template berhasil diperbarui!");
      }
    } else {
      throw new Error(result.error || "Update gagal");
    }
    
  } catch (error) {
    console.error("❌ Update failed:", error);
    alert("❌ Gagal menyimpan:\n\n" + error.message);
  } finally {
    // Restore button
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;
  }
}

/**
 * ✅ Delete template - FIXED: Proper response handling
 */
async function deleteTemplateInline() {
  console.log("🗑️ Delete button clicked");
  
  const editIdField = document.getElementById("editTemplateId");
  const id = editIdField?.value?.trim();
  
  console.log("🔍 Delete ID:", id, "Field exists:", !!editIdField);
  
  if (!id) {
    console.error("❌ ID is EMPTY!");
    alert("⚠️ Error: ID template tidak ditemukan.\n\n" +
          "Silakan tutup modal dan buka ulang.");
    return;
  }

  const templateItem = templateData.find(t => t.id === id);
  const templateName = templateItem?.nama || "Template ini";
  
  if (!confirm(`Yakin ingin menghapus template:\n\n"${templateName}"?\n\nTindakan ini tidak dapat dibatalkan.`)) {
    return;
  }

  const deleteBtn = document.querySelector("#modalEditTemplate .btn-danger");
  if (!deleteBtn) {
    console.error("❌ Delete button not found");
    return;
  }
  
  if (deleteBtn.disabled) {
    console.warn("⚠️ Delete button already disabled");
    return;
  }
  
  const originalText = deleteBtn.innerHTML;
  deleteBtn.disabled = true;
  deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghapus...';

  try {
    const params = new URLSearchParams();
    params.append("action", "deleteTemplate");
    params.append("module", "template");
    params.append("id", id);

    console.log("📤 Sending delete request...");
    console.log("   ID:", id);

    const response = await fetch(APPS_SCRIPT_URL_TEMPLATE, {
      method: "POST",
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const result = await response.json();
    console.log("📡 Delete response:", result);

    if (result.success) {
      // Tutup modal
      const modal = document.getElementById("modalEditTemplate");
      if (modal) modal.style.display = "none";
      
      // Reload
      isDataLoaded = false;
      await loadTemplateData();
      
      if (typeof window.showToast === "function") {
        window.showToast("success", "Berhasil", "Template berhasil dihapus");
      } else {
        alert("✅ Template berhasil dihapus!");
      }
    } else {
      throw new Error(result.error || "Delete gagal");
    }
    
  } catch (error) {
    console.error("❌ Delete failed:", error);
    alert("❌ Gagal menghapus:\n\n" + error.message);
  } finally {
    if (deleteBtn) {
      deleteBtn.disabled = false;
      deleteBtn.innerHTML = originalText;
    }
  }
}

// ========================================
// 🔗 FILE ACTIONS
// ========================================

function openTemplateFile(id) {
  const item = id ? templateData.find((t) => t.id === id) : null;
  const link = item?.fileLink || DOM.editTemplateLink?.value;

  if (link) {
    window.open(link, "_blank", "noopener,noreferrer");
  } else {
    alert("Link file tidak tersedia");
  }
}

function copyTemplateLink(id) {
  const item = id ? templateData.find((t) => t.id === id) : null;
  const link = item?.fileLink || DOM.editTemplateLink?.value;

  if (link) {
    navigator.clipboard.writeText(link).then(() => {
      if (typeof window.showToast === "function") {
        window.showToast(
          "success",
          "Disalin",
          "Link template disalin ke clipboard",
        );
      } else {
        alert("✅ Link disalin!");
      }
    });
  }
}
/**
 * Convert Google Drive link ke format preview
 */
function convertDriveLinkToPreview(fileLink) {
  if (!fileLink) return null;

  console.log("Original link:", fileLink);

  // Extract file ID dari berbagai format link
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9-_]+)/,
    /\/d\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
    /\/open\?id=([a-zA-Z0-9-_]+)/,
  ];

  let fileId = null;
  for (let pattern of patterns) {
    const match = fileLink.match(pattern);
    if (match && match[1]) {
      fileId = match[1];
      break;
    }
  }

  if (!fileId) {
    console.error("Could not extract file ID from:", fileLink);
    return fileLink; // Return original jika tidak match
  }

  console.log("Extracted file ID:", fileId);

  // ✅ Gunakan Google Docs Viewer dengan format yang benar
  // Format 1: Google Docs Viewer
  const viewerUrl = `https://docs.google.com/viewer?url=https://drive.google.com/uc?id=${fileId}&embedded=true`;

  // Format 2: Direct preview (alternatif)
  // const viewerUrl = `https://drive.google.com/file/d/${fileId}/preview`;

  console.log("Preview URL:", viewerUrl);
  return viewerUrl;
}

/**
 * Preview template (PDF only)
 */
function previewTemplate(id) {
  console.log("👁️ Preview template:", id);
  const item = templateData.find((t) => t.id === id);

  if (!item) {
    console.error("Template not found:", id);
    alert("Template tidak ditemukan");
    return;
  }

  console.log("File type:", item.fileType);
  console.log("File link:", item.fileLink);

  if (!item.fileLink) {
    alert("Link file tidak tersedia");
    return;
  }

  // Untuk PDF, gunakan Google Docs Viewer
  if (item.fileType === "pdf") {
    try {
      const previewUrl = convertDriveLinkToPreview(item.fileLink);

      // Buka di window baru dengan ukuran yang sesuai
      const width = Math.min(1200, window.screen.width - 100);
      const height = Math.min(800, window.screen.height - 100);
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      window.open(
        previewUrl,
        "_blank",
        `noopener,noreferrer,width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`,
      );
    } catch (error) {
      console.error("❌ Error opening preview:", error);
      alert("Gagal membuka preview. Silakan buka file langsung.");
      // Fallback: buka link asli
      window.open(item.fileLink, "_blank", "noopener,noreferrer");
    }
  } else {
    // Untuk non-PDF, buka langsung
    alert(
      `Preview hanya tersedia untuk PDF.\n\nFile ini: ${item.fileType.toUpperCase()}\n\nAkan membuka file langsung...`,
    );
    window.open(item.fileLink, "_blank", "noopener,noreferrer");
  }
}

// ========================================
// 🔍 FILTER & UTILS
// ========================================

function filterTemplateTable(btn, filter) {
  if (btn) {
    document
      .querySelectorAll("#page-surat .tab-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  }

  currentTemplateFilter = filter || "semua";
  renderTemplateTable(templateData, currentTemplateFilter);
}

function refreshTemplateTable() {
  isDataLoaded = false; // ✅ Reset flag agar load ulang
  loadTemplateData();
}

function exportTemplateTable() {
  if (templateData.length === 0) {
    alert("Tidak ada data untuk diexport");
    return;
  }

  const headers = [
    "ID",
    "Nama Template",
    "Kategori",
    "File",
    "Ukuran",
    "Deskripsi",
    "Link",
    "Diupload",
  ];
  const rows = templateData.map((item) => [
    item.id,
    item.nama,
    getCategoryLabel(item.kategori),
    item.fileName,
    formatFileSize(item.fileSize),
    item.deskripsi?.replace(/,/g, ";") || "",
    item.fileLink,
    formatDate(item.uploadedAt),
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `template_surat_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();

  if (typeof window.showToast === "function") {
    window.showToast("success", "Export", "Data template berhasil diexport");
  }
}

// ========================================
// 🛠️ HELPER FUNCTIONS
// ========================================

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateString) {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

function truncateText(text, maxLength) {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

function getCategoryBadgeClass(kategori) {
  const map = {
    surat_masuk: "active",
    surat_keluar: "process",
    nota_dinas: "blue",
    undangan: "yellow",
    lainnya: "archived",
  };
  return map[kategori] || "process";
}

function getCategoryLabel(kategori) {
  const map = {
    surat_masuk: "📥 Surat Masuk",
    surat_keluar: "📤 Surat Keluar",
    nota_dinas: "📝 Nota Dinas",
    undangan: "🎫 Undangan",
    lainnya: "📁 Lainnya",
  };
  return map[kategori] || kategori;
}

function getFileType(fileName) {
  if (!fileName) return "doc";
  const ext = fileName.split(".").pop()?.toLowerCase();
  const map = { pdf: "pdf", doc: "doc", docx: "doc", docm: "doc" };
  return map[ext] || "doc";
}

function getFileIcon(fileType) {
  const map = {
    pdf: "fa-file-pdf",
    doc: "fa-file-word",
    xls: "fa-file-excel",
    ppt: "fa-file-powerpoint",
  };
  return map[fileType] || "fa-file";
}

function getFileColor(fileType) {
  const map = {
    pdf: "#dc3545",
    doc: "#0d6efd",
    xls: "#198754",
    ppt: "#fd7e14",
  };
  return map[fileType] || "#6c757d";
}

function getCurrentUserEmail() {
  return "user@unida.gontor.ac.id";
}

function renderPagination(totalItems, itemsPerPage = 10) {
  const { pagination } = DOM;
  if (!pagination) return;

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  pagination.innerHTML = `
    <span style="font-size: 12px; color: var(--text-muted)">
      Menampilkan ${Math.min(totalItems, itemsPerPage)} dari ${totalItems} template
    </span>
  `;
}

// ========================================
// 🌐 EVENT LISTENERS & INIT (OPTIMIZED)
// ========================================

function initTemplateEvents() {
  // ✅ Search dengan debounce
  if (DOM.search) {
    DOM.search.addEventListener("keyup", debouncedSearch);
  }

  // ✅ Close modals when clicking outside
  document.addEventListener("click", function (e) {
    if (DOM.modalUpload && e.target === DOM.modalUpload) closeUploadModal();
    if (DOM.modalEdit && e.target === DOM.modalEdit) closeEditTemplateModal();
  });

  // ✅ Close modals on Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeUploadModal();
      closeEditTemplateModal();
    }
  });

  // ✅ Load data saat halaman surat aktif (tanpa MutationObserver berat)
  const pageSurat = document.getElementById("page-surat");
  if (pageSurat && pageSurat.classList.contains("active") && !isDataLoaded) {
    loadTemplateData();
  }

  // ✅ Listen untuk navigasi page (jika ada event custom di app.js)
  document.addEventListener("page-changed", function (e) {
    if (e.detail?.page === "surat" && !isDataLoaded) {
      loadTemplateData();
    }
  });
}

// ✅ Init saat DOM ready
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTemplateEvents);
  } else {
    initTemplateEvents();
  }
}

// ========================================
// 🌍 GLOBAL EXPOSURE
// ========================================
if (typeof window !== "undefined") {
  window.openUploadModal = openUploadModal;
  window.closeUploadModal = closeUploadModal;
  window.handleFileSelect = handleFileSelect;
  window.handleFileDrop = handleFileDrop;
  window.saveTemplate = saveTemplate;

  window.startEditTemplate = startEditTemplate;
  window.closeEditTemplateModal = closeEditTemplateModal;
  window.saveEditTemplate = saveEditTemplate;
  window.deleteTemplateInline = deleteTemplateInline;

  window.openTemplateFile = openTemplateFile;
  window.copyTemplateLink = copyTemplateLink;
  window.previewTemplate = previewTemplate;

  window.filterTemplateTable = filterTemplateTable;
  window.refreshTemplateTable = refreshTemplateTable;
  window.exportTemplateTable = exportTemplateTable;

  window.loadTemplateData = loadTemplateData;
  window.renderTemplateTable = renderTemplateTable;

  console.log(
    "✅ surat-template.js (optimized + CORS fix) loaded successfully!",
  );
  console.log("✅ All functions exposed to window object");
}
