// ============================================================
// CYBER FLEET ENTERPRISE - UNIFIED SYSTEM ENGINE (V3)
// ============================================================

class CyberAppEngine {
  constructor() {
    this.audioCtx = null;
    this.driverMap = null;
    this.fleetMap = null;
    
    // Inicjalizacja domyślnych danych floty jeśli brak w localStorage
    this.initDefaultData();
    this.registerServiceWorker();
  }

  initDefaultData() {
    if (!localStorage.getItem('cyber_trucks')) {
      const defaultTrucks = [
        { reg: 'PO 883XW', model: 'Volvo FH16 750', type: 'Ciągnik + Naczepa Standard' },
        { reg: 'PO 12345', model: 'Scania R500', type: 'Ciągnik + Chłodnia' }
      ];
      localStorage.setItem('cyber_trucks', JSON.stringify(defaultTrucks));
    }

    if (!localStorage.getItem('cyber_drivers')) {
      const defaultDrivers = [
        { name: 'Jan Kowalski', pin: '1234', truck: 'PO 883XW' },
        { name: 'Piotr Nowak', pin: '4321', truck: 'PO 12345' }
      ];
      localStorage.setItem('cyber_drivers', JSON.stringify(defaultDrivers));
    }
  }

  getTrucks() {
    return JSON.parse(localStorage.getItem('cyber_trucks') || '[]');
  }

