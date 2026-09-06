/**
 * TRUCKER PRO ENTERPRISE v5.0 - FLEET & SERVICE MODULE
 */

function addVehicle() {
  const name = document.getElementById('v-name')?.value;
  const plate = document.getElementById('v-plate')?.value;
  const techReview = document.getElementById('v-review')?.value || '2027-01-01';

  if (!name || !plate) {
    showToast("Wpisz markę/model oraz numer rejestracyjny!", "danger");
    return;
  }

  const newVehicle = {
    id: Date.now(),
    name,
    plate,
    status: 'Dostępny',
    techReview
  };

  db.vehicles.push(newVehicle);
  saveDb();
  showToast("Pojazd pomyślnie dodany do floty!", "success");
}

function reportFault() {
  const vehicleId = parseInt(document.getElementById('fault-vehicle-select')?.value);
  const desc = document.getElementById('fault-desc')?.value;
  const photoInput = document.getElementById('fault-photo');

  if (!desc) {
    showToast("Podaj opis usterki lub awarii!", "danger");
    return;
  }

  const vehicle = db.vehicles.find(v => v.id === vehicleId);

  const newFault = {
    id: Date.now(),
    vehicleId,
    vehicleName: vehicle ? `${vehicle.name} (${vehicle.plate})` : 'Nieznany pojazd',
    desc,
    date: new Date().toISOString().split('T')[0],
    status: 'Zgłoszona',
    photo: photoInput && photoInput.files[0] ? URL.createObjectURL(photoInput.files[0]) : null
  };

  db.faults.unshift(newFault);
  if (vehicle) vehicle.status = 'AWARIA / SERWIS';

  saveDb();
  showToast("Zgłoszenie awarii wysłane do dyspozytorni!", "warning");
}

function resolveFault(faultId) {
  const fault = db.faults.find(f => f.id === faultId);
  if (fault) {
    fault.status = 'Naprawiona';
    const vehicle = db.vehicles.find(v => v.id === fault.vehicleId);
    if (vehicle) vehicle.status = 'Dostępny';
    saveDb();
    showToast("Awarię oznaczono jako usuniętą!", "success");
  }
}

