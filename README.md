# LAN Share - Chrome Extension

A cross-platform clipboard sharing tool that works over your local network.

## Features

- **Text Sharing**: Instantly copy text from one device and paste it on another.
- **File Transfer**: Send files of any size directly to your other devices.
- **Auto-Sync**: Incoming text is automatically copied to your clipboard.
- **Device Discovery**: Automatically detects and lists all connected devices on the network.

## Prerequisites

- **Node.js** (v14 or higher)
- **Python 3** (for the server)
- **Chrome Browser**

## Installation

### 1. Install the Python Server

Open your terminal and run:

```bash
pip install websockets
```

### 2. Start the Server

Navigate to the server directory and run:

```bash
python server.py
```

### 3. Install the Chrome Extension

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the `lan-share-extension` folder.

## Usage

1. Open the extension popup on your sending device.
2. Select the destination device from the dropdown (or leave as default for broadcast).
3. Type or paste your text, or attach a file.
4. Click **Send**.
5. The content will appear on the receiving device and be automatically copied to its clipboard.

## Configuration

If your server is running on a different IP address, update the `SERVER_IP` constant in both `popup.js` and `background.js`:

```javascript
const SERVER_IP = "[IP_ADDRESS]"; // Change this to your server's IP
```
