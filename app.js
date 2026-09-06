/**
 * TRUCKER PRO ENTERPRISE ULTIMATE - CORE ENGINE (app.js)
 */

const ROLE_PINS = {
  boss: '9999',
  dispatcher: '1111',
  driver: '0000'
};

const APP_STATE = {
  role: localStorage.getItem('tp_role') || 'driver',
  activeTab: 'driver-tasks',
  tacho: {
    state: 'PAUZA',
    driveTimeLeft: 16200, // 4:30:00 w sekundach
    restTimeLeft: 2700,   // 00:45:00 w sekundach
    timerInterval: null
  },
  routes: JSON.parse(localStorage.getItem('tp_routes')) || [
    { id: 1, title: 'Załadunek: Poznań (Panattoni Park)', addr: 'ul. Magazynowa 4, Gądki', type: 'PICKUP', weight: '22.4t', status: 'W TRASIE' },
    { id: 2, title: 'Rozładunek: Berlin (Centrum Logistyczne)', addr: 'Industriestrasse 12, Berlin', type: 'DELIVERY', weight: '22.4t', status: 'OCZEKUJE' }
  ],
  fleet: JSON.parse(localStorage.getItem('tp_fleet')) || [
    { id: 'PO-88392', driver: 'Jan Kowalski', truck: 'Volvo FH16 750', status: 'W trasie', fuel: 82, location: 'A2 - Słubice' },
    { id: 'PZ-1029X', driver: 'Piotr Nowak', truck: 'Scania R500', status: 'Pauza 45m', fuel: 45, location: 'MOP Gniewkowo' }
  ]
};

