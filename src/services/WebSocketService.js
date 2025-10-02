class WebSocketService {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.connected = false;
    this.reconnectInterval = 5000;
    this.messageHandlers = [];
    this.connect();
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.connected = true;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.messageHandlers.forEach(handler => handler(data));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.connected = false;
        
        // Attempt to reconnect
        setTimeout(() => {
          if (!this.connected) {
            this.connect();
          }
        }, this.reconnectInterval);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }

  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  subscribe(type) {
    if (this.connected && this.ws) {
      this.ws.send(JSON.stringify({
        type: `subscribe_${type}`
      }));
    }
  }

  send(data) {
    if (this.connected && this.ws) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }
}

export default WebSocketService;