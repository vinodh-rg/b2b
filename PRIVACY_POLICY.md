# Privacy Policy for CrossDrop

**Last Updated:** [Date]

**CrossDrop** ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how our browser extension and associated services handle your data.

## 1. Data Collection and Usage

**We do not collect, store, or share any personal data.**

*   **File Transfer:** All file transfers occur directly between peers using WebRTC DataChannels. Files never pass through our servers, and we do not have access to them.
*   **Signaling:** Our signaling server facilitates the initial connection between devices (exchange of IP addresses and session descriptions). This data is transient and not stored persistently.
*   **Local Storage:** The extension stores your generated Device ID and list of Trusted Devices locally on your machine. This data never leaves your device except during the pairing handshake.

## 2. Permissions

The extension requires the following permissions to function:

*   **`storage`**: To save your Device ID and Trusted Devices list locally.
*   **`activeTab`**: To allow the extension popup to interact with the current tab if necessary (primary use is within the popup itself).
*   **`camera`** (Optional): Accessed only when you explicitly click "Scan QR" to pair a device. Video data is processed locally and not sent to any server.

## 3. Third-Party Services

*   **Hosting:** The signaling server may be hosted on third-party cloud providers (e.g., Render, Railway). Please refer to their privacy policies regarding server logs.

## 4. Changes to This Policy

We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.

## 5. Contact Us

If you have any questions about this Privacy Policy, please contact us at [Your Email/GitHub Issues].
