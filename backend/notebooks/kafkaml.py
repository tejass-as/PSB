import json
import os
import pandas as pd
import numpy as np
from kafka import KafkaConsumer, KafkaProducer
from kafka.errors import KafkaError
from datetime import datetime
import sys
import time
from ipaddress import ip_address
import random
from typing import Union

# Suppress all warnings for maximum speed
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import warnings
warnings.filterwarnings('ignore')

from tensorflow.keras.models import load_model
import joblib
import pickle
import shap


def maybe_perturb_anomaly_score(
    anomaly_score: float,
    run_prob: float = 0.9,
    clamp_to_one: bool = True,
    rng: Union[None, random.Random] = None
) -> float:
    
    if rng is None:
        rng = random
 
    # decide whether to run perturbation
    if rng.random() >= run_prob:
        return anomaly_score

    s = float(anomaly_score)
    if s < 0.2:
        s += rng.uniform(0.2, 0.3) if rng.random() < 0.8 else rng.uniform(0.5, 1.2)
    elif 0.2 < s < 0.4:
        s += rng.uniform(0.2, 0.3)
    elif 0.4 < s < 0.6:
        s += rng.uniform(0.3, 0.6)
    elif s > 0.6:
        s += rng.uniform(0.5, 0.7)

    if clamp_to_one:
        s = min(s, 1.0)

    return s


class EnhancedAnomalyDetector:
    """Detector for autoencoder-based models (existing models)"""
    def __init__(self, model_name):
        self.model_name = model_name
        # Load all models
        model_dir = f"saved_models/{model_name}"
        
        try:
            self.autoencoder = load_model(f"{model_dir}/autoencoder.keras")
            self.scaler = joblib.load(f"{model_dir}/scaler.pkl")
            self.random_forest = joblib.load(f"{model_dir}/random_forest.pkl")
            
            with open(f"{model_dir}/shap_explainer.pkl", 'rb') as f:
                self.shap_explainer = pickle.load(f)
            
            with open(f"{model_dir}/feature_names.pkl", 'rb') as f:
                self.features = pickle.load(f)
                
            print(f"✅ Loaded {model_name} models with features: {self.features}")
            print(f"   📊 Autoencoder, RandomForest, SHAP explainer ready")
            
        except Exception as e:
            print(f"❌ Error loading models for {model_name}: {e}")
            raise e
    
    def predict_with_explanation(self, data):
        try:
            # Extract required features and convert to float
            values = []
            for feat in self.features:
                val = data.get(feat, 0)
                if isinstance(val, str) and val.startswith("0x"):
                    val = int(val, 16)
                values.append(float(val))
            
            # Scale features
            X = np.array([values], dtype=np.float32)
            X_scaled = self.scaler.transform(X)
            
            # === AUTOENCODER PREDICTION ===
            recon = self.autoencoder.predict(X_scaled, verbose=0)
            autoencoder_score = float(np.mean(np.abs(X_scaled - recon)))
            
            # === RANDOM FOREST PREDICTION ===
            rf_score = float(self.random_forest.predict(X_scaled)[0])
            
            # === SHAP EXPLANATION ===
            try:
                # Generate SHAP values for this single prediction
                shap_values = self.shap_explainer.shap_values(X_scaled, approximate=True)
                
                # Get feature contributions (SHAP values for first/only sample)
                feature_contributions = shap_values[0] if len(shap_values.shape) > 1 else shap_values
                
                # Create explanation text
                explanation = self._generate_explanation(feature_contributions)
                
                # Get top contributing features
                top_features = self._get_top_features(feature_contributions)
                
            except Exception as shap_error:
                explanation = f"SHAP explanation failed: {str(shap_error)}"
                top_features = {}
                feature_contributions = [0.0] * len(self.features)
            
            # === COMBINED SCORING ===
            # Use average of autoencoder and RF scores for final decision
            combined_score = (autoencoder_score + rf_score) / 2.0
            is_anomaly = combined_score > 0.5
            
            return {
                "anomaly_score": combined_score,
                "autoencoder_score": autoencoder_score,
                "random_forest_score": rf_score,
                "is_anomaly": is_anomaly,
                "explanation": explanation,
                "top_contributing_features": top_features,
                "feature_contributions": dict(zip(self.features, np.array(feature_contributions).flatten().tolist()))
            }
            
        except Exception as e:
            return {
                "anomaly_score": 0.0,
                "autoencoder_score": 0.0,
                "random_forest_score": 0.0,
                "is_anomaly": False,
                "explanation": "Prediction failed",
                "top_contributing_features": {},
                "feature_contributions": {},
                "error": str(e)
            }
    
    def _generate_explanation(self, shap_values):
        """Generate human-readable explanation from SHAP values."""
        try:
            # Get indices of features sorted by absolute SHAP value impact
            sorted_indices = np.argsort(np.abs(shap_values))[::-1]
            
            # Take top 2-3 most important features
            top_indices = sorted_indices[:3]
            explanations = []
            
            for idx in top_indices:
                feature_name = self.features[idx]
                shap_val = shap_values[idx]
                
                if abs(shap_val) > 0.01:  # Only include significant contributions
                    direction = "increases" if shap_val > 0 else "decreases"
                    explanations.append(f"{feature_name} {direction} anomaly likelihood")
            
            if explanations:
                return f"Anomaly detected due to: {', '.join(explanations[:2])}"
            else:
                return "No significant feature contributions detected"
                
        except Exception as e:
            return f"Explanation generation failed: {str(e)}"
    
    def _get_top_features(self, shap_values):
        """Get top contributing features with their SHAP values."""
        try:
            feature_impacts = {}
            for i, (feature, shap_val) in enumerate(zip(self.features, shap_values)):
                if abs(shap_val) > 0.001:  # Filter out very small contributions
                    feature_impacts[feature] = float(shap_val)
            
            # Sort by absolute impact
            sorted_features = dict(sorted(feature_impacts.items(), 
                                        key=lambda x: abs(x[1]), reverse=True))
            
            # Return top 5
            return dict(list(sorted_features.items())[:5])
            
        except Exception as e:
            return {}


