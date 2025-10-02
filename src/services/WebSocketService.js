class WebSocketService {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.connected = false;
    this.reconnectInterval = 5000;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.messageHandlers = [];
    this.shouldConnect = true;
    this.connect();
  }

  connect() {
    if (!this.shouldConnect) return;
    
    try {
      // Clean up existing connection
      if (this.ws) {
        this.ws.close();
      }

      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.connected = true;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.messageHandlers.forEach(handler => {
            try {
              handler(data);
            } catch (error) {
              console.error('Error in message handler:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.connected = false;
        
        // Attempt to reconnect with exponential backoff
        if (this.shouldConnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
          setTimeout(() => {
            if (this.shouldConnect) {
              console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
              this.connect();
            }
          }, delay);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connected = false;
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
    this.shouldConnect = false;
    this.connected = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default WebSocketService;