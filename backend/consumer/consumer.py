import json
import time
from kafka import KafkaConsumer
from datetime import datetime
import logging
import os

class LogConsumer:
    def __init__(self):
        self.topics = [
            'cybersecurity_attacks',
            'netflow', 
            'device',
            'hostevent',
            'http',
            'logon',
            'webserver'
        ]
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - CONSUMER - %(levelname)s - %(message)s'
        )
        
        self.logger = logging.getLogger(__name__)
        self.consumer = None
        self.init_kafka_consumer()
        self.message_counts = {topic: 0 for topic in self.topics}
        self.batch_counts = {topic: 0 for topic in self.topics}

    def init_kafka_consumer(self):
        max_retries = 12
        for attempt in range(1, max_retries + 1):
            try:
                self.consumer = KafkaConsumer(
                    *self.topics,
                    bootstrap_servers=[os.getenv('KAFKA_BOOTSTRAP', 'kafka:29092')],
                    value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                    auto_offset_reset='earliest',
                    group_id='log_consumer_group',
                    enable_auto_commit=True
                )
                self.logger.info("Successfully connected to Kafka")
                return
            except Exception as e:
                self.logger.warning(f"Failed to connect to Kafka (attempt {attempt}/{max_retries}): {e}")
                time.sleep(5)
        
        raise Exception("Failed to connect to Kafka after maximum retries")

    def format_json_message(self, message):
        """Format message as JSON with log type indication"""
        try:
            timestamp = datetime.fromtimestamp(message['timestamp']).strftime('%Y-%m-%d %H:%M:%S')
            log_type = message.get('log_type', 'unknown').upper()
            
            # Create clean JSON output
            output_data = {
                'timestamp': timestamp,
                'log_type': log_type,
                'topic': message.get('topic', 'unknown'),
                'batch_info': {
                    'file_cycle': message.get('file_cycle', 'N/A'),
                    'batch_number': message.get('batch_number', 'N/A'),
                    'record_in_batch': message.get('record_in_batch', 'N/A'),
                    'batch_size': message.get('batch_size', 'N/A')
                },
                'total_records_sent': message.get('total_records_sent', 'N/A'),
                'data': message.get('data', {})
            }
            
            return f"[{log_type} LOG] {json.dumps(output_data, indent=2, default=str)}"
            
        except Exception as e:
            return f"❌ Error formatting message: {e}"

    def run(self):
        self.logger.info("Starting JSON log consumer...")
        print("\n" + "="*130)
        print("🚀 KAFKA REAL-TIME LOG STREAM CONSUMER - JSON Format Output")
        print("="*130)
        print("📊 Monitoring Topics: " + ", ".join(self.topics))
        print("🔄 Processing individual messages with JSON format output")
        print("📈 Reading from earliest available messages")
        print("="*130 + "\n")
        
        try:
            for msg in self.consumer:
                try:
                    value = msg.value
                    topic = value.get('topic', 'unknown')
                    log_type = value.get('log_type', 'unknown')
                    
                    if topic in self.message_counts:
                        self.message_counts[topic] += 1
                    
                    # Track batch numbers
                    batch_num = value.get('batch_number', 0)
                    if batch_num > self.batch_counts[topic]:
                        self.batch_counts[topic] = batch_num
                    
                    # Display JSON formatted log with log type indication
                    formatted_log = self.format_json_message(value)
                    print(formatted_log)
                    print("-" * 80)  # Separator between messages
                    
                    # Print statistics every 10 messages for better visibility
                    total_messages = sum(self.message_counts.values())
                    if total_messages % 10 == 0:
                        print("=" * 130)
                        print(f"📈 Messages: {dict(self.message_counts)} | Batches: {dict(self.batch_counts)} | Total: {total_messages}")
                        print("=" * 130)
                    
                except Exception as e:
                    self.logger.error(f"Error processing message: {e}")
                    
        except KeyboardInterrupt:
            self.logger.info("Shutting down consumer...")
            print(f"\n🛑 Final Stats - Messages: {dict(self.message_counts)} | Batches: {dict(self.batch_counts)} | Total: {sum(self.message_counts.values())}")
        finally:
            try:
                if self.consumer:
                    self.consumer.close()
            except Exception:
                pass

if __name__ == "__main__":
    LogConsumer().run()