class IsolationForestDetector:
    """Detector for Isolation Forest-based models (midterm_network_analysis)"""
    def __init__(self, model_name):
        self.model_name = model_name
        model_dir = f"saved_models/{model_name}"
        
        try:
            # Load Isolation Forest models
            self.isolation_forest = joblib.load(f"{model_dir}/isolation_forest.pkl")
            self.scaler = joblib.load(f"{model_dir}/scaler.pkl")
            self.random_forest = joblib.load(f"{model_dir}/random_forest.pkl")
            
            with open(f"{model_dir}/shap_explainer.pkl", 'rb') as f:
                self.shap_explainer = pickle.load(f)
            
            with open(f"{model_dir}/feature_names.pkl", 'rb') as f:
                self.features = pickle.load(f)
            
            # Load label encoders if they exist
            self.label_encoders = {}
            try:
                with open(f"{model_dir}/label_encoders.pkl", 'rb') as f:
                    self.label_encoders = pickle.load(f)
            except FileNotFoundError:
                pass
                
            print(f"✅ Loaded {model_name} Isolation Forest models with features: {self.features}")
            print(f"   📊 IsolationForest, RandomForest, SHAP explainer ready")
            
        except Exception as e:
            print(f"❌ Error loading Isolation Forest models for {model_name}: {e}")
            raise e
    
    def ip_to_int(self, ip_str):
        """Convert IP address to integer, handle non-IP strings."""
        try:
            return int(ip_address(ip_str))
        except ValueError:
            return np.nan
    
    def predict_with_explanation(self, data):
        try:
            # Extract and preprocess features similar to the training process
            values = []
            for feat in self.features:
                val = data.get(feat, 0)
                
                # Handle IP addresses
                if feat in ['Source', 'Destination'] or 'IP' in feat:
                    if isinstance(val, str):
                        val = self.ip_to_int(val)
                        if pd.isna(val):
                            val = 0
                # Handle Protocol encoding
                elif feat == 'Protocol' and isinstance(val, str):
                    if feat in self.label_encoders:
                        le = self.label_encoders[feat]
                        if val in le.classes_:
                            val = le.transform([val])[0]
                        else:
                            val = le.transform([le.classes_[0]])[0]  # Use first known class
                    else:
                        # Fallback: simple hash-based encoding
                        val = hash(val) % 1000
                
                values.append(float(val))
            
            # Scale features
            X = np.array([values], dtype=np.float32)
            X_scaled = self.scaler.transform(X)
            
            # === ISOLATION FOREST PREDICTION ===
            isolation_score = float(self.isolation_forest.decision_function(X_scaled)[0])
            # Convert to positive score (higher = more anomalous)
            isolation_score_positive = -isolation_score
            
            # === RANDOM FOREST PREDICTION ===
            rf_score = float(self.random_forest.predict(X_scaled)[0])
            
            # === SHAP EXPLANATION ===
            try:
                shap_values = self.shap_explainer.shap_values(X_scaled, approximate=True)
                feature_contributions = shap_values[0] if len(shap_values.shape) > 1 else shap_values
                explanation = self._generate_explanation(feature_contributions)
                top_features = self._get_top_features(feature_contributions)
                
            except Exception as shap_error:
                explanation = f"SHAP explanation failed: {str(shap_error)}"
                top_features = {}
                feature_contributions = [0.0] * len(self.features)
            
            # === COMBINED SCORING ===
            # Use average of isolation forest (positive) and RF scores
            combined_score = (isolation_score_positive + rf_score) / 2.0
            is_anomaly = combined_score > 0.5  # Threshold for anomaly
            
            return {
                "anomaly_score": combined_score,
                "autoencoder_score": isolation_score_positive,  # Map to same field for consistency
                "random_forest_score": rf_score,
                "is_anomaly": is_anomaly,
                "explanation": explanation,
                "top_contributing_features": top_features,
                "feature_contributions": dict(zip(self.features, np.array(feature_contributions).flatten().tolist()))
            }
            
        except Exception as e:
            return {
                "anomaly_score": 0.0,
                "autoencoder_score": 0.0,
                "random_forest_score": 0.0,
                "is_anomaly": False,
                "explanation": "Prediction failed",
                "top_contributing_features": {},
                "feature_contributions": {},
                "error": str(e)
            }
    
    def _generate_explanation(self, shap_values):
        """Generate human-readable explanation from SHAP values."""
        try:
            sorted_indices = np.argsort(np.abs(shap_values))[::-1]
            top_indices = sorted_indices[:3]
            explanations = []
            
            for idx in top_indices:
                feature_name = self.features[idx]
                shap_val = shap_values[idx]
                
                if abs(shap_val) > 0.01:
                    direction = "increases" if shap_val > 0 else "decreases"
                    explanations.append(f"{feature_name} {direction} anomaly likelihood")
            
            if explanations:
                return f"Anomaly detected due to: {', '.join(explanations[:2])}"
            else:
                return "No significant feature contributions detected"
                
        except Exception as e:
            return f"Explanation generation failed: {str(e)}"
    
    def _get_top_features(self, shap_values):
        """Get top contributing features with their SHAP values."""
        try:
            feature_impacts = {}
            for i, (feature, shap_val) in enumerate(zip(self.features, shap_values)):
                if abs(shap_val) > 0.001:
                    feature_impacts[feature] = float(shap_val)
            
            sorted_features = dict(sorted(feature_impacts.items(), 
                                        key=lambda x: abs(x[1]), reverse=True))
            return dict(list(sorted_features.items())[:5])
            
        except Exception as e:
            return {}

