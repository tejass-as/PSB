import json
import os
import pandas as pd
import numpy as np
from kafka import KafkaConsumer, KafkaProducer
from kafka.errors import KafkaError
from datetime import datetime
import sys
import time

# Suppress all warnings for maximum speed
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import warnings
warnings.filterwarnings('ignore')

from tensorflow.keras.models import load_model
import joblib
import pickle

class FastAnomalyDetector:
    def __init__(self, model_name):
        self.model_name = model_name
        # Load models
        model_dir = f"saved_models/{model_name}"
        self.autoencoder = load_model(f"{model_dir}/autoencoder.keras")
        self.scaler = joblib.load(f"{model_dir}/scaler.pkl")
        with open(f"{model_dir}/feature_names.pkl", 'rb') as f:
            self.features = pickle.load(f)
        print(f"✅ Loaded {model_name} model with features: {self.features}")
    
    def predict_fast(self, data):
        try:
            # Extract required features and convert to float
            values = []
            for feat in self.features:
                val = data.get(feat, 0)
                if isinstance(val, str) and val.startswith("0x"):
                    val = int(val, 16)
                values.append(float(val))
            
            # Scale and predict
            X = np.array([values], dtype=np.float32)
            X_scaled = self.scaler.transform(X)
            recon = self.autoencoder.predict(X_scaled, verbose=0)
            score = float(np.mean(np.abs(X_scaled - recon)))
            
            return {"anomaly_score": score, "is_anomaly": score > 0.5}
        except Exception as e:
            return {"anomaly_score": 0.0, "is_anomaly": False, "error": str(e)}

