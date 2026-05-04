/**
 * ========================================
 * AGENDA.JS - Google Apps Script Integration
 * ✅ Backend: Google Sheets via Apps Script
 * ========================================
 */

(function() {
  'use strict';

  // ===== KONFIGURASI BACKEND =====
  const API_CONFIG = {
    BASE_URL: 'https://script.google.com/macros/s/AKfycbwKxVbadzU_oQXjt6_Pt9bsJd3I-1GsWaeHPIqeOIWWWSUCj7KAnhZzurlJFAuiYNpZ/exec',
    MODULE: 'agenda',
    SHEET_NAME: 'AgendaKegiatan'
  };

  // ===== CONSTANTS =====
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const fullMonthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const dayNamesFull = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  // ===== STATE =====
  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth();
  let selectedDate = new Date();
  let selectedCat = 'personal';
  let isInitialized = false;
  let agendaCache = []; // Cache data dari backend

  // ===== API HELPERS =====
async function apiRequest(action, data = null, method = 'POST') {
  const url = new URL(API_CONFIG.BASE_URL);
  
  try {
    console.log('📡 API Request:', action, method, data);
    
    if (method === 'GET') {
      if (data) {
        Object.keys(data).forEach(key => {
          if (data[key] !== undefined && data[key] !== null) {
            url.searchParams.append(key, data[key]);
          }
        });
      }
      
      url.searchParams.append('t', Date.now());
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        mode: 'cors',
        redirect: 'follow',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('📥 GET Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ GET Response:', result);
      return result.success ? result : { success: false, error: result.error || 'Request failed' };
      
    } else {
      // POST request - IMPORTANT: Jangan gunakan no-cors untuk delete!
      const payload = {
        module: API_CONFIG.MODULE,
        action: action,
        data: data,
        timestamp: new Date().toISOString()
      };
      
      console.log('📤 Sending POST payload:', payload);
      
      // Untuk GAS, kita perlu menggunakan mode cors dan Content-Type text/plain
      // untuk menghindari preflight OPTIONS request
      const response = await fetch(url.toString(), {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload)
      });
      
      console.log('📥 POST Response status:', response.status);
      console.log('📥 POST Response type:', response.type);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ POST Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ POST Response:', result);
      return result.success ? result : { success: false, error: result.error || 'Request failed' };
    }
  } catch (error) {
    console.error('❌ API Error:', error);
    
    // Fallback untuk delete - hapus dari cache lokal saja
    if (action === 'delete') {
      console.log('🔄 Delete failed, removing from local cache only');
      return { success: true, message: 'Deleted locally only' };
    }
    
    return handleLocalFallback(action, data);
  }
}
function handleLocalFallback(action, data) {
  if (action === 'list') {
    return { success: true, data: getLocalEvents() };
  }
  if (action === 'add') {
    const events = getLocalEvents();
    const newEvent = {
      id: 'local_' + Date.now(),
      ...data,
      timestamp: new Date().toISOString()
    };
    events.push(newEvent);
    saveLocalEvents(events);
    return { success: true, data: newEvent };
  }
  if (action === 'delete') {
    const events = getLocalEvents().filter(e => e.id !== data.id);
    saveLocalEvents(events);
    return { success: true };
  }
  return { success: false, error: 'Backend unavailable, using local storage' };
}
  // ===== DATA MAPPING (Frontend ↔ Backend) =====
function mapToFrontend(backendData) {
  console.log('📥 Raw backend data:', backendData);
  
  // ===== HANDLE TANGGAL =====
  let tanggal = '';
  if (backendData.tanggal) {
    if (typeof backendData.tanggal === 'number') {
      // Google Sheets date serial number
      const dateObj = new Date(Math.round((backendData.tanggal - 25569) * 86400 * 1000));
      tanggal = dateStr(dateObj);
    } else if (backendData.tanggal instanceof Date) {
      tanggal = dateStr(backendData.tanggal);
    } else {
      // String - gunakan langsung jika sudah format YYYY-MM-DD
      const tanggalStr = String(backendData.tanggal);
      if (tanggalStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        tanggal = tanggalStr;
      } else {
        const parsed = new Date(tanggalStr);
        if (!isNaN(parsed.getTime())) {
          tanggal = dateStr(parsed);
        }
      }
    }
  }
  
  // ===== HANDLE WAKTU MULAI =====
  let waktuMulai = '09:00';
  if (backendData.waktu_mulai) {
    if (typeof backendData.waktu_mulai === 'number') {
      // Google Sheets time decimal (0.5 = 12:00)
      const totalMinutes = Math.round(backendData.waktu_mulai * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      waktuMulai = String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
    } else if (backendData.waktu_mulai instanceof Date) {
      waktuMulai = backendData.waktu_mulai.getHours().toString().padStart(2, '0') + ':' + 
                   backendData.waktu_mulai.getMinutes().toString().padStart(2, '0');
    } else {
      // String - ambil hanya HH:MM jika ada timezone
      const timeStr = String(backendData.waktu_mulai);
      const timeMatch = timeStr.match(/(\d{2}):(\d{2})/);
      if (timeMatch) {
        waktuMulai = timeMatch[1] + ':' + timeMatch[2];
      }
    }
  }
  
  // ===== HANDLE WAKTU SELESAI =====
  let waktuSelesai = '';
  if (backendData.waktu_selesai) {
    if (typeof backendData.waktu_selesai === 'number') {
      const totalMinutes = Math.round(backendData.waktu_selesai * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      waktuSelesai = String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
    } else if (backendData.waktu_selesai instanceof Date) {
      waktuSelesai = backendData.waktu_selesai.getHours().toString().padStart(2, '0') + ':' + 
                     backendData.waktu_selesai.getMinutes().toString().padStart(2, '0');
    } else {
      const timeStr = String(backendData.waktu_selesai);
      const timeMatch = timeStr.match(/(\d{2}):(\d{2})/);
      if (timeMatch) {
        waktuSelesai = timeMatch[1] + ':' + timeMatch[2];
      }
    }
  }
  
  const mapped = {
    id: String(backendData.id || 'id_' + Date.now()),
    title: String(backendData.judul || 'Tanpa Judul'),
    date: tanggal || dateStr(new Date()),
    time: waktuMulai,
    timeEnd: waktuSelesai,
    category: String(backendData.kategori || 'lainnya'),
    description: String(backendData.deskripsi || ''),
    location: String(backendData.lokasi || ''),
    status: String(backendData.status || 'terjadwal'),
    meetingLink: String(backendData.link_meeting || ''),
    createdAt: backendData.timestamp ? new Date(backendData.timestamp).toISOString() : new Date().toISOString(),
    createdBy: String(backendData.created_by || 'system')
  };
  
  console.log('✅ Mapped to frontend:', mapped);
  return mapped;
}

  function mapToBackend(frontendData) {
    // Konversi data frontend ke format backend
    return {
      id: frontendData.id || '',
      judul: frontendData.title || frontendData.judul || '',
      tanggal: frontendData.date || frontendData.tanggal || dateStr(selectedDate),
      waktu_mulai: frontendData.time || frontendData.waktu_mulai || '09:00',
      waktu_selesai: frontendData.timeEnd || frontendData.waktu_selesai || '',
      deskripsi: frontendData.description || frontendData.deskripsi || '',
      lokasi: frontendData.location || frontendData.lokasi || '',
      kategori: frontendData.category || frontendData.kategori || selectedCat,
      status: frontendData.status || 'terjadwal',
      link_meeting: frontendData.meetingLink || frontendData.link_meeting || '',
      created_by: frontendData.createdBy || frontendData.created_by || 'system'
    };
  }

  // ===== BACKEND DATA OPERATIONS =====
  async function fetchAgendaData(filters = {}) {
  try {
    console.log('📡 Fetching agenda data with filters:', filters);
    const result = await apiRequest('list', { 
      sheet: API_CONFIG.SHEET_NAME,
      ...filters 
    }, 'GET');
    
    console.log('📥 Raw backend response:', result);
    
    if (result.success && Array.isArray(result.data)) {
      console.log('📋 Mapping', result.data.length, 'events from backend');
      agendaCache = result.data.map(function(item, index) {
        console.log('  [' + index + '] Backend item:', item);
        const mapped = mapToFrontend(item);
        console.log('  [' + index + '] Mapped to:', mapped);
        return mapped;
      });
      console.log('✅ Loaded', agendaCache.length, 'events from backend');
      console.log('📅 Agenda cache:', agendaCache);
      return agendaCache;
    } else {
      console.warn('⚠️ Backend returned no data or error:', result);
      agendaCache = getLocalEvents().map(mapToFrontend);
      return agendaCache;
    }
  } catch (error) {
    console.error('❌ Failed to fetch from backend:', error);
    agendaCache = getLocalEvents().map(mapToFrontend);
    showToast('warning', 'Mode Offline', 'Menggunakan data lokal');
    return agendaCache;
  }
}

  async function saveAgendaToBackend(data) {
    const backendData = mapToBackend(data);
    const action = data.id ? 'update' : 'add';
    const result = await apiRequest(action, backendData);
    
    if (result.success) {
      // Refresh cache setelah save
      await fetchAgendaData();
      return true;
    }
    return false;
  }

  async function deleteAgendaFromBackend(id) {
  console.log('🗑️ Deleting agenda with ID:', id);
  
  try {
    // Hapus dari cache lokal dulu
    const beforeLength = agendaCache.length;
    agendaCache = agendaCache.filter(e => e.id !== id);
    
    // Kirim request ke backend
    const result = await apiRequest('delete', { id });
    
    console.log('📤 Delete response:', result);
    
    if (result.success) {
      console.log('✅ Successfully deleted from backend');
      // Refresh data dari backend untuk memastikan sinkronisasi
      await fetchAgendaData();
      return true;
    } else {
      console.warn('⚠️ Backend delete failed, keeping local deletion');
      // Tetap return true karena sudah dihapus dari cache lokal
      return true;
    }
  } catch (error) {
    console.error('❌ Delete error:', error);
    // Rollback - kembalikan item yang dihapus
    showToast('error', 'Gagal Hapus', 'Tidak dapat menghapus dari server');
    return false;
  }
}

  // ===== LOCAL STORAGE FALLBACK (Opsional) =====
  function getLocalEvents() {
    try {
      const s = localStorage.getItem('calEvents_v4');
      return s ? JSON.parse(s) : [];
    } catch(e) { return []; }
  }

  function saveLocalEvents(events) {
    try {
      localStorage.setItem('calEvents_v4', JSON.stringify(events));
      return true;
    } catch(e) { return false; }
  }

  // ===== DATE UTILS =====
  function dateStr(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function isToday(d) {
    const t = new Date();
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
  }

  function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function getDayEvents(dateStr) {
    return agendaCache
      .filter(function(e) { return e.date === dateStr; })
      .sort(function(a, b) { return a.time.localeCompare(b.time); });
  }

  // ===== TOAST NOTIFICATION =====
  function showToast(type, title, message) {
    if (typeof window.showToast === 'function') {
      window.showToast(type, title, message);
      return;
    }
    
    var container = document.getElementById('toastContainer');
    if (!container) {
      console.log('🔔', title + ':', message);
      return;
    }
    
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    var icon = type === 'success' 
      ? '<i class="fas fa-check-circle toast-icon"></i>' 
      : '<i class="fas fa-exclamation-circle toast-icon"></i>';
    
    toast.innerHTML = icon + '<div class="toast-content"><h4>' + title + '</h4><p>' + message + '</p></div>';
    container.appendChild(toast);
    
    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
  }

  // ===== RENDER FUNCTIONS =====
  function renderMonthTabs() {
    var container = document.getElementById('monthTabs');
    if (!container) return;
    
    container.innerHTML = '';
    monthNames.forEach(function(m, i) {
      var btn = document.createElement('button');
      btn.className = 'month-tab' + (i === currentMonth ? ' active' : '');
      btn.textContent = m;
      btn.type = 'button';
      btn.addEventListener('click', function() {
        currentMonth = i;
        render();
      });
      container.appendChild(btn);
    });
  }

  function renderCalendar() {
  var grid = document.getElementById('calendarGrid');
  if (!grid) return;
  
  grid.innerHTML = '';

  console.log('📅 Rendering calendar for:', currentYear, currentMonth);
  console.log('📊 Total events in cache:', agendaCache.length);

  var firstDay = new Date(currentYear, currentMonth, 1);
  var lastDay = new Date(currentYear, currentMonth + 1, 0);
  var startIdx = firstDay.getDay();
  var daysInMonth = lastDay.getDate();
  var prevLast = new Date(currentYear, currentMonth, 0).getDate();

  // Previous month days
  for (var i = startIdx - 1; i >= 0; i--) {
    var d = new Date(currentYear, currentMonth - 1, prevLast - i);
    var ds = dateStr(d);
    var evts = getDayEvents(ds);
    var cell = document.createElement('div');
    cell.className = 'calendar-cell other-month' + (evts.length > 0 ? ' has-event' : '');
    cell.textContent = d.getDate();
    cell.setAttribute('data-date', ds);
    cell.setAttribute('type', 'button');
    cell.addEventListener('click', (function(dateObj) {
      return function() {
        selectedDate = new Date(dateObj);
        currentMonth = dateObj.getMonth();
        currentYear = dateObj.getFullYear();
        render();
      };
    })(d));
    grid.appendChild(cell);
  }

  // Current month days
  for (var day = 1; day <= daysInMonth; day++) {
    var d2 = new Date(currentYear, currentMonth, day);
    var ds2 = dateStr(d2);
    var evts2 = getDayEvents(ds2);
    var cls = 'calendar-cell';
    if (isToday(d2)) cls += ' today';
    if (isSameDay(d2, selectedDate)) cls += ' selected';
    if (evts2.length > 0) cls += ' has-event';

    var cell2 = document.createElement('div');
    cell2.className = cls;
    cell2.textContent = day;
    cell2.setAttribute('data-date', ds2);
    cell2.setAttribute('type', 'button');
    cell2.addEventListener('click', (function(dateObj) {
      return function() {
        selectedDate = new Date(dateObj);
        render();
      };
    })(d2));
    grid.appendChild(cell2);
    
    // Debug untuk tanggal yang ada event
    if (evts2.length > 0) {
      console.log('✅ Event found on', ds2, ':', evts2);
    }
  }

  // Next month days
  var totalCells = startIdx + daysInMonth;
  var remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (var j = 1; j <= remaining; j++) {
    var d3 = new Date(currentYear, currentMonth + 1, j);
    var ds3 = dateStr(d3);
    var evts3 = getDayEvents(ds3);
    var cell3 = document.createElement('div');
    cell3.className = 'calendar-cell other-month' + (evts3.length > 0 ? ' has-event' : '');
    cell3.textContent = j;
    cell3.setAttribute('data-date', ds3);
    cell3.setAttribute('type', 'button');
    cell3.addEventListener('click', (function(dateObj) {
      return function() {
        selectedDate = new Date(dateObj);
        currentMonth = dateObj.getMonth();
        currentYear = dateObj.getFullYear();
        render();
      };
    })(d3));
    grid.appendChild(cell3);
  }
}

  function renderLeftPanel() {
    var bigDate = document.getElementById('bigDate');
    var bigDay = document.getElementById('bigDay');
    var yearDisplay = document.getElementById('yearDisplay');
    var eventsListLeft = document.getElementById('eventsListLeft');
    
    var d = selectedDate;
    
    // Update elemen-elemen jika ada (tidak langsung return jika tidak ada)
    if (bigDate) bigDate.textContent = d.getDate();
    if (bigDay) bigDay.textContent = dayNamesFull[d.getDay()].toUpperCase();
    if (yearDisplay) yearDisplay.textContent = currentYear;
    
    if (!eventsListLeft) {
        console.warn('⚠️ eventsListLeft not found');
        return;
    }

    var ds = dateStr(d);
    var evts = getDayEvents(ds);
    eventsListLeft.innerHTML = '';

    if (evts.length === 0) {
      eventsListLeft.innerHTML = '<li style="opacity:0.5">Tidak ada agenda hari ini</li>';
    } else {
      evts.slice(0, 5).forEach(function(ev) {
        var li = document.createElement('li');
        li.textContent = ev.time + ' ' + ev.title;
        li.setAttribute('role', 'listitem');
        eventsListLeft.appendChild(li);
      });
      if (evts.length > 5) {
        var li = document.createElement('li');
        li.textContent = '+ ' + (evts.length - 5) + ' lainnya';
        li.style.opacity = '0.6';
        eventsListLeft.appendChild(li);
      }
    }
}

  function renderTimeline() {
  var container = document.getElementById('timelineContainer');
  if (!container) return;
  
  container.innerHTML = '';

  console.log('📊 Rendering timeline, total events:', agendaCache.length);

  // Urutkan berdasarkan tanggal dan waktu
  var sortedEvents = agendaCache.slice().sort(function(a, b) {
    var dateA = new Date(a.date + 'T' + a.time);
    var dateB = new Date(b.date + 'T' + b.time);
    return dateA - dateB;
  });

  var eventsToShow = sortedEvents.slice(0, 10);

  if (eventsToShow.length === 0) {
    container.innerHTML = '<div class="empty-timeline"><div class="icon">📋</div><p>Belum ada agenda</p><p style="font-size:12px;margin-top:8px;opacity:0.7">Klik tombol "Tambah Agenda" untuk membuat agenda baru</p></div>';
    return;
  }

  var now = new Date();
  now.setHours(0, 0, 0, 0);

  eventsToShow.forEach(function(ev) {
    // Parse tanggal dengan benar
    var evDate = new Date(ev.date + 'T00:00:00');
    var isPast = evDate < now;
    
    // ✅ Format tanggal yang benar: "22 April 2026"
    var dateDisplay = evDate.getDate() + ' ' + fullMonthNames[evDate.getMonth()] + ' ' + evDate.getFullYear();
    
    // ✅ Format waktu yang benar: "09:00 - 10:00 WIB"
    var timeDisplay = '';
    if (ev.time && ev.time !== '00:00') {
      timeDisplay = ev.time;
      if (ev.timeEnd && ev.timeEnd !== '00:00') {
        timeDisplay += ' - ' + ev.timeEnd;
      }
      timeDisplay += ' WIB';
    } else {
      timeDisplay = 'Sepanjang hari';
    }

    var item = document.createElement('div');
    item.className = 'timeline-item' + (isPast ? ' past' : '');
    item.style.position = 'relative';
    item.style.paddingRight = '40px';
    
    // Status badge
    var statusBadge = '';
    if (ev.status === 'selesai') {
      statusBadge = '<span style="position:absolute;top:16px;right:40px;padding:4px 8px;background:#10b981;color:white;border-radius:4px;font-size:11px;font-weight:600">Selesai</span>';
    } else if (ev.status === 'berlangsung') {
      statusBadge = '<span style="position:absolute;top:16px;right:40px;padding:4px 8px;background:#3b82f6;color:white;border-radius:4px;font-size:11px;font-weight:600">Berlangsung</span>';
    } else if (ev.status === 'dibatalkan') {
      statusBadge = '<span style="position:absolute;top:16px;right:40px;padding:4px 8px;background:#ef4444;color:white;border-radius:4px;font-size:11px;font-weight:600">Dibatalkan</span>';
    }
    
    // Tombol hapus
    var deleteBtn = '';
    if (ev.status !== 'dibatalkan') {
      deleteBtn = '<button class="delete-timeline" data-id="' + ev.id + '" type="button" aria-label="Hapus" style="position:absolute;top:16px;right:0;width:32px;height:32px;border:none;background:#fee2e2;color:#ef4444;border-radius:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;" onmouseover="this.style.background=\'#fecaca\'" onmouseout="this.style.background=\'#fee2e2\'"><i class="fas fa-trash-alt"></i></button>';
    }

    item.innerHTML =
      '<div style="display:flex;align-items:flex-start;gap:12px">' +
        '<div style="flex:1">' +
          '<h4 style="margin:0 0 4px 0;font-size:15px;font-weight:600;color:var(--text-primary)">' + ev.title + '</h4>' +
          (ev.description ? '<p style="margin:0 0 8px 0;font-size:13px;color:var(--text-muted);line-height:1.5">' + ev.description + '</p>' : '') +
          '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:8px">' +
            '<div class="time" style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--primary-lighter);font-weight:500">' +
              '<i class="fas fa-calendar-day" style="font-size:12px"></i>' +
              '<span>' + dateDisplay + '</span>' +
            '</div>' +
            '<div class="time" style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-secondary)">' +
              '<i class="fas fa-clock" style="font-size:12px"></i>' +
              '<span>' + timeDisplay + '</span>' +
            '</div>' +
            (ev.location ? '<div style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-secondary)"><i class="fas fa-map-marker-alt" style="font-size:12px;color:var(--accent)"></i><span>' + ev.location + '</span></div>' : '') +
          '</div>' +
        '</div>' +
      '</div>' +
      statusBadge +
      deleteBtn;

    container.appendChild(item);
  });

  // Setup delete handlers
  document.querySelectorAll('.delete-timeline').forEach(function(btn) {
    btn.addEventListener('click', async function(e) {
      e.stopPropagation();
      var id = btn.getAttribute('data-id');
      
      if (!confirm('Yakin ingin menghapus agenda ini?')) return;
      
      var originalHTML = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      btn.disabled = true;
      btn.style.opacity = '0.6';
      
      try {
        const success = await deleteAgendaFromBackend(id);
        if (success) {
          btn.closest('.timeline-item').style.opacity = '0';
          btn.closest('.timeline-item').style.transform = 'translateX(20px)';
          setTimeout(() => {
            render();
            showToast('success', 'Berhasil', 'Agenda berhasil dihapus');
          }, 300);
        } else {
          btn.innerHTML = originalHTML;
          btn.disabled = false;
          btn.style.opacity = '1';
          showToast('error', 'Gagal', 'Tidak dapat menghapus agenda');
        }
      } catch (error) {
        console.error('Delete error:', error);
        btn.innerHTML = originalHTML;
        btn.disabled = false;
        btn.style.opacity = '1';
        showToast('error', 'Error', 'Terjadi kesalahan saat menghapus');
      }
    });
  });
}

  async function render() {
    // HAPUS pengecekan isInitialized di sini!
    // if (!isInitialized) {
    //     console.warn('⚠️ render() called before initialization');
    //     return;
    // }
    
    // Show loading state
    var timelineContainer = document.getElementById('timelineContainer');
    if (timelineContainer && agendaCache.length === 0) {
      timelineContainer.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted)"><i class="fas fa-spinner fa-spin" style="font-size:24px"></i><p style="margin-top:10px">Memuat data...</p></div>';
    }
    
    // Render semua komponen
    renderMonthTabs();
    renderCalendar();
    renderLeftPanel();
    renderTimeline();
    
    // Debug: pastikan tanggal ter-render
    console.log('✅ Render complete. Selected date:', selectedDate);
    console.log('📅 Left panel elements:', {
        bigDate: document.getElementById('bigDate')?.textContent,
        bigDay: document.getElementById('bigDay')?.textContent,
        yearDisplay: document.getElementById('yearDisplay')?.textContent
    });
}

async function initAgenda() {
    if (isInitialized) {
      console.log('📅 Agenda already initialized');
      return agendaAPI;
    }

    var agendaPage = document.getElementById('page-agenda');
    if (!agendaPage) {
      console.warn('⚠️ #page-agenda not found, skipping init');
      return agendaAPI;
    }

    console.log('📅 Initializing Agenda module with backend sync...');
    
    // SET isInitialized = true DI AWAL, sebelum render!
    isInitialized = true;
    
    // Pastikan elemen-elemen penting ada
    var bigDate = document.getElementById('bigDate');
    var bigDay = document.getElementById('bigDay');
    
    if (!bigDate || !bigDay) {
        console.error('❌ Required elements not found: bigDate or bigDay');
        // Tunggu sebentar dan coba lagi
        await new Promise(resolve => setTimeout(resolve, 200));
        bigDate = document.getElementById('bigDate');
        bigDay = document.getElementById('bigDay');
        
        if (!bigDate || !bigDay) {
            console.error('❌ Still not found after retry');
            // Tetap lanjutkan, mungkin elemen akan muncul nanti
        }
    }
    
    // Setup all listeners DULU
    setupEventListeners();
    
    // Initial render dengan state default
    renderLeftPanel(); // Render panel kiri dulu dengan tanggal hari ini
    renderMonthTabs();
    renderCalendar();
    
    // Baru fetch data dari backend
    await fetchAgendaData();
    
    // Render ulang dengan data
    renderTimeline();
    renderCalendar(); // Re-render calendar dengan events
    
    console.log('✅ Agenda module ready with backend sync');
    console.log('📅 Initial date displayed:', selectedDate);
    
    return agendaAPI;
}

  // ===== MODAL FUNCTIONS =====
  function openAddModal() {
    var modal = document.getElementById('addModal');
    if (!modal) return;
    
    modal.classList.add('active');
    document.getElementById('eventDate').value = dateStr(selectedDate);
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventTime').value = '';
    document.getElementById('eventTimeEnd').value = '';
    document.getElementById('eventDesc').value = '';
    selectedCat = 'personal';
    updateCatBtns();
    setTimeout(function() { 
      var titleInput = document.getElementById('eventTitle');
      if (titleInput) titleInput.focus(); 
    }, 200);
  }

  function closeAddModal() {
    var modal = document.getElementById('addModal');
    if (modal) modal.classList.remove('active');
  }

  function openDetailModal() {
    var modal = document.getElementById('detailModal');
    if (!modal) return;
    
    modal.classList.add('active');
    var d = selectedDate;
    var detailLabel = document.getElementById('detailDateLabel');
    if (detailLabel) {
      detailLabel.textContent = dayNamesFull[d.getDay()] + ', ' + d.getDate() + ' ' + fullMonthNames[d.getMonth()] + ' ' + d.getFullYear();
    }

    var ds = dateStr(d);
    var evts = getDayEvents(ds);
    var container = document.getElementById('detailEventsList');
    if (!container) return;
    
    container.innerHTML = '';

    if (evts.length === 0) {
      container.innerHTML = '<div class="no-events-msg"><div class="icon">📭</div>Tidak ada agenda untuk hari ini</div>';
    } else {
      evts.forEach(function(ev) {
        var item = document.createElement('div');
        item.className = 'detail-event-item';
        var timeInfo = ev.timeEnd ? ev.time + ' - ' + ev.timeEnd : ev.time;
        item.innerHTML =
          '<button class="delete-event" data-id="' + ev.id + '" type="button">✕ Hapus</button>' +
          '<div class="event-time">' + timeInfo + '</div>' +
          '<div class="event-name">' + ev.title + '</div>' +
          (ev.description ? '<div class="event-desc">' + ev.description + '</div>' : '');
        container.appendChild(item);
      });

      document.querySelectorAll('.detail-event-item .delete-event').forEach(function(btn) {
        btn.addEventListener('click', async function(e) {
          e.stopPropagation();
          var id = btn.getAttribute('data-id');
          if (!confirm('Hapus agenda ini?')) return;
          
          btn.innerHTML = '✕ ...';
          btn.disabled = true;
          
          const success = await deleteAgendaFromBackend(id);
          if (success) {
            render();
            openDetailModal();
            showToast('success', 'Berhasil', 'Agenda berhasil dihapus');
          } else {
            btn.innerHTML = '✕ Hapus';
            btn.disabled = false;
            showToast('error', 'Gagal', 'Tidak dapat menghapus agenda');
          }
        });
      });
    }
  }

  function closeDetailModal() {
    var modal = document.getElementById('detailModal');
    if (modal) modal.classList.remove('active');
  }

  function updateCatBtns() {
    document.querySelectorAll('.category-option').forEach(function(b) {
      b.classList.toggle('active', b.dataset.cat === selectedCat);
    });
  }

  // ===== PUBLIC API: tambahAgenda (Backend Sync) =====
  async function tambahAgenda(data) {
    var title = data.title || data.Judul || '';
    var date = data.date || data.Tanggal || dateStr(selectedDate);
    var time = data.time || data.WaktuMulai || '09:00';
    var timeEnd = data.timeEnd || data.WaktuSelesai || '';
    var category = data.category || data.Kategori || selectedCat;
    var description = data.description || data.Deskripsi || '';
    var location = data.location || data.Lokasi || '';
    var meetingLink = data.meetingLink || data.LinkMeeting || '';

    if (!title) {
      showToast('error', 'Error', 'Judul agenda wajib diisi');
      return false;
    }

    // Show loading
    var submitBtn = document.querySelector('#eventForm button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    }

    try {
      const success = await saveAgendaToBackend({
        title: title,
        date: date,
        time: time,
        timeEnd: timeEnd,
        category: category,
        description: description,
        location: location,
        meetingLink: meetingLink,
        status: 'terjadwal'
      });

      if (success) {
        if (date) {
          selectedDate = new Date(date + 'T00:00:00');
          currentYear = selectedDate.getFullYear();
          currentMonth = selectedDate.getMonth();
        }
        render();
        showToast('success', 'Berhasil', 'Agenda "' + title + '" berhasil disimpan');
        return true;
      } else {
        showToast('error', 'Gagal', 'Tidak dapat menyimpan ke server');
        return false;
      }
    } catch (error) {
      console.error('Save error:', error);
      showToast('error', 'Error', 'Terjadi kesalahan saat menyimpan');
      return false;
    } finally {
      // Reset button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save" style="margin-right: 6px;"></i>Simpan Agenda';
      }
    }
  }

  // ===== EVENT LISTENERS SETUP =====
  function setupEventListeners() {
    // Category buttons
    document.querySelectorAll('.category-option').forEach(function(b) {
      b.addEventListener('click', function() {
        selectedCat = b.dataset.cat;
        updateCatBtns();
      });
    });

    // Add form submit
    var eventForm = document.getElementById('eventForm');
    if (eventForm) {
      eventForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        var title = document.getElementById('eventTitle').value.trim();
        var date = document.getElementById('eventDate').value;
        var time = document.getElementById('eventTime').value;
        var timeEnd = document.getElementById('eventTimeEnd').value;
        var desc = document.getElementById('eventDesc').value.trim();

        if (!title || !date || !time) {
          showToast('error', 'Error', 'Judul, tanggal, dan waktu wajib diisi');
          return;
        }

        await tambahAgenda({
          title: title,
          date: date,
          time: time,
          timeEnd: timeEnd,
          category: selectedCat,
          description: desc
        });
        
        closeAddModal();
        eventForm.reset();
      });
    }

    // Navigation buttons
    var prevYear = document.getElementById('prevYear');
    var nextYear = document.getElementById('nextYear');
    if (prevYear) prevYear.addEventListener('click', function() { currentYear--; render(); });
    if (nextYear) nextYear.addEventListener('click', function() { currentYear++; render(); });

    // See all events link
    var seeEventsLink = document.getElementById('seeEventsLink');
    if (seeEventsLink) {
      seeEventsLink.addEventListener('click', function(e) {
        e.preventDefault();
        openDetailModal();
      });
    }

    // Create event button
    var createEventBtn = document.querySelector('.create-event-btn');
    if (createEventBtn) {
      createEventBtn.addEventListener('click', function(e) {
        e.preventDefault();
        openAddModal();
      });
    }

    // Modal close on backdrop click
    var addModal = document.getElementById('addModal');
    var detailModal = document.getElementById('detailModal');
    
    if (addModal) {
      addModal.addEventListener('click', function(e) {
        if (e.target === this) closeAddModal();
      });
    }
    if (detailModal) {
      detailModal.addEventListener('click', function(e) {
        if (e.target === this) closeDetailModal();
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeAddModal();
        closeDetailModal();
      }
      var addModalActive = addModal && addModal.classList.contains('active');
      var detailModalActive = detailModal && detailModal.classList.contains('active');
      
      if (!addModalActive && !detailModalActive) {
        if (e.key === 'ArrowLeft') {
          selectedDate.setDate(selectedDate.getDate() - 1);
          currentMonth = selectedDate.getMonth();
          currentYear = selectedDate.getFullYear();
          render();
        }
        if (e.key === 'ArrowRight') {
          selectedDate.setDate(selectedDate.getDate() + 1);
          currentMonth = selectedDate.getMonth();
          currentYear = selectedDate.getFullYear();
          render();
        }
      }
    });
  }

  // ===== RESET & SAMPLE DATA =====
  async function resetData() {
    if (confirm('Reset semua data kalender ke default?')) {
      // Note: Reset backend requires additional endpoint
      // For now, just clear local cache and re-fetch
      agendaCache = [];
      await fetchAgendaData();
      render();
      showToast('success', 'Refresh', 'Data berhasil diperbarui');
    }
  }

  // ===== PUBLIC API: initAgenda =====
  async function initAgenda() {
    if (isInitialized) {
      console.log('📅 Agenda already initialized');
      return agendaAPI;
    }

    var agendaPage = document.getElementById('page-agenda');
    if (!agendaPage) {
      console.warn('⚠️ #page-agenda not found, skipping init');
      return agendaAPI;
    }

    console.log('📅 Initializing Agenda module with backend sync...');
    
    // Pastikan elemen-elemen penting ada
    var bigDate = document.getElementById('bigDate');
    var bigDay = document.getElementById('bigDay');
    
    if (!bigDate || !bigDay) {
        console.error('❌ Required elements not found: bigDate or bigDay');
        // Tunggu sebentar dan coba lagi
        await new Promise(resolve => setTimeout(resolve, 100));
        bigDate = document.getElementById('bigDate');
        bigDay = document.getElementById('bigDay');
        
        if (!bigDate || !bigDay) {
            console.error('❌ Still not found after retry');
        }
    }
    
    // Fetch data from backend first
    await fetchAgendaData();
    
    // Setup all listeners
    setupEventListeners();
    
    // Initial render
    await render();
    
    isInitialized = true;
    console.log('✅ Agenda module ready with backend sync');
    console.log('📅 Initial date displayed:', selectedDate);
    
    return agendaAPI;
}

  // ===== PUBLIC API OBJECT =====
  var agendaAPI = {
    add: tambahAgenda,
    init: initAgenda,
    fetch: fetchAgendaData,
    getUpcoming: function(limit) {
      limit = limit || 3;
      var now = new Date();
      now.setHours(0, 0, 0, 0);
      return agendaCache
        .filter(function(e) {
          var ed = new Date(e.date + 'T00:00:00');
          return ed >= now;
        })
        .sort(function(a, b) {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.time.localeCompare(b.time);
        })
        .slice(0, limit);
    },
    getByDate: function(date) {
      var ds = typeof date === 'string' ? date : dateStr(date);
      return getDayEvents(ds);
    },
    delete: deleteAgendaFromBackend,
    refresh: async function() {
      await fetchAgendaData();
      render();
    },
    reset: resetData
  };

  // ===== GLOBAL EXPOSURE =====
  if (typeof window !== 'undefined') {
    window.tambahAgenda = tambahAgenda;
    window.initAgenda = initAgenda;
    window.resetData = resetData;
    window.openAddModal = openAddModal;
    window.closeAddModal = closeAddModal;
    window.openDetailModal = openDetailModal;
    window.closeDetailModal = closeDetailModal;
    window.AgendaModule = agendaAPI;
  }

  // ===== AUTO-INIT ON DOM READY =====
  // ===== AUTO-INIT ON DOM READY =====
function tryInitAgenda() {
    var agendaPage = document.getElementById('page-agenda');
    if (agendaPage) {
        // Cek apakah halaman agenda sedang aktif
        if (agendaPage.classList.contains('active') || 
            agendaPage.style.display !== 'none' ||
            getComputedStyle(agendaPage).display !== 'none') {
            console.log(' Agenda page detected, initializing...');
            initAgenda();
            return true;
        }
    }
    return false;
}

if (typeof document !== 'undefined') {
    // Coba init segera
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(tryInitAgenda, 100);
        });
    } else {
        setTimeout(tryInitAgenda, 100);
    }
    
    // Juga coba init saat window load (untuk memastikan semua HTML sudah load)
    window.addEventListener('load', function() {
        setTimeout(function() {
            if (!isInitialized) {
                console.log(' Window loaded, trying init again...');
                tryInitAgenda();
            }
        }, 300);
    });
}

})();

// ===== CATEGORY SELECTION HELPER =====
function selectCategory(btn) {
  document.querySelectorAll('.category-option').forEach(b => {
    b.classList.remove('active');
    b.style.borderColor = 'var(--border)';
    b.style.background = 'var(--bg-card)';
    b.style.color = 'var(--text-secondary)';
  });
  
  btn.classList.add('active');
  btn.style.borderColor = 'var(--success)';
  btn.style.background = 'rgba(56,161,105,0.1)';
  btn.style.color = 'var(--success)';
}
// ===== DEBUG FUNCTIONS =====
window.debugAgenda = function() {
  console.log('=== AGENDA DEBUG ===');
  console.log('Cache length:', agendaCache.length);
  console.log('Cache:', agendaCache);
  console.log('Selected date:', selectedDate);
  console.log('Current month/year:', currentMonth, currentYear);
  console.log('Today events:', getDayEvents(dateStr(selectedDate)));
  console.log('===================');
};

window.clearCache = function() {
  agendaCache = [];
  console.log('✅ Cache cleared');
  render();
};

window.refreshFromBackend = async function() {
  console.log('🔄 Refreshing from backend...');
  await fetchAgendaData();
  render();
  console.log('✅ Refresh complete');
};
