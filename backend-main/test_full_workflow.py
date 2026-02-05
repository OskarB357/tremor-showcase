import os
import json
from fastapi.testclient import TestClient
from db import Base, engine
from schemas import Result as ResultSchema
from utils_email import send_trial_result_email
from main import app

# setup
Base.metadata.create_all(bind=engine)
os.environ["SMTP_USER"] = "tremordiagnosticapp@gmail.com"
os.environ["SMTP_PASSWORD"] = "bokyzqmyfevkiayw"

client = TestClient(app)

# 1. creates user testing main.py
user_data = {"display_name": "Test Patient", "role": "patient"}
user_response = client.post("/users/", json=user_data)
user = user_response.json()
user_id = user["id"]

get_user_response = client.get(f"/users/{user_id}") #gets user by id

# 3. create spiral data
points = [{"x": 100 + i, "y": 200 + i, "t": i * 16} for i in range(50)]
spiral_data = {
    "user_id": user_id,
    "device_name": "iPad Pro",
    "dpi": 264.0,
    "mm_per_unit": 0.1,
    "form_json": {"age": 45, "hand": "right"},
    "raw_json": {"points": points},
    "normalized_json": {"points": [{"x": p["x"] * 0.1, "y": p["y"] * 0.1} for p in points]},
    "png_path": ""
}
spiral_response = client.post("/spirals/", json=spiral_data)
spiral = spiral_response.json()
spiral_id = spiral["id"]

# 4. test main.py
get_spiral_response = client.get(f"/spirals/{spiral_id}")

# 5. sample results data
result_data = {
    "spiral_id": spiral_id,
    "features": {"frequency_hz": 5.6, "amplitude_mm": 3.2, "velocity": 2.5},
    "classification": "moderate essential tremor",
    "severity_score": 7.5,
    "report_path": ""
}
result_response = client.post("/results/", json=result_data)
result = result_response.json()
result_id = result["id"]

# 6. test main.py
get_result_response = client.get(f"/results/{result_id}")

# 7. convert to JSON
result_schema = ResultSchema.model_validate(result)
json_path = "trial_result.json"
with open(json_path, "w") as f:
    json.dump(result_schema.model_dump(), f, indent=2, default=str)

# 8. send email
send_trial_result_email("ob23@rice.edu", json_path)

# clean
os.remove(json_path)

