from fastapi import FastAPI, HTTPException
from backend.predictor import Predictor  
from backend.schemas import UserInput

# Initialize FastAPI app
app = FastAPI(
    title="Fake News Detection API",
    description="API that predicts whether a news statement is real or fake using ML model.",
    version="1.0.0"
)

# Load model and vectorizer
try:
    predictor = Predictor()
except Exception as e:
    raise RuntimeError(f"Error loading model: {e}")

# Root endpoint
@app.get("/")
def root():
    return {"message": "Welcome to the Fake News Detection API!"}


# Prediction endpoint
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
