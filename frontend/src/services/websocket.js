// Real-time WebSocket Client for Police Department Command Center

let socket = null;
let reconnectTimer = null;
const listeners = new Set();

export function connectWebSocket(onMessage, onStatusChange) {
  if (onMessage) listeners.add(onMessage);

  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return () => {
      if (onMessage) listeners.delete(onMessage);
    };
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  function init() {
    try {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('[WS] Connected to Police Department Command Dispatch Engine');
        if (onStatusChange) onStatusChange('CONNECTED');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          listeners.forEach((listener) => listener(data));
        } catch (e) {
          console.error('[WS] Error parsing message:', e);
        }
      };

      socket.onclose = () => {
        console.log('[WS] Disconnected. Reconnecting in 3s...');
        if (onStatusChange) onStatusChange('DISCONNECTED');
        socket = null;
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(init, 3000);
      };

      socket.onerror = (err) => {
        console.warn('[WS] WebSocket error:', err);
        if (onStatusChange) onStatusChange('ERROR');
      };
    } catch (e) {
      console.error('[WS] Connection init error:', e);
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(init, 3000);
    }
  }

  init();

  return () => {
    if (onMessage) listeners.delete(onMessage);
  };
}

export function sendWebSocketMessage(data) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}