// --- NOTIFIKACJE TOAST ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgBorder = type === 'danger' 
    ? 'bg-red-950/90 border-red-500 text-red-200' 
    : type === 'success' 
    ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200' 
    : 'bg-slate-900/90 border-cyan-500 text-cyan-200';

  toast.className = `p-3 rounded-xl border backdrop-blur-md text-xs font-mono shadow-2xl flex items-center justify-between gap-3 transition-all duration-300 transform translate-y-2 opacity-0 ${bgBorder}`;
  toast.innerHTML = `
    <div class="flex items-center gap-2">
      <i class="fa-solid ${type === 'danger' ? 'fa-triangle-exclamation' : type === 'success' ? 'fa-circle-check' : 'fa-circle-info'} text-sm"></i>
      <span>${message}</span>
    </div>
    <button onclick="this.parentElement.remove()" class="text-gray-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// --- WERYFIKACJA PIN I ZMIANA ROLI ---
window.requestRoleChange = function(targetRole) {
  if (targetRole === APP_STATE.role) return;

  if (targetRole === 'driver') {
    applyRoleChange(targetRole);
    return;
  }

  const pin = prompt(`Wprowadź kod PIN dla profilu ${targetRole.toUpperCase()}:`);
  if (pin === ROLE_PINS[targetRole]) {
    applyRoleChange(targetRole);
    showToast(`Dostęp przyznany: Profil ${targetRole.toUpperCase()}`, 'success');
  } else if (pin !== null) {
    showToast(`Błędny kod PIN! Brak dostępu do profilu ${targetRole.toUpperCase()}`, 'danger');
  }
};

function applyRoleChange(role) {
  APP_STATE.role = role;
  localStorage.setItem('tp_role', role);

  const btnBoss = document.getElementById('btn-role-boss');
  const btnDisp = document.getElementById('btn-role-dispatcher');
  const btnDriver = document.getElementById('btn-role-driver');

  if (btnBoss) btnBoss.className = "px-2.5 py-1 rounded-lg text-[10px] font-orbitron font-bold text-gray-400 transition";
  if (btnDisp) btnDisp.className = "px-2.5 py-1 rounded-lg text-[10px] font-orbitron font-bold text-gray-400 transition";
  if (btnDriver) btnDriver.className = "px-2.5 py-1 rounded-lg text-[10px] font-orbitron font-bold text-gray-400 transition";

  if (role === 'boss' && btnBoss) btnBoss.className = "px-2.5 py-1 rounded-lg text-[10px] font-orbitron font-bold text-purple-400 bg-slate-800 transition";
  if (role === 'dispatcher' && btnDisp) btnDisp.className = "px-2.5 py-1 rounded-lg text-[10px] font-orbitron font-bold text-cyan-400 bg-slate-800 transition";
  if (role === 'driver' && btnDriver) btnDriver.className = "px-2.5 py-1 rounded-lg text-[10px] font-orbitron font-bold text-emerald-400 bg-slate-800 transition";
}

// --- NAWIGACJA ZAKŁADEK (SPA) ---
window.switchTab = function(tabId) {
  if ((tabId === 'fleet') && APP_STATE.role === 'driver') {
    showToast('Brak uprawnień. Zakładka PANEL wymaga profilu Dyspozytora lub Szefa.', 'danger');
    return;
  }

  APP_STATE.activeTab = tabId;
  const sections = ['driver-tasks', 'map', 'cmr', 'calculators', 'fleet'];

  sections.forEach(sec => {
    const el = document.getElementById(`sec-${sec}`);
    const tabBtn = document.getElementById(`tab-${sec}`);
    if (el) {
      if (sec === tabId) el.classList.remove('hidden');
      else el.classList.add('hidden');
    }
    if (tabBtn) {
      if (sec === tabId) tabBtn.className = "flex flex-col items-center text-emerald-400";
      else tabBtn.className = "flex flex-col items-center text-gray-500 hover:text-gray-300";
    }
  });

  if (tabId === 'map' && window.leafletMap) {
    setTimeout(() => window.leafletMap.invalidateSize(), 200);
  }
};

// --- TACHOGRAF CYFROWY ---
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

window.setTachoState = function(newState) {
  APP_STATE.tacho.state = newState;
  const badge = document.getElementById('tacho-status-badge');
  if (badge) {
    badge.innerText = newState;
    badge.className = `px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
      newState === 'JAZDA' ? 'bg-emerald-950 text-emerald-400 border-emerald-800 animate-pulse' :
      newState === 'PRACA' ? 'bg-amber-950 text-amber-400 border-amber-800' :
      'bg-blue-950 text-blue-400 border-blue-800'
    }`;
  }

  if (APP_STATE.tacho.timerInterval) clearInterval(APP_STATE.tacho.timerInterval);

  APP_STATE.tacho.timerInterval = setInterval(() => {
    if (APP_STATE.tacho.state === 'JAZDA') {
      if (APP_STATE.tacho.driveTimeLeft > 0) APP_STATE.tacho.driveTimeLeft--;
    } else if (APP_STATE.tacho.state === 'PAUZA') {
      if (APP_STATE.tacho.restTimeLeft > 0) APP_STATE.tacho.restTimeLeft--;
    }

    const driveEl = document.getElementById('tacho-drive-timer');
    const restEl = document.getElementById('tacho-rest-timer');
    if (driveEl) driveEl.innerText = formatTime(APP_STATE.tacho.driveTimeLeft);
    if (restEl) restEl.innerText = formatTime(APP_STATE.tacho.restTimeLeft);
  }, 1000);

  showToast(`Tachograf: Zmiana stanu na ${newState}`, 'info');
};

// --- ALARM S.O.S ---
window.triggerSosEmergency = function() {
  if (confirm("⚠️ Czy na pewno chcesz nadanać sygnał S.O.S do Centrum Dowodzenia?")) {
    showToast("🚨 ALARM S.O.S NADANY! Pozycja GPS przekazana do dyspozytora.", "danger");
  }
};

// --- ASYSTENT GŁOSOWY ---
window.startVoiceControl = function() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast("Brak wsparcia dla komend głosowych w przeglądarce.", "danger");
    return;
  }

  const rec = new SpeechRecognition();
  rec.lang = 'pl-PL';
  showToast("Słucham komendy... (np. 'trasa', 'mapa', 'jazda', 'pauza')", "info");
  rec.start();

  rec.onresult = (e) => {
    const text = e.results[0][0].transcript.toLowerCase();
    showToast(`Rozpoznano: "${text}"`, "success");

    if (text.includes("tras")) switchTab('driver-tasks');
    else if (text.includes("map")) switchTab('map');
    else if (text.includes("cmr") || text.includes("podpis")) switchTab('cmr');
    else if (text.includes("kalkulat") || text.includes("itd")) switchTab('calculators');
    else if (text.includes("flot") || text.includes("panel")) switchTab('fleet');
    else if (text.includes("jazda")) setTachoState('JAZDA');
    else if (text.includes("pauza")) setTachoState('PAUZA');
    else if (text.includes("praca")) setTachoState('PRACA');
  };
};

// --- RENDER PUNKTÓW TRASY ---
function renderRouteList() {
  const container = document.getElementById('driver-route-list');
  if (!container) return;

  container.innerHTML = APP_STATE.routes.map(r => `
    <div class="glass-card p-3 rounded-xl border border-slate-800 flex justify-between items-center">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${r.type === 'PICKUP' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-blue-950 text-blue-400 border border-blue-800'}">${r.type}</span>
          <h4 class="font-semibold text-xs text-white">${r.title}</h4>
        </div>
        <p class="text-[10px] text-gray-400 font-mono"><i class="fa-solid fa-location-dot text-red-500 mr-1"></i>${r.addr}</p>
      </div>
      <div class="text-right">
        <span class="text-[10px] font-mono text-emerald-400 block">${r.weight}</span>
        <button onclick="showToast('Status punktu zaktualizowany', 'success')" class="mt-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[9px] font-mono rounded text-gray-300">POTWIERDŹ</button>
      </div>
    </div>
  `).join('');
}

// --- MAPA LEAFLET ---
function initMap() {
  const mapContainer = document.getElementById('leaflet-map');
  if (!mapContainer) return;

  const initialPos = [52.4064, 16.9252];
  const map = L.map('leaflet-map').setView(initialPos, 12);
  window.leafletMap = map;

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  const customIcon = L.divIcon({
    className: 'custom-pin',
    html: `<div class="w-7 h-7 bg-emerald-500 border-2 border-slate-950 rounded-full flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/50"><i class="fa-solid fa-truck text-xs"></i></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });

  const marker = L.marker(initialPos, { icon: customIcon }).addTo(map);
  marker.bindPopup("<b class='text-xs font-sans'>Ciężarówka PO-88392</b><br><span class='text-[10px] font-mono'>Status: W trasie</span>");

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(pos => {
      const coords = [pos.coords.latitude, pos.coords.longitude];
      map.setView(coords, 13);
      marker.setLatLng(coords);
    });
  }
}

