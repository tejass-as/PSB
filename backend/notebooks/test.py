import json
import os
from kafka import KafkaConsumer
from datetime import datetime
import sys


def main():
    print("🚀 SIMPLE PERSISTENT KAFKA CONSUMER")
    
    # Create consumer without timeout (will block forever)
    # ✅ UPDATED: Added 'processedlogs' topic
    consumer = KafkaConsumer(
        'processedlogs',
        bootstrap_servers=[os.getenv('KAFKA_BOOTSTRAP', 'localhost:9092')],
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
        group_id='simple_persistent_consumer',
        auto_offset_reset='latest'
        # ✅ NO consumer_timeout_ms = runs forever
    )
    
    print("⏰ Waiting for messages forever... Press Ctrl+C to stop")
    print("📡 Monitoring topics: netflow, webserver, hostevent, processedlogs\n")
    
    count = 0
    try:
        # This loop will run FOREVER until Ctrl+C
        for message in consumer:
            count += 1
            timestamp = datetime.now().strftime('%H:%M:%S.%f')[:-3]
            topic = message.topic.upper()
            
            print(f"[{timestamp}] #{count} {topic}: {json.dumps(message.value, separators=(',', ':'))}")
            sys.stdout.flush()
            
    except KeyboardInterrupt:
        print(f"\n🛑 Stopped. Processed {count} messages.")
    finally:
        consumer.close()


if __name__ == "__main__":
    main()
