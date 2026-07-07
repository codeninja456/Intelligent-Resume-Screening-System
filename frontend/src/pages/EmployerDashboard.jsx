import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  PlusCircle, 
  Briefcase, 
  Users, 
  MapPin, 
  Award, 
  FileText, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  X,
  UserCheck,
  TrendingUp,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const EmployerDashboard = ({ initialSubTab = 'dashboard' }) => {
  const { getHeaders, apiUrl, user } = useAuth();
  
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab); // 'dashboard', 'create-job', 'candidates'
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected Job for viewing applicants & passive search
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [viewingApplicantsMode, setViewingApplicantsMode] = useState(false);

  // Selected Candidate for Profile Overview Modal
  const [selectedCandidate, setSelectedCandidate] = useState(null); // stores complete parsed profile
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Passive Candidates Search State
  const [passiveCandidates, setPassiveCandidates] = useState([]);
  const [loadingPassive, setLoadingPassive] = useState(false);
  const [searchJobId, setSearchJobId] = useState('');

  // Form State for Creating Job
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    required_skills: '',
    experience_level: 'Mid',
    required_experience_months: 24,
    education_level: 'Bachelor',
    location: '',
    salary_range: ''
  });
  const [postingJob, setPostingJob] = useState(false);

  useEffect(() => {
    fetchEmployerJobs();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'dashboard') {
      fetchEmployerJobs();
    }
  }, [activeSubTab]);

  const fetchEmployerJobs = async () => {
    setLoadingJobs(true);
    setErrorMsg('');
    try {
      // Get all jobs and filter locally by employer_id
      const response = await fetch(`${apiUrl}/jobs`, {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        // Backend doesn't have an employer-specific endpoint by default, so we filter by current employer ID
        const myJobs = data.filter(job => job.employer_id === user.id);
        setJobs(myJobs);
        
        // Auto-select first job for passive matching search defaults
        if (myJobs.length > 0 && !searchJobId) {
          setSearchJobId(myJobs[0].id);
        }
      } else {
        const err = await response.json();
        setErrorMsg(err.detail || 'Failed to fetch job listings.');
      }
    } catch (error) {
      console.error('Error fetching employer jobs:', error);
      setErrorMsg('Failed to connect to backend server.');
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setPostingJob(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Format skills from comma-separated string to list
    const skillsList = newJob.required_skills
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(s => s.length > 0);

    const jobData = {
      ...newJob,
      required_skills: skillsList,
      required_experience_months: parseInt(newJob.required_experience_months) || 0
    };

    try {
      const response = await fetch(`${apiUrl}/jobs/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(jobData)
      });

      if (response.ok) {
        setSuccessMsg('Job listing posted successfully!');
        setNewJob({
          title: '',
          description: '',
          required_skills: '',
          experience_level: 'Mid',
          required_experience_months: 24,
          education_level: 'Bachelor',
          location: '',
          salary_range: ''
        });
        setTimeout(() => {
          setSuccessMsg('');
          setActiveSubTab('dashboard');
        }, 2000);
      } else {
        const err = await response.json();
        setErrorMsg(err.detail || 'Failed to post job listing.');
      }
    } catch (error) {
      console.error('Error posting job:', error);
      setErrorMsg('Network error posting job.');
    } finally {
      setPostingJob(false);
    }
  };

  const handleViewApplicants = async (job) => {
    setSelectedJob(job);
    setViewingApplicantsMode(true);
    setLoadingApplicants(true);
    setErrorMsg('');
    try {
      const response = await fetch(`${apiUrl}/jobs/${job.id}/applicants`, {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setApplicants(data);
      } else {
        const err = await response.json();
        setErrorMsg(err.detail || 'Failed to fetch applicants.');
      }
    } catch (error) {
       console.error('Error fetching applicants:', error);
       setErrorMsg('Error loading applicants list.');
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleViewCandidateProfile = async (resumeId) => {
    if (!resumeId) {
      setErrorMsg('No resume parsed profile found for this applicant.');
      return;
    }
    setLoadingProfile(true);
    try {
      const response = await fetch(`${apiUrl}/resumes/${resumeId}`, {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedCandidate(data.parsed_data);
      } else {
        const err = await response.json();
        setErrorMsg(err.detail || 'Failed to retrieve candidate profile details.');
      }
    } catch (error) {
      console.error('Error loading candidate profile:', error);
      setErrorMsg('Network error fetching profile details.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePassiveSearch = async () => {
    if (!searchJobId) return;
    setLoadingPassive(true);
    setErrorMsg('');
    try {
      const response = await fetch(`${apiUrl}/matching/candidates/${searchJobId}`, {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setPassiveCandidates(data);
      } else {
        const err = await response.json();
        setErrorMsg(err.detail || 'Failed to search candidate pool.');
      }
    } catch (error) {
      console.error('Error fetching candidate pool matches:', error);
      setErrorMsg('Network error during matching execution.');
    } finally {
      setLoadingPassive(false);
    }
  };

  const handleUpdateApplicationStatus = async (appId, newStatus) => {
    // Standard mock API status update or backend update if desired
    // For this prototype, we'll update the local state to demonstrate status changes
    setApplicants(prev => prev.map(app => {
      if (app.id === appId) {
        return { ...app, status: newStatus };
      }
      return app;
    }));
    
    // We can also update passive candidates statuses locally
    setPassiveCandidates(prev => prev.map(cand => {
      if (cand.application_status !== 'Not Applied') {
        // Find if this application is active
        return { ...cand, application_status: newStatus };
      }
      return cand;
    }));

    setSuccessMsg(`Applicant status updated to: ${newStatus}`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  return (
    <div className="flex-1 p-8 space-y-8 max-w-5xl mx-auto overflow-y-auto">
      {/* Sub tabs selection */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Employer Portal</h1>
          <p className="text-sm font-medium text-slate-500">
            Post job vacancies and find matched candidate applications.
          </p>
        </div>
        
        <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-fit">
          <button
            onClick={() => { setActiveSubTab('dashboard'); setViewingApplicantsMode(false); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors duration-150 ${
              activeSubTab === 'dashboard' && !viewingApplicantsMode ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Posted Jobs
          </button>
          <button
            onClick={() => { setActiveSubTab('candidates'); setViewingApplicantsMode(false); handlePassiveSearch(); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors duration-150 ${
              activeSubTab === 'candidates' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Passive Matching
          </button>
          <button
            onClick={() => { setActiveSubTab('create-job'); setViewingApplicantsMode(false); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors duration-150 ${
              activeSubTab === 'create-job' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Post a Job
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start space-x-3 text-rose-800 text-sm">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-start space-x-3 text-emerald-800 text-sm">
          <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* VIEWING APPLICANTS MODE */}
      {viewingApplicantsMode && selectedJob && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setViewingApplicantsMode(false)}
                className="text-slate-500 hover:text-slate-800 font-bold text-sm cursor-pointer"
              >
                ← Back to Jobs
              </button>
              <ChevronRight className="h-4 w-4 text-slate-400" />
              <span className="font-extrabold text-slate-700">Applicants for: {selectedJob.title}</span>
            </div>
            <span className="text-xs bg-slate-100 border border-slate-200 text-slate-500 font-bold px-3 py-1 rounded-full">
              {applicants.length} Applicants
            </span>
          </div>

          {loadingApplicants ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-10 w-10 text-primary-500 animate-spin" />
            </div>
          ) : applicants.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-150 p-8 shadow-sm">
              <Users className="h-12 w-12 text-slate-350 mx-auto mb-2" />
              <p className="font-extrabold text-slate-600">No candidates have applied to this listing yet.</p>
              <p className="text-slate-400 text-sm mt-1">Try matching passive candidates using the "Passive Matching" tab.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applicants.map((app) => (
                <div key={app.id} className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-extrabold text-lg text-slate-800">{app.candidate_name}</span>
                      <span className="text-xs text-slate-400">Applied on {new Date(app.applied_at).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="text-xs text-slate-500 flex flex-col space-y-1">
                      <p><span className="font-semibold text-slate-600">Skills match:</span> {app.match_breakdown.skills}</p>
                      <p><span className="font-semibold text-slate-600">Experience match:</span> {app.match_breakdown.experience}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <div className={`border px-3 py-1 rounded-xl text-center flex flex-col justify-center items-center font-bold ${getScoreColor(app.match_score)}`}>
                      <span className="text-base font-extrabold">{app.match_score}%</span>
                      <span className="text-[8px] uppercase tracking-wider font-extrabold">Score</span>
                    </div>

                    <button
                      onClick={() => handleViewCandidateProfile(app.resume_id)}
                      className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all rounded-lg cursor-pointer flex items-center space-x-1"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Inspect Profile</span>
                    </button>

                    <select
                      value={app.status}
                      onChange={(e) => handleUpdateApplicationStatus(app.id, e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg text-slate-700 cursor-pointer"
                    >
                      <option value="applied">Applied</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* POSTED JOBS LIST TAB */}
      {activeSubTab === 'dashboard' && !viewingApplicantsMode && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-150 pb-2">
            <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-primary-500" />
              <span>Active Job Listings</span>
            </h2>
            <button
              onClick={() => setActiveSubTab('create-job')}
              className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center space-x-1 cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Post New Role</span>
            </button>
          </div>

          {loadingJobs ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-10 w-10 text-primary-500 animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-150 shadow-sm p-8">
              <Briefcase className="h-12 w-12 text-slate-350 mx-auto mb-2" />
              <p className="font-extrabold text-slate-600">You haven't posted any job vacancies yet.</p>
              <button 
                onClick={() => setActiveSubTab('create-job')}
                className="mt-3 text-xs bg-slate-850 hover:bg-slate-750 text-white font-bold px-4 py-2 rounded-lg cursor-pointer"
              >
                Create First Listing
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-shadow duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-xl text-slate-800 tracking-tight">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 text-xs font-semibold text-slate-500">
                      <span className="flex items-center space-x-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{job.location}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Award className="h-3.5 w-3.5" />
                        <span>{job.experience_level}</span>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewApplicants(job)}
                    className="px-5 py-2.5 bg-slate-850 hover:bg-slate-750 text-white font-bold text-sm rounded-lg shadow-sm hover:shadow active:scale-[0.98] transition-all cursor-pointer flex items-center space-x-1.5 w-fit shrink-0"
                  >
                    <Users className="h-4.5 w-4.5" />
                    <span>View Applicants</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE JOB TAB */}
      {activeSubTab === 'create-job' && (
        <form onSubmit={handleCreateJob} className="glass-panel p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="border-b border-slate-150 pb-2">
            <h2 className="text-lg font-bold text-slate-800">Job Posting Details</h2>
            <p className="text-xs text-slate-400">Fill in requirements to feed matching engine scoring variables.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Job Title</label>
              <input
                type="text"
                required
                placeholder="Senior Python Developer"
                value={newJob.title}
                onChange={(e) => setNewJob(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Job Location</label>
              <input
                type="text"
                required
                placeholder="New York, NY or Remote"
                value={newJob.location}
                onChange={(e) => setNewJob(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Experience Level</label>
              <select
                value={newJob.experience_level}
                onChange={(e) => setNewJob(prev => ({ ...prev, experience_level: e.target.value }))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 cursor-pointer"
              >
                <option value="Entry">Entry (0 - 2 years)</option>
                <option value="Mid">Mid (2 - 5 years)</option>
                <option value="Senior">Senior (5+ years)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Required Months</label>
              <input
                type="number"
                min="0"
                required
                value={newJob.required_experience_months}
                onChange={(e) => setNewJob(prev => ({ ...prev, required_experience_months: e.target.value }))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Education Level</label>
              <select
                value={newJob.education_level}
                onChange={(e) => setNewJob(prev => ({ ...prev, education_level: e.target.value }))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 cursor-pointer"
              >
                <option value="Any">Any</option>
                <option value="Bachelor">Bachelor</option>
                <option value="Master">Master</option>
                <option value="PhD">PhD</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Required Skills (Comma separated)</label>
              <input
                type="text"
                placeholder="python, react, fastapi, docker"
                value={newJob.required_skills}
                onChange={(e) => setNewJob(prev => ({ ...prev, required_skills: e.target.value }))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Salary Range</label>
              <input
                type="text"
                placeholder="e.g. $100k - $120k"
                value={newJob.salary_range}
                onChange={(e) => setNewJob(prev => ({ ...prev, salary_range: e.target.value }))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Description</label>
            <textarea
              required
              rows="4"
              placeholder="Provide a detailed description of the role, daily responsibilities, benefits, and required background."
              value={newJob.description}
              onChange={(e) => setNewJob(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={postingJob}
            className="w-full py-3.5 bg-slate-850 hover:bg-slate-750 text-white font-bold rounded-xl shadow shadow-slate-500/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            {postingJob ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlusCircle className="h-5 w-5" />}
            <span>Post Vacancy Listing</span>
          </button>
        </form>
      )}

      {/* PASSIVE MATCHING SEARCH TAB */}
      {activeSubTab === 'candidates' && (
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 flex-1 w-full">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Select job listing to match candidate pool</label>
              <select
                value={searchJobId}
                onChange={(e) => setSearchJobId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 cursor-pointer font-semibold"
              >
                {jobs.length === 0 ? (
                  <option value="">No Posted Jobs Available</option>
                ) : (
                  jobs.map(job => (
                    <option key={job.id} value={job.id}>{job.title} ({job.location})</option>
                  ))
                )}
              </select>
            </div>
            
            <button
              onClick={handlePassiveSearch}
              disabled={jobs.length === 0 || loadingPassive}
              className="px-6 py-3 bg-slate-850 hover:bg-slate-750 disabled:opacity-50 text-white font-bold text-sm rounded-lg active:scale-[0.98] transition-all cursor-pointer flex items-center space-x-1.5 w-full md:w-auto shrink-0 shadow-sm"
            >
              {loadingPassive ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <TrendingUp className="h-4.5 w-4.5" />}
              <span>Compute Match Scores</span>
            </button>
          </div>

          {loadingPassive ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-10 w-10 text-primary-500 animate-spin" />
            </div>
          ) : passiveCandidates.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-150 rounded-2xl p-8 shadow-sm">
              <Search className="h-12 w-12 text-slate-350 mx-auto mb-2" />
              <p className="font-extrabold text-slate-600">No passive candidate matches compiled.</p>
              <p className="text-slate-400 text-sm mt-1">Select a job and click "Compute Match Scores" to scan candidate pool.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {passiveCandidates.map((cand) => (
                <div key={cand.candidate_id} className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-extrabold text-lg text-slate-800">{cand.name}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {(cand.total_experience_months / 12).toFixed(1)} Yrs Exp
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex flex-col space-y-1">
                      <p><span className="font-semibold text-slate-600">Skills match:</span> {cand.match_breakdown.skills}</p>
                      <p><span className="font-semibold text-slate-600">Experience match:</span> {cand.match_breakdown.experience}</p>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {cand.skills.slice(0, 5).map(s => (
                        <span key={s} className="bg-slate-50 border border-slate-150 text-slate-500 text-[10px] px-2 py-0.5 rounded capitalize font-medium">
                          {s}
                        </span>
                      ))}
                      {cand.skills.length > 5 && (
                        <span className="text-[10px] text-slate-400 px-1 py-0.5 font-semibold">+{cand.skills.length - 5} more</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <div className={`border px-3 py-1 rounded-xl text-center flex flex-col justify-center items-center font-bold ${getScoreColor(cand.match_score)}`}>
                      <span className="text-base font-extrabold">{cand.match_score}%</span>
                      <span className="text-[8px] uppercase tracking-wider font-extrabold">Score</span>
                    </div>

                    <button
                      onClick={() => handleViewCandidateProfile(cand.resume_id)}
                      className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all rounded-lg cursor-pointer flex items-center space-x-1"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Inspect Profile</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CANDIDATE PROFILE OVERVIEW MODAL POPUP */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-150 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col relative animate-scale-up">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{selectedCandidate.name}</h3>
                <div className="flex items-center space-x-4 text-xs font-semibold text-slate-500">
                  <span>{selectedCandidate.email}</span>
                  <span>•</span>
                  <span>{selectedCandidate.phone}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Skills */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-sm text-slate-700 uppercase tracking-wider">Candidate Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.skills.map(s => (
                    <span key={s} className="bg-primary-50 border border-primary-200 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-full capitalize">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Work history */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-sm text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-1">Professional Experience</h4>
                <div className="space-y-4">
                  {selectedCandidate.experience.map((exp, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold text-slate-850 block">{exp.role}</span>
                          <span className="text-xs text-slate-500 font-semibold">{exp.company}</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-400">{exp.duration_str}</span>
                      </div>
                      <p className="text-xs text-slate-650 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {exp.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-sm text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-1">Education Background</h4>
                <div className="space-y-2">
                  {selectedCandidate.education.map((edu, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">{edu.degree}</span>
                        <span className="text-slate-500 font-semibold">{edu.institution}</span>
                      </div>
                      <span className="text-slate-400 font-semibold">{edu.year}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              {selectedCandidate.certifications && selectedCandidate.certifications.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-1">Certifications</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedCandidate.certifications.map(c => (
                      <span key={c} className="bg-slate-100 text-slate-600 border border-slate-200 text-xs px-2.5 py-1 rounded-lg font-semibold">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerDashboard;
