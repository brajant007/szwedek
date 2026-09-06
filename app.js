// ============================================================
// CYBER FLEET ENTERPRISE - COMPLETE ENGINE V3.2
// ============================================================

class CyberAppEngine {
  constructor() {
    this.driverMap = null;
    this.fleetMap = null;
    this.aetrInterval = null;
    this.aetrSeconds = 15300; // 04h 15m 00s

    this.initDefaultData();
    this.registerServiceWorker();
    this.initStorageListener();
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

    if (!localStorage.getItem('cyber_routes')) {
      const defaultRoutes = [
        { id: 1, from: 'Poznań', to: 'Warszawa', distance: 310, rate: 4.5, total: 1395, driver: 'Jan Kowalski', truck: 'PO 883XW', status: 'W TRASIE', signature: null },
        { id: 2, from: 'Wrocław', to: 'Gdańsk', distance: 480, rate: 4.8, total: 2304, driver: 'Piotr Nowak', truck: 'PO 12345', status: 'PLAN', signature: null }
      ];
      localStorage.setItem('cyber_routes', JSON.stringify(defaultRoutes));
    }
  }

  getTrucks() { return JSON.parse(localStorage.getItem('cyber_trucks') || '[]'); }
  getDrivers() { return JSON.parse(localStorage.getItem('cyber_drivers') || '[]'); }
  getRoutes() { return JSON.parse(localStorage.getItem('cyber_routes') || '[]'); }

  // Dynamiczna synchronizacja między otwartymi kartami
  initStorageListener() {
    window.addEventListener('storage', (e) => {
      if (['cyber_trucks', 'cyber_drivers', 'cyber_routes'].includes(e.key)) {
        this.refreshActivePanelViews();
      }
    });
  }

