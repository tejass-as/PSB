import asyncio
import websockets
import json
import logging
from kafka import KafkaConsumer
import os
from datetime import datetime
import threading
from queue import Queue
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class KafkaWebSocketBridge:
    def __init__(self):
        self.clients = set()
        self.kafka_consumer = None
        self.message_queue = Queue()
        self.topics = ['processedlogs']
        self.running = True
        self.kafka_thread = None
        
        # Initialize Kafka consumer
        self.init_kafka_consumer()

    def init_kafka_consumer(self):
        """Initialize Kafka consumer with proper configuration"""
        try:
            # ✅ FIXED: Use localhost:9092 for host machine (not Docker internal)
            bootstrap_server = os.getenv('KAFKA_BOOTSTRAP', 'localhost:9092')
            
            self.kafka_consumer = KafkaConsumer(
                *self.topics,
                bootstrap_servers=[bootstrap_server],
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                auto_offset_reset='latest',  # Only get new messages
                group_id='websocket_bridge_consumer',
                enable_auto_commit=True,
                auto_commit_interval_ms=1000,
                # Optimize for real-time processing
                fetch_min_bytes=1,
                fetch_max_wait_ms=100,
                max_poll_records=10,
                consumer_timeout_ms=1000  # Non-blocking timeout
            )
            logger.info(f"✅ Successfully connected to Kafka at {bootstrap_server}")
            logger.info(f"📡 Monitoring topics: {self.topics}")
            
        except Exception as e:
            logger.error(f"❌ Failed to connect to Kafka: {e}")
            self.kafka_consumer = None

    def kafka_consumer_worker(self):
        """Background thread worker for Kafka consumption"""
        logger.info("🔄 Starting Kafka consumer worker thread")
        
        while self.running and self.kafka_consumer:
            try:
                # ✅ FIXED: Use poll() instead of iterator for non-blocking consumption
                message_batch = self.kafka_consumer.poll(timeout_ms=1000)
                
                for topic_partition, messages in message_batch.items():
                    for message in messages:
                        try:
                            # ✅ ENHANCED: Add metadata to the message
                            enhanced_message = {
                                "kafka_metadata": {
                                    "topic": message.topic,
                                    "partition": message.partition,
                                    "offset": message.offset,
                                    "timestamp": message.timestamp,
                                    "received_at": datetime.now().isoformat()
                                },
                                "data": message.value
                            }
                            
                            # Put message in queue for async processing
                            self.message_queue.put(enhanced_message)
                            logger.debug(f"📥 Queued message from {message.topic}")
                            
                        except Exception as e:
                            logger.error(f"❌ Error processing message: {e}")
                
                # Small sleep to prevent CPU spinning
                time.sleep(0.01)
                
            except Exception as e:
                logger.error(f"❌ Kafka polling error: {e}")
                time.sleep(1)  # Wait before retrying
        
        logger.info("🛑 Kafka consumer worker stopped")

    async def register(self, websocket, path=None):
        """Register a new WebSocket client"""
        self.clients.add(websocket)
        client_info = f"{websocket.remote_address[0]}:{websocket.remote_address[1]}"
        logger.info(f"🔗 New client connected from {client_info}. Total clients: {len(self.clients)}")
        
        # Send welcome message
        welcome_msg = {
            "type": "connection_established",
            "message": "Connected to Kafka-WebSocket bridge",
            "topics": self.topics,
            "timestamp": datetime.now().isoformat()
        }
        await websocket.send(json.dumps(welcome_msg))

    async def unregister(self, websocket):
        """Unregister a WebSocket client"""
        if websocket in self.clients:
            self.clients.discard(websocket)
            logger.info(f"🔌 Client disconnected. Total clients: {len(self.clients)}")

    async def send_to_clients(self, message):
        """Send message to all connected WebSocket clients"""
        if not self.clients:
            return
        
        try:
            # Convert message to JSON string if it's not already
            if isinstance(message, dict):
                message_str = json.dumps(message, separators=(',', ':'))
            else:
                message_str = str(message)
            
            # ✅ FIXED: Handle client disconnections gracefully
            disconnected_clients = set()
            
            for client in self.clients.copy():
                try:
                    await client.send(message_str)
                except websockets.exceptions.ConnectionClosed:
                    disconnected_clients.add(client)
                except Exception as e:
                    logger.error(f"❌ Error sending to client: {e}")
                    disconnected_clients.add(client)
            
            # Remove disconnected clients
            for client in disconnected_clients:
                await self.unregister(client)
            
            logger.debug(f"📤 Sent message to {len(self.clients)} clients")
            
        except Exception as e:
            logger.error(f"❌ Error in send_to_clients: {e}")

    async def message_processor_task(self):
        """Async task to process queued Kafka messages"""
        logger.info("🚀 Starting message processor task")
        
        while self.running:
            try:
                # Check for messages in queue (non-blocking)
                if not self.message_queue.empty():
                    message = self.message_queue.get_nowait()
                    await self.send_to_clients(message)
                else:
                    # Small delay to prevent CPU spinning
                    await asyncio.sleep(0.01)
                    
            except Exception as e:
                logger.error(f"❌ Error in message processor: {e}")
                await asyncio.sleep(0.1)
        
        logger.info("🛑 Message processor task stopped")

    async def handler(self, websocket, path=None):
        """WebSocket connection handler"""
        try:
            await self.register(websocket, path)
            
            # Keep connection alive and handle incoming messages
            async for message in websocket:
                try:
                    # Handle any client messages (optional)
                    client_data = json.loads(message)
                    logger.debug(f"📨 Received from client: {client_data}")
                    
                    # You can add client message handling here
                    if client_data.get("type") == "ping":
                        await websocket.send(json.dumps({"type": "pong", "timestamp": datetime.now().isoformat()}))
                        
                except json.JSONDecodeError:
                    logger.warning(f"⚠️  Invalid JSON from client: {message}")
                except Exception as e:
                    logger.error(f"❌ Error handling client message: {e}")
                    
        except websockets.exceptions.ConnectionClosed:
            logger.info("🔌 Client connection closed normally")
        except Exception as e:
            logger.error(f"❌ WebSocket handler error: {e}")
        finally:
            await self.unregister(websocket)

    def start_kafka_thread(self):
        """Start the Kafka consumer in a separate thread"""
        if self.kafka_consumer:
            self.kafka_thread = threading.Thread(
                target=self.kafka_consumer_worker,
                daemon=True,
                name="KafkaConsumerWorker"
            )
            self.kafka_thread.start()
            logger.info("🧵 Kafka consumer thread started")
        else:
            logger.error("❌ Cannot start Kafka thread - consumer not initialized")

    def stop(self):
        """Stop all components"""
        logger.info("🛑 Stopping Kafka-WebSocket bridge...")
        self.running = False
        
        if self.kafka_consumer:
            try:
                self.kafka_consumer.close()
            except Exception as e:
                logger.error(f"❌ Error closing Kafka consumer: {e}")
        
        if self.kafka_thread and self.kafka_thread.is_alive():
            self.kafka_thread.join(timeout=5)

