import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Bell, Users, Shield, Save, Trash2, Plus, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Contact } from '../../types';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  
  const [generalSettings, setGeneralSettings] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '555-123-4567',
  });
  
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    weeklyReport: true,
    distressThreshold: 70,
  });
  
  const [contacts, setContacts] = useState(user?.contacts || []);
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    relationship: 'counselor' as 'counselor' | 'parent' | 'friend',
  });
  
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'contacts' | 'privacy'>('profile');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Reset form when editing changes
  useEffect(() => {
    if (isEditing) {
      const contact = contacts.find(c => c.id === isEditing);
      if (contact) {
        setEditingContact(contact);
      }
    } else {
      setEditingContact(null);
    }
  }, [isEditing, contacts]);

  // Handle profile form changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGeneralSettings({
      ...generalSettings,
      [e.target.name]: e.target.value,
    });
    
    // Clear any errors
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: '',
      });
    }
  };
  
  // Handle notification toggle changes
  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : parseInt(e.target.value);
    setNotifications({
      ...notifications,
      [e.target.name]: value,
    });
  };
  
  // Handle new contact form changes
  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (isEditing && editingContact) {
      setEditingContact({
        ...editingContact,
        [e.target.name]: e.target.value,
      } as Contact);
    } else {
      setNewContact({
        ...newContact,
        [e.target.name]: e.target.value,
      });
    }
    
    // Clear any errors
    if (errors[`contact_${e.target.name}`]) {
      setErrors({
        ...errors,
        [`contact_${e.target.name}`]: '',
      });
    }
  };
  
  // Validate contact form
  const validateContactForm = (data: typeof newContact | Contact) => {
    const newErrors: Record<string, string> = {};
    if (!data.name.trim()) {
      newErrors.contact_name = 'Name is required';
    }
    if (!(data.email ?? '').trim()) {
      newErrors.contact_email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(data.email ?? '')) {
      newErrors.contact_email = 'Email is invalid';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Add new contact
  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && editingContact) {
      const normalized = {
        ...editingContact,
        email: editingContact.email ?? '',
        phone: editingContact.phone ?? '',
      };
      if (validateContactForm(normalized)) {
        setContacts(contacts.map(c => c.id === isEditing ? editingContact : c));
        setIsEditing(null);
        setEditingContact(null);
        showSaveSuccess();
      }
    } else {
      if (validateContactForm(newContact)) {
        const newContactWithId = {
          ...newContact,
          id: Date.now().toString(),
        };
        
        setContacts([...contacts, newContactWithId]);
        setNewContact({
          name: '',
          email: '',
          relationship: 'counselor',
        });
        showSaveSuccess();
      }
    }
  };
  
  // Delete contact
  const handleDeleteContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
    if (isEditing === id) {
      setIsEditing(null);
      setEditingContact(null);
    }
    showSaveSuccess();
  };
  
  // Edit contact
  const handleEditContact = (id: string) => {
    setIsEditing(id);
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(null);
    setEditingContact(null);
  };
  
  // Save general settings
  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!generalSettings.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!generalSettings.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(generalSettings.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      // In a real app, this would make an API call to update settings
      showSaveSuccess();
    }
  };
  
  // Save notification settings
  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would make an API call to update settings
    showSaveSuccess();
  };
  
  // Save privacy settings
  const handleSavePrivacy = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would make an API call to update settings
    showSaveSuccess();
  };
  
  // Show success message
  const showSaveSuccess = () => {
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  // Tab navigation component
  const TabNavigation = () => (
    <div className="flex flex-col sm:flex-row border-b border-gray-200 mb-6">
      <button
        onClick={() => setActiveTab('profile')}
        className={`flex items-center px-4 py-2 text-sm font-medium transition-colors border-b-2 mb-2 sm:mb-0 ${
          activeTab === 'profile'
            ? 'border-indigo-500 text-indigo-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        <User className="h-4 w-4 mr-2" />
        Profile
      </button>
      <button
        onClick={() => setActiveTab('notifications')}
        className={`flex items-center px-4 py-2 text-sm font-medium transition-colors border-b-2 mb-2 sm:mb-0 ${
          activeTab === 'notifications'
            ? 'border-indigo-500 text-indigo-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        <Bell className="h-4 w-4 mr-2" />
        Notifications
      </button>
      <button
        onClick={() => setActiveTab('contacts')}
        className={`flex items-center px-4 py-2 text-sm font-medium transition-colors border-b-2 mb-2 sm:mb-0 ${
          activeTab === 'contacts'
            ? 'border-indigo-500 text-indigo-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        <Users className="h-4 w-4 mr-2" />
        Alert Contacts
      </button>
      <button
        onClick={() => setActiveTab('privacy')}
        className={`flex items-center px-4 py-2 text-sm font-medium transition-colors border-b-2 mb-2 sm:mb-0 ${
          activeTab === 'privacy'
            ? 'border-indigo-500 text-indigo-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        <Shield className="h-4 w-4 mr-2" />
        Privacy
      </button>
    </div>
  );

  // Success message component
  const SuccessMessage = () => (
    <div className={`fixed bottom-4 right-4 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-lg shadow-lg flex items-center transition-all duration-300 ${
      saveSuccess ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
    }`}>
      <Check className="h-5 w-5 text-emerald-500 mr-2" />
      <span>Settings saved successfully!</span>
    </div>
  );

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account preferences and contact information</p>
      </header>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <TabNavigation />
        
        {/* Profile Settings */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveGeneral} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={generalSettings.name}
                  onChange={handleProfileChange}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:ring-indigo-500 focus:border-indigo-500`}
                  placeholder="Your full name"
                />
              </div>
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={generalSettings.email}
                  onChange={handleProfileChange}
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:ring-indigo-500 focus:border-indigo-500`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone size={18} className="text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={generalSettings.phone}
                  onChange={handleProfileChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="555-123-4567"
                />
              </div>
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                className="flex items-center justify-center w-full sm:w-auto px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Save size={18} className="mr-2" />
                Save Profile Settings
              </button>
            </div>
          </form>
        )}
        
        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <form onSubmit={handleSaveNotifications} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Email Alerts</h3>
                  <p className="text-xs text-gray-500">Receive alerts via email when distress is detected</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="emailAlerts"
                    checked={notifications.emailAlerts}
                    onChange={handleNotificationChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">SMS Alerts</h3>
                  <p className="text-xs text-gray-500">Receive urgent alerts via SMS message</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="smsAlerts"
                    checked={notifications.smsAlerts}
                    onChange={handleNotificationChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Weekly Report</h3>
                  <p className="text-xs text-gray-500">Receive a weekly summary of emotional and debate performance</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="weeklyReport"
                    checked={notifications.weeklyReport}
                    onChange={handleNotificationChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              <div className="pt-2">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Distress Alert Threshold</h3>
                <p className="text-xs text-gray-500 mb-3">Set the level at which distress alerts are triggered (0-100)</p>
                <div className="flex items-center">
                  <input
                    type="range"
                    name="distressThreshold"
                    min="0"
                    max="100"
                    value={notifications.distressThreshold}
                    onChange={handleNotificationChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700 min-w-[40px]">
                    {notifications.distressThreshold}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                className="flex items-center justify-center w-full sm:w-auto px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Save size={18} className="mr-2" />
                Save Notification Settings
              </button>
            </div>
          </form>
        )}
        
        {/* Contacts Settings */}
        {activeTab === 'contacts' && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600">
              Manage contacts who will receive alerts if high distress is detected. Add counselors, parents, or friends to your emergency contacts.
            </p>
            
            <div className="space-y-4">
              {contacts.map((contact) => (
                <div 
                  key={contact.id}
                  className={`p-4 border rounded-lg transition-all ${
                    isEditing === contact.id
                      ? 'border-indigo-300 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {isEditing === contact.id ? (
                    <form className="space-y-3">
                      <div>
                        <label htmlFor="edit_name" className="block text-sm font-medium text-gray-700 mb-1">
                          Name
                        </label>
                        <input
                          id="edit_name"
                          name="name"
                          type="text"
                          value={editingContact?.name || ''}
                          onChange={handleContactChange}
                          className={`block w-full px-3 py-2 border ${
                            errors.contact_name ? 'border-red-300' : 'border-gray-300'
                          } rounded-lg focus:ring-indigo-500 focus:border-indigo-500`}
                          placeholder="Contact name"
                        />
                        {errors.contact_name && <p className="mt-1 text-sm text-red-600">{errors.contact_name}</p>}
                      </div>
                      
                      <div>
                        <label htmlFor="edit_email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          id="edit_email"
                          name="email"
                          type="email"
                          value={editingContact?.email || ''}
                          onChange={handleContactChange}
                          className={`block w-full px-3 py-2 border ${errors.contact_email ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-indigo-500 focus:border-indigo-500`}
                          placeholder="contact@example.com"
                        />
                        {errors.contact_email && <p className="mt-1 text-sm text-red-600">{errors.contact_email}</p>}
                      </div>
                      
                      <div>
                        <label htmlFor="edit_relationship" className="block text-sm font-medium text-gray-700 mb-1">
                          Relationship
                        </label>
                        <select
                          id="edit_relationship"
                          name="relationship"
                          value={editingContact?.relationship || 'counselor'}
                          onChange={handleContactChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="counselor">Counselor</option>
                          <option value="parent">Parent</option>
                          <option value="friend">Friend</option>
                        </select>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={handleAddContact}
                          className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-800">{contact.name}</h3>
                        <p className="text-sm text-gray-600">{contact.email}</p>
                        <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {contact.relationship.charAt(0).toUpperCase() + contact.relationship.slice(1)}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditContact(contact.id)}
                          className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                        >
                          <User size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {contacts.length === 0 && (
                <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
                  <Users className="mx-auto h-10 w-10 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts</h3>
                  <p className="mt-1 text-sm text-gray-500">Add emergency contacts who will be alerted in case of distress.</p>
                </div>
              )}
            </div>
            
            {!isEditing && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Add New Contact</h3>
                <form onSubmit={handleAddContact} className="space-y-3">
                  <div>
                    <input
                      type="text"
                      name="name"
                      value={newContact.name}
                      onChange={handleContactChange}
                      placeholder="Contact name"
                      className={`block w-full px-3 py-2 border ${
                        errors.contact_name ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:ring-indigo-500 focus:border-indigo-500`}
                    />
                    {errors.contact_name && <p className="mt-1 text-sm text-red-600">{errors.contact_name}</p>}
                  </div>
                  
                  <div>
                    <input
                      type="email"
                      name="email"
                      value={newContact.email}
                      onChange={handleContactChange}
                      placeholder="Email address"
                      className={`block w-full px-3 py-2 border ${
                        errors.contact_email ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:ring-indigo-500 focus:border-indigo-500`}
                    />
                    {errors.contact_email && <p className="mt-1 text-sm text-red-600">{errors.contact_email}</p>}
                  </div>
                  
                  <div className="flex space-x-2">
                    <select
                      name="relationship"
                      value={newContact.relationship}
                      onChange={handleContactChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="counselor">Counselor</option>
                      <option value="parent">Parent</option>
                      <option value="friend">Friend</option>
                    </select>
                    
                    <button
                      type="submit"
                      className="flex-shrink-0 flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Plus size={16} className="mr-1" />
                      Add
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
        
        {/* Privacy Settings */}
        {activeTab === 'privacy' && (
          <form onSubmit={handleSavePrivacy} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Share Analytics</h3>
                  <p className="text-xs text-gray-500">Allow your counselors to view your emotional analytics</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Anonymous Usage Data</h3>
                  <p className="text-xs text-gray-500">Share anonymous data to help improve the platform</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Content Backups</h3>
                  <p className="text-xs text-gray-500">Store encrypted backups of your conversations</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              <div className="pt-2">
                <button
                  type="button"
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Delete all my data and conversations
                </button>
              </div>
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                className="flex items-center justify-center w-full sm:w-auto px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Save size={18} className="mr-2" />
                Save Privacy Settings
              </button>
            </div>
          </form>
        )}
      </div>
      
      <SuccessMessage />
    </div>
  );
};

export default SettingsPage;