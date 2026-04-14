/**
 * ========================================
 * PENGGUNA.JS - User Management Module
 * ========================================
 * Traditional script version
 */

/**
 * Save new user
 */
function simpanPengguna() {
    const nama = document.getElementById('inputNamaUser')?.value;
    const email = document.getElementById('inputEmailUser')?.value;
    
    if (!nama || !email) {
        if (typeof window.showToast === 'function') {
            window.showToast('warning', 'Peringatan', 'Nama dan email wajib diisi!');
        }
        return;
    }

    if (typeof window.closeModal === 'function') window.closeModal('modalPengguna');
    if (typeof window.showToast === 'function') {
        window.showToast('success', 'Berhasil', `Pengguna ${nama} berhasil ditambahkan`);
    }
    
    // Clear form
    ['inputNamaUser', 'inputEmailUser', 'inputJabatanUser', 'inputPasswordUser'].forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

/**
 * Save profile settings
 */
function simpanProfil() {
    if (typeof window.showToast === 'function') {
        window.showToast('success', 'Berhasil', 'Pengaturan profil berhasil disimpan');
    }
}

/**
 * Save system settings
 */
function simpanPengaturan() {
    if (typeof window.showToast === 'function') {
        window.showToast('success', 'Berhasil', 'Pengaturan sistem berhasil disimpan');
    }
}

/**
 * Initialize pengguna module
 */
function initPengguna() {
    const userSaveBtn = document.querySelector('#modalPengguna .btn-primary');
    if (userSaveBtn) {
        userSaveBtn.addEventListener('click', simpanPengguna);
    }
    
    document.querySelectorAll('#page-pengaturan .btn-primary').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const card = this.closest('.card');
            const h3 = card?.querySelector('h3');
            const isProfil = h3?.textContent.includes('Profil');
            isProfil ? simpanProfil() : simpanPengaturan();
        });
    });
    
    console.log('👥 Pengguna module initialized');
    
    return {
        addUser: simpanPengguna,
        saveProfile: simpanProfil,
        saveSettings: simpanPengaturan,
        getUserList: function() {
            return Array.from(document.querySelectorAll('#page-pengguna tbody tr')).map(function(row) {
                return {
                    name: row.cells[0]?.textContent.trim(),
                    email: row.cells[1]?.textContent.trim(),
                    role: row.cells[3]?.textContent.trim()
                };
            });
        }
    };
}

// ========================================
// GLOBAL EXPOSURE
// ========================================
if (typeof window !== 'undefined') {
    window.simpanPengguna = simpanPengguna;
    window.simpanProfil = simpanProfil;
    window.simpanPengaturan = simpanPengaturan;
    window.initPengguna = initPengguna;
}