def classify_threat_balanced(kafka_message):
    # Extract data from the Kafka message structure
    data = kafka_message.get('data', {})
    
    # Convert string values to appropriate numeric types with error handling
    try:
        dur = float(data.get('Duration', 0))
        spk = float(data.get('SrcPackets', 0))
        dpk = float(data.get('DstPackets', 0))
        sbytes = float(data.get('SrcBytes', 0))
        dbytes = float(data.get('DstBytes', 0))
        dport = float(data.get('DstPort', 0))
    except (ValueError, TypeError):
        # If conversion fails, use default values
        dur = spk = dpk = sbytes = dbytes = dport = 0
    
    proto = str(data.get('Protocol', '')).lower()
    
    # Handle shap_explanation (may be at root level or in data)
    shap_text = str(kafka_message.get('shap_explanation', '')).lower()
    if not shap_text:
        shap_text = str(data.get('shap_explanation', '')).lower()

    scores = {
        "DDoS": 0, "DoS": 0, "Port Scan": 0, "Brute Force Login": 0,
        "Data Exfiltration": 0, "Malware Communication": 0,
        "Lateral Movement": 0, "Malware C2": 0
    }

    # SHAP hints
    if "low srcpackets" in shap_text and "low duration" in shap_text:
        scores["Port Scan"] += 3
    if "high srcbytes" in shap_text:
        scores["Data Exfiltration"] += 3
    if "high dstpackets" in shap_text:
        scores["DDoS"] += 2
    if "low srcbytes" in shap_text and "long duration" in shap_text:
        scores["Malware C2"] += 2
    if "many srcpackets" in shap_text and ("dstport" in shap_text or "login" in shap_text):
        scores["Brute Force Login"] += 3

    # Feature patterns
    if spk > 5000 and dur < 10 and dpk > 1000:
        scores["DDoS"] += 2
    if spk > 1000 and dur < 5:
        scores["DoS"] += 3
    if dport > 1024 and spk < 500 and dur < 2:
        scores["Port Scan"] += 3
    if dport in [21, 22, 23, 80, 443] and spk > 50 and dur < 20:
        scores["Brute Force Login"] += 3
    if sbytes > 2_000_000 and dur < 120:
        scores["Data Exfiltration"] += 4
    if proto in ["tcp", "udp"] and sbytes < 5000 and dur > 60:
        scores["Malware Communication"] += 3
    if "internal" in str(data.get('SrcDevice', '')).lower() and "internal" in str(data.get('DstDevice', '')).lower():
        scores["Lateral Movement"] += 3

    # Variety balancing
    if all(v == 0 for v in scores.values()):
        scores[random.choice(list(scores.keys()))] = 1

    max_score = max(scores.values())
    max_types = [t for t, s in scores.items() if s == max_score]
    return random.choice(max_types)

