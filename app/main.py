from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import joblib

from app.schemas import Features

app = FastAPI(
    title="NYC Airbnb Room Classification API",
    description="Predicts the room type of an NYC Airbnb listing.",
    version="1.0.0",
)

# Allow the frontend to call the API from a different origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "models/nyc_airbnb_room_classification_model.pkl"
model = joblib.load(MODEL_PATH)

# Column order must match the training data
COLUMNS = [
    "latitude",
    "longitude",
    "price",
    "minimum_nights",
    "number_of_reviews",
    "reviews_per_month",
    "calculated_host_listings_count",
    "availability_365",
    "neighbourhood_group",
    "neighbourhood",
]


@app.get("/")
def home():
    # Health check.
    return {"message": "NYC Airbnb Room Classification API is running"}


@app.post("/predict")
def predict(features: Features):
    # Return the predicted room type and class probabilities.
    row = pd.DataFrame([features.model_dump()], columns=COLUMNS)

    prediction = model.predict(row)
    probability = model.predict_proba(row)

    return {
        "predicted_room_type": prediction[0],
        "probability": probability.tolist()[0],
    }