/**
 * LAN Share - Chrome Extension
 * 
 * Implements the JSON-based protocol for text sharing and device discovery.
 * Supports binary data for file transfers.
 */

// --- Configuration ---
const SERVER_IP = "localhost"; // Change this to your local network IP
const SERVER_PORT = "3000";
const WS_URL = `ws://${SERVER_IP}:${SERVER_PORT}`;

// --- DOM Elements ---
const sendBtn = document.getElementById("send");
const pasteBtn = document.getElementById("paste");
const fileBtn = document.getElementById("fileButton");
const fileInput = document.getElementById("fileInput");
const fileNameLabel = document.getElementById("fileName");
const textArea = document.getElementById("text");
const deviceDropdown = document.getElementById("devices");
const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");

// --- WebSocket Initialization ---
let socket = null;

function connect() {
  socket = new WebSocket(WS_URL);
  socket.binaryType = "arraybuffer"; // Support binary file transfers

  socket.onopen = () => {
    console.log("✅ WebSocket Connected");
    updateStatus("Connected", "connected");
  };

  socket.onclose = () => {
    console.log("❌ WebSocket Disconnected");
    updateStatus("Not Connected", "");
    setTimeout(connect, 3000); // Reconnect logic
  };

  socket.onerror = (error) => {
    console.error("⚠️ WebSocket Error:", error);
    updateStatus("Error", "error");
  };

  socket.onmessage = handleIncomingMessage;
}

/**
 * Handle incoming messages based on the protocol
 */
async function handleIncomingMessage(event) {
  const { data } = event;

  // 1. Handle Binary Data (Files)
  if (data instanceof ArrayBuffer) {
    console.log("📁 Received Binary Data");
    downloadFile(data, `shared_file_${Date.now()}`);
    return;
  }

  // 2. Handle JSON Data (Text/Devices)
  try {
    const message = JSON.parse(data);
    
    switch (message.type) {
      case "devices":
        updateDeviceList(message.payload);
        break;
      
      case "message":
        handleTextMessage(message.payload);
        break;
      
      default:
        console.warn("❓ Unknown message type:", message.type);
    }
  } catch (err) {
    console.error("❌ Failed to parse message:", err);
  }
}

/**
 * Update the device dropdown menu
 */
function updateDeviceList(deviceIds) {
  console.log("📱 Updating Device List:", deviceIds);
  
  // Clear existing options
  deviceDropdown.innerHTML = "";
  
  // Add default option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select Destination (Currently Broadcast)";
  deviceDropdown.appendChild(defaultOption);

  // Populate with new devices (avoiding duplicates if server didn't already)
  const uniqueDevices = [...new Set(deviceIds)];
  uniqueDevices.forEach(id => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = id;
    deviceDropdown.appendChild(option);
  });
}

/**
 * Handle incoming text messages
 */
function handleTextMessage(text) {
  console.log("📝 Received Message:", text);
  textArea.value = text;
  
  // Auto-copy to clipboard
  copyToClipboard(text);
  
  // Visual feedback
  textArea.style.borderColor = "var(--success-color)";
  setTimeout(() => textArea.style.borderColor = "", 1000);
}

/**
 * Send content via WebSocket
 */
function sendContent() {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    alert("Connection not established!");
    return;
  }

  const file = fileInput.files[0];
  const text = textArea.value.trim();

  // 1. Send File (Priority)
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      socket.send(e.target.result);
      console.log("📤 Sent Binary File:", file.name);
      resetFileInput();
      showActionFeedback("File Sent!");
    };
    reader.readAsArrayBuffer(file);
    return;
  }

  // 2. Send Text
  if (text) {
    const payload = JSON.stringify({
      type: "message",
      payload: text
    });
    socket.send(payload);
    console.log("📤 Sent Text Message");
    showActionFeedback("Sent!");
  }
}

/**
 * Trigger file download
 */
function downloadFile(data, name) {
  const blob = new Blob([data]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showActionFeedback("Received File!");
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log("📋 Auto-copied to clipboard");
  } catch (err) {
    console.error("Failed to copy:", err);
  }
}

// --- UI Utilities ---

function updateStatus(text, className) {
  statusText.textContent = text;
  statusDot.className = "status-dot " + className;
}

function showActionFeedback(msg) {
  const originalText = sendBtn.innerHTML;
  sendBtn.textContent = msg;
  sendBtn.style.backgroundColor = "var(--success-color)";
  setTimeout(() => {
    sendBtn.innerHTML = originalText;
    sendBtn.style.backgroundColor = "";
  }, 2000);
}

function resetFileInput() {
  fileInput.value = "";
  fileNameLabel.textContent = "";
}

// --- Event Listeners ---

sendBtn.addEventListener("click", sendContent);

pasteBtn.addEventListener("click", async () => {
  try {
    const text = await navigator.clipboard.readText();
    textArea.value = text;
    textArea.focus();
  } catch (err) {
    console.error("Failed to read clipboard:", err);
  }
});

fileBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    fileNameLabel.textContent = file.name;
  }
});

// Initialize
connect();