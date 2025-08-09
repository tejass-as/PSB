import asyncio
import websockets
import json
import logging
from kafka import KafkaConsumer
import os
from datetime import datetime

# Configure loggingx
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class KafkaWebSocketBridge:
    def __init__(self):
        self.clients = set()
        self.kafka_consumer = None
        self.topics = [
            'cybersecurity_attacks',
            'netflow', 
            'device',
            'hostevent',
            'http',
            'logon',
            'webserver'
        ]
        self.init_kafka_consumer()

    def init_kafka_consumer(self):
        """Initialize Kafka consumer"""
        try:
            self.kafka_consumer = KafkaConsumer(
                *self.topics,
                bootstrap_servers=[os.getenv('KAFKA_BOOTSTRAP', 'kafka:29092')],
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                auto_offset_reset='latest',
                group_id='websocket_consumer_group',
                enable_auto_commit=True
            )
            logger.info("Successfully connected to Kafka")
        except Exception as e:
            logger.error(f"Failed to connect to Kafka: {e}")
            self.kafka_consumer = None

    async def register(self, websocket):
        """Register a new WebSocket client"""
        self.clients.add(websocket)
        logger.info(f"New client connected. Total clients: {len(self.clients)}")

    async def unregister(self, websocket):
        """Unregister a WebSocket client"""
        self.clients.remove(websocket)
        logger.info(f"Client disconnected. Total clients: {len(self.clients)}")

    async def send_to_clients(self, message):
        """Send message to all connected clients"""
        if self.clients:
            # Convert message to JSON string
            message_str = json.dumps(message)
            # Create tasks for all clients
            tasks = [client.send(message_str) for client in self.clients.copy()]
            # Send to all clients concurrently
            await asyncio.gather(*tasks, return_exceptions=True)

    async def kafka_consumer_task(self):
        """Task to consume Kafka messages and send to WebSocket clients"""
        if not self.kafka_consumer:
            logger.error("Kafka consumer not initialized")
            return

        try:
            for message in self.kafka_consumer:
                try:
                    value = message.value
                    # Send the Kafka message to all WebSocket clients
                    await self.send_to_clients(value)
                    logger.debug(f"Sent message to {len(self.clients)} clients")
                except Exception as e:
                    logger.error(f"Error processing Kafka message: {e}")
        except Exception as e:
            logger.error(f"Kafka consumer error: {e}")

    async def handler(self, websocket):
        """WebSocket connection handler"""
        await self.register(websocket)
        try:
            # Keep the connection alive
            async for message in websocket:
                # Handle any incoming messages from clients if needed
                logger.debug(f"Received message from client: {message}")
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            await self.unregister(websocket)

async def main():
    """Main function to start the WebSocket server"""
    bridge = KafkaWebSocketBridge()
    
    # Start the WebSocket server
    server = await websockets.serve(
        bridge.handler,
        "0.0.0.0",  # Listen on all interfaces
        8080,       # Port 8080
        ping_interval=20,
        ping_timeout=20
    )
    
    logger.info("WebSocket server started on ws://0.0.0.0:8080")
    
    # Start the Kafka consumer task
    kafka_task = asyncio.create_task(bridge.kafka_consumer_task())
    
    try:
        # Keep the server running
        await asyncio.gather(server.wait_closed(), kafka_task)
    except KeyboardInterrupt:
        logger.info("Shutting down WebSocket server...")
        if bridge.kafka_consumer:
            bridge.kafka_consumer.close()

if __name__ == "__main__":
    asyncio.run(main()) 