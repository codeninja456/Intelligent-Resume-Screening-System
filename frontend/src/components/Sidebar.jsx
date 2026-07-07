import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  PlusCircle, 
  Users, 
  History 
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, role }) => {
  
  const candidateItems = [
    { id: 'dashboard', label: 'My Profile & Resume', icon: FileText },
    { id: 'jobs', label: 'Match & Browse Jobs', icon: Briefcase },
    { id: 'applications', label: 'Applications History', icon: History },
  ];

  const employerItems = [
    { id: 'dashboard', label: 'Jobs Dashboard', icon: LayoutDashboard },
    { id: 'create-job', label: 'Post a New Job', icon: PlusCircle },
    { id: 'candidates', label: 'Search Candidates', icon: Users },
  ];

  const menuItems = role === 'employer' ? employerItems : candidateItems;

  return (
    <aside className="w-64 glass-panel min-h-[calc(100vh-80px)] border-r border-slate-100 p-4 space-y-6">
      <div className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-primary-600 to-sky-500 text-white shadow-md shadow-primary-500/25 scale-[1.02]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
      
      <div className="absolute bottom-6 left-6 right-6 p-4 bg-gradient-to-tr from-primary-900 to-primary-750 text-white rounded-xl text-xs space-y-2 hidden md:block">
        <p className="font-bold text-sky-300">Matching Engine v1.0</p>
        <p className="text-slate-300 leading-relaxed">
          Matches are computed instantly based on skill intersection (60%), experience (30%), and education (10%).
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
