import json
import time
import random
import logging
import os
import csv
from kafka import KafkaProducer
from abc import ABC

class BaseProducer(ABC):
    def __init__(self, topic_name, csv_file_path, batch_size=100, message_sleep_range=(2, 5), start_at_line=0):
        self.topic_name = topic_name
        self.csv_file_path = csv_file_path
        self.batch_size = int(batch_size)
        self.message_sleep_range = message_sleep_range  # Changed from batch_sleep_range
        self.start_at_line = max(0, int(start_at_line))
        
        logging.basicConfig(
            level=logging.INFO,
            format=f'%(asctime)s - {topic_name} - %(levelname)s - %(message)s'
        )
        
        self.logger = logging.getLogger(__name__)
        self.producer = None
        self.init_kafka_producer()
        self.total_batches_processed = 0
        self.total_records_sent = 0
        self.file_cycles = 0
        self.logger.info(f"Initialized for topic={topic_name}, batch_size={self.batch_size}, message_sleep_range={self.message_sleep_range}s")

    def init_kafka_producer(self):
        max_retries = 12
        for attempt in range(1, max_retries + 1):
            try:
                self.producer = KafkaProducer(
                    bootstrap_servers=['kafka:29092'],
                    value_serializer=lambda x: json.dumps(x, default=str).encode('utf-8'),
                    retries=5,
                    retry_backoff_ms=1000,
                    acks='all',
                    batch_size=16384,
                    linger_ms=10
                )
                self.logger.info("Successfully connected to Kafka")
                return
            except Exception as e:
                self.logger.warning(f"Kafka connection failed (attempt {attempt}/{max_retries}): {e}")
                time.sleep(5)
        raise Exception("Failed to connect to Kafka after maximum retries")

    def read_batch(self, file_handle, reader, batch_size):
        """Read a batch of records from CSV reader"""
        batch = []
        try:
            for _ in range(batch_size):
                row = next(reader)
                # Clean and convert all values to strings
                record = {k: ('' if v is None else str(v).strip()) for k, v in row.items()}
                batch.append(record)
        except StopIteration:
            # End of file reached
            pass
        return batch

    def send_message_to_kafka(self, record, record_index, batch_number, batch_size):
        """Send individual message to Kafka with log_type field"""
        try:
            payload = {
                'timestamp': time.time(),
                'log_type': self.topic_name,  # Added log_type field
                'topic': self.topic_name,
                'batch_number': batch_number,
                'record_in_batch': record_index + 1,
                'batch_size': batch_size,
                'total_records_sent': self.total_records_sent + 1,
                'file_cycle': self.file_cycles + 1,
                'data': record
            }
            
            future = self.producer.send(self.topic_name, payload)
            future.get(timeout=30)  # Wait for acknowledgment
            return True
        except Exception as e:
            self.logger.error(f"Failed to send record: {e}")
            return False

    def run(self):
        self.logger.info(f"Starting CONTINUOUS individual message producer for {self.topic_name}")
        self.logger.info(f"Reading from: {self.csv_file_path}")
        self.logger.info("🔄 Running in continuous mode - sending individual messages with 2-5s intervals")
        
        try:
            while True:  # CONTINUOUS LOOP
                self.file_cycles += 1
                self.logger.info(f"🔄 Starting file cycle {self.file_cycles} for {self.topic_name}")
                
                with open(self.csv_file_path, mode='r', newline='', encoding='utf-8', buffering=1024*1024) as f:
                    reader = csv.DictReader(f)
                    
                    # Skip initial lines if requested
                    skipped = 0
                    while skipped < self.start_at_line:
                        try:
                            next(reader)
                            skipped += 1
                        except StopIteration:
                            self.logger.info("Reached end of file while skipping lines")
                            break
                    
                    # Process file in batches but send individual messages
                    file_batches_processed = 0
                    while True:
                        batch = self.read_batch(f, reader, self.batch_size)
                        if not batch:
                            self.logger.info(f"📄 Completed file cycle {self.file_cycles} - processed {file_batches_processed} batches")
                            self.logger.info("🔄 Restarting from beginning to simulate continuous log generation...")
                            break
                        
                        self.total_batches_processed += 1
                        file_batches_processed += 1
                        batch_number = self.total_batches_processed
                        
                        self.logger.info(f"Processing batch {batch_number} with {len(batch)} records [Cycle {self.file_cycles}]")
                        
                        # Send each record individually with interval
                        successful_sends = 0
                        for i, record in enumerate(batch):
                            if self.send_message_to_kafka(record, i, batch_number, len(batch)):
                                successful_sends += 1
                                self.total_records_sent += 1
                                self.logger.info(f"✅ Sent message {self.total_records_sent} ({self.topic_name})")
                            
                            # Sleep between individual messages (2-5 seconds)
                            if i < len(batch) - 1:  # Don't sleep after last message in batch
                                sleep_time = random.uniform(*self.message_sleep_range)
                                self.logger.info(f"😴 Sleeping {sleep_time:.1f}s before next message...")
                                time.sleep(sleep_time)
                        
                        self.logger.info(f"Batch {batch_number} completed: {successful_sends}/{len(batch)} records sent")
                        self.logger.info(f"📊 Total progress: {self.total_records_sent} records, {self.total_batches_processed} batches, {self.file_cycles} cycles")
                
                # Small pause before restarting file cycle
                cycle_pause = random.uniform(2, 5)
                self.logger.info(f"⏸️ End of file cycle {self.file_cycles}. Pausing {cycle_pause:.1f}s before restart...")
                time.sleep(cycle_pause)
                
        except KeyboardInterrupt:
            self.logger.info("Received interrupt signal, shutting down gracefully...")
        except Exception as e:
            self.logger.error(f"Unexpected error: {e}")
        finally:
            try:
                if self.producer:
                    self.producer.flush(timeout=60)
                    self.producer.close()
            except Exception as e:
                self.logger.error(f"Error closing producer: {e}")
            
            self.logger.info(f"Producer shutdown complete. Final stats: {self.total_records_sent} records, {self.total_batches_processed} batches, {self.file_cycles} cycles")
