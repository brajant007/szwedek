/**
 * TRUCKER PRO ENTERPRISE v5.0 - ROUTES MODULE
 */

let tempWaypoints = [];

// DODAWANIE PRZYSTANKU W KREATORZE
function addWaypointInput(address = '', type = 'Rozładunek') {
  tempWaypoints.push({ id: Date.now() + Math.random(), address, type });
  renderWaypointInputs();
}

function removeWaypointInput(index) {
  tempWaypoints.splice(index, 1);
  renderWaypointInputs();
}

function moveWaypoint(index, direction) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= tempWaypoints.length) return;
  const temp = tempWaypoints[index];
  tempWaypoints[index] = tempWaypoints[targetIndex];
  tempWaypoints[targetIndex] = temp;
  renderWaypointInputs();
}

function calculateRouteEstimates() {
  const stopsCount = tempWaypoints.length;
  if (stopsCount === 0) return { estKm: 0, estMaut: 0 };
  const estKm = stopsCount * 240; // Przybliżony estymowany dystans
  const estMaut = (estKm * 0.34).toFixed(2); // Przykładowa stawka opłat drogowych (~0.34 EUR/km)
  return { estKm, estMaut };
}

function renderWaypointInputs() {
  const container = document.getElementById('waypoints-input-list');
  if (!container) return;
  container.innerHTML = '';

  tempWaypoints.forEach((wp, idx) => {
    container.innerHTML += `
      <div class="flex items-center gap-1.5 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
        <div class="flex flex-col gap-0.5">
          <button onclick="moveWaypoint(${idx}, -1)" ${idx === 0 ? 'disabled class="opacity-30"' : ''} class="text-[10px] text-gray-400 hover:text-emerald-400"><i class="fa-solid fa-chevron-up"></i></button>
          <button onclick="moveWaypoint(${idx}, 1)" ${idx === tempWaypoints.length - 1 ? 'disabled class="opacity-30"' : ''} class="text-[10px] text-gray-400 hover:text-emerald-400"><i class="fa-solid fa-chevron-down"></i></button>
        </div>
        <select onchange="tempWaypoints[${idx}].type = this.value" class="rounded-lg p-1.5 text-[10px]">
          <option value="Załadunek" ${wp.type==='Załadunek'?'selected':''}>Załadunek</option>
          <option value="Rozładunek" ${wp.type==='Rozładunek'?'selected':''}>Rozładunek</option>
          <option value="Tankowanie" ${wp.type==='Tankowanie'?'selected':''}>Tankowanie</option>
          <option value="MOP / Pauza" ${wp.type==='MOP / Pauza'?'selected':''}>MOP / Pauza</option>
        </select>
        <input type="text" value="${wp.address}" oninput="tempWaypoints[${idx}].address = this.value" placeholder="Adres / Miejsce" class="w-full rounded-lg p-1.5 text-xs">
        <button onclick="removeWaypointInput(${idx})" class="p-1.5 bg-red-950/80 text-red-400 rounded-lg border border-red-800/50 hover:bg-red-900"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
  });

  const est = calculateRouteEstimates();
  const estDisplay = document.getElementById('route-estimates-display');
  if (estDisplay) {
    estDisplay.innerHTML = `Dystans ok.: <b class="text-white">${est.estKm} km</b> | Maut/e-TOLL ok.: <b class="text-amber-400">${est.estMaut} EUR</b>`;
  }
}

function saveAndDispatchRoute() {
  const title = document.getElementById('route-title')?.value;
  const driverId = parseInt(document.getElementById('route-driver-select')?.value);
  const vehicleId = parseInt(document.getElementById('route-vehicle-select')?.value);

  if (!title || tempWaypoints.length === 0) {
    showToast("Podaj tytuł trasy oraz dodaj przynajmniej jeden przystanek!", "danger");
    return;
  }

  const est = calculateRouteEstimates();

  const newRoute = {
    id: Date.now(),
    title,
    driverId,
    vehicleId,
    estKm: est.estKm,
    estMaut: est.estMaut,
    waypoints: tempWaypoints.map(w => ({ ...w, done: false, currentStatus: 'Do zrobienia' })),
    status: 'Zaplanowana'
  };

  db.routes.unshift(newRoute);
  tempWaypoints = [];
  if (document.getElementById('route-title')) document.getElementById('route-title').value = '';
  saveDb();
  showToast("Trasa pomyślnie utworzona i wysłana do kierowcy!", "success");
}

function updateWaypointStatus(routeId, wpId, newStatus) {
  const route = db.routes.find(r => r.id === routeId);
  if (!route) return;

  const wp = route.waypoints.find(w => w.id === wpId);
  if (wp) {
    wp.currentStatus = newStatus;
    if (newStatus === 'Gotowe') wp.done = true;

    const allDone = route.waypoints.every(w => w.done);
    if (allDone) route.status = 'Zrealizowana';
    else route.status = 'W trakcie';

    saveDb();
    showToast(`Zmieniono status przystanku: ${newStatus}`, "info");
  }
}

function renderPlannerSection() {
  const sec = document.getElementById('sec-planner');
  if (!sec) return;

  sec.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <!-- KREATOR TRASY -->
      <div class="glass-card p-4 rounded-2xl border-emerald-500/30 space-y-3">
        <h2 class="font-orbitron text-xs text-emerald-400 flex items-center justify-between">
          <span><i class="fa-solid fa-route mr-1"></i> KREATOR MULTI-WAYPOINT</span>
          <span class="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded">Maut Kalkulator</span>
        </h2>

        <div class="space-y-2 text-xs">
          <div>
            <label class="text-[10px] text-gray-400">Tytuł Zlecenia / Trasy:</label>
            <input type="text" id="route-title" placeholder="np. PL-61 Poznań -> DE-10 Berlin -> DE-20 Hamburg" class="w-full rounded-xl p-2 font-bold">
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[10px] text-gray-400">Kierowca:</label>
              <select id="route-driver-select" class="w-full rounded-xl p-2"></select>
            </div>
            <div>
              <label class="text-[10px] text-gray-400">Zestaw / Pojazd:</label>
              <select id="route-vehicle-select" class="w-full rounded-xl p-2"></select>
            </div>
          </div>

          <div class="border-t border-slate-800 pt-2 space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-[10px] font-orbitron text-amber-400">PRZYSTANKI (WAYPOINTS):</span>
              <span id="route-estimates-display" class="text-[9px] font-mono text-gray-400"></span>
            </div>
            <div id="waypoints-input-list" class="space-y-2 max-h-60 overflow-y-auto pr-1"></div>
            <button onclick="addWaypointInput()" class="w-full py-2 bg-slate-900 border border-slate-700 text-gray-300 font-orbitron text-[10px] rounded-xl hover:border-emerald-500">
              <i class="fa-solid fa-plus mr-1"></i> DODAJ PRZYSTANEK
            </button>
          </div>

          <button onclick="saveAndDispatchRoute()" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-black font-orbitron font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30">
            <i class="fa-solid fa-paper-plane mr-1"></i> ZAPISZ I WYŚLIJ DYSPOZYCJĘ
          </button>
        </div>
      </div>

      <!-- LISTA TRAS DLA DYSPOZYTORA / SZEFA -->
      <div class="lg:col-span-2 glass-card p-4 rounded-2xl border-emerald-500/30 space-y-3">
        <h2 class="font-orbitron text-xs text-emerald-400 flex justify-between items-center">
          <span><i class="fa-solid fa-list-check mr-1"></i> MONITORY HARMONOGRAMÓW FLOTY</span>
          <span id="active-routes-count" class="text-gray-400 font-mono text-[10px]">0 tras</span>
        </h2>
        <div id="routes-master-list" class="space-y-3 max-h-[520px] overflow-y-auto pr-1"></div>
      </div>
    </div>
  `;

  // Wypełnienie opcji wyboru
  const dSel = document.getElementById('route-driver-select');
  const vSel = document.getElementById('route-vehicle-select');

  if (dSel) {
    dSel.innerHTML = '';
    db.drivers.forEach(d => dSel.innerHTML += `<option value="${d.id}">${d.name}</option>`);
  }
  if (vSel) {
    vSel.innerHTML = '';
    db.vehicles.forEach(v => vSel.innerHTML += `<option value="${v.id}">${v.name} (${v.plate})</option>`);
  }

  if (tempWaypoints.length === 0) {
    addWaypointInput('Poznań, Baza Fabryczna', 'Załadunek');
    addWaypointInput('Berlin, Logistics Center Hub', 'Rozładunek');
  } else {
    renderWaypointInputs();
  }
}

function renderDriverTasksSection() {
  const sec = document.getElementById('sec-driver-tasks');
  if (!sec) return;

  const activeRoute = db.routes.find(r => r.driverId === 101); // Domyślny widok kierowcy

  let waypointsListHtml = '';
  if (activeRoute && activeRoute.waypoints.length > 0) {
    waypointsListHtml = activeRoute.waypoints.map(wp => {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wp.address)}`;
      return `
        <div class="p-3 bg-slate-900/90 rounded-xl border ${wp.done ? 'border-emerald-500/40 opacity-60' : 'border-slate-800'} space-y-2">
          <div class="flex justify-between items-start">
            <div>
              <span class="text-[9px] font-orbitron px-2 py-0.5 rounded ${wp.type === 'Załadunek' ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'bg-purple-950 text-purple-300 border border-purple-800'}">${wp.type}</span>
              <h4 class="font-bold text-sm text-white mt-1">${wp.address}</h4>
            </div>
            <a href="${mapsUrl}" target="_blank" class="px-2.5 py-1.5 bg-emerald-950 border border-emerald-600 text-emerald-300 rounded-xl text-xs font-orbitron flex items-center gap-1 shadow-lg shadow-emerald-950/50">
              <i class="fa-solid fa-location-arrow"></i> NAWIGUJ
            </a>
          </div>

          <div class="flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs">
            <span class="text-gray-400 font-mono text-[10px]">STATUS: <b class="text-amber-400">${wp.currentStatus}</b></span>
            <div class="flex gap-1">
              <button onclick="updateWaypointStatus(${activeRoute.id}, ${wp.id}, 'W drodze')" class="px-2 py-1 bg-slate-800 text-gray-300 rounded text-[10px]">W drodze</button>
              <button onclick="updateWaypointStatus(${activeRoute.id}, ${wp.id}, 'Na miejscu')" class="px-2 py-1 bg-blue-950 text-blue-300 rounded text-[10px]">Na miejscu</button>
              <button onclick="updateWaypointStatus(${activeRoute.id}, ${wp.id}, 'Gotowe')" class="px-2 py-1 bg-emerald-600 text-black font-bold rounded text-[10px]">GOTOWE</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } else {
    waypointsListHtml = `<p class="text-xs text-gray-500 italic text-center py-6">Brak przypisanych aktywnych tras na dzisiaj.</p>`;
  }

  sec.innerHTML = `
    <div class="glass-card p-4 rounded-2xl border-emerald-500/40 space-y-3 max-w-2xl mx-auto">
      <div class="flex justify-between items-center border-b border-slate-800 pb-2">
        <div>
          <span class="text-[10px] text-gray-400 font-mono block">AKTYWNY NAKAZ JAZDY:</span>
          <h2 class="font-orbitron text-base font-bold text-emerald-400">${activeRoute ? activeRoute.title : 'Brak Trasy'}</h2>
        </div>
        <span class="px-2.5 py-1 bg-slate-900 border border-slate-700 text-emerald-400 font-orbitron text-[10px] rounded-xl">${activeRoute ? activeRoute.status : 'WAITING'}</span>
      </div>

      <div class="space-y-3">
        ${waypointsListHtml}
      </div>
    </div>
  `;
}

function renderMasterRoutesList() {
  const container = document.getElementById('routes-master-list');
  if (!container) return;

  const countLabel = document.getElementById('active-routes-count');
  if (countLabel) countLabel.innerText = `${db.routes.length} tras w systemie`;

  if (db.routes.length === 0) {
    container.innerHTML = `<p class="text-xs text-gray-500 italic text-center py-8">Brak zapisanych tras w bazie.</p>`;
    return;
  }

  container.innerHTML = '';
  db.routes.forEach(r => {
    const driver = db.drivers.find(d => d.id === r.driverId)?.name || 'Nieprzypisany';
    const vehicle = db.vehicles.find(v => v.id === r.vehicleId)?.name || 'Brak pojazdu';

    const waypointsHtml = r.waypoints.map(w => `
      <div class="text-[11px] flex justify-between items-center py-1 border-b border-slate-800/50">
        <span><b class="text-emerald-400">[${w.type}]</b> ${w.address}</span>
        <span class="font-mono text-[9px] ${w.done ? 'text-emerald-400' : 'text-amber-400'}">${w.currentStatus}</span>
      </div>
    `).join('');

    container.innerHTML += `
      <div class="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
        <div class="flex justify-between items-center">
          <h3 class="font-orbitron font-bold text-sm text-emerald-400">${r.title}</h3>
          <span class="px-2 py-0.5 bg-emerald-950 border border-emerald-700 text-emerald-300 text-[10px] rounded-full font-mono">${r.status}</span>
        </div>
        <div class="text-[10px] text-gray-400 flex justify-between font-mono">
          <span>KIEROWCA: <b class="text-white">${driver}</b> | POJAZD: <b class="text-white">${vehicle}</b></span>
          <span>MAUT EST.: <b class="text-amber-400">${r.estMaut || 0} EUR</b></span>
        </div>
        <div class="bg-black/50 p-2 rounded-xl border border-slate-900 space-y-0.5">
          ${waypointsHtml}
        </div>
      </div>
    `;
  });
}

function renderRoutesModule() {
  renderPlannerSection();
  renderDriverTasksSection();
  renderMasterRoutesList();
}