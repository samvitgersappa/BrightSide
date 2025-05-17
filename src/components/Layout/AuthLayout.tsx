import React from 'react';
import { BrainCircuit } from 'lucide-react';
import { Outlet, Link } from 'react-router-dom';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center">
            <BrainCircuit className="h-12 w-12 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mt-4">BrightSide</h1>
          <p className="text-gray-600 mt-2">Emotional Intelligence & Communication Platform</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <Outlet />
        </div>
        
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>© 2025 BrightSide. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;