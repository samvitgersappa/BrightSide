import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState('');
  const [emergencyContactEmail, setEmergencyContactEmail] = useState('');
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [emergencyContactNameError, setEmergencyContactNameError] = useState('');
  const [emergencyContactRelationshipError, setEmergencyContactRelationshipError] = useState('');
  const [emergencyContactEmailError, setEmergencyContactEmailError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setEmergencyContactNameError('');
    setEmergencyContactRelationshipError('');
    setEmergencyContactEmailError('');

    let valid = true;

    if (!name.trim()) {
      setNameError('Name is required');
      valid = false;
    }
    if (!email.trim()) {
      setEmailError('Email is required');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email is invalid');
      valid = false;
    }
    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    }
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      valid = false;
    }
    if (!emergencyContactName.trim()) {
      setEmergencyContactNameError('Emergency contact name is required');
      valid = false;
    }
    if (!emergencyContactRelationship.trim()) {
      setEmergencyContactRelationshipError('Relationship is required');
      valid = false;
    }
    if (!emergencyContactEmail.trim()) {
      setEmergencyContactEmailError('Emergency contact email is required');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(emergencyContactEmail)) {
      setEmergencyContactEmailError('Emergency contact email is invalid');
      valid = false;
    }
    if (!valid) return;
    setIsSubmitting(true);
    try {
      // Prepare emergency contact object
      const emergencyContact = {
        id: Date.now().toString(),
        name: emergencyContactName,
        email: emergencyContactEmail,
        relationship: emergencyContactRelationship as 'counselor' | 'parent' | 'friend',
      };
      // Pass emergency contact to signup (update your backend to accept this)
      await signup(name, email, password, [emergencyContact]);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to create an account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Create Account</h2>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`block w-full pl-10 pr-3 py-2 border ${nameError ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-indigo-500 focus:border-indigo-500`}
              placeholder="John Doe"
              required
            />
          </div>
          {nameError && <p className="mt-1 text-sm text-red-600">{nameError}</p>}
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
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`block w-full pl-10 pr-3 py-2 border ${emailError ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-indigo-500 focus:border-indigo-500`}
              placeholder="you@example.com"
              required
            />
          </div>
          {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={18} className="text-gray-400" />
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`block w-full pl-10 pr-3 py-2 border ${passwordError ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-indigo-500 focus:border-indigo-500`}
              placeholder="••••••••"
              required
            />
          </div>
          {passwordError && <p className="mt-1 text-sm text-red-600">{passwordError}</p>}
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={18} className="text-gray-400" />
            </div>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`block w-full pl-10 pr-3 py-2 border ${confirmPasswordError ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-indigo-500 focus:border-indigo-500`}
              placeholder="••••••••"
              required
            />
          </div>
          {confirmPasswordError && <p className="mt-1 text-sm text-red-600">{confirmPasswordError}</p>}
        </div>
        
        <div>
          <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700 mb-1">
            Emergency Contact Name
          </label>
          <input
            id="emergencyContactName"
            type="text"
            value={emergencyContactName}
            onChange={(e) => setEmergencyContactName(e.target.value)}
            className={`block w-full px-3 py-2 border ${emergencyContactNameError ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-indigo-500 focus:border-indigo-500`}
            placeholder="Jane Doe"
            required
          />
          {emergencyContactNameError && <p className="mt-1 text-sm text-red-600">{emergencyContactNameError}</p>}
        </div>
        
        <div>
          <label htmlFor="emergencyContactRelationship" className="block text-sm font-medium text-gray-700 mb-1">
            Relationship to You
          </label>
          <input
            id="emergencyContactRelationship"
            type="text"
            value={emergencyContactRelationship}
            onChange={(e) => setEmergencyContactRelationship(e.target.value)}
            className={`block w-full px-3 py-2 border ${emergencyContactRelationshipError ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-indigo-500 focus:border-indigo-500`}
            placeholder="Parent, Friend, Sibling, etc."
            required
          />
          {emergencyContactRelationshipError && <p className="mt-1 text-sm text-red-600">{emergencyContactRelationshipError}</p>}
        </div>
        
        <div>
          <label htmlFor="emergencyContactEmail" className="block text-sm font-medium text-gray-700 mb-1">
            Emergency Contact Email
          </label>
          <input
            id="emergencyContactEmail"
            type="email"
            value={emergencyContactEmail}
            onChange={(e) => setEmergencyContactEmail(e.target.value)}
            className={`block w-full px-3 py-2 border ${emergencyContactEmailError ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-indigo-500 focus:border-indigo-500`}
            placeholder="contact@example.com"
            required
          />
          {emergencyContactEmailError && <p className="mt-1 text-sm text-red-600">{emergencyContactEmailError}</p>}
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <Loader size={18} className="animate-spin mr-2" />
              Creating account...
            </span>
          ) : (
            'Sign Up'
          )}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;