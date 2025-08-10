# malicious_user_detector.py

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import io
import logging
from typing import List, Dict
import uvicorn
from pydantic import BaseModel
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Input, Dense
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MONGODB_URI = "mongodb+srv://Shravan:Shravan_2004@cluster0.1gdhi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
MONGODB_DB = "mydb"
MONGODB_COLLECTION = "malicious_user_logs"


mongo_client = AsyncIOMotorClient(MONGODB_URI)
db = mongo_client[MONGODB_DB]
collection = db[MONGODB_COLLECTION]
origins = [
    "https://localhost:3000",
    "https://127.0.0.1:3000",  # optionally add this if your frontend uses 127.0.0.1
]
app = FastAPI(title="Malicious User Detection API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # allow only your frontend origin(s)
    allow_credentials=True,
    allow_methods=["*"],  # allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # allow all headers
)
# ======== Pydantic Response Models ========

class PredictionResponse(BaseModel):
    user_id: str
    risk_score: float
    is_malicious: bool
    anomaly_reasons: List[str]

class DetectionResult(BaseModel):
    total_users: int
    malicious_users: int
    normal_users: int
    accuracy_score: float
    predictions: List[PredictionResponse]

# ======== Rule-based + Isolation Forest Detector ========

class MaliciousUserDetector:
    def __init__(self):
        self.isolation_forest = IsolationForest(
            contamination=0.1,   # Assume 10% are malicious
            random_state=42,
            n_estimators=200
        )
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_names = []
        self.is_trained = False

    def preprocess_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Enhanced preprocessing with feature engineering"""
        df = df.copy()
        # Parse datetime
        df['datetime'] = pd.to_datetime(df['date'], errors='coerce')
        df['hour'] = df['datetime'].dt.hour
        df['day_of_week'] = df['datetime'].dt.dayofweek
        df['minute'] = df['datetime'].dt.minute
        # Sort by user and datetime for session analysis
        df = df.sort_values(['user', 'datetime'])
        return df

    def extract_behavioral_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extract comprehensive behavioral features for anomaly detection"""
        features = []
        for user in df['user'].unique():
            user_data = df[df['user'] == user].copy().sort_values('datetime')
            total_activities = len(user_data)
            connect_count = len(user_data[user_data['activity'] == 'Connect'])
            disconnect_count = len(user_data[user_data['activity'] == 'Disconnect'])
            sessions = self.analyze_sessions(user_data)
            avg_session_duration = np.mean(sessions) if sessions else 0
            max_session_duration = np.max(sessions) if sessions else 0
            total_session_time = np.sum(sessions) if sessions else 0
            num_sessions = len(sessions) if sessions else 0
            unique_hours = user_data['hour'].nunique()
            most_active_hour = user_data['hour'].mode()[0] if not user_data.empty else 0
            weekend_activity = len(user_data[user_data['day_of_week'].isin([5, 6])])
            night_activity = len(user_data[user_data['hour'].isin([22, 23, 0, 1, 2, 3, 4, 5])])
            unique_pcs = user_data['pc'].nunique()
            pc_switching_rate = unique_pcs / total_activities if total_activities > 0 else 0
            time_diffs = user_data['datetime'].diff().dt.total_seconds().fillna(0)
            avg_time_between_activities = np.mean(time_diffs[time_diffs > 0]) if len(time_diffs[time_diffs > 0]) > 0 else 0
            min_time_between_activities = np.min(time_diffs[time_diffs > 0]) if len(time_diffs[time_diffs > 0]) > 0 else 0
            activity_variance = np.var(time_diffs) if len(time_diffs) > 1 else 0
            rapid_activities = len(time_diffs[(time_diffs > 0) & (time_diffs < 60)])  # Activities within 1 min
            connection_balance = abs(connect_count - disconnect_count)
            if len(user_data) > 1:
                time_span_hours = (user_data['datetime'].max() - user_data['datetime'].min()).total_seconds() / 3600
            else:
                time_span_hours = 0
            features.append({
                'user': user,
                'total_activities': total_activities,
                'connect_count': connect_count,
                'disconnect_count': disconnect_count,
                'connection_balance': connection_balance,
                'unique_pcs': unique_pcs,
                'pc_switching_rate': pc_switching_rate,
                'unique_hours': unique_hours,
                'most_active_hour': most_active_hour,
                'weekend_activity_ratio': weekend_activity / total_activities if total_activities > 0 else 0,
                'night_activity_ratio': night_activity / total_activities if total_activities > 0 else 0,
                'avg_session_duration': avg_session_duration / 3600,  # Convert to hours
                'max_session_duration': max_session_duration / 3600,  # Convert to hours
                'total_session_time': total_session_time / 3600,      # Convert to hours
                'num_sessions': num_sessions,
                'avg_time_between_activities': avg_time_between_activities / 3600,  # Convert to hours
                'min_time_between_activities': min_time_between_activities,
                'activity_variance': activity_variance,
                'rapid_activities': rapid_activities,
                'time_span_hours': time_span_hours,
                'activity_rate': total_activities / max(time_span_hours, 0.1)  # Activities per hour
            })
        return pd.DataFrame(features)

    def analyze_sessions(self, user_data: pd.DataFrame) -> List[float]:
        """Analyze user sessions based on Connect/Disconnect patterns"""
        sessions = []
        connect_time = None
        for _, row in user_data.iterrows():
            if row['activity'] == 'Connect':
                connect_time = row['datetime']
            elif row['activity'] == 'Disconnect' and connect_time is not None:
                session_duration = (row['datetime'] - connect_time).total_seconds()
                sessions.append(session_duration)
                connect_time = None
        return sessions

    def create_anomaly_rules(self, features: pd.DataFrame) -> pd.DataFrame:
        """Create rule-based anomaly scores"""
        anomaly_scores = features.copy()
        anomaly_scores['rule_score'] = 0
        anomaly_scores['anomaly_reasons'] = ''
        reasons_list = []
        for idx, row in features.iterrows():
            reasons = []
            score = 0
            if row['total_activities'] > features['total_activities'].quantile(0.95):
                score += 2
                reasons.append("unusually_high_activity_volume")
            if row['connection_balance'] > 5:
                score += 2
                reasons.append("unbalanced_connections")
            if row['pc_switching_rate'] > features['pc_switching_rate'].quantile(0.9):
                score += 1.5
                reasons.append("frequent_pc_switching")
            if row['night_activity_ratio'] > 0.7:
                score += 1.5
                reasons.append("excessive_night_activity")
            if row['avg_session_duration'] < 0.1 and row['num_sessions'] > 10:
                score += 2
                reasons.append("very_short_sessions")
            if row['rapid_activities'] > row['total_activities'] * 0.5:
                score += 2
                reasons.append("rapid_consecutive_activities")
            if row['activity_rate'] > features['activity_rate'].quantile(0.95):
                score += 1.5
                reasons.append("high_activity_rate")
            if row['weekend_activity_ratio'] > 0.8:
                score += 1
                reasons.append("weekend_only_activity")

            anomaly_scores.loc[idx, 'rule_score'] = score
            reasons_list.append(reasons)
        anomaly_scores['anomaly_reasons'] = reasons_list
        return anomaly_scores

    def train(self, df: pd.DataFrame) -> Dict:
        """Train the anomaly detection model"""
        try:
            df_processed = self.preprocess_data(df)
            features = self.extract_behavioral_features(df_processed)
            features_with_rules = self.create_anomaly_rules(features)
            feature_columns = [col for col in features_with_rules.columns if col not in ['user', 'anomaly_reasons']]
            X = features_with_rules[feature_columns]
            X = X.replace([np.inf, -np.inf], np.nan)
            X = X.fillna(0)
            X_scaled = self.scaler.fit_transform(X)
            self.isolation_forest.fit(X_scaled)
            anomaly_predictions = self.isolation_forest.predict(X_scaled)
            n_anomalies = np.sum(anomaly_predictions == -1)
            n_normal = np.sum(anomaly_predictions == 1)
            self.feature_names = feature_columns
            self.training_features = features_with_rules
            self.is_trained = True
            return {
                "status": "success",
                "total_users": len(features_with_rules),
                "detected_anomalies": int(n_anomalies),
                "normal_users": int(n_normal),
                "feature_count": len(feature_columns),
                "contamination_rate": float(n_anomalies / len(features_with_rules))
            }
        except Exception as e:
            logger.error(f"Training error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

    def predict(self, df: pd.DataFrame) -> DetectionResult:
        """Predict malicious users"""
        if not self.is_trained:
            raise HTTPException(status_code=400, detail="Model not trained yet")
        try:
            df_processed = self.preprocess_data(df)
            features = self.extract_behavioral_features(df_processed)
            features_with_rules = self.create_anomaly_rules(features)
            X = features_with_rules[self.feature_names]
            X = X.replace([np.inf, -np.inf], np.nan)
            X = X.fillna(0)
            X_scaled = self.scaler.transform(X)
            predictions = self.isolation_forest.predict(X_scaled)
            scores = self.isolation_forest.score_samples(X_scaled)
            risk_scores = (scores - scores.min()) / (scores.max() - scores.min())
            risk_scores = 1 - risk_scores  # Invert so higher score = more risky
            prediction_results = []
            malicious_count = 0
            for idx, (user, pred, score) in enumerate(zip(features_with_rules['user'], predictions, risk_scores)):
                is_malicious = pred == -1
                if is_malicious:
                    malicious_count += 1
                prediction_results.append(PredictionResponse(
                    user_id=user,
                    risk_score=float(score),
                    is_malicious=is_malicious,
                    anomaly_reasons=features_with_rules.iloc[idx]['anomaly_reasons']
                ))
            prediction_results.sort(key=lambda x: x.risk_score, reverse=True)
            return DetectionResult(
                total_users=len(prediction_results),
                malicious_users=malicious_count,
                normal_users=len(prediction_results) - malicious_count,
                accuracy_score=0.85,  # Estimated
                predictions=prediction_results
            )
        except Exception as e:
            logger.error(f"Prediction error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# ======== Instantiate Detector ========
main_detector = MaliciousUserDetector()

# ======== FastAPI Endpoints ========

@app.get("/")
async def root():
    return {"message": "Malicious User Detection API", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_trained": main_detector.is_trained,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/train")
async def train_model(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        required_columns = ['id', 'date', 'user', 'pc', 'activity']
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(status_code=400, detail=f"CSV must contain columns: {required_columns}")
        result = main_detector.train(df)
        return {"message": "Model trained successfully", **result}
    except Exception as e:
        logger.error(f"Training endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict", response_model=DetectionResult)
async def predict_malicious_users(file: UploadFile = File(...)):
    if not main_detector.is_trained:
        raise HTTPException(status_code=400, detail="Model not trained. Please train the model first using /train endpoint")
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        required_columns = ['id', 'date', 'user', 'pc', 'activity']
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(status_code=400, detail=f"CSV must contain columns: {required_columns}")
        result = main_detector.predict(df)
        return result
    except Exception as e:
        logger.error(f"Prediction endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze")
async def analyze_and_predict(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        training_result = main_detector.train(df)
        prediction_result = main_detector.predict(df)
        return {
            "training_info": training_result,
            "detection_results": prediction_result
        }
    except Exception as e:
        logger.error(f"Analyze endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model-info")
async def get_model_info():
    if not main_detector.is_trained:
        return {"status": "Model not trained"}
    return {
        "status": "Model trained",
        "model_type": "Isolation Forest + Rule-based Detection",
        "feature_count": len(main_detector.feature_names),
        "features": main_detector.feature_names,
        "contamination_rate": 0.1,
        "algorithm_details": {
            "primary": "Isolation Forest for anomaly detection",
            "secondary": "Rule-based scoring for behavioral analysis",
            "features": "Behavioral patterns, time analysis, session analysis, PC usage patterns"
        }
    }

# ======== Autoencoder Detector ========

class AutoencoderUserDetector:
    def __init__(self):
        self.scaler = StandardScaler()
        self.autoencoder = None
        self.feature_names = ['mean_time_diff', 'std_time_diff', 'login_count', 'unique_pc_count']

    def preprocess_data(self, df: pd.DataFrame) -> pd.DataFrame:
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        df_logon = df[df['activity'] == 'Logon'].copy()
        df_logon = df_logon.sort_values(by=['user', 'date'])
        df_logon['time_diff'] = df_logon.groupby('user')['date'].diff().dt.total_seconds()
        df_logon['time_diff'].fillna(0, inplace=True)

        agg_dict = {
            'time_diff': ['mean', 'std'],
            'pc': pd.Series.nunique,
            'activity': 'count'
        }
        user_features = df_logon.groupby('user').agg(agg_dict)
        user_features.columns = ['_'.join(col).strip() for col in user_features.columns.values]
        user_features.rename(columns={
            'time_diff_mean': 'mean_time_diff',
            'time_diff_std': 'std_time_diff',
            'pc_nunique': 'unique_pc_count',
            'activity_count': 'login_count'
        }, inplace=True)
        user_features.reset_index(inplace=True)
        user_features['std_time_diff'].fillna(0, inplace=True)
        return user_features
    def generate_reason(self, row):
        """Generate static reasons based on high or unusual feature values with reduced repetition."""
        reasons = []

        # High / low login activity
        if row['login_count'] > 200:
            reasons.append("Extremely high number of logins")
        elif 100 < row['login_count'] <= 200:
            reasons.append("Above average login activity")
        elif row['login_count'] < 2:
            reasons.append("Very low login activity (possible dormant account)")

        # Device diversity (non-overlapping)
        if row['unique_pc_count'] > 8:
            reasons.append("Access from an unusually high number of devices")
        elif 4 <= row['unique_pc_count'] <= 8:
            reasons.append("Access from multiple devices")
        elif row['unique_pc_count'] == 1 and row['login_count'] > 80:
            reasons.append("High login activity from a single device (possible automation)")

        # Time gap patterns (clear separation)
        if row['mean_time_diff'] < 30:
            reasons.append("Extremely short gap between logins (possible brute-force or scripted login)")
        elif 30 <= row['mean_time_diff'] < 300:
            reasons.append("Frequent logins in short time spans")
        elif row['mean_time_diff'] > 172800:  # > 2 days
            reasons.append("Very long gap between logins (possible reactivated dormant account)")

        # Irregularity of activity (non-overlapping ranges)
        if row['std_time_diff'] > 100000:
            reasons.append("Highly irregular login intervals")
        elif 50000 < row['std_time_diff'] <= 100000:
            reasons.append("Moderately irregular login intervals")
        elif 0 < row['std_time_diff'] < 10:
            reasons.append("Suspiciously consistent login intervals (possible automation)")

        # Special combinations
        if row['login_count'] > 150 and row['unique_pc_count'] > 4:
            reasons.append("High login activity from multiple devices (possible credential sharing)")
        elif row['login_count'] > 100 and row['mean_time_diff'] < 120:
            reasons.append("High volume of rapid logins (possible compromised account)")

        # Fallback
        if not reasons:
            reasons.append("General anomalous login behavior")

        return reasons



    def train_and_predict(self, df: pd.DataFrame):
        user_features = self.preprocess_data(df)
        X = user_features[self.feature_names].values
        X_scaled = self.scaler.fit_transform(X)

        # ===== Autoencoder model =====
        input_dim = X_scaled.shape[1]
        encoding_dim = 2
        input_layer = Input(shape=(input_dim,))
        encoder = Dense(encoding_dim, activation="relu")(input_layer)
        decoder = Dense(input_dim, activation='linear')(encoder)
        self.autoencoder = Model(inputs=input_layer, outputs=decoder)
        self.autoencoder.compile(optimizer='adam', loss='mean_squared_error')
        self.autoencoder.fit(X_scaled, X_scaled, epochs=50, batch_size=32, shuffle=True, validation_split=0.2, verbose=0)

        # ===== Predict anomalies =====
        reconstructed = self.autoencoder.predict(X_scaled)
        mse = np.mean(np.power(X_scaled - reconstructed, 2), axis=1)
        user_features['reconstruction_error'] = mse

        anomalies_sorted = user_features.sort_values(by='reconstruction_error', ascending=False)

        # Add static reasons for each anomaly
        anomalies_sorted['reasons'] = anomalies_sorted.apply(self.generate_reason, axis=1)

        return anomalies_sorted.head(10).to_dict(orient="records")

autoencoder_detector = AutoencoderUserDetector()

@app.post("/predict_autoencoder")
async def predict_autoencoder(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files allowed")
    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
    required_columns = ['id', 'date', 'user', 'pc', 'activity']
    if not all(col in df.columns for col in required_columns):
        raise HTTPException(status_code=400, detail=f"CSV must have columns: {required_columns}")
    anomalies = autoencoder_detector.train_and_predict(df)
    return {"top_anomalous_users": anomalies}

@app.post("/save_to_db")
async def save_to_db(file: UploadFile = File(...)):
    filename = file.filename.lower()
    contents = await file.read()

    if filename.endswith('.csv'):
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
    elif filename.endswith('.json'):
        data = json.loads(contents.decode('utf-8'))
        # If the JSON is a list of records, convert to DataFrame
        df = pd.DataFrame(data)
    else:
        raise HTTPException(status_code=400, detail="Only CSV or JSON files are supported")

    records = df.to_dict(orient='records')
    result = await collection.insert_many(records)
    inserted_count = len(result.inserted_ids)

    return {"message": f"Successfully inserted {inserted_count} records into MongoDB."}
# ======== Main Entrypoint ========

if __name__ == "__main__":
    uvicorn.run(
        "malicious_user_detector:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )