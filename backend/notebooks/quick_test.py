from anomaly_detector import AnomalyDetector
import pandas as pd

# Example: Quick test with specific dataset
def quick_test(dataset_name, csv_file, num_rows=50):
    """Quick test function"""
    print(f"🧪 Quick test for {dataset_name}")
    
    try:
        # Load detector
        detector = AnomalyDetector(dataset_name)
        
        # Load sample data
        df = pd.read_csv(csv_file).head(num_rows)
        print(f"📄 Testing with {len(df)} rows")
        
        # Detect anomalies
        results = detector.predict_anomalies(df, top_n=5)
        
        print(f"\n🎯 Top 3 Anomalies:")
        print(results.head(3)[['shap_anomaly_score'] + detector.feature_names])
        
        return results
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

# Test each model
if __name__ == "__main__":
    # Test goodbad model
    quick_test("goodbad", "../datasets/2good_reqff.csv")
    
    # Test network model  
    quick_test("network", "../datasets/wls_day-02.csv")
    
    # Test host model
    quick_test("host", "../datasets/netflow_day-02.csv")