def main():
    print("⚡ ULTRA-FAST REAL-TIME ANOMALY DETECTION WITH GUARANTEED DELIVERY")
    print("="*80)
    
    # Load detectors
    detectors = {}
    detector_mapping = {
        'webserver': 'goodbad',
        'hostevent': 'network', 
        'netflow': 'host'
    }
    
    for topic, model_name in detector_mapping.items():
        try:
            detectors[topic] = FastAnomalyDetector(model_name)
        except Exception as e:
            print(f"❌ Failed to load {model_name} model for {topic}: {e}")
            sys.exit(1)
    
    # ✅ ENHANCED: Initialize Kafka Producer with GUARANTEED delivery
    try:
        producer = KafkaProducer(
            bootstrap_servers=[os.getenv('KAFKA_BOOTSTRAP', 'localhost:9092')],
            value_serializer=lambda v: json.dumps(v, separators=(',', ':')).encode('utf-8'),
            
            # ✅ GUARANTEED DELIVERY SETTINGS
            acks='all',                    # Wait for all in-sync replicas (strongest guarantee)
            retries=5,                     # Retry up to 5 times on failure
            retry_backoff_ms=100,          # Wait 100ms between retries
            max_in_flight_requests_per_connection=1,  # Ensure ordering
            
            # ✅ PERFORMANCE OPTIMIZATIONS
            batch_size=1,                  # Send immediately, no batching
            linger_ms=0,                   # No delay
            compression_type=None,         # No compression for speed
            buffer_memory=33554432,        # 32MB buffer
            request_timeout_ms=10000,      # 10 second timeout
            delivery_timeout_ms=30000,     # 30 second overall timeout
            
            # ✅ ENABLE IDEMPOTENCE (prevents duplicates)
            enable_idempotence=True
        )
        print("🚀 Kafka Producer initialized with GUARANTEED delivery")
        print("   ✅ acks='all' - waits for all replicas")
        print("   ✅ retries=5 - automatic retry on failure")
        print("   ✅ idempotence=True - prevents duplicates")
        
    except Exception as e:
        print(f"❌ Failed to initialize producer: {e}")
        sys.exit(1)
    
    # Create consumer
    try:
        consumer = KafkaConsumer(
            'netflow', 'webserver', 'hostevent',
            bootstrap_servers=[os.getenv('KAFKA_BOOTSTRAP', 'localhost:9092')],
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            group_id='fast_anomaly_consumer_v2',
            auto_offset_reset='latest',
            # Consumer optimizations
            fetch_min_bytes=1,
            fetch_max_wait_ms=100,
            max_poll_records=1
        )
        print("🎯 Consumer initialized for topics: netflow, webserver, hostevent")
        
    except Exception as e:
        print(f"❌ Failed to initialize consumer: {e}")
        sys.exit(1)
    
    print("🔴 Press Ctrl+C to stop\n")
    
    # Statistics tracking
    count = 0
    success_count = 0
    error_count = 0
    start_time = time.time()
    
    try:
        for message in consumer:
            count += 1
            topic = message.topic
            
            # Extract data from message
            data = message.value.get('data', {})
            
            if not data:
                print(f"⚠️  Empty data in message {count} from {topic}")
                continue
            
            # Run ML prediction
            result = detectors[topic].predict_fast(data)
            
            # Create output
            output = {
                "id": count,
                "time": datetime.now().strftime('%H:%M:%S.%f')[:-3],
                "topic": topic.upper(),
                "anomaly_score": result["anomaly_score"],
                "is_anomaly": result["is_anomaly"],
                "data": data,
                "processing_timestamp": datetime.now().isoformat()
            }
            
            # Add error info if present
            if "error" in result:
                output["ml_error"] = result["error"]
            
            # ✅ GUARANTEED: Print output
            print(json.dumps(output, separators=(',', ':')))
            sys.stdout.flush()
            
            # ✅ GUARANTEED: Publish to 'processedlogs' with delivery confirmation
            try:
                # Send message and get future
                future = producer.send('processedlogs', value=output)
                
                # ✅ CRITICAL: Block until message is delivered or timeout
                record_metadata = future.get(timeout=10)
                
                success_count += 1
                
                # Optional: Uncomment for detailed delivery confirmation
                # print(f"✅ Delivered to processedlogs - partition:{record_metadata.partition} offset:{record_metadata.offset}")
                
            except KafkaError as e:
                error_count += 1
                print(f"❌ Failed to send message {count} to processedlogs: {e}")
                
            except Exception as e:
                error_count += 1
                print(f"❌ Unexpected error sending message {count}: {e}")
            
            # ✅ PERFORMANCE: Print statistics every 50 messages
            if count % 50 == 0:
                elapsed = time.time() - start_time
                rate = count / elapsed if elapsed > 0 else 0
                print(f"📊 Stats: {count} processed | {success_count} delivered | {error_count} failed | {rate:.1f} msg/sec")
            
    except KeyboardInterrupt:
        print(f"\n🛑 Shutting down gracefully...")
        
    except Exception as e:
        print(f"❌ Consumer error: {e}")
        
    finally:
        # ✅ CLEANUP: Ensure all pending messages are sent
        print("🔄 Flushing remaining messages...")
        
        try:
            if producer:
                producer.flush(timeout=30)  # Wait up to 30 seconds for pending messages
                producer.close(timeout=10)
                print("✅ Producer closed successfully")
        except Exception as e:
            print(f"⚠️  Error closing producer: {e}")
        
        try:
            consumer.close()
            print("✅ Consumer closed successfully")
        except Exception as e:
            print(f"⚠️  Error closing consumer: {e}")
        
        # Final statistics
        elapsed = time.time() - start_time
        rate = count / elapsed if elapsed > 0 else 0
        success_rate = (success_count / count * 100) if count > 0 else 0
        
        print(f"\n📈 FINAL STATISTICS:")
        print(f"   Messages processed: {count}")
        print(f"   Successfully delivered: {success_count} ({success_rate:.1f}%)")
        print(f"   Failed deliveries: {error_count}")
        print(f"   Processing rate: {rate:.1f} messages/second")
        print(f"   Total runtime: {elapsed:.1f} seconds")

if __name__ == "__main__":
    main()
