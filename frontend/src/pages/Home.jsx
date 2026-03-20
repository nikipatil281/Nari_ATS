import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, User } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-950 w-full p-6 transition-colors duration-300">
      <div className="max-w-3xl w-full text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-slate-100 mb-4 tracking-tight transition-colors duration-300">
          Unified Candidate Reasoning
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto transition-colors duration-300">
          Our Multi-Agent System cross-verifies applicant resumes against external validation data like GitHub code repositories, ensuring unbiased, holistic evaluations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        <button
          onClick={() => navigate('/candidate')}
          className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-50/50 dark:to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4 z-10 transition-colors duration-300">
            <User size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2 z-10 transition-colors duration-300">I am a Candidate</h2>
          <p className="text-slate-500 dark:text-slate-400 z-10 transition-colors duration-300">
            View available jobs and upload your resume to apply.
          </p>
        </button>

        <button
          onClick={() => navigate('/recruiter')}
          className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-50/50 dark:to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4 z-10 transition-colors duration-300">
            <Briefcase size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2 z-10 transition-colors duration-300">I am a Recruiter</h2>
          <p className="text-slate-500 dark:text-slate-400 z-10 transition-colors duration-300">
            Upload Job Descriptions and manage openings.
          </p>
        </button>
      </div>
    </div>
  );
}