async def main():
    """Main function to start the WebSocket server"""
    logger.info("🚀 Starting Kafka-WebSocket Bridge Server")
    
    # Create bridge instance
    bridge = KafkaWebSocketBridge()
    
    if not bridge.kafka_consumer:
        logger.error("❌ Failed to initialize Kafka consumer. Exiting.")
        return
    
    # Start Kafka consumer thread
    bridge.start_kafka_thread()
    
    # Start WebSocket server
    try:
        server = await websockets.serve(
            bridge.handler,
            "0.0.0.0",  # Listen on all interfaces
            8080,       # Port 8080
            ping_interval=20,
            ping_timeout=20,
            max_size=1048576,  # 1MB max message size
            compression=None   # Disable compression for speed
        )
        
        logger.info("🌐 WebSocket server started on ws://0.0.0.0:8080")
        logger.info("📡 Bridge is ready to forward Kafka messages to WebSocket clients")
        logger.info("🔴 Press Ctrl+C to stop")
        
        # Start message processor task
        processor_task = asyncio.create_task(bridge.message_processor_task())
        
        # Keep server running
        await asyncio.gather(
            server.wait_closed(),
            processor_task
        )
        
    except KeyboardInterrupt:
        logger.info("🛑 Shutting down server...")
    except Exception as e:
        logger.error(f"❌ Server error: {e}")
    finally:
        bridge.stop()
        logger.info("✅ Shutdown complete")

if __name__ == "__main__":
    asyncio.run(main())
