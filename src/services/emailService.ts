import { User, Contact } from '../types';

// Interface for email sending options
interface SendEmailOptions {
  to: string[];
  subject: string;
  body: string;
}

// URL for our Python backend API
const EMERGENCY_API_URL = import.meta.env.VITE_EMERGENCY_API_URL || 'http://localhost:8000';

/**
 * Sends an email via a hypothetical API endpoint
 * In a real application, this would connect to an email service API
 */
export const sendEmail = async (options: SendEmailOptions): Promise<boolean> => {
  // In a real app, this would use an actual email service API
  console.log('Sending email:', options);
  
  // Simulate API call
  try {
    // Mock successful email sending
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

/**
 * Sends an email notification using the Python SMTP backend
 */
export const sendMIMENotification = async (
  user: User,
  emotionScore: number,
  message: string,
  relationships?: Contact['relationship'][]
): Promise<boolean> => {
  try {
    // Filter out contacts without emails
    const validContacts = user.contacts.filter(contact => 
      contact.email && contact.email.trim() !== ''
    );
    
    // Create a user object with only valid contacts
    const userWithValidContacts = {
      ...user,
      contacts: validContacts
    };
    
    const response = await fetch(`${EMERGENCY_API_URL}/api/notify/emergency`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: userWithValidContacts,
        emotionScore,
        message,
        relationships
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to send MIME notification:', errorData);
      return false;
    }
    
    const data = await response.json();
    console.log('MIME notification sent successfully:', data);
    return true;
    
  } catch (error) {
    console.error('Error sending MIME notification:', error);
    return false;
  }
};

/**
 * Sends an emergency alert email to all contacts of specified relationships
 * @param user - The user whose contacts should be notified
 * @param emotionScore - The score indicating distress level
 * @param message - The message content that triggered the alert
 * @param relationships - Types of contacts to notify (defaults to all types)
 * @param useMIME - Whether to use the Python SMTP backend for sending (defaults to true)
 */
export const sendEmergencyAlert = async (
  user: User,
  emotionScore: number,
  message: string,
  relationships: Contact['relationship'][] = ['counselor', 'parent', 'friend'],
  useMIME: boolean = true
): Promise<boolean> => {
  // Filter contacts by specified relationships
  const contactsToAlert = user.contacts.filter(contact => 
    relationships.includes(contact.relationship)
  );
  
  if (contactsToAlert.length === 0) {
    console.warn('No emergency contacts found for specified relationships');
    return false;
  }
  
  // Use MIME notification if requested (and available)
  if (useMIME) {
    try {
      return await sendMIMENotification(user, emotionScore, message, relationships);
    } catch (error) {
      console.error('MIME notification failed, falling back to regular email:', error);
      // Continue with regular email as fallback
    }
  }
  
  // Format the email (used as fallback if MIME fails)
  const emailOptions: SendEmailOptions = {
    to: contactsToAlert.map(contact => contact.email).filter(Boolean) as string[],
    subject: `URGENT: Emotional Support Alert for ${user.name}`,
    body: `
      <h2>Emergency Alert: High Emotional Distress Detected</h2>
      <p>Our system has detected signs of significant emotional distress for ${user.name}.</p>
      
      <h3>Details:</h3>
      <ul>
        <li><strong>Distress Score:</strong> ${emotionScore}/100</li>
        <li><strong>Timestamp:</strong> ${new Date().toLocaleString()}</li>
        <li><strong>Message Content:</strong> "${message}"</li>
      </ul>
      
      <p>Please consider reaching out to ${user.name} as soon as possible to provide support.</p>
      
      <hr>
      <p><small>This is an automated message from the Emotional Support Platform.</small></p>
    `
  };
  
  return sendEmail(emailOptions);
};
