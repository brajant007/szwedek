/**
 * TRUCKER PRO ENTERPRISE v5.0 - TACHO & GPS MAP MODULE
 */

let tachoInterval = null;
let tachoSecondsLeft = 4.5 * 3600; // 4:30:00 (16200 sekund)
let tachoState = 'PAUZA';

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function setTachoState(newState) {
  tachoState = newState;
  showToast(`Tacho przełączone w tryb: ${newState}`, "info");

  if (tachoInterval) clearInterval(tachoInterval);

  if (tachoState === 'JAZDA') {
    tachoInterval = setInterval(() => {
      if (tachoSecondsLeft > 0) {
        tachoSecondsLeft--;
        updateTachoDisplay();
        if (tachoSecondsLeft === 15 * 60) {
          showToast("UWAGA! Zostało tylko 15 minut czasu jazdy AETR!", "warning");
        }
      } else {
        clearInterval(tachoInterval);
        showToast("PRZEKROCZONO CZAS JAZDY! ZAREZERWUJ PAUZĘ 45m!", "danger");
      }
    }, 1000);
  }
  updateTachoDisplay();
}

function resetTachoDriveTime() {
  tachoSecondsLeft = 4.5 * 3600;
  updateTachoDisplay();
  showToast("Czas jazdy zresetowany (4:30:00)", "success");
}

function updateTachoDisplay() {
  const display = document.getElementById('tacho-display');
  const stateLabel = document.getElementById('tacho-state-label');
  if (display) display.innerText = formatTime(tachoSecondsLeft);
  if (stateLabel) stateLabel.innerText = tachoState;
}

let lMap = null;
function initMap() {
  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  if (!lMap) {
    lMap = L.map('map').setView([52.2297, 21.0122], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(lMap);

    db.vehicles.forEach(v => {
      const lat = 52.2 + (Math.random() - 0.5) * 2;
      const lng = 21.0 + (Math.random() - 0.5) * 3;
      L.marker([lat, lng])
        .addTo(lMap)
        .bindPopup(`<b>${v.name}</b><br>Nr: ${v.plate}<br>Status: ${v.status}`);
    });
  } else {
    lMap.invalidateSize();
  }
}

function renderTachoModule() {
  const sec = document.getElementById('sec-tacho');
  if (!sec) return;

  sec.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <!-- MAPA GPS FLEET MONITOR -->
      <div class="lg:col-span-2 glass-card p-3 rounded-2xl border-emerald-500/30 space-y-2">
        <div class="flex justify-between items-center text-xs px-1">
          <span class="font-orbitron text-emerald-400 font-bold"><i class="fa-solid fa-map-marked-alt mr-1"></i> MONITORING GPS FLOTY NA ŻYWO</span>
          <span class="text-[10px] text-gray-400 font-mono">Aktualizacja: LIVE</span>
        </div>
        <div id="map"></div>
      </div>

      <!-- ASYSTENT TACHO AETR -->
      <div class="glass-card p-4 rounded-2xl border-amber-500/30 text-center flex flex-col justify-between space-y-4">
        <div>
          <span class="font-orbitron text-xs text-amber-400 flex items-center justify-center gap-1.5">
            <i class="fa-solid fa-stopwatch"></i> LICZNIK JAZDY AETR (4:30h)
          </span>
          <p class="text-[10px] text-gray-400 mt-1 font-mono">TRYB: <b id="tacho-state-label" class="text-white">${tachoState}</b></p>
        </div>

        <div class="my-2 p-4 bg-black/60 border border-amber-500/30 rounded-2xl shadow-inner">
          <div id="tacho-display" class="font-orbitron text-4xl lg:text-5xl font-black text-amber-400 tracking-widest">${formatTime(tachoSecondsLeft)}</div>
        </div>

        <div class="space-y-2">
          <div class="grid grid-cols-3 gap-1.5">
            <button onclick="setTachoState('JAZDA')" class="py-2.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 rounded-xl text-xs font-bold font-orbitron transition">JAZDA</button>
            <button onclick="setTachoState('PAUZA')" class="py-2.5 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700 rounded-xl text-xs font-bold font-orbitron transition">PAUZA</button>
            <button onclick="setTachoState('PRACA')" class="py-2.5 bg-slate-900 hover:bg-slate-800 text-gray-300 border border-slate-700 rounded-xl text-xs font-bold font-orbitron transition">PRACA</button>
          </div>
          <button onclick="resetTachoDriveTime()" class="w-full py-2 bg-slate-950 text-gray-400 border border-slate-800 rounded-xl text-[10px] font-mono hover:text-white">RESETUJ CZAS JAZDY (PAUZA 45M)</button>
        </div>
      </div>
    </div>
  `;

  setTimeout(initMap, 200);
}