import logging
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .schemas import Features

logger = logging.getLogger("uvicorn.error")

# Paths are built from this file's location, so the app works from any folder
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "nyc_airbnb_room_classification_model.pkl"
FRONTEND_DIR = BASE_DIR / "frontend"

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

app = FastAPI(
    title="NYC Airbnb Room Classification API",
    description="Predicts the room type of an NYC Airbnb listing.",
    version="1.0.0",
)

# Open CORS lets the page also work when opened as a file or from another dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

if not MODEL_PATH.exists():
    raise RuntimeError(f"Model file not found: {MODEL_PATH}")

model = joblib.load(MODEL_PATH)


@app.get("/health")
def health():
    """Health check used by the frontend's status indicator."""
    return {"message": "NYC Airbnb Room Classification API is running"}


@app.post("/predict")
def predict(features: Features):
    """Return the predicted room type and the probability of each class."""
    row = pd.DataFrame([features.model_dump()], columns=COLUMNS)

    try:
        prediction = model.predict(row)[0]
        probabilities = model.predict_proba(row)[0]
    except Exception:
        logger.exception("Prediction failed")
        raise HTTPException(
            status_code=500,
            detail="The model could not process this listing.",
        )

    probabilities = [float(p) for p in probabilities]
    classes = [str(c) for c in model.classes_]

    return {
        "predicted_room_type": str(prediction),
        "probability": probabilities,
        "probabilities": dict(zip(classes, probabilities)),
    }


# It serves index.html at "/" plus style.css and script.js,
# and only catches paths that none of the routes above handled.
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")