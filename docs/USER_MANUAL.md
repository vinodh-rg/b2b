# CrossDrop User Manual

**Cross-Platform File Sharing Extension**

## 1. Installation

### Server (Self-Hosted)
1.  Navigate to the `server/` directory.
2.  Run `npm install`.
3.  Start the server: `npm start`.
    *   For cloud deployment, see the [Developer Guide](DEVELOPER_GUIDE.md).

### Browser Extension
1.  Open Chrome/Edge and go to `chrome://extensions`.
2.  Enable **Developer Mode** (toggle in top right).
3.  Click **Load unpacked**.
4.  Select the `extension/` folder in this project.

## 2. Pairing Devices
To securely transfer files, devices must be paired first.

1.  Open the CrossDrop extension on **Device A**.
    *   Your unique **Device ID** and **QR Code** will be displayed.
2.  Open the extension on **Device B**.
3.  Click **Scan QR** and point the camera at Device A's QR code.
    *   Alternatively, manually enter Device A's ID.
4.  Click **Send Pair Request** (if manual).
5.  **Device A** will receive a prompt. Click **OK** to accept.
6.  Both devices are now trusted!

## 3. Sending Files
1.  Ensure both devices are online and the extension is open.
2.  In the **Send File** section:
    *   Click **Choose File** to select a file.
    *   Select the target device from the dropdown list.
        *   *Note: Only online devices will appear.*
    *   Click **Send**.
3.  The recipient device will automatically download the file once the transfer is complete.
