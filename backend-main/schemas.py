"""
Defines the shapes of data that the api accepts and returns.
* each class tells the api what fields to expect when someone sends data
* each class tells the api what fields to include when sending data back
pydantic automatically checks that incoming data matches these shapes.
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Any, Dict, List, Optional

# base class with common user fields
class UserBase(BaseModel):
    display_name: str
    role: str = "clinician"

# used when someone wants to create a new user (data coming in)
class UserIn(UserBase):
    pass

# used when sending user data back (includes id that database created)
class User(UserBase):
    id: int
    
    class Config:
        from_attributes = True

# base class with common spiral fields
class SpiralBase(BaseModel):
    user_id: int
    device_name: str
    dpi: float = 0.0
    mm_per_unit: float = 0.0
    form_json: dict
    raw_json: dict
    normalized_json: dict
    png_path: str = ""

# used when someone wants to create a new spiral (data coming in)
class SpiralIn(SpiralBase):
    pass

# used when sending spiral data back (includes id and timestamp that database created)
class Spiral(SpiralBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# base class with common result fields
class ResultBase(BaseModel):
    spiral_id: int
    features: dict
    classification: str
    severity_score: float
    report_path: str = ""

# used when someone wants to create a new result (data coming in)
class ResultIn(ResultBase):
    pass

# used when sending result data back (includes id and timestamp that database created)
class Result(ResultBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# used when displaying score summary in report format; presentation/response schema
# high-level info only displayed: spiral ID, severity score calculated from model, classification, main features from data extraction
class ScoreSummary(BaseModel):
    spiral_id: int
    severity_score: float
    classification: str
    features: Dict[str, Any]
    spiral_image_png_base64: Optional[str] = None  # for frontend display page

# NOTE: ScoreSummary is for API response, ResultBase is for database record
