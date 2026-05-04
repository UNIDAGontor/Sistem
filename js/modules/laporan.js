/**
========================================
BUAT-SURAT.JS - WordPress-Style Letter Editor
========================================
*/
(function() {
  'use strict';

  // ===== STATE =====
  let suratData = {
    id: null,
    title: '',
    content: '',
    meta: {
      nomor: '',
      klasifikasi: 'biasa',
      tanggal: '',
      tujuan: '',
      lampiran: ''
    },
    category: 'lainnya',
    attachments: [],
    status: 'draft',
    createdAt: null,
    updatedAt: null
  };

  let autoSaveTimer = null;
  const STORAGE_KEY = 'surat_draft_v1';

  // ===== INIT =====
  function initBuatSurat() {
    console.log('✍️ Initializing Buat Surat module...');
    
    // Cek elemen penting
    const editor = document.getElementById('suratEditor');
    if (!editor) {
      console.error('❌ Editor element not found!');
      return;
    }

    // Set tanggal hari ini
    const datePlaceholder = document.getElementById('currentDatePlaceholder');
    if (datePlaceholder) {
      datePlaceholder.textContent = new Date().toLocaleDateString('id-ID', { 
        day: 'numeric', month: 'long', year: 'numeric' 
      });
    }
    
    const metaTanggal = document.getElementById('metaTanggal');
    if (metaTanggal) {
      metaTanggal.valueAsDate = new Date();
    }

    // Load draft jika ada
    loadDraft();

    // Setup event listeners
    setupEditorToolbar();
    setupMetaInputs();  // ← Gabungkan semua di sini
    setupAttachments();
    setupTemplates();
    setupActions();
    setupAutoSave();
    setupWordCount();

    // Keyboard shortcuts
    setupKeyboardShortcuts();

    console.log('✅ Buat Surat module ready');
  }

  // ===== EDITOR TOOLBAR =====
  function setupEditorToolbar() {
    const editor = document.getElementById('suratEditor');
    if (!editor) return;
    
    // Toolbar buttons
    document.querySelectorAll('.toolbar-btn[data-action]').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const action = this.dataset.action;
        editor.focus();
        document.execCommand(action, false, null); 
        updateWordCount();
      });
    });

    // Custom buttons
    const btnAddLink = document.getElementById('btnAddLink');
    if (btnAddLink) {
      btnAddLink.addEventListener('click', function(e) {
        e.preventDefault();
        const url = prompt('Masukkan URL:', 'https://');
        if (url) {
          editor.focus();
          document.execCommand('createLink', false, url);
        }
      });
    }

    const btnAddImage = document.getElementById('btnAddImage');
    if (btnAddImage) {
      btnAddImage.addEventListener('click', function(e) {
        e.preventDefault();
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = function(e) {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
              editor.focus();
              const img = document.createElement('img');
              img.src = event.target.result;
              img.style.maxWidth = '100%';
              img.style.height = 'auto';
              editor.appendChild(img);
              updateWordCount();
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      });
    }

    const btnAddTable = document.getElementById('btnAddTable');
    if (btnAddTable) {
      btnAddTable.addEventListener('click', function(e) {
        e.preventDefault();
        editor.focus();
        const rows = prompt('Jumlah baris:', '3');
        const cols = prompt('Jumlah kolom:', '2');
        if (rows && cols) {
          let table = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">';
          for (let i = 0; i < rows; i++) {
            table += '<tr>';
            for (let j = 0; j < cols; j++) {
              table += '<td style="padding: 8px; border: 1px solid #ccc;">&nbsp;</td>';
            }
            table += '</tr>';
          }
          table += '</table>';
          editor.insertAdjacentHTML('beforeend', table);
        }
      });
    }

    const btnClearFormat = document.getElementById('btnClearFormat');
    if (btnClearFormat) {
      btnClearFormat.addEventListener('click', function(e) {
        e.preventDefault();
        editor.focus();
        document.execCommand('removeFormat', false, null);
      });
    }

    // Update toolbar state on selection change
    editor.addEventListener('mouseup', updateToolbarState);
    editor.addEventListener('keyup', updateToolbarState);

    function updateToolbarState() {
      document.querySelectorAll('.toolbar-btn[data-action]').forEach(btn => {
        const action = btn.dataset.action;
        try {
          const state = document.queryCommandState(action);
          btn.classList.toggle('active', state);
        } catch(e) {}
      });
    }
  }

  // ===== META INPUTS & CATEGORY CHIPS (GABUNGAN) =====
