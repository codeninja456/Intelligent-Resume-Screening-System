import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Clock,
  ThumbsUp,
  XCircle,
  HelpCircle
} from 'lucide-react';

const ApplicationsHistory = () => {
  const { getHeaders, apiUrl } = useAuth();
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch(`${apiUrl}/jobs/applications/my`, {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      } else {
        const err = await response.json();
        setErrorMsg(err.detail || 'Failed to fetch your applications history.');
      }
    } catch (error) {
      console.error('Error fetching applications history:', error);
      setErrorMsg('Failed to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const base = "inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize border ";
    switch (status) {
      case 'applied':
        return base + "bg-blue-50 text-blue-700 border-blue-200";
      case 'reviewing':
        return base + "bg-amber-50 text-amber-700 border-amber-200";
      case 'shortlisted':
        return base + "bg-emerald-50 text-emerald-700 border-emerald-200";
      case 'rejected':
        return base + "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return base + "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'applied':
        return <Clock className="h-4 w-4" />;
      case 'reviewing':
        return <HelpCircle className="h-4 w-4 text-amber-500 animate-pulse" />;
      case 'shortlisted':
        return <ThumbsUp className="h-4 w-4 text-emerald-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-rose-500" />;
      default:
        return null;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-250';
    if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-250';
    return 'bg-rose-50 text-rose-700 border-rose-250';
  };

  return (
    <div className="flex-1 p-8 space-y-8 max-w-5xl mx-auto overflow-y-auto">
      <div className="border-b border-slate-100 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Applications History</h1>
        <p className="text-sm font-medium text-slate-500">
          Monitor status updates and matching details for positions you have applied to.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start space-x-3 text-rose-800 text-sm">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-10 w-10 text-primary-500 animate-spin" />
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-150 shadow-sm rounded-2xl p-8">
          <Briefcase className="h-12 w-12 text-slate-350 mx-auto mb-2" />
          <p className="font-extrabold text-slate-600">You haven't submitted any job applications yet.</p>
          <p className="text-slate-400 text-sm mt-1">Browse active listings under "Match & Browse Jobs" to apply.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3 className="font-extrabold text-xl text-slate-855 tracking-tight">{app.job_title}</h3>
                    <span className={getStatusBadge(app.status)}>
                      {getStatusIcon(app.status)}
                      <span>{app.status}</span>
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
                    <Calendar className="h-4 w-4 text-slate-450" />
                    <span>Applied on {new Date(app.applied_at).toLocaleDateString()}</span>
                  </div>

                  <div className="text-xs text-slate-500 font-medium space-y-1.5 pt-2 border-t border-slate-100 mt-2">
                    <p><span className="font-bold text-slate-650 block">Skills match details:</span> {app.match_breakdown.skills}</p>
                    <p><span className="font-bold text-slate-650 block">Experience details:</span> {app.match_breakdown.experience}</p>
                    <p><span className="font-bold text-slate-650 block">Education details:</span> {app.match_breakdown.education}</p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center md:flex-col gap-2">
                  <div className={`border px-4 py-2 rounded-xl text-center flex flex-col justify-center items-center shadow-sm select-none ${getScoreColor(app.match_score)}`}>
                    <span className="text-lg font-black tracking-tight">{app.match_score}%</span>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold leading-none">Match Score</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationsHistory;
