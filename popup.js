/**
 * LAN Share - Chrome Extension
 * 
 * Handles real-time text and file sharing via WebSocket.
 * Connects to a Node.js server (ws library) on the local network.
 */

// --- Configuration ---
const SERVER_IP = "localhost"; // Change this to your local network IP (e.g., 192.168.1.5)
const SERVER_PORT = "3000";
const WS_URL = `ws://${SERVER_IP}:${SERVER_PORT}`;

// --- DOM Elements ---
const sendBtn = document.getElementById("send");
const pasteBtn = document.getElementById("paste");
const fileBtn = document.getElementById("fileButton");
const fileInput = document.getElementById("fileInput");
const fileNameLabel = document.getElementById("fileName");
const textArea = document.getElementById("text");
const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");

// --- WebSocket Initialization ---
let socket = null;

function connect() {
  socket = new WebSocket(WS_URL);
  socket.binaryType = "arraybuffer"; // Important for file transfers

  socket.onopen = () => {
    console.log("✅ Connected to LAN Share server");
    updateStatus("Connected", "connected");
  };

  socket.onclose = () => {
    console.log("❌ Disconnected from server");
    updateStatus("Not Connected", "");
    // Optional: Attempt reconnection after 3 seconds
    setTimeout(connect, 3000);
  };

  socket.onerror = (error) => {
    console.error("⚠️ WebSocket Error:", error);
    updateStatus("Error", "error");
  };

  socket.onmessage = handleIncomingMessage;
}

/**
 * Handle connection status UI updates
 */
function updateStatus(text, className) {
  statusText.textContent = text;
  statusDot.className = "status-dot " + className;
}

/**
 * Process incoming WebSocket messages (Text or Binary)
 */
async function handleIncomingMessage(event) {
  const { data } = event;

  // 1. Handle Text Data
  if (typeof data === "string") {
    console.log("📝 Received Text:", data);
    textArea.value = data;
    
    // Provide visual feedback
    textArea.classList.add("pulse");
    setTimeout(() => textArea.classList.remove("pulse"), 1000);

    // Auto-copy to clipboard
    copyToClipboard(data);
  } 
  // 2. Handle Binary Data (Files)
  else if (data instanceof ArrayBuffer) {
    console.log("📁 Received File Data", data.byteLength, "bytes");
    downloadFile(data, "shared_file_" + Date.now());
  }
}

/**
 * Send content via WebSocket
 */
function sendMessage() {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    alert("Connection not established!");
    return;
  }

  const file = fileInput.files[0];
  const text = textArea.value.trim();

  // Prioritize File Transfer if selected
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target.result;
      socket.send(buffer);
      console.log("📤 Sent File:", file.name);
      
      resetFileInput();
      showSuccessFeedback("File Sent!");
    };
    reader.readAsArrayBuffer(file);
  } 
  // Otherwise Send Text
  else if (text) {
    socket.send(text);
    console.log("📤 Sent Text:", text);
    showSuccessFeedback("Sent!");
    // textArea.value = ""; // Optional: clear after send
  }
}

/**
 * Utility: Trigger file download for binary data
 */
function downloadFile(data, defaultName) {
  const blob = new Blob([data]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = defaultName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showSuccessFeedback("File Received & Downloaded!");
}

/**
 * Utility: Copy text to clipboard
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log("📋 Auto-copied to clipboard");
  } catch (err) {
    console.error("Failed to copy:", err);
  }
}

/**
 * UI Feedback for Actions
 */
function showSuccessFeedback(msg) {
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

sendBtn.addEventListener("click", sendMessage);

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
    console.log("📎 File selected:", file.name);
  }
});

// Initialize connection
connect();