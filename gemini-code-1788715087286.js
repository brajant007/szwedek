// ============================================================
// CYBER FLEET ENTERPRISE - UNIFIED SYSTEM ENGINE
// ============================================================

class CyberAppEngine {
  constructor() {
    this.audioCtx = null;
    this.driverMap = null;
    this.fleetMap = null;
    this.registerServiceWorker();
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration error:', err));
      });
    }
  }

  // 1. SILNIK AUDIO
  playBeep() {
    if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.2);
  }

  // 2. INICJALIZACJA PANELA KIEROWCY
  initDriverPanel() {
    if (!document.getElementById('driver-map')) return;

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

    // Canvas e-CMR
    this.initECMRCanvas();

    // Eventy Przycisków
    document.getElementById('btn-dms')?.addEventListener('click', () => this.startDMS());
    document.getElementById('btn-send-ecmr')?.addEventListener('click', () => {
      alert('Dokument e-CMR został wysłany do dyspozytora!');
    });
    document.getElementById('btn-obd')?.addEventListener('click', async () => {
      try {
        const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
        alert(`Połączono z interfejsem CAN-Bus: ${device.name}`);
      } catch (err) {
        alert("Nie wybrano urządzenia Bluetooth.");
      }
    });
  }

  // 3. INICJALIZACJA PANELA DYSPOZYTORA
  initDispatcherPanel() {
    if (!document.getElementById('fleet-map')) return;

    this.fleetMap = L.map('fleet-map', { zoomControl: true }).setView([52.0, 19.0], 6);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(this.fleetMap);

    // Symulowana flota na mapie dyspozytora
    const trucks = [
      { id: 'HGV-01', lat: 52.612, lng: 16.578, driver: 'Jan Kowalski' },
      { id: 'HGV-02', lat: 52.229, lng: 21.012, driver: 'Piotr Nowak' }
    ];

    trucks.forEach(t => {
      L.marker([t.lat, t.lng]).addTo(this.fleetMap)
        .bindPopup(`<b>${t.id}</b><br>Kierowca: ${t.driver}`);
    });
  }

  // 4. DMS KAMERA
  async startDMS() {
    const video = document.getElementById('dms-video');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (video) video.srcObject = stream;
    } catch (e) {
      alert('Brak dostępu do kamery DMS.');
    }
  }

  // 5. OBSŁUGA CANVAS PODPISU
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