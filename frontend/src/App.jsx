import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import CandidateDashboard from './pages/CandidateDashboard';
import JobListings from './pages/JobListings';
import ApplicationsHistory from './pages/ApplicationsHistory';
import EmployerDashboard from './pages/EmployerDashboard';
import { Loader2 } from 'lucide-react';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-primary-400 animate-spin mx-auto" />
          <p className="text-slate-400 font-bold text-sm uppercase tracking-wider">Verifying session tokens...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return isRegister ? (
      <Register onToggleLogin={() => setIsRegister(false)} />
    ) : (
      <Login onToggleRegister={() => setIsRegister(true)} />
    );
  }

  // Render Role-specific layouts
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />
      
      <div className="flex flex-1">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          role={user.role} 
        />
        
        <main className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden">
          {user.role === 'employer' ? (
            // Employer layout maps all sidebar items to specific views in EmployerDashboard
            <EmployerDashboard initialSubTab={activeTab} key={activeTab} />
          ) : (
            // Candidate layout maps tabs to separate page components
            <>
              {activeTab === 'dashboard' && <CandidateDashboard />}
              {activeTab === 'jobs' && <JobListings />}
              {activeTab === 'applications' && <ApplicationsHistory />}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