function renderFleetModule() {
  const sec = document.getElementById('sec-fleet');
  if (!sec) return;

  const vehicleOptions = db.vehicles.map(v => `<option value="${v.id}">${v.name} (${v.plate})</option>`).join('');

  let faultsListHtml = '';
  if (db.faults.length === 0) {
    faultsListHtml = `<p class="text-xs text-gray-500 italic text-center py-4">Brak aktywnych zgłoszeń awarii.</p>`;
  } else {
    faultsListHtml = db.faults.map(f => `
      <div class="p-3 bg-slate-900/90 rounded-xl border ${f.status === 'Zgłoszona' ? 'border-red-500/50' : 'border-emerald-500/40'} space-y-2">
        <div class="flex justify-between items-center">
          <span class="font-orbitron text-xs font-bold ${f.status === 'Zgłoszona' ? 'text-red-400' : 'text-emerald-400'}">${f.vehicleName}</span>
          <span class="text-[9px] font-mono px-2 py-0.5 rounded ${f.status === 'Zgłoszona' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}">${f.status}</span>
        </div>
        <p class="text-xs text-gray-300">${f.desc}</p>
        ${f.photo ? `<img src="${f.photo}" class="w-full h-32 object-cover rounded-lg border border-slate-800" alt="Zdjęcie usterki">` : ''}
        <div class="flex justify-between items-center border-t border-slate-800/80 pt-1.5 text-[10px] text-gray-400 font-mono">
          <span>Data: ${f.date}</span>
          ${f.status === 'Zgłoszona' && (db.role === 'boss' || db.role === 'dispatcher') ? `
            <button onclick="resolveFault(${f.id})" class="px-2 py-1 bg-emerald-600 text-black font-bold font-orbitron rounded text-[10px]">OZNACZ JAKO NAPRAWIONE</button>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  let vehiclesListHtml = db.vehicles.map(v => `
    <div class="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
      <div>
        <h4 class="font-bold text-white font-orbitron">${v.name} <span class="text-gray-400 font-mono text-xs">(${v.plate})</span></h4>
        <span class="text-[10px] text-gray-400 font-mono">Przegląd tech.: <b class="text-amber-400">${v.techReview}</b></span>
      </div>
      <span class="px-2 py-1 rounded text-[10px] font-orbitron ${v.status === 'Dostępny' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'}">${v.status}</span>
    </div>
  `).join('');

  sec.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <!-- DODAWANIE POJAZDU (SZEF / DYSPOZYTOR) -->
      <div class="boss-only dispatcher-only glass-card p-4 rounded-2xl border-blue-500/30 space-y-3">
        <h2 class="font-orbitron text-xs text-blue-400 flex items-center gap-1.5">
          <i class="fa-solid fa-plus-circle"></i> REJESTRACJA NOWEGO POJAZDU
        </h2>
        <div class="space-y-2 text-xs">
          <div>
            <label class="text-[10px] text-gray-400">Marka i Model:</label>
            <input type="text" id="v-name" placeholder="np. MAN TGX 18.500" class="w-full rounded-xl p-2 font-bold">
          </div>
          <div>
            <label class="text-[10px] text-gray-400">Numer Rejestracyjny:</label>
            <input type="text" id="v-plate" placeholder="np. PO 88899" class="w-full rounded-xl p-2 font-mono uppercase">
          </div>
          <div>
            <label class="text-[10px] text-gray-400">Data Przeglądu Technicznego:</label>
            <input type="date" id="v-review" class="w-full rounded-xl p-2">
          </div>
          <button onclick="addVehicle()" class="w-full py-2 bg-blue-950 hover:bg-blue-900 border border-blue-700 text-blue-300 font-orbitron font-bold text-xs rounded-xl transition">
            <i class="fa-solid fa-save mr-1"></i> ZAPISZ W BAZIE FLOTY
          </button>
        </div>
      </div>

      <!-- ZGŁASZANIE AWARII (KIEROWCA / SZEF) -->
      <div class="glass-card p-4 rounded-2xl border-red-500/30 space-y-3">
        <h2 class="font-orbitron text-xs text-red-400 flex items-center gap-1.5">
          <i class="fa-solid fa-triangle-exclamation"></i> ZGŁOSZENIE AWARII / SZKODY
        </h2>
        <div class="space-y-2 text-xs">
          <div>
            <label class="text-[10px] text-gray-400">Wybierz Pojazd:</label>
            <select id="fault-vehicle-select" class="w-full rounded-xl p-2">${vehicleOptions}</select>
          </div>
          <div>
            <label class="text-[10px] text-gray-400">Opis Usterki / Uszkodzenia Towaru:</label>
            <textarea id="fault-desc" rows="3" placeholder="Opisz dokładnie co się stało..." class="w-full rounded-xl p-2"></textarea>
          </div>
          <div>
            <label class="text-[10px] text-gray-400">Zdjęcie Szkody (Opcjonalnie):</label>
            <input type="file" id="fault-photo" accept="image/*" class="w-full rounded-xl p-1 text-[10px] bg-slate-900">
          </div>
          <button onclick="reportFault()" class="w-full py-2.5 bg-red-950 hover:bg-red-900 border border-red-700 text-red-300 font-orbitron font-bold text-xs rounded-xl shadow-lg shadow-red-950/50 transition">
            <i class="fa-solid fa-paper-plane mr-1"></i> WYŚLIJ PROTOKÓŁ USZKODZENIA
          </button>
        </div>
      </div>

      <!-- REJESTR FLOTY I PROTOKOŁÓW -->
      <div class="lg:col-span-2 glass-card p-4 rounded-2xl border-blue-500/30 space-y-4">
        <div>
          <h2 class="font-orbitron text-xs text-blue-400 mb-2 flex items-center gap-1.5">
            <i class="fa-solid fa-truck-ramp-box"></i> STAN FLOTY I PRZEGLĄDY
          </h2>
          <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
            ${vehiclesListHtml}
          </div>
        </div>

        <div class="border-t border-slate-800 pt-3">
          <h2 class="font-orbitron text-xs text-red-400 mb-2 flex items-center gap-1.5">
            <i class="fa-solid fa-wrench"></i> HISTORIA ZGŁOSZONYCH AWARII
          </h2>
          <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
            ${faultsListHtml}
          </div>
        </div>
      </div>
    </div>
  `;
}