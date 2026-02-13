const WebSocket = require('ws');

const TARGET_URL = process.argv[2] || 'ws://localhost:3000';
console.log(`Connecting to ${TARGET_URL}...`);

const ws = new WebSocket(TARGET_URL);

ws.on('open', () => {
    console.log('✅ Connected to WebSocket server');
    console.log('Sending register payload...');
    ws.send(JSON.stringify({ type: 'register', name: 'VerificationBot', info: { ua: 'NodeJS' } }));
});

ws.on('message', (data) => {
    const msg = JSON.parse(data);
    console.log('Received:', msg.type);

    if (msg.type === 'welcome') {
        console.log(`✅ Welcome received. Assigned ID: ${msg.id}`);
    } else if (msg.type === 'registered') {
        console.log('✅ Registration confirmed.');
        // Keep alive briefly then exit success
        setTimeout(() => {
            console.log('SUCCESS: Deployment verified.');
            process.exit(0);
        }, 1000);
    }
});

ws.on('error', (err) => {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
});

// Timeout
setTimeout(() => {
    console.error('❌ Timeout waiting for response.');
    process.exit(1);
}, 10000);
