from db import SessionLocal, Base, engine
import crud, models
from datetime import datetime

# Create dummy spiral
sp = models.Spiral(
    user_id = 1,
    device_name = "Lenovo",
    dpi = 254,
    mm_per_unit = 0.1,
    form_json = {"age": 10},
    raw_json = {"strokes": []},
    normalized_json = {"points": []},
    png_path = "storage/test.png",
    created_at = datetime.utcnow()
)
db.add(sp)
db.flush()

# Call CRUD function
res = crud.create_result_for_spiral(
    db = db,
    spiral_id = sp.id,
    features = {"speed": 2.5},
    classification = "mild",
    severity_score = 0.33,
    report_path = "storage/test_report.txt"
)

db.commit()
print("Created result:", res.id, res.classification)

