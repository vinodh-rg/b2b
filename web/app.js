// Minimal web app client mirroring extension behaviour
const SIGNALING = location.origin.replace(/^http/, 'ws');
let ws, myId, devices=[];
const deviceList = document.getElementById('deviceList');
const targetSelect = document.getElementById('targetSelect');
const sendBtn = document.getElementById('sendBtn');
const fileInput = document.getElementById('fileInput');
const progressArea = document.getElementById('progressArea');
const progressBar = document.getElementById('progress');

function connect() {
  ws = new WebSocket(SIGNALING);
  ws.addEventListener('open', async () => {
    const ips = await CrossDropRTC.discoverLocalIPs().catch(()=>[]);
    ws.send(JSON.stringify({ type: 'register', name: 'web', localIp: ips[0]||null }));
  });
  ws.addEventListener('message', ev => {
    const msg = JSON.parse(ev.data);
    if (msg.type === 'welcome') myId = msg.id;
    if (msg.type === 'device-list') { devices = msg.devices.filter(d=>d.id!==myId); renderDevices(); }
    if (msg.type === 'offer') handleOffer(msg);
    if (msg.type === 'answer') handleAnswer(msg);
    if (msg.type === 'candidate') handleCandidate(msg);
  });
}

function renderDevices() {
  deviceList.innerHTML=''; targetSelect.innerHTML='';
  devices.forEach(d => { const li = document.createElement('li'); li.textContent = `${d.name}`; deviceList.appendChild(li); const opt = document.createElement('option'); opt.value=d.id; opt.textContent=d.name; targetSelect.appendChild(opt); });
}

// Reuse same code from extension popup for brevity (omitted duplicate handlers)
// For production, share a single library file.

connect();