  refreshActivePanelViews() {
    if (document.getElementById('trucks-list')) this.renderBossLists();
    if (document.getElementById('routes-list')) this.renderRoutesAndMoney();
    if (document.getElementById('select-driver-truck')) {
      const currentTruck = document.getElementById('select-driver-truck').value;
      this.updateActiveDriverRoute(currentTruck);
    }
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW error:', err));
      });
    }
  }

  // ------------------------------------------------------------
  // 1. PANEL SZEFA (Z PEŁNYM USUWANIEM CRUD)
  // ------------------------------------------------------------
  initBossPanel() {
    this.renderBossLists();

    document.getElementById('form-add-truck')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const reg = document.getElementById('truck-reg').value.toUpperCase().trim();
      const model = document.getElementById('truck-model').value.trim();
      const type = document.getElementById('truck-type').value;

      const trucks = this.getTrucks();
      if (trucks.some(t => t.reg === reg)) return alert('Auto z tą rejestracją już istnieje!');

      trucks.push({ reg, model, type });
      localStorage.setItem('cyber_trucks', JSON.stringify(trucks));

      e.target.reset();
      this.renderBossLists();
    });

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
    });
  }

  deleteTruck(reg) {
    if (!confirm(`Czy na pewno usunąć pojazd ${reg}?`)) return;
    const trucks = this.getTrucks().filter(t => t.reg !== reg);
    localStorage.setItem('cyber_trucks', JSON.stringify(trucks));
    this.renderBossLists();
  }

  deleteDriver(index) {
    if (!confirm(`Czy na pewno usunąć tego kierowcę?`)) return;
    const drivers = this.getDrivers();
    drivers.splice(index, 1);
    localStorage.setItem('cyber_drivers', JSON.stringify(drivers));
    this.renderBossLists();
  }

  renderBossLists() {
    const trucks = this.getTrucks();
    const drivers = this.getDrivers();

    const trucksList = document.getElementById('trucks-list');
    const selectTruck = document.getElementById('driver-assigned-truck');
    
    if (trucksList) {
      trucksList.innerHTML = trucks.map(t => `
        <div class="p-2 bg-slate-900/80 rounded border border-slate-800 flex justify-between items-center text-xs">
          <div><span class="font-bold text-cyan-400 font-mono">${t.reg}</span> <span class="text-gray-400 ml-2">${t.model}</span></div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] border border-emerald-800">${t.type}</span>
            <button onclick="window.cyberApp.deleteTruck('${t.reg}')" class="text-red-500 hover:text-red-300 p-1"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </div>
      `).join('');
    }

    if (selectTruck) {
      selectTruck.innerHTML = trucks.map(t => `<option value="${t.reg}">${t.reg} (${t.model})</option>`).join('');
    }

    const driversList = document.getElementById('drivers-list');
    if (driversList) {
      driversList.innerHTML = drivers.map((d, idx) => `
        <div class="p-2 bg-slate-900/80 rounded border border-slate-800 flex justify-between items-center text-xs">
          <div><span class="font-bold text-amber-400">${d.name}</span> <span class="text-gray-400 ml-2 font-mono">Auto: ${d.truck}</span></div>
          <button onclick="window.cyberApp.deleteDriver(${idx})" class="text-red-500 hover:text-red-300 p-1"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      `).join('');
    }
  }

  // ------------------------------------------------------------
  // 2. PANEL DYSPOZYTORA (TRASY + USUWANIE + OBLICZENIA)
  // ------------------------------------------------------------
  initDispatcherPanel() {
    if (!document.getElementById('fleet-map')) return;

    const trucks = this.getTrucks();
    const drivers = this.getDrivers();
    
    const fleetCount = document.getElementById('dispatcher-fleet-count');
    if (fleetCount) fleetCount.innerText = trucks.length;

    // Inicjalizacja Leaflet z fixem wymiarów
    this.fleetMap = L.map('fleet-map', { zoomControl: true }).setView([52.0, 19.0], 6);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(this.fleetMap);
    setTimeout(() => { this.fleetMap.invalidateSize(); }, 300);

    const selectDriver = document.getElementById('route-assign-driver');
    if (selectDriver) {
      selectDriver.innerHTML = drivers.map(d => `<option value="${d.name}|${d.truck}">${d.name} (${d.truck})</option>`).join('');
    }

    const distInput = document.getElementById('route-distance');
    const rateInput = document.getElementById('route-rate');
    const totalDisplay = document.getElementById('calculated-total-val');

    const updateMoneyCalc = () => {
      const dist = parseFloat(distInput.value) || 0;
      const rate = parseFloat(rateInput.value) || 0;
      const total = (dist * rate).toFixed(2);
      if (totalDisplay) totalDisplay.innerText = `${total} PLN`;
    };

    distInput?.addEventListener('input', updateMoneyCalc);
    rateInput?.addEventListener('input', updateMoneyCalc);

    document.getElementById('form-add-route')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const from = document.getElementById('route-from').value.trim();
      const to = document.getElementById('route-to').value.trim();
      const distance = parseFloat(distInput.value) || 0;
      const rate = parseFloat(rateInput.value) || 0;
      const total = parseFloat((distance * rate).toFixed(2));
      
      const driverData = document.getElementById('route-assign-driver').value.split('|');

      const routes = this.getRoutes();
      routes.push({
        id: Date.now(),
        from, to, distance, rate, total,
        driver: driverData[0],
        truck: driverData[1],
        status: 'W TRASIE',
        signature: null
      });

      localStorage.setItem('cyber_routes', JSON.stringify(routes));
      e.target.reset();
      updateMoneyCalc();
      this.renderRoutesAndMoney();
    });

    this.renderRoutesAndMoney();
  }

  deleteRoute(id) {
    if (!confirm('Czy na pewno usunąć tę trasę?')) return;
    const routes = this.getRoutes().filter(r => r.id !== id);
    localStorage.setItem('cyber_routes', JSON.stringify(routes));
    this.renderRoutesAndMoney();
  }

  renderRoutesAndMoney() {
    const routes = this.getRoutes();
    const routesList = document.getElementById('routes-list');
    const totalMoneyElem = document.getElementById('dispatcher-total-money');

    let totalSum = 0;

    if (routesList) {
      routesList.innerHTML = routes.map(r => {
        if (r.status === 'W TRASIE') totalSum += r.total;
        
        const badgeColor = r.status === 'ZAKOŃCZONA' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-cyan-950 text-cyan-400 border-cyan-800';
        
        return `
          <div class="p-3 bg-slate-900 border border-slate-800 rounded flex justify-between items-center text-xs">
            <div>
              <div class="font-bold text-cyan-300 font-orbitron">${r.from} &rarr; ${r.to}</div>
              <div class="text-[10px] text-gray-400">${r.driver} | ${r.truck} | ${r.distance} km @ ${r.rate} PLN/km</div>
            </div>
            <div class="text-right flex items-center gap-3">
              <div>
                <span class="font-orbitron font-bold text-amber-400 text-sm block">${r.total.toFixed(2)} PLN</span>
                <span class="px-1.5 py-0.5 rounded text-[9px] border ${badgeColor}">${r.status}</span>
              </div>
              <button onclick="window.cyberApp.deleteRoute(${r.id})" class="text-red-500 hover:text-red-300"><i class="fa-solid fa-xmark text-base"></i></button>
            </div>
          </div>
        `;
      }).join('');
    }

    if (totalMoneyElem) totalMoneyElem.innerText = `${totalSum.toFixed(2)} PLN`;
  }

  // ------------------------------------------------------------
  // 3. PANEL KIEROWCY (AKTYWNY AETR + ZAMYKANIE TRASY E-CMR)
  // ------------------------------------------------------------
  initDriverPanel() {
    if (!document.getElementById('driver-map')) return;

    const trucks = this.getTrucks();
    const select = document.getElementById('select-driver-truck');
    const display = document.getElementById('active-truck-display');

    if (select) {
      select.innerHTML = trucks.map(t => `<option value="${t.reg}">${t.reg} - ${t.model}</option>`).join('');
      select.addEventListener('change', (e) => {
        const val = e.target.value;
        if (display) display.innerText = val;
        this.updateActiveDriverRoute(val);
      });

      if (trucks.length > 0) {
        if (display) display.innerText = trucks[0].reg;
        this.updateActiveDriverRoute(trucks[0].reg);
      }
    }

    // Mapa z autokorektą rozmiaru
    this.driverMap = L.map('driver-map', { zoomControl: false }).setView([52.612, 16.578], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(this.driverMap);
    setTimeout(() => { this.driverMap.invalidateSize(); }, 300);

    const hgvIcon = L.divIcon({
      className: 'custom-hgv-icon',
      html: `<div style="background:#00ffcc;width:14px;height:14px;border-radius:50%;border:2px solid #000;box-shadow:0 0 10px #00ffcc;"></div>`
    });
    const marker = L.marker([52.612, 16.578], { icon: hgvIcon }).addTo(this.driverMap);

    if ('geolocation' in navigator) {
      navigator.geolocation.watchPosition((pos) => {
        const { latitude, longitude, speed } = pos.coords;
        marker.setLatLng([latitude, longitude]);
        this.driverMap.panTo([latitude, longitude]);
        
        const speedKmH = speed ? Math.round(speed * 3.6) : 0;
        const speedElem = document.getElementById('speed-display');
        if (speedElem) speedElem.innerHTML = `${speedKmH} <span class="text-xs text-gray-400">KM/H</span>`;
        
        // Start odliczania AETR przy wykryciu ruchu (> 5 km/h)
        if (speedKmH > 5 && !this.aetrInterval) {
          this.startAETRTimer();
        }
      }, (err) => console.warn('GPS error:', err), { enableHighAccuracy: true });
    }

    this.initECMRCanvas();
    this.startAETRTimer(); // Domyślny start odliczania czasu jazdy

    document.getElementById('btn-dms')?.addEventListener('click', () => this.startDMS());
    
    // ZAMKNIĘCIE TRASY Z PODPISEM
    document.getElementById('btn-send-ecmr')?.addEventListener('click', () => {
      const activeTruck = select ? select.value : '';
      const routes = this.getRoutes();
      const activeRoute = routes.find(r => r.truck === activeTruck && r.status === 'W TRASIE');

      if (!activeRoute) return alert('Brak aktywnej trasy do rozliczenia!');

      const canvas = document.getElementById('ecmr-canvas');
      const sigData = canvas ? canvas.toDataURL() : null;

      activeRoute.status = 'ZAKOŃCZONA';
      activeRoute.signature = sigData;

      localStorage.setItem('cyber_routes', JSON.stringify(routes));
      
      alert(`Trasa ${activeRoute.from} -> ${activeRoute.to} została podpisana i pomyślnie rozliczona!`);
      this.updateActiveDriverRoute(activeTruck);
    });
  }

  updateActiveDriverRoute(truckReg) {
    const routes = this.getRoutes();
    const activeRoute = routes.find(r => r.truck === truckReg && r.status === 'W TRASIE');
    
    const routeInfo = document.getElementById('driver-route-info');
    const routeMoney = document.getElementById('driver-route-money');

    if (activeRoute) {
      if (routeInfo) routeInfo.innerText = `${activeRoute.from} ➔ ${activeRoute.to} (${activeRoute.distance} km)`;
      if (routeMoney) routeMoney.innerText = `${activeRoute.total.toFixed(2)} PLN`;
    } else {
      if (routeInfo) routeInfo.innerText = 'Brak aktywnej trasy';
      if (routeMoney) routeMoney.innerText = '0.00 PLN';
    }
  }

  startAETRTimer() {
    if (this.aetrInterval) return;
    const timerElem = document.getElementById('aura-timer');

    this.aetrInterval = setInterval(() => {
      if (this.aetrSeconds <= 0) {
        clearInterval(this.aetrInterval);
        if (timerElem) timerElem.innerText = '00:00:00 (PAUZA!)';
        return;
      }
      this.aetrSeconds--;
      
      const hrs = String(Math.floor(this.aetrSeconds / 3600)).padStart(2, '0');
      const mins = String(Math.floor((this.aetrSeconds % 3600) / 60)).padStart(2, '0');
      const secs = String(this.aetrSeconds % 60).padStart(2, '0');

      if (timerElem) timerElem.innerText = `${hrs}:${mins}:${secs}`;
    }, 1000);
  }

  async startDMS() {
    const video = document.getElementById('dms-video');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (video) video.srcObject = stream;
    } catch (e) {
      alert('Brak dostępu do kamery DMS.');
    }
  }

  initECMRCanvas() {
    const canvas = document.getElementById('ecmr-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let drawing = false;

    canvas.width = canvas.parentElement.clientWidth || 300;
    canvas.height = 96;
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