function setupMetaInputs() {
    console.log('📋 Setting up meta inputs...');
    
    // Part 1: Meta Inputs
    const inputs = ['metaNomor', 'metaKlasifikasi', 'metaTanggal', 'metaTujuan', 'metaLampiran'];
    
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', function() {
                const key = id.replace('meta', '').toLowerCase();
                suratData.meta[key] = this.value;
                scheduleAutoSave();
            });
        }
    });

    // Update nomor surat di editor
    const metaNomor = document.getElementById('metaNomor');
    if (metaNomor) {
        metaNomor.addEventListener('input', function() {
            const spans = document.querySelectorAll('#suratEditor span[style*="color: #666"]');
            if (spans[0]) spans[0].textContent = this.value || '[Isi Nomor Surat]';
        });
    }

    // Update lampiran di editor
    const metaLampiran = document.getElementById('metaLampiran');
    if (metaLampiran) {
        metaLampiran.addEventListener('input', function() {
            const spans = document.querySelectorAll('#suratEditor span[style*="color: #666"]');
            if (spans[1]) spans[1].textContent = this.value || '[Isi Lampiran]';
        });
    }

    // Update perihal di editor (dari title)
    const suratTitle = document.getElementById('suratTitle');
    if (suratTitle) {
        suratTitle.addEventListener('input', function() {
            const spans = document.querySelectorAll('#suratEditor span[style*="color: #666"]');
            if (spans[2]) spans[2].textContent = this.value || '[Isi Perihal]';
            suratData.title = this.value;
            scheduleAutoSave();
        });
    }

    // Part 2: Category chips
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            suratData.category = this.dataset.cat;
            scheduleAutoSave();
        });
    });
    
    console.log('✅ Meta inputs setup complete');
}

  // ===== ATTACHMENTS =====
  function setupAttachments() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const attachmentList = document.getElementById('attachmentList');

    if (!dropZone || !fileInput) return;

    // Click to upload
    dropZone.addEventListener('click', () => fileInput.click());

    // Drag & drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.remove('dragover');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      handleFiles(files);
    });

    fileInput.addEventListener('change', (e) => {
      handleFiles(e.target.files);
    });

    function handleFiles(files) {
      Array.from(files).forEach(file => {
        if (suratData.attachments.length >= 5) {
          showToast('warning', 'Batas Tercapai', 'Maksimal 5 lampiran');
          return;
        }
        
        const attachment = {
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type,
          file: file
        };
        
        suratData.attachments.push(attachment);
        renderAttachments();
        scheduleAutoSave();
      });
    }

    function renderAttachments() {
      if (!attachmentList) return;
      
      attachmentList.innerHTML = '';
      suratData.attachments.forEach((att, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
          <i class="fas fa-file" style="color: var(--primary);"></i>
          <span style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${att.name}</span>
          <small style="color: var(--text-muted);">${att.size}</small>
          <span class="remove-attachment" data-index="${index}"><i class="fas fa-times"></i></span>
        `;
        attachmentList.appendChild(li);
      });

      // Remove handler
      attachmentList.querySelectorAll('.remove-attachment').forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          const index = this.dataset.index;
          suratData.attachments.splice(index, 1);
          renderAttachments();
          scheduleAutoSave();
        });
      });
    }

    function formatFileSize(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
  }

  // ===== TEMPLATES =====
  function setupTemplates() {
    const templates = {
      undangan: `<p><strong>Perihal</strong> : <span style="color: #666;">Undangan [Nama Acara]</span></p><br><p>Yth. [Nama Penerima]<br>[Jabatan/Instansi]<br>di<br><strong>Tempat</strong></p><br><p>Dengan hormat,</p><p style="text-indent: 30px;">Sehubungan dengan akan diselenggarakannya <strong>[Nama Acara]</strong>, maka dengan ini kami mengundang Bapak/Ibu untuk hadir pada:</p><table style="margin: 16px 0; border-collapse: collapse;"><tr><td style="padding: 4px 12px 4px 0; width: 120px;">Hari/Tanggal</td><td>: [Isi]</td></tr><tr><td style="padding: 4px 12px 4px 0;">Waktu</td><td>: [Isi]</td></tr><tr><td style="padding: 4px 12px 4px 0;">Tempat</td><td>: [Isi]</td></tr><tr><td style="padding: 4px 12px 4px 0;">Acara</td><td>: [Isi]</td></tr></table><p style="text-indent: 30px;">Mengingat pentingnya acara tersebut, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktunya.</p><br><p>Demikian undangan ini kami sampaikan. Atas perhatian dan kehadiran Bapak/Ibu, kami ucapkan terima kasih.</p>`,
      pengumuman: `<p><strong>Perihal</strong> : <span style="color: #666;">Pengumuman [Topik]</span></p><br><p>Kepada Yth.<br>Seluruh [Target Penerima]<br>di<br><strong>Tempat</strong></p><br><p>Dengan ini kami sampaikan pengumuman sebagai berikut:</p><ol style="margin-left: 20px;"><li>[Poin pertama]</li><li>[Poin kedua]</li><li>[Poin ketiga]</li></ol><p style="text-indent: 30px;">Demikian pengumuman ini kami sampaikan untuk menjadi perhatian dan dilaksanakan sebagaimana mestinya.</p>`,
      permohonan: `<p><strong>Perihal</strong> : <span style="color: #666;">Permohonan [Keperluan]</span></p><br><p>Yth. [Nama Penerima]<br>[Jabatan/Instansi]<br>di<br><strong>Tempat</strong></p><br><p>Dengan hormat,</p><p style="text-indent: 30px;">Bersama surat ini, kami bermaksud mengajukan permohonan [jelaskan keperluan] sehubungan dengan [alasan/kegiatan].</p><p style="text-indent: 30px;">Sebagai bahan pertimbangan, bersama ini kami lampirkan:</p><ul style="margin-left: 20px;"><li>[Dokumen 1]</li><li>[Dokumen 2]</li></ul><p style="text-indent: 30px;">Besar harapan kami agar permohonan ini dapat dikabulkan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.</p>`,
      balasan: `<p><strong>Perihal</strong> : <span style="color: #666;">Balasan Surat [Nomor Surat]</span></p><br><p>Yth. [Nama Penerima]<br>[Jabatan/Instansi]<br>di<br><strong>Tempat</strong></p><br><p>Dengan hormat,</p><p style="text-indent: 30px;">Menindaklanjuti surat Bapak/Ibu Nomor: [Nomor Surat] tanggal [Tanggal Surat] perihal [Perihal Surat], bersama ini kami sampaikan bahwa:</p><p style="text-indent: 30px; margin-left: 30px;">[Isi tanggapan/balasan Anda di sini]</p><p style="text-indent: 30px;">Demikian kami sampaikan, atas perhatian Bapak/Ibu kami ucapkan terima kasih.</p>`
    };

    document.querySelectorAll('[data-template]').forEach(btn => {
      btn.addEventListener('click', function() {
        const template = templates[this.dataset.template];
        const hr = document.querySelector('#suratEditor hr');
        if (template && hr && confirm('Gunakan template ini? Konten yang belum disimpan akan hilang.')) {
          document.getElementById('suratEditor').innerHTML = hr.outerHTML + template;
          updateWordCount();
          scheduleAutoSave();
        }
      });
    });
  }

  // ===== ACTIONS =====
  function setupActions() {
    // Preview
    const btnPreview = document.getElementById('btnPreviewSurat');
    if (btnPreview) {
      btnPreview.addEventListener('click', openPreview);
    }
    
    const closePreview = document.getElementById('closePreview');
    if (closePreview) {
      closePreview.addEventListener('click', function() {
        document.getElementById('previewModal').style.display = 'none';
      });
    }
    
    const btnEditFromPreview = document.getElementById('btnEditFromPreview');
    if (btnEditFromPreview) {
      btnEditFromPreview.addEventListener('click', function() {
        document.getElementById('previewModal').style.display = 'none';
      });
    }
    
    const btnPrintPreview = document.getElementById('btnPrintPreview');
    if (btnPrintPreview) {
      btnPrintPreview.addEventListener('click', function() {
        window.print();
      });
    }

    // Save Draft
    const btnSaveDraft = document.getElementById('btnSaveDraft');
    if (btnSaveDraft) {
      btnSaveDraft.addEventListener('click', function() {
        saveDraft(true);
        showToast('success', 'Draft Disimpan', 'Surat berhasil disimpan sebagai draft');
      });
    }

    // Publish/Kirim
    const btnPublish = document.getElementById('btnPublishSurat');
    if (btnPublish) {
      btnPublish.addEventListener('click', async function() {
        const titleInput = document.getElementById('suratTitle');
        if (!titleInput || !titleInput.value.trim()) {
          showToast('error', 'Judul Kosong', 'Harap isi judul surat terlebih dahulu');
          return;
        }
        
        if (confirm('Kirim surat ini? Pastikan semua data sudah benar.')) {
          this.disabled = true;
          this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
          
          try {
            const result = await saveToBackend();
            if (result.success) {
              showToast('success', 'Berhasil', 'Surat berhasil dikirim!');
              clearDraft();
            } else {
              throw new Error(result.error);
            }
          } catch (error) {
            console.error('Send error:', error);
            showToast('error', 'Gagal', 'Tidak dapat mengirim surat: ' + error.message);
          } finally {
            this.disabled = false;
            this.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Surat';
          }
        }
      });
    }

    // Back button
    const btnBack = document.getElementById('btnBackSurat');
    if (btnBack) {
      btnBack.addEventListener('click', function() {
        const editor = document.getElementById('suratEditor');
        if (suratData.title || (editor && editor.textContent.trim().length > 100)) {
          if (!confirm('Ada perubahan yang belum disimpan. Kembali tanpa menyimpan?')) {
            return;
          }
        }
        if (typeof window.navigateTo === 'function') {
          window.navigateTo('dashboard');
        }
      });
    }
  }

  // ===== PREVIEW =====
  function openPreview() {
    const editor = document.getElementById('suratEditor');
    const preview = document.getElementById('previewContent');
    const modal = document.getElementById('previewModal');
    
    if (!editor || !preview || !modal) return;
    
    let html = editor.innerHTML;
    
    const meta = suratData.meta;
    const titleInput = document.getElementById('suratTitle');
    
    const metaHtml = `
      <div style="text-align: center; margin-bottom: 24px;">
        <strong style="font-size: 14pt;">PEMERINTAH KABUPATEN CONTOH</strong><br>
        <span style="font-size: 11pt;">DINAS KOMUNIKASI DAN INFORMATIKA</span><br>
        <small>Jl. Contoh No. 123, Kota Contoh • Telp. (021) 123456</small>
      </div>
      <hr style="border: none; border-top: 3px double #333; margin: 16px 0 24px;">
      <p><strong>Nomor</strong> : ${meta.nomor || '-'}</p>
      <p><strong>Lampiran</strong> : ${meta.lampiran || '-'}</p>
      <p><strong>Perihal</strong> : ${titleInput ? titleInput.value : '-'}</p>
      <br>
    `;
    
    preview.innerHTML = metaHtml + html;
    modal.style.display = 'flex';
  }

  // ===== AUTO-SAVE =====
  function setupAutoSave() {
    const editor = document.getElementById('suratEditor');
    if (editor) {
      editor.addEventListener('input', function() {
        suratData.content = this.innerHTML;
        updateWordCount();
        scheduleAutoSave();
      });
    }
  }

  function scheduleAutoSave() {
    const lastSaved = document.getElementById('lastSaved');
    if (lastSaved) {
      lastSaved.textContent = 'Menyimpan...';
    }
    
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      saveDraft(false);
      if (lastSaved) {
        lastSaved.textContent = 'Disimpan: ' + new Date().toLocaleTimeString('id-ID');
      }
    }, 2000);
  }

  function saveDraft(showNotification = false) {
    const titleInput = document.getElementById('suratTitle');
    const editor = document.getElementById('suratEditor');
    
    suratData.title = titleInput ? titleInput.value : '';
    suratData.content = editor ? editor.innerHTML : '';
    suratData.updatedAt = new Date().toISOString();
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(suratData));
      if (showNotification) {
        showToast('success', 'Draft Disimpan', 'Perubahan berhasil disimpan');
      }
      return true;
    } catch (e) {
      console.error('Save draft error:', e);
      if (showNotification) {
        showToast('error', 'Gagal Simpan', 'Storage penuh atau error');
      }
      return false;
    }
  }

  function loadDraft() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        const draftDate = new Date(draft.updatedAt);
        const daysDiff = (Date.now() - draftDate) / (1000 * 60 * 60 * 24);
        
        if (daysDiff < 7 && confirm('Terdapat draft yang belum disimpan. Muat draft tersebut?')) {
          suratData = { ...suratData, ...draft };
          
          const titleInput = document.getElementById('suratTitle');
          const editor = document.getElementById('suratEditor');
          
          if (titleInput) {
            titleInput.value = suratData.title;
          }
          if (editor) {
            editor.innerHTML = suratData.content;
          }
          
          if (suratData.meta) {
            Object.keys(suratData.meta).forEach(key => {
              const input = document.getElementById('meta' + key.charAt(0).toUpperCase() + key.slice(1));
              if (input) input.value = suratData.meta[key];
            });
          }
          
          if (suratData.category) {
            document.querySelectorAll('.category-chip').forEach(chip => {
              chip.classList.toggle('active', chip.dataset.cat === suratData.category);
            });
          }
          
          renderAttachments();
          updateWordCount();
          
          showToast('info', 'Draft Dimuat', 'Draft sebelumnya telah dipulihkan');
        }
      }
    } catch (e) {
      console.error('Load draft error:', e);
    }
  }

  function clearDraft() {
    localStorage.removeItem(STORAGE_KEY);
    suratData = {
      id: null,
      title: '',
      content: '',
      meta: { nomor: '', klasifikasi: 'biasa', tanggal: '', tujuan: '', lampiran: '' },
      category: 'lainnya',
      attachments: [],
      status: 'draft',
      createdAt: null,
      updatedAt: null
    };
  }

  // ===== WORD COUNT =====
  function setupWordCount() {
    const editor = document.getElementById('suratEditor');
    if (editor) {
      editor.addEventListener('input', updateWordCount);
      updateWordCount();
    }
  }

  function updateWordCount() {
    const editor = document.getElementById('suratEditor');
    const counter = document.getElementById('wordCount');
    if (editor && counter) {
      const text = editor.textContent || '';
      const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
      counter.textContent = words + ' kata';
    }
  }

  // ===== KEYBOARD SHORTCUTS =====
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveDraft(true);
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        openPreview();
      }
      
      if (e.key === 'Escape') {
        const modal = document.getElementById('previewModal');
        if (modal) {
          modal.style.display = 'none';
        }
      }
    });
  }

  // ===== BACKEND SYNC =====
  async function saveToBackend() {
    const payload = {
      ...suratData,
      attachments: suratData.attachments.map(a => ({ name: a.name, size: a.size }))
    };
    
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ success: true, id: 'surat_' + Date.now() });
      }, 1000);
    });
  }

  function renderAttachments() {
    const attachmentList = document.getElementById('attachmentList');
    if (!attachmentList) return;
    
    attachmentList.innerHTML = '';
    suratData.attachments.forEach((att, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <i class="fas fa-file" style="color: var(--primary);"></i>
        <span style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${att.name}</span>
        <small style="color: var(--text-muted);">${att.size}</small>
        <span class="remove-attachment" data-index="${index}"><i class="fas fa-times"></i></span>
      `;
      attachmentList.appendChild(li);
    });

    attachmentList.querySelectorAll('.remove-attachment').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const index = this.dataset.index;
        suratData.attachments.splice(index, 1);
        renderAttachments();
        scheduleAutoSave();
      });
    });
  }

  // ===== PUBLIC API =====
  window.BuatSuratModule = {
    init: initBuatSurat,
    saveDraft: () => saveDraft(true),
    openPreview: openPreview,
    clear: clearDraft,
    getData: () => ({ ...suratData })
  };

  // ===== AUTO-INIT =====
  if (typeof document !== 'undefined') {
    function tryInit() {
      const page = document.getElementById('page-buat-surat');
      if (page && (page.classList.contains('active') || page.style.display !== 'none')) {
        initBuatSurat();
        return true;
      }
      return false;
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => setTimeout(tryInit, 100));
    } else {
      setTimeout(tryInit, 100);
    }

    window.addEventListener('load', () => {
      setTimeout(() => {
        const editor = document.getElementById('suratEditor');
        if (editor && !editor.hasAttribute('data-initialized')) {
          editor.setAttribute('data-initialized', 'true');
          tryInit();
        }
      }, 300);
    });
  }
})();