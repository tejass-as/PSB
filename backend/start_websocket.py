#!/usr/bin/env python3
"""
WebSocket server for bridging Kafka messages to the frontend
"""

import asyncio
import websockets
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - WEBSOCKET - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Import the KafkaWebSocketBridge class
from websocket_server import KafkaWebSocketBridge

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