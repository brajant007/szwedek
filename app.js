/**
 * TRUCKER PRO ENTERPRISE v5.0 - CORE APP ENGINE
 */

// INICJALIZACJA BAZY DANYCH LOKALNEJ
const defaultState = {
  role: 'boss', // 'boss', 'dispatcher', 'driver'
  pinBoss: '1234',
  pinDispatcher: '5555',
  vehicles: [
    { id: 1, name: 'DAF XF 480 FT', plate: 'PO 12345', status: 'Dostępny', techReview: '2026-11-15' },
    { id: 2, name: 'SCANIA R450 Streamline', plate: 'PZ 98765', status: 'W trasie', techReview: '2026-09-30' }
  ],
  drivers: [
    { id: 101, name: 'Jan Kowalski', phone: '+48 600 111 222', tachoStatus: 'Odpoczynek' },
    { id: 102, name: 'Piotr Nowak', phone: '+48 600 333 444', tachoStatus: 'Jazda' }
  ],
  routes: [],
  faults: []
};

let db = JSON.parse(localStorage.getItem('trucker_enterprise_db')) || defaultState;
let targetRoleAttempt = null;

function saveDb() {
  localStorage.setItem('trucker_enterprise_db', JSON.stringify(db));
  renderApp();
}

// TOASTY / POWIADOMIEŃ
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  const colors = {
    info: 'bg-blue-950/90 border-blue-500 text-blue-200',
    success: 'bg-emerald-950/90 border-emerald-500 text-emerald-200',
    danger: 'bg-red-950/90 border-red-500 text-red-200',
    warning: 'bg-amber-950/90 border-amber-500 text-amber-200'
  };
  toast.className = `p-3 rounded-xl border text-xs font-orbitron shadow-2xl flex items-center gap-2 transition-all duration-300 ${colors[type] || colors.info}`;
  toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 3500);
}

// ZARZĄDZANIE ROLAMI I PIN
function openRoleSelector() {
  if (db.role === 'boss') {
    db.role = 'driver';
    saveDb();
    showToast("Przełączono w tryb KIEROWCY", "info");
  } else if (db.role === 'driver') {
    targetRoleAttempt = 'dispatcher';
    document.getElementById('pin-modal').classList.remove('hidden');
  } else {
    targetRoleAttempt = 'boss';
    document.getElementById('pin-modal').classList.remove('hidden');
  }
}

function closePinModal() {
  document.getElementById('pin-modal').classList.add('hidden');
  document.getElementById('pin-input').value = '';
}

function verifyPin() {
  const pin = document.getElementById('pin-input').value;
  if (targetRoleAttempt === 'boss' && pin === db.pinBoss) {
    db.role = 'boss';
    showToast("Zalogowano jako SZEF", "success");
  } else if (targetRoleAttempt === 'dispatcher' && (pin === db.pinDispatcher || pin === db.pinBoss)) {
    db.role = 'dispatcher';
    showToast("Zalogowano jako DYSPOZYTOR", "success");
  } else {
    showToast("Nieprawidłowy kod PIN!", "danger");
    return;
  }
  closePinModal();
  saveDb();
}

function applyRoleUI() {
  document.body.className = `p-2 md:p-4 min-h-screen flex flex-col justify-between role-${db.role}`;
  const roleDisplay = document.getElementById('role-name-display');
  const labelDisplay = document.getElementById('status-mode-label');

  if (db.role === 'boss') {
    roleDisplay.innerText = 'SZEF (FULL CONTROL)';
    labelDisplay.innerText = 'DOK: SZEF / ZARZĄDZANIE CAŁOŚCIOWE';
    switchTab('planner');
  } else if (db.role === 'dispatcher') {
    roleDisplay.innerText = 'DYSPOZYTOR';
    labelDisplay.innerText = 'DOK: CENTRUM DYSPOZYCYJNE';
    switchTab('planner');
  } else {
    roleDisplay.innerText = 'KIEROWCA';
    labelDisplay.innerText = 'DOK: KOKPIT KIEROWCY';
    switchTab('driver-tasks');
  }
}

// PRZEŁĄCZANIE ZAKŁADEK
function switchTab(tabId) {
  document.querySelectorAll('main > section').forEach(sec => sec.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

  const sec = document.getElementById('sec-' + tabId);
  const tab = document.getElementById('tab-' + tabId);

  if (sec) sec.classList.remove('hidden');
  if (tab) tab.classList.add('active');

  // Wymuszenie odświeżenia mapy po przełączeniu
  if (tabId === 'tacho' && typeof initMap === 'function') {
    setTimeout(initMap, 150);
  }
}

// RENDEROWANIE CAŁEJ APLIKACJI
function renderApp() {
  applyRoleUI();
  if (typeof renderRoutesModule === 'function') renderRoutesModule();
  if (typeof renderFleetModule === 'function') renderFleetModule();
  if (typeof renderTachoModule === 'function') renderTachoModule();
}

// START APLIKACJI
document.addEventListener('DOMContentLoaded', () => {
  renderApp();
});