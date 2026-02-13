// popup.js - connects to signaling server, shows device list, handles user actions

// Replace with your deployed signaling server WSS URL in production
// Sample deployed URL: wss://crossdrop.onrender.com
// For local dev: ws://localhost:3000
const DEFAULT_WSS = 'ws://localhost:3000';
const SIGNALING_WSS = (typeof SIGNALING_URL !== 'undefined') ? SIGNALING_URL : (localStorage.getItem('crossdrop_signaling') || DEFAULT_WSS);
let ws; let myId = null; let devices = [];

const statusEl = document.getElementById('status');
const deviceListEl = document.getElementById('deviceList');
const targetSelect = document.getElementById('targetSelect');
const sendBtn = document.getElementById('sendBtn');
const fileInput = document.getElementById('fileInput');
const progressArea = document.getElementById('progressArea');
const progressBar = document.getElementById('progress');
const fileNameEl = document.getElementById('fileName');
const speedEl = document.getElementById('speed');
const connStatus = document.getElementById('connStatus');
const errors = document.getElementById('errors');
const darkToggle = document.getElementById('darkToggle');
const deviceIdEl = document.getElementById('deviceId');
const qrImg = document.getElementById('qrImg');
const pairInput = document.getElementById('pairInput');
const pairBtn = document.getElementById('pairBtn');
const trustedList = document.getElementById('trustedList');
function loadTrusted() {
  const raw = localStorage.getItem('crossdrop_trusted');
  const map = raw ? JSON.parse(raw) : {};
  trustedList.innerHTML = '';
  for (const id in map) {
    const li = document.createElement('li'); li.textContent = `${map[id].name || id}`;
    const btn = document.createElement('button'); btn.textContent = 'Remove'; btn.onclick = () => { delete map[id]; localStorage.setItem('crossdrop_trusted', JSON.stringify(map)); loadTrusted(); };
    li.appendChild(btn); trustedList.appendChild(li);
  }
}

function saveTrusted(id, info) {
  const raw = localStorage.getItem('crossdrop_trusted');
  const map = raw ? JSON.parse(raw) : {};
  map[id] = info || { added: Date.now() };
  localStorage.setItem('crossdrop_trusted', JSON.stringify(map));
  loadTrusted();
}

pairBtn.onclick = async () => {
  const target = pairInput.value.trim();
  if (!target) return logErr('Enter a device ID to pair');
  const fromId = ensureDeviceId();
  // Call server handling logic later? For now just try to pair via WS if online
  // OR simpy save as trusted if we are just testing local pairing
  // But Phase 1 says "Add pairing request/accept workflow"

  // Basic implementation: send request over WS
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'pair-request', from: fromId, target: target, message: 'Requesting to pair' }));
    logErr('Pair request sent to ' + target);
  } else {
    logErr('Not connected to signaling server');
  }
};

function handleIncomingPair(msg) {
  const from = msg.from;
  if (confirm(`Pair request from ${from}. Accept?`)) {
    saveTrusted(from, { name: from });
    ws.send(JSON.stringify({ type: 'pair-response', from: ensureDeviceId(), target: from, accepted: true }));
  } else {
    ws.send(JSON.stringify({ type: 'pair-response', from: ensureDeviceId(), target: from, accepted: false }));
  }
}

function handlePairResponse(msg) {
  if (msg.accepted) {
    saveTrusted(msg.from, { name: msg.from });
    logErr('Pair accepted by ' + msg.from);
  } else {
    logErr('Pair rejected by ' + msg.from);
  }
}
const scanBtn = document.getElementById('scanBtn');
const scannerWrap = document.getElementById('scanner');
const videoEl = document.getElementById('video');
const canvasEl = document.getElementById('canvas');
const stopScanBtn = document.getElementById('stopScan');

let peer = null; let targetId = null;

function logErr(msg) { errors.textContent = msg; }

function ensureDeviceId() {
  let id = localStorage.getItem('crossdrop_device_id');
  if (!id) {
    id = 'd-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('crossdrop_device_id', id);
  }
  return id;
}

async function registerToServer(wsConn) {
  const id = ensureDeviceId();
  const ips = await CrossDropRTC.discoverLocalIPs().catch(() => []);
  // request token via REST token endpoint for persistent registration (optional)
  try {
    const resp = await fetch((SIGNALING_WSS.replace(/^ws/, 'http')).replace(/:\/\/$/, '://') + '/token', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: navigator.userAgent, info: { localIp: ips[0] || null, ua: navigator.userAgent } })
    });
    const json = await resp.json();
    if (json && json.token) {
      wsConn.send(JSON.stringify({ type: 'register', token: json.token }));
      return;
    }
  } catch (e) { /* fallback to websocket registration */ }
  wsConn.send(JSON.stringify({ type: 'register', name: navigator.userAgent, info: { localIp: ips[0] || null } }));
}

function connect() {
  ws = new WebSocket(SIGNALING_WSS);
  ws.addEventListener('open', async () => {
    statusEl.textContent = 'Connected';
    await registerToServer(ws);
  });

  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    switch (msg.type) {
      case 'welcome': myId = msg.id; break;
      case 'device-list': devices = msg.devices.filter(d => d.id !== myId); renderDevices(); break;
      case 'pair-request': handleIncomingPair(msg); break;
      case 'pair-response': handlePairResponse(msg); break;
      case 'offer': handleOffer(msg); break;
      case 'answer': handleAnswer(msg); break;
      case 'candidate': handleCandidate(msg); break;
      case 'error': logErr(msg.message); break;
    }
  });

  ws.addEventListener('close', () => statusEl.textContent = 'Disconnected');
}

