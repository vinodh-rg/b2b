const WebSocket = require("ws");

// Create WebSocket server
const wss = new WebSocket.Server({ port: 3000 });

console.log("CrossDrop Signaling Server running on ws://localhost:3000");

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    // Send signaling data to other clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
