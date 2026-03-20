import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Briefcase, FileText, Upload, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';

export default function Candidate() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/jobs');
      setJobs(res.data.jobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedJob || !file) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await axios.post(`http://localhost:8000/api/upload-resume/${selectedJob.job_id}`, formData);
      navigate(`/results/${res.data.task_id}`);
    } catch (err) {
      console.error(err);
      alert('Upload failed.');
      setUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-12 flex-1 flex flex-col transition-colors duration-300">
      <button 
        onClick={() => navigate('/')}
        className="flex self-start items-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mb-8"
      >
        <ArrowLeft size={16} className="mr-2" /> Back to Home
      </button>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 transition-all duration-300">
        {/* Jobs List Panel */}
        <div className="lg:w-1/2 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden h-fit max-h-[800px] transition-colors duration-300">
          <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700 transition-colors duration-300">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center transition-colors">
              <Briefcase className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" /> Open Positions
            </h2>
          </div>
          
          <div className="p-2 overflow-y-auto flex-1 custom-scrollbar">
            {loading ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center transition-colors">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-400" />
                Loading jobs...
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 transition-colors">
                No jobs published yet. Check back later!
              </div>
            ) : (
              <ul className="space-y-2">
                {jobs.map(job => (
                  <li key={job.job_id}>
                    <button
                      onClick={() => setSelectedJob(job)}
                      className={`w-full text-left p-4 rounded-lg border transition-all duration-300 ${selectedJob?.job_id === job.job_id ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800/50 shadow-sm' : 'bg-white dark:bg-slate-800 border-transparent dark:hover:bg-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600 hover:bg-slate-50'}`}
                    >
                      <h3 className={`font-semibold text-lg transition-colors ${selectedJob?.job_id === job.job_id ? 'text-indigo-800 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-100'}`}>
                        {job.title}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 line-clamp-2 transition-colors">{job.description}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Application Panel */}
        <div className="lg:w-1/2 flex flex-col transition-all duration-300">
          {selectedJob ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-900/50 overflow-hidden relative transition-colors duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
              <div className="p-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2 transition-colors">{selectedJob.title}</h2>
                <div className="prose prose-sm text-slate-600 dark:text-slate-300 mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar transition-colors">
                  <p className="whitespace-pre-wrap">{selectedJob.description}</p>
                </div>
                
                <hr className="border-slate-100 dark:border-slate-700 mb-8 transition-colors" />
                
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center transition-colors">
                  <FileText className="w-5 h-5 mr-2 text-slate-400" /> Apply Now
                </h3>
                
                <div className="mb-6">
                  <label className="block border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all duration-300 cursor-pointer group">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setFile(e.target.files[0])}
                    />
                    <Upload className="w-8 h-8 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 transition-colors mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                      {file ? file.name : "Click to upload Resume (PDF/DOCX)"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 transition-colors">Maximum file size 10MB</p>
                  </label>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={handleApply}
                    disabled={!file || uploading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-lg shadow transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Uploading...</>
                    ) : (
                      <>Verify Application <ArrowRight className="w-4 h-4 ml-2" /></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/30 transition-colors duration-300">
              <UserCircleIcon className="w-16 h-16 mb-4 opacity-50" />
              <p>Select a job from the list to apply.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UserCircleIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></svg>
  );
}
