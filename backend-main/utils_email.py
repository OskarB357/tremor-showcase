"""
sends email with trial results attached
reads email settings from environment variables
"""

import os
import smtplib
import json
import io
import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import numpy as np

# default email to send results to
DEFAULT_RECIPIENT_EMAIL = "ob23@rice.edu"

def generate_spiral_image_from_json(json_file_path: str) -> bytes:
    """
    Generates a PNG image of the spiral from the JSON file with reference spiral overlay.
    Returns the image as bytes.
    """
    try:
        # Read the JSON file
        with open(json_file_path, 'r') as f:
            data = json.load(f)
        
        # Try to extract points from normalized_json first (preferred), then raw_json
        points = None
        if 'normalized_json' in data and 'points' in data['normalized_json']:
            points = data['normalized_json']['points']
        elif 'raw_json' in data and 'points' in data['raw_json']:
            points = data['raw_json']['points']
        elif 'points' in data:
            points = data['points']
        
        if not points or len(points) < 2:
            print(f"[EMAIL] Warning: No valid points found in JSON file for image generation")
            return None
        
        # Extract x and y coordinates (handle different key formats)
        x_coords = []
        y_coords = []
        for p in points:
            # Try different key formats
            if 'x' in p:
                x_coords.append(float(p['x']))
            elif 'x []' in p:
                x_coords.append(float(p['x []']))
            else:
                continue
                
            if 'y' in p:
                y_coords.append(float(p['y']))
            elif 'y []' in p:
                y_coords.append(float(p['y []']))
            else:
                continue
        
        if len(x_coords) < 2 or len(y_coords) < 2:
            print(f"[EMAIL] Warning: Not enough valid coordinates for image generation")
            return None
        
        # Convert to numpy arrays
        x_arr = np.array(x_coords)
        y_arr = np.array(y_coords)
        
        # Get reference spiral parameters (a and b) from form_json - these are already in mm (normalized)
        a_ref = 0
        b_ref = 0
        if 'form_json' in data:
            form = data['form_json']
            a_ref = float(form.get('a', 0))
            b_ref = float(form.get('b', 0))
        
        # The reference spiral should be centered at the canvas center, not the drawn spiral center
        # The frontend draws the reference spiral at (width/2, height/2) in pixels
        # After normalization, this becomes the center of the coordinate space
        # Since the reference spiral starts at r=0 (a=0), the starting point should be at the canvas center
        # Use the starting point of the drawn spiral as an estimate of the canvas center
        # (Users typically start drawing near the reference spiral center)
        start_x = x_arr[0]
        start_y = y_arr[0]
        
        # Alternatively, use the center of the bounding box as a more stable estimate
        # But the starting point is more accurate since the reference spiral starts at the center
        # Use a weighted approach: start point is more reliable for the center
        canvas_center_x = start_x
        canvas_center_y = start_y
        
        # Calculate center of drawn spiral for comparison
        drawn_center_x = np.mean(x_arr)
        drawn_center_y = np.mean(y_arr)
        
        # If the drawn spiral center is very different from start, use drawn center
        # Otherwise, use start point (which should be closer to canvas center)
        center_diff = np.sqrt((drawn_center_x - start_x)**2 + (drawn_center_y - start_y)**2)
        if center_diff > 20:  # If drawn center is far from start, user might have drawn off-center
            # Use drawn center in this case
            ref_center_x = drawn_center_x
            ref_center_y = drawn_center_y
        else:
            # Use start point (canvas center estimate)
            ref_center_x = canvas_center_x
            ref_center_y = canvas_center_y
        
        # Generate the spiral image
        fig = plt.figure(figsize=(6, 6))
        ax = plt.gca()
        
        # Draw only the actual drawn spiral (blue, solid)
        ax.plot(x_coords, y_coords, color='blue', linewidth=2)
        
        # Set equal aspect and remove axes
        ax.set_aspect("equal", adjustable="box")
        ax.axis("off")
        ax.set_title("Spiral Drawing Analysis", fontsize=12, pad=10)
        
        # Invert y-axis to match canvas coordinates (y increases downward in screen space)
        ax.invert_yaxis()
        
        # Save to bytes buffer
        buf = io.BytesIO()
        plt.savefig(buf, format="png", bbox_inches="tight", pad_inches=0.1, dpi=150)
        plt.close(fig)
        
        buf.seek(0)
        return buf.read()
        
    except Exception as e:
        print(f"[EMAIL] Error generating spiral image: {e}")
        import traceback
        traceback.print_exc()
        return None

