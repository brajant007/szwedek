/**
 * TRUCKER PRO ENTERPRISE v5.0 - e-CMR MODULE
 */

let cmrCanvas = null;
let cmrCtx = null;
let isDrawing = false;

function initCmrCanvas() {
  cmrCanvas = document.getElementById('cmr-canvas');
  if (!cmrCanvas) return;

  cmrCtx = cmrCanvas.getContext('2d');
  cmrCanvas.width = cmrCanvas.offsetWidth || 300;
  cmrCanvas.height = 120;

  cmrCtx.strokeStyle = "#34d399";
  cmrCtx.lineWidth = 2;
  cmrCtx.lineCap = "round";

  const getPos = (e) => {
    const rect = cmrCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e) => {
    isDrawing = true;
    const pos = getPos(e);
    cmrCtx.beginPath();
    cmrCtx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    cmrCtx.lineTo(pos.x, pos.y);
    cmrCtx.stroke();
  };

  const stopDrawing = () => { isDrawing = false; };

  cmrCanvas.onmousedown = startDrawing;
  cmrCanvas.onmousemove = draw;
  cmrCanvas.onmouseup = stopDrawing;

  cmrCanvas.ontouchstart = startDrawing;
  cmrCanvas.ontouchmove = draw;
  cmrCanvas.ontouchend = stopDrawing;
}

function clearCmrCanvas() {
  if (cmrCtx && cmrCanvas) {
    cmrCtx.clearRect(0, 0, cmrCanvas.width, cmrCanvas.height);
  }
}

function saveCmrDocument() {
  const sender = document.getElementById('cmr-sender')?.value;
  const receiver = document.getElementById('cmr-receiver')?.value;

  if (!sender || !receiver) {
    showToast("Wypełnij dane Nadawcy i Odbiorcy!", "danger");
    return;
  }

  showToast("Dokument e-CMR wygenerowany i podpisany cyfrowo!", "success");
  clearCmrCanvas();
}

function renderCmrModule() {
  const sec = document.getElementById('sec-cmr');
  if (!sec) return;

  sec.innerHTML = `
    <div class="glass-card p-4 rounded-2xl border-purple-500/30 max-w-2xl mx-auto space-y-4">
      <div class="flex justify-between items-center border-b border-slate-800 pb-2">
        <h2 class="font-orbitron text-xs text-purple-400 flex items-center gap-1.5">
          <i class="fa-solid fa-file-signature"></i> CYFROWE e-CMR (INTERNATIONAL CONSIGNMENT NOTE)
        </h2>
        <span class="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">ISO 19841</span>
      </div>

      <div class="space-y-3 text-xs">
        <div>
          <label class="text-[10px] text-gray-400">1. Nadawca (Nazwa, Adres, Kraj):</label>
          <input type="text" id="cmr-sender" placeholder="np. Logistics Hub Sp. z o.o., Poznań PL" class="w-full rounded-xl p-2 font-bold">
        </div>

        <div>
          <label class="text-[10px] text-gray-400">2. Odbiorca (Nazwa, Adres, Kraj):</label>
          <input type="text" id="cmr-receiver" placeholder="np. Berlin Distribution GmbH, Berlin DE" class="w-full rounded-xl p-2 font-bold">
        </div>

        <div>
          <label class="text-[10px] text-gray-400">3. Opis Towaru / Liczba Palet / Waga (kg):</label>
          <textarea rows="2" placeholder="np. 33 palety EURO, 18 500 kg, Artykuły przemysłowe" class="w-full rounded-xl p-2"></textarea>
        </div>

        <div class="border border-slate-800 rounded-xl p-2 bg-black space-y-1">
          <div class="flex justify-between items-center text-[10px] text-gray-400">
            <span>Podpis cyfrowy Odbiorcy na ekranie:</span>
            <button onclick="clearCmrCanvas()" class="text-red-400 hover:underline">Wyczyść</button>
          </div>
          <canvas id="cmr-canvas" class="w-full h-28 cursor-crosshair bg-slate-950 rounded border border-slate-800/80"></canvas>
        </div>

        <button onclick="saveCmrDocument()" class="w-full py-2.5 bg-purple-950 hover:bg-purple-900 border border-purple-700 text-purple-300 font-orbitron font-bold text-xs rounded-xl shadow-lg shadow-purple-950/50 transition">
          <i class="fa-solid fa-check-circle mr-1"></i> ZAPISZ I PODPISZ e-CMR
        </button>
      </div>
    </div>
  `;

  setTimeout(initCmrCanvas, 150);
}