// --- MODUŁ e-CMR ---
function renderCmrModule() {
  const container = document.getElementById('sec-cmr');
  if (!container) return;

  container.innerHTML = `
    <div class="glass-card p-4 rounded-2xl border-slate-800 space-y-3">
      <div class="flex justify-between items-center border-b border-slate-800 pb-2">
        <h3 class="font-orbitron text-xs text-emerald-400 flex items-center gap-1.5"><i class="fa-solid fa-file-signature"></i> CYFROWY LIST PRZEWOZOWY e-CMR</h3>
        <span class="text-[9px] font-mono bg-slate-900 text-gray-400 px-2 py-0.5 rounded border border-slate-800">CMR #99283-2026</span>
      </div>

      <div class="grid grid-cols-2 gap-2 text-[10px] font-mono">
        <div class="bg-slate-950 p-2 rounded-xl border border-slate-800">
          <span class="text-gray-500 block">NADAWCA:</span>
          <b class="text-gray-200">Panattoni Logistics PL</b>
        </div>
        <div class="bg-slate-950 p-2 rounded-xl border border-slate-800">
          <span class="text-gray-500 block">ODBIORCA:</span>
          <b class="text-gray-200">Logistics Hub DE GmbH</b>
        </div>
      </div>

      <div>
        <label class="block text-[10px] font-mono text-gray-400 uppercase mb-1">PODPIS ODBIORCY NA EKRANIE:</label>
        <div class="border border-slate-700 rounded-xl bg-slate-950 overflow-hidden">
          <canvas id="cmr-canvas" class="w-full h-44 cursor-crosshair block"></canvas>
        </div>
      </div>

      <div class="flex gap-2">
        <button id="btn-clear-canvas" class="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 font-mono text-xs rounded-xl transition">WYCZYŚĆ</button>
        <button id="btn-save-cmr" class="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-orbitron font-bold text-xs rounded-xl shadow-lg transition">ZAPISZ E-CMR</button>
      </div>
    </div>
  `;

  setTimeout(() => {
    const canvas = document.getElementById('cmr-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let isDrawing = false;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
    }
    resize();

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    }

    canvas.addEventListener('mousedown', (e) => { isDrawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); });
    canvas.addEventListener('mousemove', (e) => { if (!isDrawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); });
    window.addEventListener('mouseup', () => isDrawing = false);

    canvas.addEventListener('touchstart', (e) => { isDrawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); }, {passive: true});
    canvas.addEventListener('touchmove', (e) => { if (!isDrawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); }, {passive: true});
    canvas.addEventListener('touchend', () => isDrawing = false);

    document.getElementById('btn-clear-canvas')?.addEventListener('click', () => { ctx.clearRect(0, 0, canvas.width, canvas.height); showToast('Wyczyszczono podpis', 'info'); });
    document.getElementById('btn-save-cmr')?.addEventListener('click', () => { showToast('Podpis zarchiwizowany! e-CMR wysłane do bazy.', 'success'); });
  }, 100);
}

