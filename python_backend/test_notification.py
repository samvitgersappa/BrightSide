#!/usr/bin/env python3
"""
Test script for the emergency notification system.
This script will send a test notification to demonstrate the MIME email functionality.
"""

import json
import os
import sys
import requests
from dotenv import load_dotenv

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from email_service import send_emergency_alert

# Load environment variables
load_dotenv()

def test_direct_email():
    """Test sending an email directly using the email_service module."""
    # Sample user data
    user_data = {
        "id": "test-user-123",
        "name": "Test User",
        "email": "test@example.com",
        "contacts": [
            {
                "id": "contact-1",
                "name": "Emergency Contact 1",
                "email": "your-real-email@example.com",  # Replace with a real email to test
                "relationship": "friend",
                "phone": "555-123-4567"
            }
        ]
    }
    
    # Send the notification
    print("Sending test emergency notification directly...")
    success = send_emergency_alert(
        user_data=user_data,
        emotion_score=85.5,
        message="This is a test emergency message from BrightSide",
        relationships=["friend"]
    )
    
    if success:
        print("✅ Test notification sent successfully!")
    else:
        print("❌ Failed to send test notification")

def test_api_endpoint():
    """Test sending an email through the API endpoint."""
    # Only run if the API server is running
    api_url = os.environ.get("API_URL", "http://localhost:8000/api")
    
    # Sample request data
    request_data = {
        "user": {
            "id": "test-user-123",
            "name": "API Test User",
            "email": "test@example.com",
            "contacts": [
                {
                    "id": "contact-1",
                    "name": "Emergency Contact 1",
                    "email": "your-real-email@example.com",  # Replace with a real email to test
                    "relationship": "friend",
                    "phone": "555-123-4567"
                }
            ]
        },
        "emotionScore": 90.5,
        "message": "This is a test emergency message from the API",
        "relationships": ["friend"]
    }
    
    try:
        print(f"Sending test notification through API at {api_url}/notify/emergency...")
        response = requests.post(
            f"{api_url}/notify/emergency",
            json=request_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print(f"✅ API test successful: {response.json()}")
        else:
            print(f"❌ API test failed: {response.status_code}")
            print(response.text)
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to API server. Is it running?")

if __name__ == "__main__":
    print("BrightSide Emergency Notification Test")
    print("=====================================")
    
    # Check if we should skip API test
    skip_api = "--skip-api" in sys.argv
    
    # Ask for confirmation before sending emails
    print("\n⚠️  This will send real emails to the addresses configured in the test script.")
    confirmation = input("Are you sure you want to proceed? (y/N): ").lower()
    
    if confirmation == "y":
        # Run the direct test
        print("\n🚀 Running direct email test...")
        test_direct_email()
        
        # Run the API test if not skipped
        if not skip_api:
            print("\n🚀 Running API endpoint test...")
            test_api_endpoint()
    else:
        print("Test cancelled.")
