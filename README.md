# CrossDrop

## Overview
CrossDrop is a production-ready, cross-platform file sharing system for the web. It uses WebRTC DataChannels for peer-to-peer file transfer and a WebSocket server for signaling.

## Features
- **Secure Pairing**: QR-code based device verification.
- **Peer-to-Peer**: Direct file transfer (no cloud storage).
- **Cross-Platform**: Works on any device with a modern browser.
- **Local & Cloud**: Supports both local discovery and global connectivity.

## Documentation
- **[User Manual](docs/USER_MANUAL.md)**: How to pair devices and send files.
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)**: Architecture, API, and Deployment instructions.

## Quick Start
1.  **Server**: `cd server && npm install && npm start`
2.  **Extension**: Load `extension/` folder in Chrome Developer Mode.

## License
MIT
