/**
 * LAN Share - Background Service Worker
 * 
 * Manages the persistent WebSocket connection and message routing.
 */

const SERVER_IP = "localhost"; // Change this to your local network IP
const SERVER_PORT = "3000";
const WS_URL = `ws://${SERVER_IP}:${SERVER_PORT}`;

let socket = null;
let deviceList = [];
let connectionStatus = "Not Connected";

/**
 * Initialize WebSocket connection
 */
function connect() {
  if (socket && socket.readyState === WebSocket.OPEN) return;

  socket = new WebSocket(WS_URL);
  socket.binaryType = "arraybuffer";

  socket.onopen = () => {
    console.log("✅ WebSocket Connected (Background)");
    updateStatus("Connected");
  };

  socket.onclose = () => {
    console.log("❌ WebSocket Disconnected (Background)");
    updateStatus("Not Connected");
    setTimeout(connect, 3000); // Reconnect logic
  };

  socket.onerror = (error) => {
    console.error("⚠️ WebSocket Error (Background):", error);
    updateStatus("Error");
  };

  socket.onmessage = async (event) => {
    const { data } = event;

    // 1. Handle Binary Data (Files)
    if (data instanceof ArrayBuffer) {
      console.log("📁 Received Binary Data in background");
      // Forward to popup if open
      chrome.runtime.sendMessage({ type: "binary", payload: data }).catch(() => {
        // Popup might be closed, we should ideally handle this (e.g., notification or download)
        console.log("Popup closed, binary data not forwarded.");
      });
      return;
    }

    // 2. Handle JSON Data
    try {
      const message = JSON.parse(data);
      if (message.type === "devices") {
        deviceList = message.payload;
        broadcastToPopup({ type: "devices", payload: deviceList });
      } else if (message.type === "message") {
        broadcastToPopup({ type: "message", payload: message.payload });
      }
    } catch (err) {
      console.error("❌ Failed to parse background message:", err);
    }
  };
}

function updateStatus(status) {
  connectionStatus = status;
  broadcastToPopup({ type: "status", payload: status });
}

function broadcastToPopup(message) {
  chrome.runtime.sendMessage(message).catch(() => {
    // Expected if popup is closed
  });
}

// --- Message Listeners from Popup ---

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 1. Popup requests initial state upon opening
  if (request.type === "get_state") {
    sendResponse({
      status: connectionStatus,
      devices: deviceList
    });
  }

  // 2. Popup sends outgoing text message
  if (request.type === "send_text") {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "message",
        payload: request.payload
      }));
      console.log("📤 Sent Text from background");
    }
  }

  // 3. Popup sends outgoing binary file
  if (request.type === "send_binary") {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(request.payload);
      console.log("📤 Sent Binary from background");
    }
  }
  
  return true; // Keep channel open for async response
});

// Start connection
connect();