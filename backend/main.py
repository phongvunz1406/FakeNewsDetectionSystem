from fastapi import FastAPI, HTTPException
import sqlite3
from backend.predictor import Predictor  
from backend.schemas import UserInput

# Initialize FastAPI app
app = FastAPI(
    title="Fake News Detection API",
    description="API that predicts whether a news statement is real or fake using a trained ML model.",
    version="1.0.0"
)

# Load model and vectorizer
try:
    predictor = Predictor()
except Exception as e:
    raise RuntimeError(f"Error loading model: {e}")


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
            "details": result["extracted_features"]
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
            history.append({
                "id": row[0],
                "statement": row[1],
                "fullText_based_content": row[2],
                "speaker": row[3],
                "sources": row[4],
                "prediction": row[5],
                "confidence": row[6],
                "num_sources": row[7],
                "has_official_source": bool(row[8])
            })
        return {"total_records": len(history), "data": history}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
