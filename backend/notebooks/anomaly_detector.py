import pandas as pd
import numpy as np
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
from tensorflow.keras.models import load_model
import joblib
import pickle
import warnings
warnings.filterwarnings('ignore')

class AnomalyDetector:
    def __init__(self, model_name):
        """
        Initialize the anomaly detector for a specific dataset
        model_name: 'goodbad', 'network', or 'host'
        """
        self.model_name = model_name
        self.model_dir = f"saved_models/{model_name}"
        self.load_models()
    
    def load_models(self):
        """Load all saved models"""
        try:
            print(f"📂 Loading models for {self.model_name}...")
            
            # Load autoencoder
            self.autoencoder = load_model(f"{self.model_dir}/autoencoder.keras")
            
            # Load scaler and random forest
            self.scaler = joblib.load(f"{self.model_dir}/scaler.pkl")
            self.random_forest = joblib.load(f"{self.model_dir}/random_forest.pkl")
            
            # Load SHAP explainer and feature names
            with open(f"{self.model_dir}/shap_explainer.pkl", 'rb') as f:
                self.shap_explainer = pickle.load(f)
            
            with open(f"{self.model_dir}/feature_names.pkl", 'rb') as f:
                self.feature_names = pickle.load(f)
            
            print(f"✅ All models loaded successfully!")
            print(f"   Features: {self.feature_names}")
            
        except Exception as e:
            print(f"❌ Error loading models: {str(e)}")
            raise
    
    def hex_to_int(self, val):
        """Convert hex strings to integers"""
        try:
            if isinstance(val, str) and val.startswith("0x"):
                return int(val, 16)
            return int(val)
        except:
            return np.nan
    
    def preprocess_data(self, df):
        """Preprocess input data same way as training"""
        # Remove rows with NaN in feature columns
        df_clean = df.dropna(subset=self.feature_names).copy()
        
        # Convert hex strings to integers
        for col in self.feature_names:
            if col in df_clean.columns:
                df_clean[col] = df_clean[col].apply(self.hex_to_int)
        
        # Remove any remaining NaN values
        df_clean = df_clean.dropna(subset=self.feature_names)
        df_clean[self.feature_names] = df_clean[self.feature_names].astype(np.float32)
        
        return df_clean, df_clean[self.feature_names].values
    
    def compute_anomaly_scores(self, X_scaled):
        """Compute anomaly scores using autoencoder"""
        recon = self.autoencoder.predict(X_scaled, verbose=0)
        scores = np.mean(np.abs(X_scaled - recon), axis=1)
        return scores
    
    def predict_anomalies(self, df, top_n=100):
        """
        Predict anomalies for input data
        df: pandas DataFrame with the same structure as training data
        top_n: number of top anomalies to return
        """
        print(f"\n🔍 Processing {len(df)} rows for anomaly detection...")
        
        # Preprocess data
        df_clean, X = self.preprocess_data(df)
        
        if len(df_clean) == 0:
            print("❌ No valid data after preprocessing!")
            return pd.DataFrame()
        
        print(f"✅ {len(df_clean)} rows ready for analysis")
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        # Compute anomaly scores
        scores = self.compute_anomaly_scores(X_scaled)
        
        # Get top anomalies
        if len(scores) < top_n:
            top_n = len(scores)
            print(f"⚠️  Only {len(scores)} samples available, showing all")
        
        top_idx = np.argsort(scores)[-top_n:]
        X_top = X_scaled[top_idx]
        scores_top = scores[top_idx]
        
        # Generate SHAP explanations
        print(f"🧠 Generating SHAP explanations for top {top_n} anomalies...")
        shap_values = self.shap_explainer.shap_values(X_top, approximate=True)
        shap_df = pd.DataFrame(shap_values, columns=self.feature_names)
        shap_df["anomaly_score"] = scores_top
        
        # Combine results
        result_df = pd.concat([
            df_clean.iloc[top_idx].reset_index(drop=True),
            shap_df.add_prefix("shap_")
        ], axis=1)
        
        return result_df.sort_values("shap_anomaly_score", ascending=False)

def main():
    """Main function to demonstrate usage"""
    
    # Dataset configurations
    datasets = {
        "goodbad": {
            "file": "../datasets/2good_reqff.csv",
            "features": ["path_length", "body_length", "badwords_count"]
        },
        "network": {
            "file": "../datasets/wls_day-02.csv", 
            "features": ["ProcessID", "ParentProcessID", "EventID"]
        },
        "host": {
            "file": "../datasets/netflow_day-02.csv",
            "features": ["Duration", "SrcPackets", "DstPackets", "SrcBytes", "DstBytes"]
        }
    }
    
    print("🚀 Anomaly Detection Inference System")
    print("="*50)
    
    # Process each dataset
    for dataset_name, config in datasets.items():
        print(f"\n📊 Processing {dataset_name.upper()} dataset...")
        
        try:
            # Load the detector
            detector = AnomalyDetector(dataset_name)
            
            # Load test data (first 100 rows)
            df = pd.read_csv(config["file"]).head(100)
            print(f"📄 Loaded first 100 rows from {config['file']}")
            
            # Predict anomalies
            results = detector.predict_anomalies(df, top_n=10)
            
            if len(results) > 0:
                print(f"\n📋 Top 5 Anomalies for {dataset_name.upper()}:")
                print(results.head().to_string(index=False))
                
                print(f"\n📊 Summary Statistics:")
                print(f"   - Total samples processed: {len(df)}")
                print(f"   - Anomalies detected: {len(results)}")
                print(f"   - Highest anomaly score: {results['shap_anomaly_score'].max():.4f}")
                print(f"   - Average anomaly score: {results['shap_anomaly_score'].mean():.4f}")
                
                # Save results
                output_file = f"inference_results_{dataset_name}.csv"
                results.to_csv(output_file, index=False)
                print(f"   💾 Results saved to {output_file}")
            else:
                print(f"❌ No anomalies detected for {dataset_name}")
                
        except FileNotFoundError:
            print(f"⚠️  Dataset file not found: {config['file']}")
        except Exception as e:
            print(f"❌ Error processing {dataset_name}: {str(e)}")
        
        print("\n" + "="*50)

if __name__ == "__main__":
    main()