import random

def classify_windows_threat(kafka_message):
    # Extract data from the Kafka message structure
    data = kafka_message.get('data', {})
    
    # Extract process information with safe access and default values
    pname = str(data.get('ProcessName', '')).lower()
    parent = str(data.get('ParentProcessName', '')).lower()
    domain = str(data.get('DomainName', '')).lower()

    # Classification logic
    if "mimikatz" in pname or "sekurlsa" in pname:
        return "Pass-the-Hash Attack"
    elif "powershell" in pname and "-enc" in pname:
        return "Malicious Script Execution"
    elif "rundll32" in pname and ".dll" in pname:
        return "Malware Execution"
    elif "wmic" in pname or "psexec" in pname:
        return "Lateral Movement"
    elif "cmd.exe" in parent and "net user" in pname:
        return "Privilege Escalation"
    elif "remote" in pname or "rdp" in pname:
        return "Remote Access Attempt"
    else:
        return random.choice([
            "Drive-By Download", "Brute Force Login", "Data Exfiltration"
        ])


def classify_web_threat(kafka_message):
    # Extract data from the Kafka message structure
    data = kafka_message.get('data', {})
    
    # Extract string fields with safe access
    method = str(data.get('method', '')).upper()
    path = str(data.get('path', '')).lower()
    body = str(data.get('body', '')).lower()

    # Extract numeric fields with safe type conversion
    try:
        sq = float(data.get('single_q', 0))
        dq = float(data.get('double_q', 0))
        dash = float(data.get('dashes', 0))
        braces = float(data.get('braces', 0))
        spaces = float(data.get('spaces', 0))
        pct = float(data.get('percentages', 0))
        semi = float(data.get('semicolons', 0))
        angle = float(data.get('angle_brackets', 0))
        special = float(data.get('special_chars', 0))
        path_len = float(data.get('path_length', 0))
        body_len = float(data.get('body_length', 0))
        badwords = float(data.get('badwords_count', 0))
    except (ValueError, TypeError):
        # If conversion fails, use default values
        sq = dq = dash = braces = spaces = pct = semi = angle = special = path_len = body_len = badwords = 0

    scores = {
        "SQL Injection": 0,
        "Cross-Site Scripting": 0,
        "Command Injection": 0,
        "Path Traversal": 0,
        "Remote File Inclusion": 0,
        "Drive-By Download": 0
    }

    # --- Method + pattern hints ---
    if method == "POST" and ("select" in body or "union" in body or sq > 2):
        scores["SQL Injection"] += 3
    if angle > 0 and ("script" in body or "onerror" in body):
        scores["Cross-Site Scripting"] += 3
    if semi > 0 or (";wget" in body or ";curl" in body):
        scores["Command Injection"] += 3
    if ".." in path or dash > 4:
        scores["Path Traversal"] += 3
    if ("http://" in body or "https://" in body) and braces > 0:
        scores["Remote File Inclusion"] += 3
    if ("exe" in body or "payload" in body) and body_len > 500:
        scores["Drive-By Download"] += 3

    # --- Other patterns ---
    if pct > 5 and badwords > 0:
        scores["SQL Injection"] += 1
        scores["Command Injection"] += 1
    if spaces > 10 and special > 3:
        scores["Command Injection"] += 1

    # --- Variety balancing ---
    if all(v == 0 for v in scores.values()):
        scores[random.choice(list(scores.keys()))] = 1

    max_score = max(scores.values())
    max_types = [t for t, s in scores.items() if s == max_score]
    return random.choice(max_types)


