from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pydantic
import os

app = FastAPI(title="Event Media Platform AI Service")

# Enable cross-origin resource sharing so your React frontend can call it directly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock in-memory vectors cluster database for biometric profiles
USER_FACE_PROFILES = {}

@app.get("/")
def read_root():
    return {"status": "online", "engine": "Face Recognition Cluster v1.0"}

@app.post("/api/ai/register-face")
async def register_face(
    user_id: str = Form(...), 
    file: UploadFile = File(...)
):
    try:
        # Validate that an image format payload was transmitted
        if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            raise HTTPException(status_code=400, detail="Invalid file type format extension.")
            
        # Read file contents into memory stream bytes buffer
        contents = await file.read()
        
        # SIMULATION STUB: In a full face_recognition deployment, you would process:
        # image = face_recognition.load_image_file(io.BytesIO(contents))
        # encoding = face_recognition.face_encodings(image)[0]
        
        # Save a simulated array vector mapping for this mock user balance sequence
        USER_FACE_PROFILES[str(user_id)] = [0.123, -0.456, 0.789]
        
        return {
            "success": True,
            "message": f"Biometric metadata vector assigned to user profile target matches.",
            "user_id": user_id,
            "filename": file.filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/scan-media-tags")
async def scan_media_tags(file: UploadFile = File(...)):
    # Simulation pipeline scanning bulk event pictures for registered faces & items
    return {
        "success": True,
        "detected_tags": ["Main Stage", "Tech", "Crowd"],
        "matched_user_ids": [4] # Matches currentUserId from your React component!
    }
