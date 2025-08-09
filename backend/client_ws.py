import asyncio
import websockets
import json

async def test_client():
    uri = "ws://localhost:8080"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to WebSocket server")
            
            async for message in websocket:
                data = json.loads(message)
                print(f"Received: {json.dumps(data, indent=2)}")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_client())