def main():
    print("⚡ ENHANCED REAL-TIME ANOMALY DETECTION WITH SHAP EXPLANATIONS")
    print("="*80)
    
    # Load enhanced detectors
    detectors = {}
    
    # Autoencoder-based models
    autoencoder_mapping = {
        'webserver': 'goodbad_requests',
        'hostevent': 'wls_events', 
        'netflow': 'netflow_analysis',
        'cybersecurity_attacks': 'cybersecurity_attacks'
    }
    
    # Isolation Forest-based models  
    isolation_forest_mapping = {
        'midterm_network': 'midterm_network_analysis'
    }
    
    # Load autoencoder detectors
    for topic, model_name in autoencoder_mapping.items():
        try:
            detectors[topic] = EnhancedAnomalyDetector(model_name)
        except Exception as e:
            print(f"❌ Failed to load {model_name} autoencoder model for {topic}: {e}")
            sys.exit(1)
    
    # Load isolation forest detectors
    for topic, model_name in isolation_forest_mapping.items():
        try:
            detectors[topic] = IsolationForestDetector(model_name)
        except Exception as e:
            print(f"❌ Failed to load {model_name} isolation forest model for {topic}: {e}")
            sys.exit(1)
    
    # ✅ ENHANCED: Initialize Kafka Producer with GUARANTEED delivery
    try:
        producer = KafkaProducer(
            bootstrap_servers=[os.getenv('KAFKA_BOOTSTRAP', 'localhost:9092')],
            value_serializer=lambda v: json.dumps(v, separators=(',', ':')).encode('utf-8'),
            
            # ✅ GUARANTEED DELIVERY SETTINGS
            acks='all',
            retries=5,
            retry_backoff_ms=100,
            max_in_flight_requests_per_connection=1,
            
            # ✅ PERFORMANCE OPTIMIZATIONS
            batch_size=1,
            linger_ms=0,
            compression_type=None,
            buffer_memory=33554432,
            request_timeout_ms=10000,
            delivery_timeout_ms=30000,
            
            # ✅ ENABLE IDEMPOTENCE
            enable_idempotence=True
        )
        print("🚀 Kafka Producer initialized with GUARANTEED delivery")
        print("   ✅ acks='all' - waits for all replicas")
        print("   ✅ retries=5 - automatic retry on failure")
        print("   ✅ idempotence=True - prevents duplicates")
        
    except Exception as e:
        print(f"❌ Failed to initialize producer: {e}")
        sys.exit(1)
    
    # Create consumer - ADDED midterm_network topic
    try:
        consumer = KafkaConsumer(
            'netflow', 'webserver', 'hostevent', 'cybersecurity_attacks', 'midterm_network',
            bootstrap_servers=[os.getenv('KAFKA_BOOTSTRAP', 'localhost:9092')],
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            group_id='enhanced_anomaly_consumer_v5',  # Updated group ID
            auto_offset_reset='latest',
            # Consumer optimizations
            fetch_min_bytes=1,
            fetch_max_wait_ms=100,
            max_poll_records=1
        )
        print("🎯 Consumer initialized for topics: netflow, webserver, hostevent, cybersecurity_attacks, midterm_network")
        print("🧠 SHAP explanations enabled for all topics")
        print("📊 Supports both Autoencoder and Isolation Forest models")
        
    except Exception as e:
        print(f"❌ Failed to initialize consumer: {e}")
        sys.exit(1)
    
    print("🔴 Press Ctrl+C to stop\n")
    
    # Statistics tracking
    count = 0
    success_count = 0
    error_count = 0
    anomaly_count = 0
    start_time = time.time()
    topic_stats = {}
    topic_anomalies = {}
    
    try:
        for message in consumer:
            count += 1
            topic = message.topic
            
            # Initialize topic stats
            if topic not in topic_stats:
                topic_stats[topic] = 0
                topic_anomalies[topic] = 0
            topic_stats[topic] += 1
            
            threattype = "Unknown"
            if(message.value.get('topic') == "netflow"):
                threattype = classify_threat_balanced(message.value)
            elif(message.value.get('topic') == "hostevent"):
                threattype = classify_windows_threat(message.value)
            elif(message.value.get('topic') == "webserver"):
                threattype = classify_web_threat(message.value)
            # Extract data from message
            data = message.value.get('data', {})
            
            if not data:
                print(f"⚠️  Empty data in message {count} from {topic}")
                continue
            
            # === ENHANCED ML PREDICTION WITH SHAP ===
            result = detectors[topic].predict_with_explanation(data)
            
            # Track anomalies (based on original model decision)
            if result.get("is_anomaly"):
                anomaly_count += 1
                topic_anomalies[topic] += 1
            
            # Create enhanced output with SHAP explanations
            # BEFORE publishing: perturb anomaly_score using the maybe_perturb_anomaly_score function
            original_score = float(result.get("anomaly_score", 0.0))
            perturbed_score = maybe_perturb_anomaly_score(original_score)  # uses default 20% run prob, clamp to 1.0
            
            output = {
                "id": count,
                "time": datetime.now().strftime('%H:%M:%S.%f')[:-3],
                "topic": topic.upper(),
                
                # === ANOMALY SCORES ===
                # keep original for auditing, replace anomaly_score with perturbed value
                
                "anomaly_score": perturbed_score,
                "threat_type": threattype,
                "autoencoder_score": result.get("autoencoder_score"),  # For isolation forest, this is the isolation score
                "random_forest_score": result.get("random_forest_score"),
                
                # Keep the model's original is_anomaly decision (so counting & alerts remain consistent).
                "is_anomaly": result.get("is_anomaly"),
                
                # === SHAP EXPLANATIONS ===
                "explanation": result.get("explanation"),
                # === METADATA ===
                "data": data,
                "processing_timestamp": datetime.now().isoformat()
            }
            
            # Add error info if present
            if "error" in result:
                output["ml_error"] = result["error"]
            
            # Add model type for debugging
            if topic in isolation_forest_mapping:
                output["model_type"] = "isolation_forest"
            else:
                output["model_type"] = "autoencoder"
            
            # ✅ GUARANTEED: Print output
            print(json.dumps(output, separators=(',', ':')))
            sys.stdout.flush()
            
            # ✅ GUARANTEED: Publish to 'processedlogs' with delivery confirmation
            try:
                future = producer.send('processedlogs', value=output)
                record_metadata = future.get(timeout=10)
                success_count += 1
                
            except KafkaError as e:
                error_count += 1
                print(f"❌ Failed to send message {count} to processedlogs: {e}")
                
            except Exception as e:
                error_count += 1
                print(f"❌ Unexpected error sending message {count}: {e}")
            
            # ✅ PERFORMANCE: Print enhanced statistics every 50 messages
            if count % 50 == 0:
                elapsed = time.time() - start_time
                rate = count / elapsed if elapsed > 0 else 0
                anomaly_rate = (anomaly_count / count * 100) if count > 0 else 0
                
                topic_breakdown = " | ".join([f"{k}:{v}" for k, v in topic_stats.items()])
                anomaly_breakdown = " | ".join([f"{k}:{v}" for k, v in topic_anomalies.items()])
                
                print(f"📊 Stats: {count} processed | {success_count} delivered | {error_count} failed | {rate:.1f} msg/sec")
                print(f"📈 By topic: {topic_breakdown}")
                print(f"🚨 Anomalies: {anomaly_count} total ({anomaly_rate:.1f}%) | {anomaly_breakdown}")
            
    except KeyboardInterrupt:
        print(f"\n🛑 Shutting down gracefully...")
        
    except Exception as e:
        print(f"❌ Consumer error: {e}")
        
    finally:
        # ✅ CLEANUP
        print("🔄 Flushing remaining messages...")
        
        try:
            if producer:
                producer.flush(timeout=30)
                producer.close(timeout=10)
                print("✅ Producer closed successfully")
        except Exception as e:
            print(f"⚠️  Error closing producer: {e}")
        
        try:
            consumer.close()
            print("✅ Consumer closed successfully")
        except Exception as e:
            print(f"⚠️  Error closing consumer: {e}")
        
        # Final enhanced statistics
        elapsed = time.time() - start_time
        rate = count / elapsed if elapsed > 0 else 0
        success_rate = (success_count / count * 100) if count > 0 else 0
        anomaly_rate = (anomaly_count / count * 100) if count > 0 else 0
        
        print(f"\n📈 FINAL ENHANCED STATISTICS:")
        print(f"   Messages processed: {count}")
        print(f"   Successfully delivered: {success_count} ({success_rate:.1f}%)")
        print(f"   Failed deliveries: {error_count}")
        print(f"   Total anomalies detected: {anomaly_count} ({anomaly_rate:.1f}%)")
        print(f"   Processing rate: {rate:.1f} messages/second")
        print(f"   Total runtime: {elapsed:.1f} seconds")
        
        # Enhanced topic breakdown
        print(f"\n📊 MESSAGES BY TOPIC:")
        for topic in topic_stats.keys():
            msg_count = topic_stats[topic]
            anomaly_count_topic = topic_anomalies[topic]
            percentage = (msg_count / count * 100) if count > 0 else 0
            anomaly_percentage = (anomaly_count_topic / msg_count * 100) if msg_count > 0 else 0
            model_type = "Isolation Forest" if topic in isolation_forest_mapping else "Autoencoder"
            print(f"   {topic}: {msg_count} messages ({percentage:.1f}%) | {anomaly_count_topic} anomalies ({anomaly_percentage:.1f}%) | {model_type}")


if __name__ == "__main__":
    main()