  getDrivers() {
    return JSON.parse(localStorage.getItem('cyber_drivers') || '[]');
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration error:', err));
      });
    }
  }

  // 1. PANEL SZEFA / ADMINA
  initBossPanel() {
    this.renderBossLists();

    // Dodawanie ciężarówki
    document.getElementById('form-add-truck')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const reg = document.getElementById('truck-reg').value.toUpperCase().trim();
      const model = document.getElementById('truck-model').value.trim();
      const type = document.getElementById('truck-type').value;

      const trucks = this.getTrucks();
      trucks.push({ reg, model, type });
      localStorage.setItem('cyber_trucks', JSON.stringify(trucks));

      e.target.reset();
      this.renderBossLists();
      alert(`Pojazd ${reg} zarejestrowany pomyślnie!`);
    });

    // Dodawanie kierowcy
    document.getElementById('form-add-driver')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('driver-name').value.trim();
      const pin = document.getElementById('driver-pin').value.trim();
      const truck = document.getElementById('driver-assigned-truck').value;

      const drivers = this.getDrivers();
      drivers.push({ name, pin, truck });
      localStorage.setItem('cyber_drivers', JSON.stringify(drivers));

      e.target.reset();
      this.renderBossLists();
      alert(`Kierowca ${name} został utworzony!`);
    });
  }

  renderBossLists() {
    const trucks = this.getTrucks();
    const drivers = this.getDrivers();

    // Renderowanie Listy Ciężarówek
    const trucksList = document.getElementById('trucks-list');
    const selectTruck = document.getElementById('driver-assigned-truck');
    
    if (trucksList) {
      trucksList.innerHTML = trucks.map(t => `
        <div class="p-2.5 bg-slate-900/80 rounded border border-slate-800 flex justify-between items-center text-xs">
          <div>
            <span class="font-bold text-cyan-400 font-mono">${t.reg}</span>
            <span class="text-gray-400 ml-2">${t.model}</span>
          </div>
          <span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] border border-emerald-800">${t.type}</span>
        </div>
      `).join('');
    }

    if (selectTruck) {
      selectTruck.innerHTML = trucks.map(t => `<option value="${t.reg}">${t.reg} (${t.model})</option>`).join('');
    }

    // Renderowanie Listy Kierowców
    const driversList = document.getElementById('drivers-list');
    if (driversList) {
      driversList.innerHTML = drivers.map(d => `
        <div class="p-2.5 bg-slate-900/80 rounded border border-slate-800 flex justify-between items-center text-xs">
          <div>
            <span class="font-bold text-amber-400">${d.name}</span>
            <span class="text-gray-400 ml-2 font-mono">(PIN: ****)</span>
          </div>
          <span class="text-gray-400 font-mono text-[10px]">Auto: ${d.truck}</span>
        </div>
      `).join('');
    }
  }

  // 2. PANEL KIEROWCY
  initDriverPanel() {
    if (!document.getElementById('driver-map')) return;

    // Ładowanie listy ciężarówek do wyboru
    const trucks = this.getTrucks();
    const select = document.getElementById('select-driver-truck');
    const display = document.getElementById('active-truck-display');

    if (select) {
      select.innerHTML = trucks.map(t => `<option value="${t.reg}">${t.reg} - ${t.model}</option>`).join('');
      select.addEventListener('change', (e) => {
        if (display) display.innerText = e.target.value;
      });
      if (trucks.length > 0 && display) display.innerText = trucks[0].reg;
    }

    // Mapa Kierowcy
    this.driverMap = L.map('driver-map', { zoomControl: false }).setView([52.612, 16.578], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(this.driverMap);

    const hgvIcon = L.divIcon({
      className: 'custom-hgv-icon',
      html: `<div style="background:#00ffcc;width:14px;height:14px;border-radius:50%;border:2px solid #000;box-shadow:0 0 10px #00ffcc;"></div>`
    });
    const marker = L.marker([52.612, 16.578], { icon: hgvIcon }).addTo(this.driverMap);

    // Live GPS
    if ('geolocation' in navigator) {
      navigator.geolocation.watchPosition((pos) => {
        const { latitude, longitude, speed } = pos.coords;
        marker.setLatLng([latitude, longitude]);
        this.driverMap.panTo([latitude, longitude]);
        const speedKmH = speed ? Math.round(speed * 3.6) : 0;
        const speedElem = document.getElementById('speed-display');
        if (speedElem) speedElem.innerHTML = `${speedKmH} <span class="text-xs text-gray-400">KM/H</span>`;
      }, (err) => console.warn('GPS error:', err), { enableHighAccuracy: true });
    }

    this.initECMRCanvas();

    document.getElementById('btn-dms')?.addEventListener('click', () => this.startDMS());
    document.getElementById('btn-send-ecmr')?.addEventListener('click', () => {
      alert('Dokument e-CMR został pomyślnie podpisany i przesłany do centrali!');
    });
  }

  // 3. PANEL DYSPOZYTORA
  initDispatcherPanel() {
    if (!document.getElementById('fleet-map')) return;

    const trucks = this.getTrucks();
    const fleetCount = document.getElementById('dispatcher-fleet-count');
    if (fleetCount) fleetCount.innerText = trucks.length;

    this.fleetMap = L.map('fleet-map', { zoomControl: true }).setView([52.0, 19.0], 6);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(this.fleetMap);

    // Renderowanie pojazdów na mapie dyspozytora
    const feed = document.getElementById('dispatcher-feed');
    if (feed) feed.innerHTML = '';

    trucks.forEach((t, index) => {
      const lat = 52.0 + (index * 0.4);
      const lng = 16.5 + (index * 1.2);

      L.marker([lat, lng]).addTo(this.fleetMap)
        .bindPopup(`<b>Pojazd: ${t.reg}</b><br>${t.model}<br>Status: W trasie`);

      if (feed) {
        feed.innerHTML += `
          <div class="p-2.5 rounded bg-cyan-950/40 border border-cyan-800/50">
            <div class="flex justify-between font-bold text-cyan-300">
              <span>${t.reg} (${t.model})</span>
              <span class="text-[10px] text-emerald-400">ONLINE</span>
            </div>
            <p class="text-gray-400 mt-1">Status: Gotowy do wysłania komend.</p>
          </div>
        `;
      }
    });
  }

  // Kamera DMS
  async startDMS() {
    const video = document.getElementById('dms-video');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (video) video.srcObject = stream;
    } catch (e) {
      alert('Brak dostępu do kamery DMS.');
    }
  }

  // Canvas Podpisu
  initECMRCanvas() {
    const canvas = document.getElementById('ecmr-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let drawing = false;

    canvas.width = canvas.parentElement.clientWidth || 300;
    canvas.height = 112;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const start = (e) => { drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
    const move = (e) => { if (drawing) { const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); } };
    const stop = () => { drawing = false; };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', stop);
    canvas.addEventListener('touchstart', start);
    canvas.addEventListener('touchmove', move);
    window.addEventListener('touchend', stop);

    document.getElementById('btn-clear-sig')?.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }
}

window.cyberApp = new CyberAppEngine();