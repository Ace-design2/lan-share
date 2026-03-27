const sendBtn = document.getElementById("send");
const pasteBtn = document.getElementById("paste");
const textArea = document.getElementById("text");
const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");

// Mock connection status
setTimeout(() => {
  statusDot.classList.add("connected");
  statusText.textContent = "Connected";
}, 1000);

sendBtn.addEventListener("click", () => {
  const text = textArea.value;
  if (!text.trim()) return;

  console.log("Sending:", text);
  
  // Visual feedback
  const originalContent = sendBtn.innerHTML;
  sendBtn.textContent = "Sent!";
  sendBtn.style.backgroundColor = "var(--success-color)";
  
  setTimeout(() => {
    sendBtn.innerHTML = originalContent;
    sendBtn.style.backgroundColor = "";
    textArea.value = "";
  }, 1500);
});

pasteBtn.addEventListener("click", async () => {
  try {
    const text = await navigator.clipboard.readText();
    textArea.value = text;
    textArea.focus();
  } catch (err) {
    console.error("Failed to read clipboard:", err);
  }
});