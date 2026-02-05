"""
FastAPI Backend 
"""

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from db import Base, engine, get_db # Import Base class that tables inherit
import models # Import table definitions to create tables at startup if not made yet
from schemas import UserIn, User, SpiralIn, Spiral, ResultIn, Result, ScoreSummary
import crud
import json
import os
from utils_email import send_trial_result_email 
from utils_scoring import score_spiral_json

# Create FastAPI app
app = FastAPI(
    title="Tremor Spiral Test API",
    description="Backend for tremor analysis",
    version="1.0.0"
)

# add cors so frontend can talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # in production, use specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# create tables when server starts
Base.metadata.create_all(bind=engine)

# Test route to verify backend runs locally
@app.get("/")
def root():
    """Test route - verify backend is running"""
    return {"message": "Backend is running!", "status": "healthy"}

@app.get("/health")
def health():
    """Health check endpoint"""
    return {"status": "ok"}

@app.get("/test")
def test_endpoint():
    """Another test route"""
    return {"message": "Test endpoint working!", "data": {"test": True}}

@app.post("/users/", response_model=User)
def create_user(user: UserIn, db: Session = Depends(get_db)):
    """
    Save a new user to the database.
    """
    return crud.create_user(db=db, **user.model_dump())

@app.get("/users/{user_id}", response_model=User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """
    Get a user by their ID.
    """
    db_user = crud.get_user(db=db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@app.post("/spirals/", response_model=Spiral)
def create_spiral(spiral: SpiralIn, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Save a new spiral drawing to the database.
    """
    # use crud helper to save spiral
    saved_spiral = crud.create_spiral(db=db, **spiral.model_dump())
    
    # Note: Email is sent after scoring completes (in score_spiral endpoint)
    # This ensures we have the score and diagnosis to include in the summary
    
    return saved_spiral

@app.get("/spirals/{spiral_id}", response_model=Spiral)
def get_spiral(spiral_id: int, db: Session = Depends(get_db)):
    """
    Get a spiral by its ID.
    """
    # use crud helper to get spiral
    db_spiral = crud.get_spiral(db=db, spiral_id=spiral_id)
    if db_spiral is None:
        raise HTTPException(status_code=404, detail="Spiral not found")
    return db_spiral

POPSTATS_PATH = "Population Stats USCI.json"  # Adjust as needed

@app.post("/spirals/{spiral_id}/score", response_model=ScoreSummary)
def score_spiral(spiral_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_spiral = crud.get_spiral(db=db, spiral_id=spiral_id)
    if db_spiral is None:
        raise HTTPException(status_code=404, detail="Spiral not found")

    spiral_json = db_spiral.normalized_json or db_spiral.raw_json
    if not spiral_json:
        raise HTTPException(status_code=400, detail="Spiral has no raw_json/normalized_json to score")

    # Pull a,b from form_json (preferred), otherwise fallback to trace json
    def _try_get_ab(obj):
        if not isinstance(obj, dict):
            return None
        a = obj.get("a", obj.get("a []")) # Based on Andrew's extraction code syntax
        b = obj.get("b", obj.get("b []", obj.get("b [/rad]")))
        if a is None or b is None:
            return None
        return float(a), float(b)

    # Attempt to get a, b spiral params based on type of json file (form_json > normalized)json > raw_json)
    ab = _try_get_ab(db_spiral.form_json) or _try_get_ab(db_spiral.normalized_json) or _try_get_ab(db_spiral.raw_json)
    if ab is None:
        raise HTTPException(status_code=400, detail="Missing spiral template params a/b")
    a, b = ab

    try:
        artifact = score_spiral_json(
            spiral_json=spiral_json,
            a=a,
            b=b,
            popstats_path=POPSTATS_PATH,
            include_image=True,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Scoring failed: {str(e)}")

    final_score = float(artifact["scoring"]["final_score"])
    classification = "tremor_score_v1"

    # Debug: Print scoring details to understand extreme scores
    print(f"\n=== SCORING DEBUG ===")
    print(f"Final Score: {final_score}")
    print(f"Z-scores: {artifact['scoring']['z_scores']}")
    print(f"Weighted contributions: {artifact['scoring']['weighted_contributions']}")
    print(f"Raw metrics: {artifact['metrics']}")
    print(f"=====================\n")

    # store in Result.features (DB)
    features = {
        "metrics": artifact["metrics"],
        "scoring": artifact["scoring"],
        "debug": artifact["debug"],
        "generated_at": artifact["generated_at"],
        "version": artifact["version"],
    }

    result_row = crud.create_or_update_result_for_spiral(
        db=db,
        spiral_id=spiral_id,
        features=features,
        classification=classification,
        severity_score=final_score,
        report_path="",
    )

    # Send email with results in background
    try:
        # Get the spiral data for email
        json_path = f"spiral_{spiral_id}.json"
        with open(json_path, "w") as f:
            json.dump({
                "id": db_spiral.id,
                "user_id": db_spiral.user_id,
                "device_name": db_spiral.device_name,
                "form_json": db_spiral.form_json,
                "raw_json": db_spiral.raw_json,
                "normalized_json": db_spiral.normalized_json,
                "created_at": str(db_spiral.created_at),
            }, f, indent=2, default=str)
        
        # Prepare result data for email summary
        result_data = {
            "severity_score": result_row.severity_score,
            "classification": result_row.classification,
        }
        
        # Send email in background with result data
        background_tasks.add_task(send_trial_result_email, None, json_path, None, result_data)
    except Exception as e:
        # don't fail the request if email fails
        print(f"Error preparing email: {e}")

    return {
        "spiral_id": spiral_id,
        "severity_score": result_row.severity_score,
        "classification": result_row.classification,
        "features": result_row.features,
        "spiral_image_png_base64": artifact["report"].get("spiral_image_png_base64"),
    }

@app.post("/results/", response_model=Result)
def create_result(result: ResultIn, db: Session = Depends(get_db)):
    """
    Save a new analysis result to the database.
    """
    # use crud helper to save result
    try:
        return crud.create_result_for_spiral(db=db, **result.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/results/{result_id}", response_model=Result)
def get_result(result_id: int, db: Session = Depends(get_db)):
    """
    Get a result by its ID.
    """
    # use crud helper to get result
    db_result = crud.get_result(db=db, result_id=result_id)
    if db_result is None:
        raise HTTPException(status_code=404, detail="Result not found")
    return db_result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
