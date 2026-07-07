import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Briefcase, 
  MapPin, 
  Award, 
  Search, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle,
  Loader2,
  AlertCircle,
  FileWarning
} from 'lucide-react';

const JobListings = () => {
  const { getHeaders, apiUrl } = useAuth();
  
  const [jobs, setJobs] = useState([]);
  const [hasResume, setHasResume] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filter State
  const [skillFilter, setSkillFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [expLevelFilter, setExpLevelFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Expandable Match Detail State
  const [expandedJobId, setExpandedJobId] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async (customParams = '') => {
    setLoading(true);
    setErrorMsg('');
    try {
      // First try to fetch matches for candidate (which ranks jobs)
      const response = await fetch(`${apiUrl}/matching/jobs${customParams}`, {
        headers: getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setHasResume(data.has_resume);
        if (data.has_resume) {
          setJobs(data.jobs);
        } else {
          // If no resume, fall back to standard job fetch (no ranking)
          await fetchStandardJobs(customParams);
        }
      } else {
        // Fall back to standard job listings
        await fetchStandardJobs(customParams);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setErrorMsg('Failed to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStandardJobs = async (customParams = '') => {
    const response = await fetch(`${apiUrl}/jobs${customParams}`, {
      headers: getHeaders()
    });
    if (response.ok) {
      const data = await response.json();
      // Map schema to show scores as null (since no resume is uploaded yet)
      const formattedJobs = data.map(j => ({
        job_id: j.id,
        title: j.title,
        description: j.description,
        required_skills: j.required_skills,
        experience_level: j.experience_level,
        required_experience_months: j.required_experience_months,
        education_level: j.education_level,
        location: j.location,
        salary_range: j.salary_range,
        match_score: null,
        applied: false
      }));
      setJobs(formattedJobs);
      setHasResume(false);
    } else {
      const err = await response.json();
      setErrorMsg(err.detail || 'Failed to fetch jobs list.');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    // Build query params
    const params = [];
    if (skillFilter) params.push(`skill=${encodeURIComponent(skillFilter)}`);
    if (locationFilter) params.push(`location=${encodeURIComponent(locationFilter)}`);
    if (expLevelFilter) params.push(`experience_level=${encodeURIComponent(expLevelFilter)}`);
    if (searchQuery) params.push(`query=${encodeURIComponent(searchQuery)}`);
    
    const queryStr = params.length > 0 ? `?${params.join('&')}` : '';
    
    // Since search might filter, we fetch based on filters
    if (hasResume) {
      // Fetch ranked matching jobs with custom filters
      fetchJobs(queryStr);
    } else {
      // Fetch standard jobs with filters
      setLoading(true);
      fetchStandardJobs(queryStr).finally(() => setLoading(false));
    }
  };

  const handleApply = async (jobId) => {
    setApplyingId(jobId);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const response = await fetch(`${apiUrl}/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: getHeaders()
      });

      if (response.ok) {
        setSuccessMsg('Successfully applied! Match score recorded.');
        // Update job list state locally to reflect applied status
        setJobs(prev => prev.map(job => {
          if (job.job_id === jobId) {
            return { ...job, applied: true };
          }
          return job;
        }));
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const err = await response.json();
        setErrorMsg(err.detail || 'Failed to submit application.');
      }
    } catch (error) {
      console.error('Error applying to job:', error);
      setErrorMsg('Failed to apply. Please check your connection.');
    } finally {
      setApplyingId(null);
    }
  };

  const toggleExpand = (jobId) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
    } else {
      setExpandedJobId(jobId);
    }
  };

  const getScoreColor = (score) => {
    if (score === null || score === undefined) return 'bg-slate-100 text-slate-600';
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  return (
    <div className="flex-1 p-8 space-y-8 max-w-5xl mx-auto overflow-y-auto">
      <div className="border-b border-slate-100 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Match & Browse Jobs</h1>
        <p className="text-sm font-medium text-slate-500">
          Find matching job opportunities. Jobs are automatically sorted by score based on your uploaded resume.
        </p>
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

      {/* Warning banner if no resume uploaded */}
      {!hasResume && !loading && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start space-x-4 text-amber-900 text-sm">
          <FileWarning className="h-6 w-6 text-amber-600 shrink-0" />
          <div>
            <p className="font-bold text-amber-800">Matching algorithm deactivated</p>
            <p className="text-amber-700 mt-1">
              You haven't uploaded a resume yet. Upload your resume under "My Profile & Resume" to get matching scores, explainable breakdowns, and bidirectional candidate recommendation.
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search Section */}
      <form onSubmit={handleSearchSubmit} className="glass-panel p-5 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="h-5 w-5" />
          </span>
          <input
            type="text"
            placeholder="Search titles or descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Skill (e.g. Python)"
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white text-slate-800"
          />
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Location (e.g. Remote)"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white text-slate-800"
          />
        </div>

        <div className="relative">
          <select
            value={expLevelFilter}
            onChange={(e) => setExpLevelFilter(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white text-slate-600 appearance-none font-medium cursor-pointer"
          >
            <option value="">Exp Level (Any)</option>
            <option value="Entry">Entry</option>
            <option value="Mid">Mid</option>
            <option value="Senior">Senior</option>
          </select>
        </div>

        <button
          type="submit"
          className="md:col-span-5 bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:bg-slate-700 transition-colors duration-200 cursor-pointer flex items-center justify-center space-x-2"
        >
          <SlidersHorizontal className="h-4.5 w-4.5" />
          <span>Apply Search Filters</span>
        </button>
      </form>

      {/* Jobs list */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-10 w-10 text-primary-500 animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-extrabold text-slate-700">No jobs match your search parameters.</p>
          <p className="text-slate-400 text-sm mt-1">Try broadening your queries or uploading your resume.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const isExpanded = expandedJobId === job.job_id;
            return (
              <div 
                key={job.job_id} 
                className="bg-white rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
              >
                {/* Main Card row */}
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-extrabold text-xl text-slate-800 tracking-tight">{job.title}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-xs font-semibold">
                          <span className="flex items-center space-x-1">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{job.location}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Award className="h-3.5 w-3.5" />
                            <span>{job.experience_level} Experience</span>
                          </span>
                          {job.salary_range && (
                            <span className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md text-[10px]">
                              {job.salary_range}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Score Badge */}
                      {job.match_score !== null && (
                        <div className={`border px-3 py-1.5 rounded-xl text-center flex flex-col justify-center items-center shadow-sm select-none ${getScoreColor(job.match_score)}`}>
                          <span className="text-lg font-black tracking-tight">{job.match_score}%</span>
                          <span className="text-[9px] uppercase tracking-wider font-extrabold leading-none">Match</span>
                        </div>
                      )}
                    </div>

                    <p className="text-slate-600 text-sm leading-relaxed max-w-3xl line-clamp-2">
                      {job.description}
                    </p>

                    {/* Skill Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.required_skills.map((skill) => (
                        <span 
                          key={skill} 
                          className="bg-slate-50 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-150 capitalize"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex flex-row md:flex-col items-center justify-end gap-2 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                    {hasResume && (
                      <button
                        onClick={() => toggleExpand(job.job_id)}
                        className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors duration-200 rounded-lg cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        <span>{isExpanded ? 'Hide Details' : 'Match Details'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleApply(job.job_id)}
                      disabled={job.applied || applyingId === job.job_id}
                      className={`flex items-center justify-center space-x-1.5 px-5 py-2 text-sm font-bold rounded-lg cursor-pointer shadow-sm active:scale-[0.98] transition-all duration-200 min-w-[110px] ${
                        job.applied
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed shadow-none'
                          : 'bg-primary-600 text-white hover:bg-primary-500'
                      }`}
                    >
                      {job.applied ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>Applied</span>
                        </>
                      ) : applyingId === job.job_id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                      ) : (
                        <span>Apply Now</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Match Details Panel (Expanded) */}
                {isExpanded && job.match_breakdown && (
                  <div className="bg-slate-50 border-t border-slate-150 p-6 space-y-4 text-sm animate-slide-down">
                    <h4 className="font-extrabold text-slate-800 border-b border-slate-200 pb-1.5">Explainable Score Breakdown</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Skill Alignment (60%)</span>
                        <p className="text-slate-700 leading-relaxed font-semibold">{job.match_breakdown.skills}</p>
                        {job.matched_skills && job.matched_skills.length > 0 && (
                          <div className="text-xs mt-1 text-emerald-700 font-medium">Matched: {job.matched_skills.join(', ')}</div>
                        )}
                        {job.missing_skills && job.missing_skills.length > 0 && (
                          <div className="text-xs mt-1 text-rose-600 font-medium">Missing: {job.missing_skills.join(', ')}</div>
                        )}
                      </div>

                      <div className="space-y-1 border-t md:border-t-0 md:border-x border-slate-200 pt-3 md:pt-0 md:px-6">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Experience Gap (30%)</span>
                        <p className="text-slate-700 leading-relaxed font-semibold">{job.match_breakdown.experience}</p>
                      </div>

                      <div className="space-y-1 border-t md:border-t-0 pt-3 md:pt-0">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Education Requirements (10%)</span>
                        <p className="text-slate-700 leading-relaxed font-semibold">{job.match_breakdown.education}</p>
                      </div>
                    </div>

                    <div className="bg-primary-50 text-primary-800 p-3 rounded-xl border border-primary-100 flex items-start space-x-2 text-xs font-medium">
                      <CheckCircle className="h-4.5 w-4.5 text-primary-500 shrink-0 mt-0.5" />
                      <span>{job.match_breakdown.summary}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JobListings;
