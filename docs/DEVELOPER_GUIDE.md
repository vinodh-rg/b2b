# CrossDrop Developer Guide

## System Architecture

CrossDrop consists of two main components:
1.  **Signaling Server** (`server/`): A NodeJS + Express + WebSocket server that handles device discovery, presence (heartbeat), and signaling message routing (SDP/ICE).
2.  **Browser Extension** (`extension/`): A Chrome extension that handles the UI, WebRTC connections, and file transfer logic.

### Technology Stack
-   **Server**: Node.js, WebSocket (`ws`), Express, In-memory Registry.
-   **Extension**: HTML/CSS/JS (Vanilla), WebRTC DataChannels.
-   **Deployment**: Docker.

## Setup for Development

### Prerequisites
-   Node.js v14+
-   Docker (optional)

### Running Locally
1.  **Start the Server**:
    ```bash
    cd server
    npm install
    npm run start:dev
    ```
    Server runs on `http://localhost:3000`.

2.  **Load the Extension**:
    -   Go to `chrome://extensions`.
    -   Enable "Developer mode".
    -   "Load unpacked" -> Select `extension/` folder.

## Deployment with Docker

1.  **Build Image**:
    ```bash
    docker build -t crossdrop-server ./server
    ```

2.  **Run Container**:
    ```bash
    docker run -p 3000:3000 -e NODE_ENV=production crossdrop-server
    ```

3.  **Cloud Deployment (e.g., Render)**:
    -   Connect your repo.
    -   Set Root Directory to `server`.
    -   Build Command: `npm install`.
    -   Start Command: `node server.js`.
    -   Add Environment Variables: `NODE_ENV=production`.

## API Endpoints (Signaling Server)

-   `GET /health`: Health check (returns `{"ok":true}`).
-   `POST /token`: Generate auth token (body: `{id, name}`).
-   `POST /pair/request`: Initiate pairing (body: `{fromId, toId, message}`).

## Testing
Run automated tests for the server:
```bash
cd server
npm test
```
