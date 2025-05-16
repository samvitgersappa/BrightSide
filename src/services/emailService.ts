import { User, Contact } from '../types';

// Interface for email sending options
interface SendEmailOptions {
  to: string[];
  subject: string;
  body: string;
}

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
 * Sends an emergency alert email to all contacts of specified relationships
 * @param user - The user whose contacts should be notified
 * @param emotionScore - The score indicating distress level
 * @param message - The message content that triggered the alert
 * @param relationships - Types of contacts to notify (defaults to all types)
 */
export const sendEmergencyAlert = async (
  user: User,
  emotionScore: number,
  message: string,
  relationships: Contact['relationship'][] = ['counselor', 'parent', 'friend']
): Promise<boolean> => {
  // Filter contacts by specified relationships
  const contactsToAlert = user.contacts.filter(contact => 
    relationships.includes(contact.relationship)
  );
  
  if (contactsToAlert.length === 0) {
    console.warn('No emergency contacts found for specified relationships');
    return false;
  }
  
  // Format the email
  const emailOptions: SendEmailOptions = {
    to: contactsToAlert.map(contact => contact.email),
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
