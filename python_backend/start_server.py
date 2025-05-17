#!/usr/bin/env python3
"""
Start the BrightSide Emergency Notification API server.
"""

import os
import sys
import uvicorn
from dotenv import load_dotenv

def main():
    # Load environment variables
    load_dotenv()
    
    # Get port from environment variable or use default
    port = int(os.environ.get("PORT", "8000"))
    
    print(f"Starting BrightSide Emergency Notification API on port {port}...")
    
    # Start the API server
    uvicorn.run(
        "api:app",
        host="127.0.0.1",  # <-- changed from 0.0.0.0 to localhost
        port=port,
        reload=True  # Enable auto-reload for development
    )

if __name__ == "__main__":
    main()