// --- MODUŁ KALKULATORÓW ITD ---
function renderCalculatorsModule() {
  const container = document.getElementById('sec-calculators');
  if (!container) return;

  container.innerHTML = `
    <div class="glass-card p-4 rounded-2xl border-slate-800 space-y-4">
      <h3 class="font-orbitron text-xs text-amber-400 flex items-center gap-1.5"><i class="fa-solid fa-calculator"></i> KALKULATOR NACISKU DLA ITD / PAKIET MOBILNOŚCI</h3>
      
      <div class="space-y-3 font-mono text-xs">
        <div>
          <label class="block text-gray-400 mb-1">MASA CAŁKOWITA ZESTAWU (KG):</label>
          <input type="number" id="calc-mass" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500" placeholder="np. 40000">
        </div>
        <div>
          <label class="block text-gray-400 mb-1">LICZBA OSI ZESTAWU:</label>
          <input type="number" id="calc-axles" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500" placeholder="np. 5">
        </div>
        <button id="btn-calc-axle" class="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-black font-orbitron font-bold rounded-xl shadow-lg transition">PRZELICZ OBSZAR KONTROLI ITD</button>
      </div>

      <div id="calc-result" class="hidden p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono"></div>
    </div>
  `;

  document.getElementById('btn-calc-axle')?.addEventListener('click', () => {
    const mass = parseFloat(document.getElementById('calc-mass').value);
    const axles = parseInt(document.getElementById('calc-axles').value);
    const res = document.getElementById('calc-result');

    if (!mass || !axles || axles <= 0) {
      showToast('Wprowadź prawidłowe dane', 'danger');
      return;
    }

    const avgPerAxle = (mass / axles / 1000).toFixed(2);
    const isOver = (mass / axles) > 11500;

    res.classList.remove('hidden');
    res.innerHTML = `
      <div class="${isOver ? 'text-red-400' : 'text-emerald-400'}">
        <b>ŚREDNI NACISK NA OŚ: ${avgPerAxle} t/oś</b>
        <p class="mt-1 text-[10px] text-gray-400">${isOver ? '⚠️ PRZEKROCZONO LIMIT 11.5T! Ryzyko mandatu ITD.' : '✅ W normie przepisów ruchu drogowego PL/EU.'}</p>
      </div>
    `;
  });
}

// --- RENDER FLOTY ---
function renderFleetList() {
  const container = document.getElementById('fleet-vehicles-list');
  if (!container) return;

  container.innerHTML = APP_STATE.fleet.map(v => `
    <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs font-mono">
      <div>
        <span class="font-bold text-white block">${v.id} - ${v.truck}</span>
        <span class="text-[10px] text-gray-400">Kierowca: ${v.driver}</span>
      </div>
      <div class="text-right">
        <span class="px-2 py-0.5 rounded text-[9px] bg-slate-900 border border-slate-800 text-purple-400">${v.status}</span>
        <span class="block text-[10px] text-gray-500 mt-1">${v.location}</span>
      </div>
    </div>
  `).join('');
}

// --- INICJALIZACJA ---
document.addEventListener('DOMContentLoaded', () => {
  applyRoleChange(APP_STATE.role);
  renderRouteList();
  renderCmrModule();
  renderCalculatorsModule();
  renderFleetList();
  initMap();

  showToast("SYSTEM TRUCKER PRO ENTERPRISE READY", "success");
});