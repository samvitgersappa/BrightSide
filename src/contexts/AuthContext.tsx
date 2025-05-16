import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (name: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock data for demo purposes
const MOCK_USER: User = {
  id: '1',
  name: 'Alex Student',
  email: 'alex@university.edu',
  contacts: [
    { id: '1', name: 'Dr. Smith', email: 'smith@university.edu', relationship: 'counselor' },
    { id: '2', name: 'Jane Doe', email: 'jane@family.com', relationship: 'parent' },
    { id: '3', name: 'Bob Friend', email: 'bob@university.edu', relationship: 'friend' }
  ]
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user is stored in localStorage (simulating persistence)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // In a real app, this would be an API call
    // This is just for demo purposes
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo, any valid-looking email/password will work
    if (email && password.length >= 6) {
      // Use mock user data
      setUser(MOCK_USER);
      localStorage.setItem('user', JSON.stringify(MOCK_USER));
    } else {
      throw new Error('Invalid credentials');
    }
    
    setIsLoading(false);
  };

  const signup = async (name: string, email: string, password: string) => {
    // In a real app, this would be an API call
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (name && email && password.length >= 6) {
      // Create a new user based on the mock data but with the provided details
      const newUser = {
        ...MOCK_USER,
        name,
        email
      };
      
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      throw new Error('Invalid signup data');
    }
    
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        signup
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};