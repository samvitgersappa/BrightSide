#!/usr/bin/env python3
"""
Emergency Notification API

A FastAPI server that provides an endpoint for sending emergency notifications
to contacts when a user is experiencing emotional distress.
"""

import os
import json
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel, EmailStr, Field
import uvicorn
from dotenv import load_dotenv
from email_service import send_emergency_alert
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from .env file
load_dotenv()

app = FastAPI(
    title="BrightSide Emergency Notification API",
    description="API for sending emergency notifications to contacts",
    version="1.0.0"
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models for API request validation
class Contact(BaseModel):
    id: str
    name: str
    email: Optional[EmailStr] = None
    relationship: str
    phone: Optional[str] = None

class User(BaseModel):
    id: str
    name: str
    email: EmailStr
    contacts: List[Contact]

class EmergencyAlertRequest(BaseModel):
    user: User
    emotionScore: float = Field(..., gt=0, le=100, description="Score indicating distress level (1-100)")
    message: str
    relationships: Optional[List[str]] = None


@app.post("/api/notify/emergency", status_code=200)
async def emergency_notification(request: EmergencyAlertRequest = Body(...)):
    """
    Send emergency notifications to specified contacts.
    """
    try:
        # Convert Pydantic model to dictionary
        user_dict = request.user.dict()
        
        # Validate email addresses for each contact
        valid_contacts = []
        for contact in user_dict["contacts"]:
            if contact.get("email") and "@" in contact["email"]:
                valid_contacts.append(contact)
        
        # Update user with only valid contacts
        user_dict["contacts"] = valid_contacts
        
        if not valid_contacts:
            return {"status": "warning", "message": "No valid email addresses found in contacts"}
        
        # Call the email service function
        success = send_emergency_alert(
            user_data=user_dict,
            emotion_score=request.emotionScore,
            message=request.message,
            relationships=request.relationships
        )
        
        if success:
            return {"status": "success", "message": "Emergency notifications sent successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send emergency notifications")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending notifications: {str(e)}")


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "emergency-notification-api"}


if __name__ == "__main__":
    # Get port from environment variable or use default
    port = int(os.environ.get("PORT", "8000"))
    
    # Run the server
    uvicorn.run(app, host="0.0.0.0", port=port)
