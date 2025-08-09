# Kafka Integration for SecureWatch AI

This document explains how to integrate the Kafka backend with the SecureWatch AI frontend.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  WebSocket      │    │   Kafka         │
│   (React/Next)  │◄──►│   Server        │◄──►│   Backend       │
│                 │    │   (Port 8080)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Start the Kafka Backend

```bash
cd backend
docker-compose up -d
```

This will start:
- Zookeeper (port 2181)
- Kafka (port 9092)
- Multiple producers for different log types
- Consumer for processing logs

### 2. Start the WebSocket Server

```bash
cd backend
python websocket_server.py
```

This will start the WebSocket server on port 8080 that bridges Kafka messages to the frontend.

### 3. Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend will automatically connect to the WebSocket server and start receiving real-time logs.

## 📊 Kafka Topics

The system monitors the following Kafka topics:

- `cybersecurity_attacks` - Security attack logs
- `netflow` - Network flow data
- `device` - Device activity logs
- `hostevent` - Host system events
- `http` - HTTP request logs
- `logon` - Login/logout events
- `webserver` - Web server logs

## 🔧 Configuration

### WebSocket Server Configuration

The WebSocket server is configured in `websocket_server.py`:

```python
# Kafka connection settings
KAFKA_BOOTSTRAP = 'kafka:29092'  # Kafka broker address
TOPICS = ['cybersecurity_attacks', 'netflow', 'device', 'hostevent', 'http', 'logon', 'webserver']

# WebSocket settings
HOST = '0.0.0.0'  # Listen on all interfaces
PORT = 8080       # WebSocket port
```

### Frontend Configuration

The frontend Kafka service is configured in `frontend/lib/kafka-service.ts`:

```typescript
// WebSocket connection settings
private apiUrl = '/api/gemini'  // For API calls
private wsUrl = 'ws://localhost:8080/kafka'  // For WebSocket connection
```

## 🔄 Data Flow

### 1. Log Generation
- Producers read CSV files and send messages to Kafka topics
- Each message contains structured log data with metadata

### 2. Kafka Processing
- Consumer processes messages from all topics
- Messages are formatted and sent to WebSocket server

### 3. WebSocket Bridge
- WebSocket server receives Kafka messages
- Messages are forwarded to connected frontend clients

### 4. Frontend Processing
- Frontend receives messages via WebSocket
- Messages are converted to LogEntry format
- Threat detection is performed
- UI is updated in real-time

## 🛠️ Development

### Adding New Topics

1. Add the topic to `websocket_server.py`:
```python
self.topics = [
    'cybersecurity_attacks',
    'netflow', 
    'device',
    'hostevent',
    'http',
    'logon',
    'webserver',
    'new_topic'  # Add your new topic here
]
```

2. Create a new producer in the `producers/` directory
3. Update the docker-compose.yml if needed

### Modifying Log Processing

To modify how logs are processed:

1. Update `frontend/lib/kafka-service.ts` for message conversion
2. Update `frontend/lib/log-simulator.ts` for threat detection
3. Update `websocket_server.py` for message formatting

## 🔍 Monitoring

### Kafka Status

Check Kafka status:
```bash
docker-compose ps
```

### WebSocket Server Status

Check WebSocket server logs:
```bash
tail -f websocket_server.log
```

### Frontend Connection

The frontend displays Kafka connection status in the header:
- 🟢 "Kafka Connected" - Successfully connected
- 🔴 "Kafka Disconnected" - Connection failed

## 🐛 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check if WebSocket server is running on port 8080
   - Verify firewall settings
   - Check browser console for errors

2. **Kafka Connection Failed**
   - Ensure Kafka is running: `docker-compose ps`
   - Check Kafka logs: `docker-compose logs kafka`
   - Verify network connectivity

3. **No Logs Appearing**
   - Check if producers are running: `docker-compose logs producer-*`
   - Verify CSV files exist in `dataset/` directory
   - Check WebSocket server logs

### Debug Mode

Enable debug logging in `websocket_server.py`:
```python
logging.basicConfig(level=logging.DEBUG)
```

## 📈 Performance

### Optimization Tips

1. **Batch Processing**: Messages are processed in batches for better performance
2. **Connection Pooling**: WebSocket connections are reused
3. **Memory Management**: Old logs are automatically cleaned up
4. **Error Handling**: Robust error handling with automatic reconnection

### Scaling

To scale the system:

1. **Multiple WebSocket Servers**: Run multiple instances behind a load balancer
2. **Kafka Partitions**: Increase topic partitions for better throughput
3. **Frontend Clustering**: Use multiple frontend instances

## 🔒 Security

### Network Security

- WebSocket server listens on all interfaces (0.0.0.0)
- Consider using HTTPS/WSS for production
- Implement authentication if needed

### Data Security

- Log data is transmitted in plain text
- Consider encryption for sensitive data
- Implement access controls for Kafka topics

## 📝 API Reference

### WebSocket Messages

Messages are sent as JSON with the following structure:

```json
{
  "timestamp": "2024-01-01 12:00:00",
  "log_type": "cybersecurity_attacks",
  "topic": "cybersecurity_attacks",
  "batch_info": {
    "file_cycle": "1",
    "batch_number": "1",
    "record_in_batch": "1",
    "batch_size": "100"
  },
  "total_records_sent": "1",
  "data": {
    // Log-specific data
  }
}
```

### Frontend API

The frontend provides these functions:

```typescript
// Get real-time logs
const logs = getRealTimeLogs()

// Get real-time threats
const threats = getRealTimeThreats()

// Check Kafka connection
const connected = isKafkaConnected()
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. 