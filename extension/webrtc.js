/*
  webrtc.js
  - WebRTC helper: create peer, DataChannel file transfer, local IP discovery
  - Exposes CrossDropRTC class for use by popup.js or web app
*/

class CrossDropRTC {
  constructor({ onData, onProgress, onState }) {
    this.pc = null;
    this.dc = null;
    this.onData = onData;
    this.onProgress = onProgress;
    this.onState = onState;
    this.recvBuffers = [];
    this.expectedSize = 0;
    this.fileName = '';
  }

  createPeer(isCaller = false) {
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    this.pc.onicecandidate = (e) => {
      if (e.candidate && this.onState) this.onState({ type: 'ice', candidate: e.candidate });
    };

    this.pc.onconnectionstatechange = () => {
      if (this.onState) this.onState({ type: 'state', state: this.pc.connectionState });
    };

    if (isCaller) {
      this.dc = this.pc.createDataChannel('file');
      this.setupDataChannel(this.dc);
    } else {
      this.pc.ondatachannel = (ev) => {
        this.dc = ev.channel; this.setupDataChannel(this.dc);
      };
    }
  }

  setupDataChannel(dc) {
    dc.binaryType = 'arraybuffer';
    dc.onopen = () => { if (this.onState) this.onState({ type: 'dc-open' }); };
    dc.onclose = () => { if (this.onState) this.onState({ type: 'dc-close' }); };
    dc.onmessage = (ev) => this.handleMessage(ev.data);
  }

  async createOffer() {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  async createAnswer() {
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  async handleRemoteDesc(desc) {
    await this.pc.setRemoteDescription(desc);
  }

  async addIce(candidate) {
    try { await this.pc.addIceCandidate(candidate); } catch (e) { console.warn('addIce failed', e); }
  }

  // File sending API: sends metadata first, then binary chunks
  async sendFile(file, chunkSize = 64 * 1024) {
    if (!this.dc || this.dc.readyState !== 'open') throw new Error('DataChannel not open');
    this.onState && this.onState({ type: 'sending', file: file.name });
    // metadata
    this.dc.send(JSON.stringify({ meta: true, name: file.name, size: file.size }));

    const reader = file.stream().getReader();
    let readBytes = 0;
    const startTs = Date.now();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      this.dc.send(value);
      readBytes += value.byteLength;
      const elapsed = Math.max(1, (Date.now() - startTs) / 1000);
      this.onProgress && this.onProgress({ sent: readBytes, total: file.size, speed: Math.round(readBytes / elapsed) });
    }

    this.dc.send(JSON.stringify({ finished: true }));
    this.onState && this.onState({ type: 'sent', file: file.name });
  }

  handleMessage(data) {
    // metadata or finished messages are JSON; binary chunks are ArrayBuffer
    if (typeof data === 'string') {
      try {
        const msg = JSON.parse(data);
        if (msg.meta) {
          this.recvBuffers = [];
          this.expectedSize = msg.size;
          this.fileName = msg.name;
          this.onState && this.onState({ type: 'incoming', name: msg.name, size: msg.size });
        } else if (msg.finished) {
          const blob = new Blob(this.recvBuffers);
          this.onData && this.onData({ blob, name: this.fileName });
          this.recvBuffers = [];
          this.expectedSize = 0;
          this.fileName = '';
        }
      } catch (e) { console.warn('JSON parse failed', e); }
    } else {
      // binary chunk
      this.recvBuffers.push(data);
      const received = this.recvBuffers.reduce((s, b) => s + b.byteLength, 0);
      this.onProgress && this.onProgress({ received, total: this.expectedSize });
    }
  }

  close() {
    try { this.dc && this.dc.close(); } catch (e) {}
    try { this.pc && this.pc.close(); } catch (e) {}
  }

  // Local IP discovery via WebRTC trick
  static async discoverLocalIPs(timeout = 2000) {
    return new Promise((resolve) => {
      const ips = new Set();
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('ip');
      pc.onicecandidate = (e) => {
        if (!e.candidate) return;
        const parts = e.candidate.candidate.split(' ');
        for (const p of parts) {
          if (/\d+\.\d+\.\d+\.\d+/.test(p)) ips.add(p);
        }
      };
      pc.createOffer().then(offer => pc.setLocalDescription(offer));
      setTimeout(() => { pc.close(); resolve(Array.from(ips)); }, timeout);
    });
  }
}

// Export for extension and web use
if (typeof window !== 'undefined') window.CrossDropRTC = CrossDropRTC;
