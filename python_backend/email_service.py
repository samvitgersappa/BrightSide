#!/usr/bin/env python3
"""
Emergency Email Notification Service

This script provides functionality to send MIMEText SMTP email notifications
to emergency contacts when a user is experiencing emotional distress.
"""

import os
import json
import smtplib
import argparse
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Optional
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Email configuration
# These should be set in environment variables for security
SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME", "your_email@gmail.com")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "your_email_password")
DEFAULT_FROM = os.environ.get("DEFAULT_FROM", "brightside_alerts@example.com")

class Contact:
    """Represents an emergency contact."""
    def __init__(self, name: str, email: str, relationship: str, phone: Optional[str] = None):
        self.name = name
        self.email = email
        self.relationship = relationship
        self.phone = phone

    @classmethod
    def from_dict(cls, data: Dict) -> 'Contact':
        """Create a Contact from a dictionary."""
        return cls(
            name=data.get("name", ""),
            email=data.get("email", ""),
            relationship=data.get("relationship", ""),
            phone=data.get("phone")
        )

class User:
    """Represents a user with emergency contacts."""
    def __init__(self, id: str, name: str, email: str, contacts: List[Contact]):
        self.id = id
        self.name = name
        self.email = email
        self.contacts = contacts
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'User':
        """Create a User from a dictionary."""
        contacts = [Contact.from_dict(c) for c in data.get("contacts", [])]
        return cls(
            id=data.get("id", ""),
            name=data.get("name", ""),
            email=data.get("email", ""),
            contacts=contacts
        )


def send_mime_email(
    to_addresses: List[str], 
    subject: str, 
    html_content: str, 
    from_address: str = DEFAULT_FROM
) -> bool:
    """
    Send a MIME email to a list of recipients.
    
    Args:
        to_addresses: List of recipient email addresses
        subject: Email subject
        html_content: HTML content of the email
        from_address: Sender email address
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    if not to_addresses:
        print("No recipients specified")
        return False

    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = from_address
        msg['To'] = ', '.join(to_addresses)
        
        # Attach HTML content
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Create plain text version as fallback
        plain_text = html_content.replace('<h2>', '').replace('</h2>', '\n\n')
        plain_text = plain_text.replace('<h3>', '').replace('</h3>', '\n')
        plain_text = plain_text.replace('<p>', '').replace('</p>', '\n')
        plain_text = plain_text.replace('<strong>', '').replace('</strong>', '')
        plain_text = plain_text.replace('<ul>', '\n').replace('</ul>', '\n')
        plain_text = plain_text.replace('<li>', '- ').replace('</li>', '\n')
        plain_text = plain_text.replace('<hr>', '-' * 40 + '\n')
        plain_text = plain_text.replace('<small>', '').replace('</small>', '')
        
        text_part = MIMEText(plain_text, 'plain')
        msg.attach(text_part)
        
        # Connect to server and send
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
            
        print(f"Successfully sent email to {len(to_addresses)} recipients")
        return True
        
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False


def send_emergency_alert(
    user_data: Dict, 
    emotion_score: float, 
    message: str, 
    relationships: Optional[List[str]] = None
) -> bool:
    """
    Send emergency alert emails to specified contacts.
    
    Args:
        user_data: User data including contacts
        emotion_score: Score indicating distress level
        message: The message that triggered the alert
        relationships: Types of contacts to notify (defaults to all types)
        
    Returns:
        bool: True if emails were sent successfully, False otherwise
    """
    # Create User object from dictionary
    user = User.from_dict(user_data)
    
    # Filter contacts by relationship if specified
    relationships = relationships or ["counselor", "parent", "friend"]
    # Ensure relationship is always a string (in case it comes from TypeScript enum)
    sanitized_relationships = [str(r).lower() for r in relationships]
    contacts_to_alert = [c for c in user.contacts if c.relationship.lower() in sanitized_relationships and c.email]
    
    if not contacts_to_alert:
        print("No emergency contacts found for specified relationships")
        return False
    
    # Create email content
    subject = f"URGENT: Emotional Support Alert for {user.name}"
    html_content = f"""
        <h2>Emergency Alert: High Emotional Distress Detected</h2>
        <p>Our system has detected signs of significant emotional distress for {user.name}.</p>
        
        <h3>Details:</h3>
        <ul>
            <li><strong>Distress Score:</strong> {emotion_score}/100</li>
            <li><strong>Timestamp:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</li>
            <li><strong>Message Content:</strong> "{message}"</li>
        </ul>
        
        <p>Please consider reaching out to {user.name} as soon as possible to provide support.</p>
        
        <hr>
        <p><small>This is an automated message from the BrightSide Emotional Support Platform.</small></p>
    """
    
    # Send the email
    return send_mime_email(
        to_addresses=[c.email for c in contacts_to_alert if c.email],
        subject=subject,
        html_content=html_content
    )


def main():
    """Command line interface for sending emergency alerts."""
    parser = argparse.ArgumentParser(description='Send emergency email notifications')
    parser.add_argument('--user', '-u', required=True, help='JSON string or file path with user data')
    parser.add_argument('--score', '-s', type=float, required=True, help='Emotional distress score')
    parser.add_argument('--message', '-m', required=True, help='Message that triggered the alert')
    parser.add_argument('--relationships', '-r', nargs='+', help='Relationships to notify (defaults to all)')
    
    args = parser.parse_args()
    
    # Process user data (either from file or direct JSON)
    user_data = None
    if os.path.isfile(args.user):
        with open(args.user, 'r') as f:
            user_data = json.load(f)
    else:
        try:
            user_data = json.loads(args.user)
        except json.JSONDecodeError:
            print("Error: User data must be valid JSON or a path to a JSON file")
            return False
    
    # Send the alert
    return send_emergency_alert(
        user_data=user_data,
        emotion_score=args.score,
        message=args.message,
        relationships=args.relationships
    )


if __name__ == "__main__":
    main()
