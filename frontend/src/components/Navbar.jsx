import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Briefcase, Award } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="glass-panel sticky top-0 z-50 px-6 py-4 shadow-sm flex items-center justify-between border-b border-slate-100">
      <div className="flex items-center space-x-2">
        <div className="bg-gradient-to-tr from-primary-600 to-sky-400 p-2.5 rounded-xl shadow-md text-white">
          <Briefcase className="h-6 w-6 animate-pulse" />
        </div>
        <div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary-600 to-sky-500 bg-clip-text text-transparent">
            MatchPoint
          </span>
          <span className="text-xs block font-semibold text-slate-400 uppercase tracking-widest leading-none">
            Parser & Matcher
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 border-r border-slate-200 pr-4">
          <div className="text-right">
            <span className="text-sm font-semibold text-slate-700 block">{user.name}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize inline-block text-white bg-gradient-to-r from-primary-500 to-sky-500">
              {user.role}
            </span>
          </div>
          <div className="bg-slate-100 h-10 w-10 rounded-full flex items-center justify-center text-slate-600 border border-slate-200">
            <User className="h-5 w-5" />
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center space-x-1.5 px-3 py-2 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors duration-200 rounded-lg cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
