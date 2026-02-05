# LAST COMMIT: Anika Kulkarni, 1/30/26

# This script serves to establish helper functions that perform CRUD functions:
# (1) Create: add a new row (e.g. new user, new spiral trial)
# (2) Read: fetch rows (e.g. get spiral by ID, list a user's spirals)
# (3) Update: change existing rows (e.g. attach analysis result to a spiral)
# (4) Delete: remove a row (optional)
# FastAPI endpoints (routes) will then call these helpers!

import json 

from typing import List, Optional # Import type hints that made code self-explanatory
from sqlalchemy.orm import Session # Import SQLAlchemy's database session class (create sessions with db)
from sqlalchemy import select # Import functionality for SQL-like queries in Python
from datetime import datetime # Use to stamp records with current time

import models, schemas # Import other files

# USER HELPERS

def create_user(db: Session, display_name: str, role: str = "clinician") -> models.User:
    """
    Insert a new user. Pass in active database session and the validated Pydantic object the route receives from JSON. 
    """
    user = models.User( # Create a new row via ORM object (Python's version of a row)
        display_name = display_name,
	role = role
    )
    db.add(user) # Stage object for insertion
    db.flush()  # Pushes the insert to the database without committing yet - assigns id from SQLite for instant referencability 
    return user # Returns ORM object to FastAPI can convert to JSON

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    """
    Fetch one user by primary key. Basically does <select * from users where id = user_id>.
    """
    return db.get(models.User, user_id) # Returns matching user object or "None" if not found

# SPIRAL HELPERS

def create_spiral(
    db: Session,
    user_id: int,
    device_name: str,
    dpi: float,
    mm_per_unit: float,
    form_json: dict,
    raw_json: dict,
    normalized_json: dict,
    png_path: str = ""
) -> models.Spiral:
    """
    Create a new Spiral trial row.
    Each spiral stores raw + normalized data for one test.
    """
    spiral = models.Spiral(
        user_id = user_id,
        device_name = device_name,
        dpi = dpi,
        mm_per_unit = mm_per_unit,
        form_json = form_json,
        raw_json = raw_json,
        normalized_json = normalized_json,
        png_path = png_path,
        created_at = datetime.utcnow()
    )

    db.add(spiral) # Stage new spiral for insertion
    db.flush() # Push to DB so .id is assigned
    return spiral

def get_spiral(db: Session, spiral_id: int):
    """Fetch a spiral by its primary key."""
    return db.get(models.Spiral, spiral_id)

def list_spirals_for_user(db: Session, user_id: int):
    """List all spirals linked to a given user."""
    return db.query(models.Spiral).filter(models.Spiral.user_id == user_id).all()

# RESULTS

def create_result_for_spiral(
    db: Session,
    spiral_id: int,
    features: dict,
    classification: str,
    severity_score: float,
    report_path: str
) -> models.Result:
    spiral = db.get(models.Spiral, spiral_id)
    if spiral is None:
        raise ValueError(f"Spiral id {spiral_id} not found")
    result = models.Result(
        spiral_id = spiral_id,
        features = features,
        classification = classification,
        severity_score = severity_score,
        report_path = report_path,
        created_at = datetime.utcnow()
    )
    db.add(result)
    db.flush()
    return result 

def get_result(db: Session, result_id: int) -> Optional[models.Result]:
    return db.get(models.Result, result_id)

def get_result_for_spiral(db: Session, spiral_id: int) -> Optional[models.Result]:
    stmt = (
        select(models.Result)
        .where(models.Result.spiral_id == spiral_id)
        .order_by(models.Result.created_at.desc())
        .limit(1)
    )
    return db.scalar(stmt) # Fetch most recent result linked to a given spiral, useful when analysis is rerun

# EXTRA: If the spiral already has a result, update the most recent one. Otherwise, create a new result row.
def create_or_update_result_for_spiral(
    db: Session,
    spiral_id: int,
    features: dict,
    classification: str,
    severity_score: float,
    report_path: str = ""
) -> models.Result:
    spiral = db.get(models.Spiral, spiral_id)
    if spiral is None:
        raise ValueError(f"Spiral id {spiral_id} not found")

    existing = get_result_for_spiral(db, spiral_id)

	# Keep created_at as original
    if existing is not None:
        existing.features = features
        existing.classification = classification
        existing.severity_score = severity_score
        existing.report_path = report_path
        db.flush()
        return existing

    # Fallback: create new spiral if not already existing
    return create_result_for_spiral(
        db=db,
        spiral_id=spiral_id,
        features=features,
        classification=classification,
        severity_score=severity_score,
        report_path=report_path,
    )

