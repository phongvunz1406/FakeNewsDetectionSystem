from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
import sqlite3
from datetime import timedelta
import os
from dotenv import load_dotenv
from backend.predictor import Predictor
from backend.schemas import UserInput, CreateUser, Token
from backend.auth import authenticate_user, create_access_token, create_user, get_current_active_user, get_admin_user, revoke_token, save_session, oauth2_scheme, ACCESS_TOKEN_EXPIRE_MINUTES

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Fake News Detection API",
    description="API that predicts whether a news statement is real or fake using a trained ML model.",
    version="1.0.0"
)

# Get CORS origins from environment variable
cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"
).split(",")

# Configure CORS - Allow frontend to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Load model and vectorizer
try:
    predictor = Predictor()
except Exception as e:
    raise RuntimeError(f"Error loading model: {e}")


#Health check endpoint for AWS ALB/ECS
@app.get("/health")
def health_check():
    """
    Health check endpoint for load balancers and container orchestration.
    Returns 200 if the service is healthy.
    """
    try:
        # Check if predictor is loaded
        if predictor is None or predictor.model is None:
            raise HTTPException(status_code=503, detail="ML model not loaded")

        return {
            "status": "healthy",
            "service": "Fake News Detection API",
            "version": "1.0.0",
            "model_loaded": True
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")


#Root endpoint
@app.get("/")
def read_root():
    """
    Root endpoint with API information.
    """
    return {
        "service": "Fake News Detection API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }


#Prediction endpoint (POST)
@app.post("/predict")
def predict_news(input_data: UserInput):
    """
    Takes user input and returns the model's prediction.
    """
    try:
        result = predictor.predict(
            statement=input_data.statement,
            fullText_based_content=input_data.fullText_based_content,
            speaker=input_data.speaker,
            sources=input_data.sources
        )

        return {
            "prediction": result["prediction"],
            "confidence": result["confidence"],
            "probabilities": result["probabilities"],
            "details": result["extracted_features"],
            "trust_indicators": result["trust_indicators"],
            "explainability": result["explainability"],
            "metadata": result["metadata"]
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


#Retrieve all stored predictions (GET)
@app.get("/history")
def get_prediction_history():
    """
    Retrieve all past predictions from the SQLite database.
    """
    try:
        conn = sqlite3.connect(predictor.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM predictions ORDER BY id DESC")
        rows = cursor.fetchall()
        conn.close()

        # Format results as list of dicts
        history = []
        for row in rows:
            # Handle both old and new schema (for backward compatibility)
            history_item = {
                "id": row[0],
                "statement": row[1],
                "fullText_based_content": row[2],
                "speaker": row[3],
                "sources": row[4],
                "prediction": row[5],
                "confidence": row[6],
                "num_sources": row[7],
                "has_official_source": bool(row[8])
            }
            # Add new fields if they exist
            if len(row) > 9:
                history_item["risk_level"] = row[9]
                history_item["timestamp"] = row[10]
                history_item["input_completeness"] = row[11]

            history.append(history_item)
        return {"total_records": len(history), "data": history}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")


#Delete a specific prediction by ID (DELETE) - Admin only
@app.delete("/history/{prediction_id}")
async def delete_prediction(prediction_id: int, admin_user: dict = Depends(get_admin_user)):
    """
    Delete a specific prediction from the database by its ID.
    Requires admin privileges.
    """
    try:
        conn = sqlite3.connect(predictor.db_path)
        cursor = conn.cursor()

        # Check if the prediction exists
        cursor.execute("SELECT id FROM predictions WHERE id = ?", (prediction_id,))
        result = cursor.fetchone()

        if not result:
            conn.close()
            raise HTTPException(status_code=404, detail=f"Prediction with ID {prediction_id} not found")

        # Delete the prediction
        cursor.execute("DELETE FROM predictions WHERE id = ?", (prediction_id,))
        conn.commit()
        conn.close()

        return {
            "message": f"Prediction with ID {prediction_id} deleted successfully",
            "deleted_by": admin_user["username"]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")



#Register a new user (POST)
@app.post("/register")
def register(user_data: CreateUser):
    """
    Register a new user with username and password.
    Regular users cannot register as admin - admin role must be granted manually.
    """
    try:
        # Always create regular users (is_admin=False) - admin must be granted manually
        user = create_user(user_data.username, user_data.password, is_admin=False)
        return {"message": "User created successfully", "username": user["username"]}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration error: {e}")


#Login endpoint (POST)
@app.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Login with username and password to receive an access token.
    """
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )

    # Save session
    save_session(user["username"], access_token)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_admin": user.get("is_admin", False)
    }


#Logout endpoint (POST)
@app.post("/logout")
async def logout(token: str = Depends(oauth2_scheme)):
    """
    Logout by revoking the current access token.
    """
    try:
        revoke_token(token)
        return {"message": "Successfully logged out"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Logout error: {e}")


#Get current user info (GET) - Protected route example
@app.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_active_user)):
    """
    Get current authenticated user information.
    This is a protected route that requires authentication.
    """
    return {
        "username": current_user["username"],
        "id": current_user["id"],
        "is_active": current_user["is_active"],
        "is_admin": current_user.get("is_admin", False),
        "created_at": current_user["created_at"]
    }


#Get model performance metrics (GET) - Admin only
@app.get("/admin/model-performance")
async def get_model_performance(admin_user: dict = Depends(get_admin_user)):
    """
    Get comprehensive model performance metrics.
    Requires admin privileges.
    """
    try:
        conn = sqlite3.connect(predictor.db_path)
        cursor = conn.cursor()

        # Total predictions
        cursor.execute("SELECT COUNT(*) FROM predictions")
        total_predictions = cursor.fetchone()[0]

        # Predictions by label
        cursor.execute("""
            SELECT prediction, COUNT(*) as count
            FROM predictions
            GROUP BY prediction
        """)
        prediction_distribution = dict(cursor.fetchall())

        # Average confidence
        cursor.execute("SELECT AVG(confidence) FROM predictions")
        avg_confidence = cursor.fetchone()[0] or 0

        # Confidence distribution
        cursor.execute("""
            SELECT
                CASE
                    WHEN confidence >= 0.9 THEN 'Very High (90-100%)'
                    WHEN confidence >= 0.8 THEN 'High (80-90%)'
                    WHEN confidence >= 0.7 THEN 'Medium (70-80%)'
                    WHEN confidence >= 0.6 THEN 'Low (60-70%)'
                    ELSE 'Very Low (<60%)'
                END as confidence_range,
                COUNT(*) as count
            FROM predictions
            GROUP BY confidence_range
        """)
        confidence_distribution = dict(cursor.fetchall())

        # Risk level distribution
        cursor.execute("""
            SELECT risk_level, COUNT(*) as count
            FROM predictions
            WHERE risk_level IS NOT NULL
            GROUP BY risk_level
        """)
        risk_distribution = dict(cursor.fetchall())

        # Source quality metrics
        cursor.execute("""
            SELECT
                AVG(num_sources) as avg_sources,
                SUM(CASE WHEN has_official_source = 1 THEN 1 ELSE 0 END) as official_source_count,
                AVG(input_completeness) as avg_completeness
            FROM predictions
        """)
        source_metrics = cursor.fetchone()

        # Predictions over time (last 30 days)
        cursor.execute("""
            SELECT
                DATE(timestamp) as date,
                COUNT(*) as count,
                prediction
            FROM predictions
            WHERE timestamp >= datetime('now', '-30 days')
            GROUP BY DATE(timestamp), prediction
            ORDER BY date DESC
        """)
        temporal_data = cursor.fetchall()

        # Recent predictions
        cursor.execute("""
            SELECT id, statement, prediction, confidence, timestamp
            FROM predictions
            ORDER BY timestamp DESC
            LIMIT 10
        """)
        recent_predictions = [
            {
                "id": row[0],
                "statement": row[1],
                "prediction": row[2],
                "confidence": row[3],
                "timestamp": row[4]
            }
            for row in cursor.fetchall()
        ]

        conn.close()

        return {
            "total_predictions": total_predictions,
            "prediction_distribution": prediction_distribution,
            "avg_confidence": round(avg_confidence, 4),
            "confidence_distribution": confidence_distribution,
            "risk_distribution": risk_distribution,
            "source_metrics": {
                "avg_sources": round(source_metrics[0] or 0, 2),
                "official_source_count": source_metrics[1] or 0,
                "avg_completeness": round(source_metrics[2] or 0, 2)
            },
            "temporal_data": [
                {"date": row[0], "count": row[1], "prediction": row[2]}
                for row in temporal_data
            ],
            "recent_predictions": recent_predictions
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")


