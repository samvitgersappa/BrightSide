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
  const [emergencyContacts, setEmergencyContacts] = useState([
    { name: '', email: '', relationship: 'friend' as 'friend' },
    { name: '', email: '', relationship: 'parent' as 'parent' },
    { name: '', email: '', relationship: 'counselor' as 'counselor' },
  ]);
  const [emergencyContactsError, setEmergencyContactsError] = useState<string[]>([]);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const handleAddContact = () => {
    setEmergencyContacts([
      ...emergencyContacts,
      { name: '', email: '', relationship: 'friend' as 'friend' },
    ]);
    setEmergencyContactsError([...emergencyContactsError, '']);
  };

  const handleContactChange = (idx: number, field: 'name' | 'email' | 'relationship', value: string) => {
    const updated = [...emergencyContacts];
    if (field === 'relationship') {
      if (['counselor', 'parent', 'friend'].includes(value)) {
        updated[idx].relationship = value as 'counselor' | 'parent' | 'friend';
      } else {
        updated[idx].relationship = 'friend';
      }
    } else if (field === 'name') {
      updated[idx].name = value;
    } else if (field === 'email') {
      updated[idx].email = value;
    }
    setEmergencyContacts(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setEmergencyContactsError([]);

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
    // Validate emergency contacts
    const contactErrors: string[] = [];
    emergencyContacts.forEach((c, idx) => {
      let err = '';
      if (!c.name.trim()) err = 'Name required';
      else if (!c.relationship) err = 'Relationship required';
      else if (!c.email.trim()) err = 'Email required';
      else if (!/\S+@\S+\.\S+/.test(c.email)) err = 'Invalid email';
      contactErrors[idx] = err;
      if (err) valid = false;
    });
    setEmergencyContactsError(contactErrors);
    if (!valid) return;
    setIsSubmitting(true);
    try {
      // Prepare emergency contacts with ids
      const contactsWithId = emergencyContacts.map((c) => ({
        ...c,
        id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
      }));
      await signup(name, email, password, contactsWithId);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to create an account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-8 bg-white rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-3xl font-extrabold text-center text-indigo-700 mb-8 tracking-tight">Create Account</h2>
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-6 text-sm font-medium border border-red-200 flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-5">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-gray-400" />
              </span>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`block w-full pl-10 pr-3 py-2 border ${nameError ? 'border-red-400' : 'border-gray-300'} rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                placeholder="John Doe"
                required
              />
            </div>
            {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-400" />
              </span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`block w-full pl-10 pr-3 py-2 border ${emailError ? 'border-red-400' : 'border-gray-300'} rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                placeholder="you@example.com"
                required
              />
            </div>
            {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 border ${passwordError ? 'border-red-400' : 'border-gray-300'} rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                  placeholder="••••••••"
                  required
                />
              </div>
              {passwordError && <p className="mt-1 text-xs text-red-600">{passwordError}</p>}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </span>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 border ${confirmPasswordError ? 'border-red-400' : 'border-gray-300'} rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                  placeholder="••••••••"
                  required
                />
              </div>
              {confirmPasswordError && <p className="mt-1 text-xs text-red-600">{confirmPasswordError}</p>}
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Emergency Contacts</label>
          <div className="space-y-4">
            {emergencyContacts.map((contact, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col gap-2 shadow-sm">
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={contact.name}
                    onChange={e => handleContactChange(idx, 'name', e.target.value)}
                    className="px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm border-gray-300"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={contact.email}
                    onChange={e => handleContactChange(idx, 'email', e.target.value)}
                    className="px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm border-gray-300"
                    required
                  />
                  <select
                    value={contact.relationship}
                    onChange={e => handleContactChange(idx, 'relationship', e.target.value)}
                    className="px-3 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm border-gray-300"
                    required
                  >
                    <option value="friend">Friend</option>
                    <option value="parent">Parent</option>
                    <option value="counselor">Counselor</option>
                  </select>
                </div>
                {emergencyContactsError[idx] && (
                  <p className="text-xs text-red-600 mt-1">{emergencyContactsError[idx]}</p>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddContact}
            className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium transition-all border border-indigo-100"
          >
            + Add Another Contact
          </button>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed mt-6 transition-all"
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
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-semibold transition-all">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;