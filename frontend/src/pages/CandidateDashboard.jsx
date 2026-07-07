import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Upload, 
  FileText, 
  User, 
  Mail, 
  Phone, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Award,
  BookOpen,
  Briefcase
} from 'lucide-react';

const CandidateDashboard = () => {
  const { token, getHeaders, apiUrl } = useAuth();
  
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Edited Profile Form State
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    skills: [],
    experience: [],
    education: [],
    certifications: []
  });
  
  // Skill Input State
  const [newSkill, setNewSkill] = useState('');
  
  useEffect(() => {
    fetchResume();
  }, []);

  const fetchResume = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch(`${apiUrl}/resumes/my-resume`, {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setResume(data);
        setProfile(data.parsed_data);
      } else if (response.status === 404) {
        // No resume yet
        setResume(null);
      } else {
        const errData = await response.json();
        setErrorMsg(errData.detail || 'Failed to fetch resume.');
      }
    } catch (error) {
      console.error('Error fetching resume:', error);
      setErrorMsg('Failed to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop().toLowerCase();
    if (fileExt !== 'pdf' && fileExt !== 'docx') {
      setErrorMsg('Unsupported file format. Please upload a PDF or DOCX file.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${apiUrl}/resumes/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setResume(data);
        setProfile(data.parsed_data);
        setSuccessMsg('Resume uploaded and parsed successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const errData = await response.json();
        setErrorMsg(errData.detail || 'Parsing failed. Please check file formatting.');
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      setErrorMsg('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const response = await fetch(`${apiUrl}/resumes/my-resume`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ parsed_data: profile })
      });

      if (response.ok) {
        const data = await response.json();
        setResume(data);
        setProfile(data.parsed_data);
        setSuccessMsg('Profile updated successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const errData = await response.json();
        setErrorMsg(errData.detail || 'Failed to update profile.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMsg('Network error saving profile.');
    }
  };

  // Profile Field Change Handlers
  const handleContactChange = (field, val) => {
    setProfile(prev => ({
      ...prev,
      [field]: val
    }));
  };

  // Skills management
  const handleAddSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim().toLowerCase())) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim().toLowerCase()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  // Experience management
  const handleExpChange = (index, field, val) => {
    const updatedExp = [...profile.experience];
    updatedExp[index] = {
      ...updatedExp[index],
      [field]: field === 'duration_months' ? parseInt(val) || 0 : val
    };
    setProfile(prev => ({
      ...prev,
      experience: updatedExp
    }));
  };

  const handleAddExp = () => {
    setProfile(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        { company: '', role: '', duration_months: 12, duration_str: '', description: '' }
      ]
    }));
  };

  const handleRemoveExp = (index) => {
    setProfile(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  // Education management
  const handleEduChange = (index, field, val) => {
    const updatedEdu = [...profile.education];
    updatedEdu[index] = {
      ...updatedEdu[index],
      [field]: val
    };
    setProfile(prev => ({
      ...prev,
      education: updatedEdu
    }));
  };

  const handleAddEdu = () => {
    setProfile(prev => ({
      ...prev,
      education: [
        ...prev.education,
        { degree: '', institution: '', year: '' }
      ]
    }));
  };

  const handleRemoveEdu = (index) => {
    setProfile(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  // Certifications management
  const [newCert, setNewCert] = useState('');
  const handleAddCert = () => {
    if (newCert.trim() && !profile.certifications.includes(newCert.trim())) {
      setProfile(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCert.trim()]
      }));
      setNewCert('');
    }
  };

  const handleRemoveCert = (certToRemove) => {
    setProfile(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== certToRemove)
    }));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-primary-500 animate-spin mx-auto" />
          <p className="text-slate-600 font-semibold">Loading resume details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 space-y-8 max-w-5xl mx-auto overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Candidate Profile</h1>
          <p className="text-sm font-medium text-slate-500">
            Upload your resume and customize your extracted profile details to improve job matching.
          </p>
        </div>
        
        {resume && (
          <button
            onClick={handleSaveProfile}
            className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-primary-600 to-sky-500 hover:from-primary-500 hover:to-sky-400 text-white font-bold rounded-xl shadow-md shadow-primary-500/20 hover:shadow-primary-500/30 active:scale-[0.98] transition-all duration-200 cursor-pointer w-fit"
          >
            <Save className="h-4.5 w-4.5" />
            <span>Save Profile Modifications</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start space-x-3 text-rose-800 text-sm animate-fade-in">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-start space-x-3 text-emerald-800 text-sm animate-fade-in">
          <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Upload Box if no resume or to replace resume */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
          <Upload className="h-5 w-5 text-primary-500" />
          <span>{resume ? 'Replace Uploaded Resume' : 'Upload Your Resume'}</span>
        </h2>
        
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-primary-400 transition-colors duration-200 rounded-xl p-8 bg-slate-50/50 text-center relative">
          {uploading ? (
            <div className="space-y-4 py-4">
              <Loader2 className="h-10 w-10 text-primary-500 animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-700">NLP Engine parsing text entities... This takes a few seconds.</p>
              <p className="text-xs text-slate-400">Extracting names, skills taxonomy matching, and chronologies.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto bg-slate-100 p-3 rounded-full w-fit border border-slate-200 text-slate-500">
                <FileText className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Drag and drop your file, or{' '}
                  <label className="text-primary-600 hover:text-primary-500 cursor-pointer font-bold underline">
                    browse files
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </p>
                <p className="text-xs text-slate-400 mt-1">Supports PDF & DOCX up to 10MB</p>
              </div>
            </div>
          )}
        </div>
        
        {resume && (
          <div className="text-xs text-slate-400 flex items-center justify-between px-2">
            <span>Currently parsing: <span className="font-semibold text-slate-600">{resume.file_name}</span></span>
            <span>Uploaded: <span className="font-semibold text-slate-600">{new Date(resume.uploaded_at).toLocaleDateString()}</span></span>
          </div>
        )}
      </div>

      {resume ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left panel: Info, Skills, Certs */}
          <div className="space-y-8 md:col-span-1">
            {/* Contact Details */}
            <div className="glass-panel p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-2">
                <User className="h-4.5 w-4.5 text-primary-500" />
                <span>Contact Information</span>
              </h3>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Full Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => handleContactChange('name', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white text-slate-800"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleContactChange('email', e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={(e) => handleContactChange('phone', e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Taxonomy Tags */}
            <div className="glass-panel p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-2">
                <Briefcase className="h-4.5 w-4.5 text-primary-500" />
                <span>Extracted Skills</span>
              </h3>
              
              <div className="flex flex-wrap gap-1.5 min-h-[50px] p-2 bg-slate-50 border border-slate-100 rounded-lg max-h-52 overflow-y-auto">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-100 text-primary-800 border border-primary-200 group"
                  >
                    <span className="capitalize">{skill}</span>
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-1 text-primary-500 hover:text-primary-800 transition-colors cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Add skill (e.g. Docker)"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                  className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                <button
                  onClick={handleAddSkill}
                  className="px-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 cursor-pointer flex items-center justify-center"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Certifications */}
            <div className="glass-panel p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-2">
                <Award className="h-4.5 w-4.5 text-primary-500" />
                <span>Certifications</span>
              </h3>
              
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {profile.certifications.map((cert) => (
                  <div
                    key={cert}
                    className="flex items-center justify-between text-xs bg-slate-50 hover:bg-slate-100 border border-slate-150 p-2 rounded-lg"
                  >
                    <span className="font-semibold text-slate-700 max-w-[80%] truncate">{cert}</span>
                    <button
                      onClick={() => handleRemoveCert(cert)}
                      className="text-rose-500 hover:text-rose-700 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="AWS Cloud Practitioner"
                  value={newCert}
                  onChange={(e) => setNewCert(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCert()}
                  className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                <button
                  onClick={handleAddCert}
                  className="px-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 cursor-pointer flex items-center justify-center"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right panel: Work Experience & Education (Editable) */}
          <div className="space-y-8 md:col-span-2">
            {/* Experience list */}
            <div className="glass-panel p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                  <Briefcase className="h-4.5 w-4.5 text-primary-500" />
                  <span>Work History Details</span>
                </h3>
                <button
                  onClick={handleAddExp}
                  className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Role</span>
                </button>
              </div>

              <div className="space-y-6">
                {profile.experience.map((exp, index) => (
                  <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative group">
                    <button
                      onClick={() => handleRemoveExp(index)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Company Name</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => handleExpChange(index, 'company', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Job Title / Role</label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => handleExpChange(index, 'role', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Duration String (e.g. Jan 2022 - Present)</label>
                        <input
                          type="text"
                          value={exp.duration_str || ''}
                          onChange={(e) => handleExpChange(index, 'duration_str', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Duration (in months)</label>
                        <input
                          type="number"
                          value={exp.duration_months}
                          onChange={(e) => handleExpChange(index, 'duration_months', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Job Details / Description</label>
                      <textarea
                        rows="2"
                        value={exp.description || ''}
                        onChange={(e) => handleExpChange(index, 'description', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 resize-y"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Education list */}
            <div className="glass-panel p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                  <BookOpen className="h-4.5 w-4.5 text-primary-500" />
                  <span>Academic History Details</span>
                </h3>
                <button
                  onClick={handleAddEdu}
                  className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Degree</span>
                </button>
              </div>

              <div className="space-y-4">
                {profile.education.map((edu, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl relative group">
                    <button
                      onClick={() => handleRemoveEdu(index)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Degree / Major</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => handleEduChange(index, 'degree', e.target.value)}
                        placeholder="M.S. in Computer Science"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Institution</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => handleEduChange(index, 'institution', e.target.value)}
                        placeholder="Stanford University"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Graduation Year</label>
                      <input
                        type="text"
                        value={edu.year}
                        onChange={(e) => handleEduChange(index, 'year', e.target.value)}
                        placeholder="2020"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-4">
          <div className="bg-sky-50 text-primary-500 p-4 rounded-full border border-sky-100">
            <FileText className="h-10 w-10 animate-bounce" />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-xl font-extrabold text-slate-800">No profile details available.</h3>
            <p className="text-slate-500 text-sm">
              Please upload your resume above. Our advanced NLP system will parse your experience, skills, and education to build your profile automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDashboard;