function renderDeviceIdAndQr() {
  const id = ensureDeviceId();
  deviceIdEl.textContent = id;
  // Clear previous
  qrImg.innerHTML = ''; // qrImg is used as container ID but variable name was qrImg
  const container = document.getElementById('qrWrap');
  container.innerHTML = '';
  new QRCode(container, {
    text: id,
    width: 128,
    height: 128,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
}

// ... existing code ...

// QR scanning using getUserMedia + jsQR
let scanning = false; let streamRef = null;
async function startScan() {
  if (scanning) return;
  // jsQR should be loaded via script tag
  if (typeof jsQR === 'undefined') {
    logErr('jsQR library not loaded');
    return;
  }
  scannerWrap.classList.remove('hidden');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    streamRef = stream; videoEl.srcObject = stream; scanning = true;
    videoEl.setAttribute('playsinline', true); // required for iOS
    videoEl.play();
    requestAnimationFrame(scanLoop);
  } catch (e) {
    console.error(e);
    logErr('Camera access denied or error: ' + e.message);
  }
}

function stopScan() {
  scanning = false; scannerWrap.classList.add('hidden');
  if (streamRef) { streamRef.getTracks().forEach(t => t.stop()); streamRef = null; }
}

function scanLoop() {
  if (!scanning) return;
  if (videoEl.readyState === videoEl.HAVE_ENOUGH_DATA) {
    const w = videoEl.videoWidth, h = videoEl.videoHeight;
    canvasEl.width = w; canvasEl.height = h;
    const ctx = canvasEl.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    const code = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" });
    if (code && code.data) {
      // Valid QR found
      pairInput.value = code.data;
      stopScan();
      logErr('QR scanned: ' + code.data);
      // Optional: Auto-click pair
      // pairBtn.click();
      return;
    }
  }
  requestAnimationFrame(scanLoop);
}

scanBtn.onclick = () => startScan();
stopScanBtn.onclick = () => stopScan();

function renderDevices() {
  deviceListEl.innerHTML = '';
  targetSelect.innerHTML = '<option value="">Select device</option>';
  devices.forEach(d => {
    const li = document.createElement('li');
    li.textContent = `${d.name} (${d.localIp || 'remote'})`;
    const btn = document.createElement('button'); btn.textContent = 'Connect';
    btn.onclick = () => { targetSelect.value = d.id; };
    li.appendChild(btn);
    deviceListEl.appendChild(li);

    const opt = document.createElement('option'); opt.value = d.id; opt.textContent = d.name; targetSelect.appendChild(opt);
  });
}

async function handleOffer(msg) {
  targetId = msg.from;
  peer = new CrossDropRTC({ onData: onData, onProgress: onProgress, onState: onState });
  peer.createPeer(false);
  await peer.handleRemoteDesc(msg.offer);
  const answer = await peer.createAnswer();
  ws.send(JSON.stringify({ type: 'answer', target: targetId, answer }));
}

async function handleAnswer(msg) {
  if (!peer) return;
  await peer.handleRemoteDesc(msg.answer);
}

async function handleCandidate(msg) {
  if (!peer) return;
  await peer.addIce(msg.candidate);
}

function onState(st) {
  if (st.type === 'ice') ws.send(JSON.stringify({ type: 'candidate', target: targetId, candidate: st.candidate }));
  if (st.type === 'dc-open') connStatus.textContent = 'DataChannel open';
  if (st.type === 'dc-close') connStatus.textContent = 'DataChannel closed';
  if (st.type === 'sending') fileNameEl.textContent = st.file;
}

function onProgress(p) {
  if (p.total) {
    const val = p.sent ? Math.round((p.sent / p.total) * 100) : (p.received ? Math.round((p.received / p.total) * 100) : 0);
    progressBar.value = val;
  }
  if (p.speed) speedEl.textContent = `${Math.round(p.speed / 1024)} KB/s`;
}

function onData({ blob, name }) {
  // auto-download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

sendBtn.onclick = async () => {
  const file = fileInput.files[0];
  targetId = targetSelect.value;
  if (!file || !targetId) { logErr('Select a file and a target'); return; }

  peer = new CrossDropRTC({ onData: onData, onProgress: onProgress, onState: onState });
  peer.createPeer(true);
  const offer = await peer.createOffer();
  const fromId = ensureDeviceId();
  ws.send(JSON.stringify({ type: 'offer', from: fromId, target: targetId, offer }));

  // When remote answer arrives, handleAnswer will set remote desc
  // Wait until DC open
  const waitOpen = () => new Promise((res) => {
    const chk = setInterval(() => { if (peer.dc && peer.dc.readyState === 'open') { clearInterval(chk); res(); } }, 100);
    setTimeout(() => { clearInterval(chk); res(); }, 15000);
  });
  await waitOpen();
  progressArea.classList.remove('hidden');
  await peer.sendFile(file);
};

darkToggle.onchange = () => { document.body.classList.toggle('dark', darkToggle.checked); };

// init
renderDeviceIdAndQr();
loadTrusted();
connect();
