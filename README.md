# WebSocket Test Viewer

## Run it

1. Open a terminal in this folder.
2. Install the WebSocket dependency:

   ```bash
   npm install
   ```

3. Start the HTTP and WebSocket server:

   ```bash
   npm start
   ```

4. Open [http://localhost:8080](http://localhost:8080) in your browser.

Do not open `index.html` directly as a `file://` URL. Eaglecraft's bundled worker and browser security checks require it to be served over HTTP.

The dashboard connects to `ws://localhost:8080`. The server sends an initial test message, and any message received from a WebSocket client is broadcast to all connected dashboards.

The copied Eaglecraft client uses three allowlisted `wss://` relays for multiplayer. The local server now provides a raw WebSocket proxy for those relays, which can help when a school network blocks direct connections to the relay hostnames. In Eaglecraft's relay screen, the green check beside a relay marks the selected **primary** relay; the connection result is shown separately on the right. A red cross there means the Eaglecraft relay-protocol connection timed out or failed.

After updating this file, hard-refresh the page. If the relay screen still shows the original direct `wss://relay...` addresses, open the boot menu and choose the option to reset servers and relays, or clear this site's storage in the browser. Eaglecraft saves the old relay list locally and may otherwise ignore the new proxy addresses.

The local WebSocket endpoint is only a basic WebSocket test server, while `/relay` forwards Eaglecraft's binary frames to an allowlisted public relay. It is not itself an Eaglecraft relay and cannot replace the public relay service. A basic WebSocket handshake succeeding is not enough to prove that Eaglecraft can use a relay: the client must also complete Eaglecraft's relay protocol, which is why the browser's relay status is the authoritative result.

Stop the server with `Ctrl+C`.