def create_summary_json(json_file_path: str, result_data: dict = None) -> dict:
    """
    Creates a concise summary JSON with score and diagnosis, excluding coordinate data.
    """
    try:
        with open(json_file_path, 'r') as f:
            data = json.load(f)
        
        # Extract key information
        summary = {
            "spiral_id": data.get("id"),
            "created_at": data.get("created_at"),
            "device_name": data.get("device_name"),
        }
        
        # Add form data (patient info) if available
        if "form_json" in data:
            form = data["form_json"]
            summary["patient_info"] = {
                "age": form.get("age"),
                "has_tremor": form.get("has_tremor"),
                "movement_disorder": form.get("movement_disorder"),
            }
        
        # Add score and diagnosis from result_data if provided
        if result_data:
            summary["score"] = result_data.get("severity_score")
            summary["diagnosis"] = result_data.get("classification")
            # Add severity classification based on score
            score = result_data.get("severity_score", 0)
            if score < 0.3:
                summary["severity"] = "Normal"
            elif score < 1.0:
                summary["severity"] = "Mild"
            elif score < 2.0:
                summary["severity"] = "Moderate"
            else:
                summary["severity"] = "Severe"
        
        return summary
    except Exception as e:
        print(f"[EMAIL] Error creating summary JSON: {e}")
        return {}

def send_trial_result_email(to_email: str = None, json_file_path: str = None, image_path: str = None, result_data: dict = None):
    """
    sends trial result email. uses default email if none provided.
    """
    # use default email if none provided
    if to_email is None:
        to_email = DEFAULT_RECIPIENT_EMAIL
    
    if json_file_path is None:
        raise ValueError("json_file_path is required")
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "tremordiagnosticapp@gmail.com")
    smtp_password = os.getenv("SMTP_PASSWORD", "qvcxcwsxptesnekn")
    
    # check if email credentials are set
    if not smtp_user or not smtp_password:
        print("Warning: SMTP_USER or SMTP_PASSWORD not set. Email not sent.")
        return
    
    msg = MIMEMultipart()
    msg["From"] = smtp_user
    msg["To"] = to_email
    msg["Subject"] = "tremor trial result"
    msg.attach(MIMEText("processed trial data is attached.", "plain"))
    
    # Create and attach summary JSON (concise, no coordinates)
    summary = create_summary_json(json_file_path, result_data)
    if summary:
        summary_json = json.dumps(summary, indent=2, default=str)
        summary_part = MIMEText(summary_json, "plain")
        summary_part.add_header("Content-Disposition", f'attachment; filename= summary_{os.path.basename(json_file_path)}')
        msg.attach(summary_part)
        print(f"[EMAIL] Summary JSON created and attached")
    
    # Optionally attach full JSON file (commented out to reduce email size)
    # with open(json_file_path, "rb") as f:
    #     part = MIMEBase("application", "octet-stream")
    #     part.set_payload(f.read())
    #     encoders.encode_base64(part)
    #     part.add_header("Content-Disposition", f'attachment; filename= {os.path.basename(json_file_path)}')
    #     msg.attach(part)
    
    # Generate and attach spiral image from JSON data
    spiral_image_bytes = generate_spiral_image_from_json(json_file_path)
    if spiral_image_bytes:
        img_part = MIMEBase("application", "octet-stream")
        img_part.set_payload(spiral_image_bytes)
        encoders.encode_base64(img_part)
        spiral_id = os.path.basename(json_file_path).replace('.json', '').replace('spiral_', '')
        img_part.add_header("Content-Disposition", f'attachment; filename= spiral_{spiral_id}.png')
        msg.attach(img_part)
        print(f"[EMAIL] Spiral image generated and attached")
    else:
        print(f"[EMAIL] Warning: Could not generate spiral image")
    
    # Attach image if provided via image_path parameter (for backwards compatibility)
    if image_path and os.path.exists(image_path):
        with open(image_path, "rb") as f:
            img_part = MIMEBase("application", "octet-stream")
            img_part.set_payload(f.read())
            encoders.encode_base64(img_part)
            img_part.add_header("Content-Disposition", f'attachment; filename= {os.path.basename(image_path)}')
            msg.attach(img_part)

    try:
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        print(f"Email sent successfully to {to_email}")
    except Exception as e:
        print(f"Error sending email: {e}")
        # don't raise - email failure shouldn't break the app

