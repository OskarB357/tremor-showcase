# LAST COMMIT: Anika Kulkarni, 10/25/25

""" 
This script serves to define what tables will look like in the database.
* Each class (user, spiral, result) = a table
* Each variable (id, user_id, raw_json, etc.) = a column; aka class attributes

Once we define models, SQLAlchemy will then create the tables for us and let us insert/query rows using Python objects instead of raw SQL.
"""

# IMPORTS
from sqlalchemy.orm import Mapped, mapped_column # Import modern SQLAlchemy ORM typing style
from sqlalchemy import Integer, String, Float, JSON, DateTime, ForeignKey # Import column data types and constraints 
from datetime import datetime # Used for timestamps
from db import Base # Special parent class from db.py; any class inheriting from Base becomes a mapped table

class User(Base): # Inherits from base; SQLAlchemy knows it's a table
    __tablename__ = "users" 
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True) # Integer key, where each row gets a unique ID; index=True speeds up lookups by id
    display_name: Mapped[str] = mapped_column(String, index=True) # User's name, for faster indexing
    role: Mapped[str] = mapped_column(String, default="clinician") # String like "clinician" or "patient"
# TL;DR: this table stores system users 

class Spiral(Base):
    __tablename__ = "spirals"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True) # Primary key for a trial
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id")) # Sets up foreign key linking trial to a user (users.id); how we know who performed this trial
    device_name: Mapped[str] = mapped_column(String)
    dpi: Mapped[float] = mapped_column(Float, default=0.0) # Device scaling so we can convert pixels to mm (normalization)
    mm_per_unit: Mapped[float] = mapped_column(Float, default=0.0)
    form_json: Mapped[dict] = mapped_column(JSON) # JSON blob for questionnaire fields
    raw_json: Mapped[dict] = mapped_column(JSON) # Raw data received, like x, y, t, pressure, etc.
    normalized_json: Mapped[dict] = mapped_column(JSON) # Processed points in mm coordinates
    png_path: Mapped[str] = mapped_column(String, default="") # File path to a saved PNG preview 
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow) # Timestamp for history generation
# TL;DR: this table stores all spiral drawings; 1 spiral trial per row 

class Result(Base):
    __tablename__ = "results"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    spiral_id: Mapped[int] = mapped_column(ForeignKey("spirals.id")) # Links result back to source spiral
    features: Mapped[dict] = mapped_column(JSON) # JSON dictionary of computed metrics like frequency
    classification: Mapped[str] = mapped_column(String) # Summary output (tremor classification? severity classification? Whatever the model outputs) 
    severity_score: Mapped[float] = mapped_column(Float) # Summary output (tremor severity score)
    report_path: Mapped[str] = mapped_column(String, default="") # Optional saved summary file for clinician
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow) # Timestamp
# TL;DR: Stores computed metrics per spiral test
# Separating Result from Spiral b/c raw data is immutable in Spiral (raw results), whereas we can compute/compare multiple results over time in Result


