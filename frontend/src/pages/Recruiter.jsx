import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Recruiter() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hiringNotes, setHiringNotes] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [jobId, setJobId] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || (!description && !file)) return;

    setStatus('loading');
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      if (hiringNotes) {
        formData.append('hiring_notes', hiringNotes);
      }
      if (file) {
        formData.append('file', file);
      }

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await axios.post(`${API_BASE_URL}/api/jobs`, formData);
      setJobId(response.data.job_id);
      setStatus('success');
      
      // Reset form
      setTitle('');
      setDescription('');
      setHiringNotes('');
      setFile(null);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-6 py-12 flex-1 transition-colors duration-300">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mb-8"
      >
        <ArrowLeft size={16} className="mr-2" /> Back to Home
      </button>

      <div className="bg-white dark:bg-slate-800 border text-left border-gray-200 dark:border-slate-700 shadow-sm rounded-xl overflow-hidden transition-colors duration-300">
        <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-5 border-b border-gray-200 dark:border-slate-700 transition-colors duration-300">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center transition-colors">
            <BriefcaseIcon className="w-5 h-5 mr-3 text-emerald-600 dark:text-emerald-500" />
            Upload Job Description
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors">Make a new job available to candidates.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Job Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm px-4 py-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-900 dark:text-slate-100 transition-colors duration-300"
              placeholder="e.g. Senior Frontend Engineer"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Job Description Text (Optional if File is uploaded)</label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm px-4 py-3 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none text-slate-900 dark:text-slate-100 transition-colors duration-300"
              placeholder="Paste requirements, or leave blank and upload a file below..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">Upload JD File (PDF/DOCX)</label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-slate-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors duration-300">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-8 h-8 text-gray-400 dark:text-slate-500 mb-2 transition-colors" />
                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium transition-colors">
                  {file ? file.name : "Click to select a file"}
                </p>
              </div>
              <input 
                id="dropzone-file" 
                type="file" 
                className="hidden" 
                accept=".pdf,.docx,.doc"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </label>
          </div>

          {status === 'success' && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-lg flex items-start transition-colors duration-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 mr-2 shrink-0 transition-colors" />
              <div>
                <p className="font-medium">Job successfully published!</p>
                <p className="text-sm opacity-90">Candidates can now view and apply for this position.</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 dark:bg-rose-900/20 border border-red-200 dark:border-rose-800/50 text-red-800 dark:text-rose-300 px-4 py-3 rounded-lg transition-colors duration-300">
              <p className="font-medium">Failed to publish job. Please ensure the backend is running.</p>
            </div>
          )}

          <div className="pt-2">
            <button
               type="submit"
               disabled={status === 'loading'}
               className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg shadow transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Publishing...</>
              ) : (
                <><UploadCloud className="w-5 h-5 mr-2" /> Publish Job</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BriefcaseIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  );
}
