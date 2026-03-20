import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, AlertTriangle, ShieldCheck, ShieldAlert, FileSearch, ArrowLeft, Loader2, Cpu, Info, Database, Zap, BookOpen, ChevronDown, ChevronRight, Code2, Activity, Globe, Check, X, Code } from 'lucide-react';

const flagDefinitions = {
  "Unverified Technical Claim": "A specific skill mentioned was not found in external web data or GitHub footprints. This suggests the claim may be purely theoretical or lacks a public code trail.",
  "Institutional Brand Bias": "An observation that the initial assessment may be overly influenced by prestigious company or university names rather than specific project evidence.",
  "Technical Footprint Mismatch": "A significant gap between the technologies used in the candidate's actual projects versus the skills prioritized on their profile."
};

const CollapsibleSection = ({ title, icon: Icon, explanation, children, defaultOpen = false, alert = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border ${alert ? 'border-rose-200 dark:border-rose-900/50' : 'border-slate-200 dark:border-slate-700'} overflow-hidden mb-6 transition-colors duration-300`}>
      <div 
        className={`p-5 flex items-center justify-between cursor-pointer transition-colors duration-300 ${alert ? 'hover:bg-rose-50 dark:hover:bg-rose-900/40 bg-rose-50/30 dark:bg-rose-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 bg-white dark:bg-slate-800'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-4">
          <div className={`p-2 rounded-lg transition-colors ${alert ? 'bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-400' : 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-500 dark:text-indigo-400'}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-lg font-bold transition-colors ${alert ? 'text-rose-900 dark:text-rose-200' : 'text-slate-800 dark:text-slate-100'}`}>{title}</h3>
            {explanation && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 transition-colors">{explanation}</p>}
          </div>
        </div>
        <button className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 transition-colors">
          {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>
      {isOpen && (
        <div className={`p-6 border-t transition-colors duration-300 ${alert ? 'border-rose-100 dark:border-rose-900/50 bg-white dark:bg-slate-800' : 'border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800'}`}>
          {children}
        </div>
      )}
    </div>
  );
};

export default function Results() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('PROCESSING');
  const [error, setError] = useState(null);

  useEffect(() => {
    let intervalId;
    const pollResults = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/results/${taskId}`);
        if (res.data.status === 'DONE') {
          setData(res.data.result);
          setStatus('DONE');
          clearInterval(intervalId);
        } else {
          if (res.data.result) setData(res.data.result);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch results.');
        clearInterval(intervalId);
      }
    };
    pollResults();
    intervalId = setInterval(pollResults, 3000);
    return () => clearInterval(intervalId);
  }, [taskId]);

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-red-600">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <h2 className="text-2xl font-bold">Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg">Go Home</button>
      </div>
    );
  }

  const auditFlags = data?.audit_flags || [];
  const hasBias = auditFlags.length > 0;
  
  // Group flags by type to avoid repeating definitions, and filter out internal technical flags
  const groupedFlags = auditFlags.reduce((acc, flag) => {
    const type = flag.flag_type;
    // Skip internal "Resume Hallucination" from the human-facing report
    if (type === "Resume Hallucination") return acc;
    
    if (!acc[type]) acc[type] = [];
    acc[type].push(flag.description);
    return acc;
  }, {});

  const agents = [
    { name: 'Ingest Agent', icon: Database, desc: 'Extracts exact GitHub links from the resume and fetches deep repository footprints (up to 10 repos).' },
    { name: 'Web Researcher', icon: Globe, desc: 'Uses Tavily API to autonomously cross-reference the web for missing project and skill links via dynamic search queries.' },
    { name: 'Trajectory Agent', icon: Activity, desc: 'Performs Experience Progression analysis and adjusts to Hiring Manager Dynamic Criteria.' },
    { name: 'Success Velocity', icon: Zap, desc: 'Calculates the speed of learning and complexity scaling by analyzing repository creation dates.' },
    { name: 'Hybrid Reasoning', icon: Cpu, desc: 'Cross-verifies resume claims vs GitHub footprints and Web Evidence to find verified and Ghost Skills.' },
    { name: 'Adversarial Auditor', icon: ShieldAlert, desc: 'Red-teams the reasoning report. If it finds Evidence Gaps, it loops the graph back to Reasoning for self-correction.' },
    { name: 'Agent Vox', icon: BookOpen, desc: 'Synthesizes findings into a Unified Report and generates targeted technical interview questions.' }
  ];

  return (
    <div className="flex-1 flex flex-col w-full h-full max-w-full overflow-hidden bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0 z-20 shadow-sm relative transition-colors duration-300">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/')} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight transition-colors">Multi-Agent Processing Hub</h1>
              {data && <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1 transition-colors">Candidate: <span className="text-indigo-600 dark:text-indigo-400">{data.candidate_name}</span></p>}
            </div>
          </div>
        </div>
        
        {/* Agent Execution Visualizer Full Width Ribbon */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-y-3 justify-center z-30 relative transition-colors duration-300">
          {agents.map((agent, i) => {
            const isDone = status === 'DONE';
            return (
              <React.Fragment key={i}>
                <div className={`group relative flex items-center text-[10px] sm:text-xs font-bold uppercase tracking-wider ${isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'} transition-colors duration-500 cursor-help px-3 py-2 rounded-full ${isDone ? 'bg-emerald-100/50 dark:bg-emerald-900/30' : 'bg-indigo-100/50 dark:bg-indigo-900/30'} shadow-sm border border-slate-200/50 dark:border-slate-700 z-40`}>
                  {isDone ? <CheckCircle className="w-4 h-4 mr-1 sm:mr-1.5" /> : <Loader2 className="w-4 h-4 mr-1 sm:mr-1.5 animate-spin" />}
                  <span>{agent.name}</span>
                  
                  {/* Tooltip Popup */}
                  <div className="absolute top-full lg:top-auto lg:bottom-full left-1/2 -translate-x-1/2 lg:mb-3 mt-3 w-64 p-3 bg-slate-800 dark:bg-slate-950 text-white rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-xs normal-case font-medium pointer-events-none text-center border border-slate-700 dark:border-slate-800">
                    <div className="absolute -top-2 lg:top-auto lg:-bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-800 dark:bg-slate-950 rotate-45 lg:border-t-0 lg:border-l-0 border-t border-l border-b-0 border-r-0 lg:border-b lg:border-r border-slate-700 dark:border-slate-800"></div>
                    <span className="relative z-10">{agent.desc}</span>
                  </div>
                </div>
                {i < agents.length - 1 && <span className="text-slate-300 dark:text-slate-600 mx-1 lg:mx-2 font-bold transition-colors">→</span>}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-8 custom-scrollbar relative">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {data ? (
            <>
              {/* 1. Unified Candidate Reasoning Report (Always on Top & Open) */}
              {status === 'DONE' && data.final_json?.summary && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-indigo-200 dark:border-indigo-900 shadow-lg relative overflow-hidden mb-8 transition-colors duration-300">
                  <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center tracking-tight transition-colors">
                      <Zap className="w-7 h-7 mr-3 text-indigo-500" /> Unified Candidate Reasoning Report
                    </h2>
                    
                    {data.final_json.matching_score !== undefined && (
                      <div className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors">
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500">Matching Score</p>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                            {data.final_json.matching_score >= 80 ? 'Exceptional Match' : 
                             data.final_json.matching_score >= 50 ? 'Potential Match' : 'Gap Detected'}
                          </p>
                        </div>
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black shadow-sm border-2 transition-colors
                          ${data.final_json.matching_score >= 80 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 
                            data.final_json.matching_score >= 50 ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' : 
                            'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'}`}>
                          {data.final_json.matching_score}%
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="prose prose-slate max-w-none text-slate-700 dark:text-slate-300 leading-relaxed font-medium space-y-4 transition-colors">
                    {data.final_json.summary.split('\\n').map((para, i) => {
                      const cleaned = para.trim().replace(/\\*\\*/g, '');
                      return cleaned ? <p key={i} className="text-lg">{cleaned}</p> : null;
                    })}
                  </div>
                </div>
              )}

              {/* 1.5 Provenance Links (Links & GitHub Sources) */}
              {status === 'DONE' && data.final_json?.provenance_links && data.final_json.provenance_links.length > 0 && (
                <CollapsibleSection
                  title="Source Provenance Links"
                  icon={Globe}
                  explanation="Direct links to the exact GitHub repositories, LinkedIn profile, and Tavily web data gathered as evidence."
                  defaultOpen={true}
                >
                  <ul className="text-sm space-y-3">
                    {data.final_json.provenance_links.map((link, i) => (
                      <li key={i} className="flex items-start bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors duration-300">
                        <Database className="w-5 h-5 mr-3 text-indigo-400 dark:text-indigo-500 shrink-0" />
                        <a href={link} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline break-all mt-0.5 transition-colors">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </CollapsibleSection>
              )}

              {/* 2. Raw State Graph JSON (Collapsible) */}
              <CollapsibleSection 
                title="Raw State Graph (JSON)" 
                icon={Code2} 
                explanation="The unfiltered memory state passed between LangGraph agents."
                defaultOpen={false}
              >
                <div className="bg-slate-900 dark:bg-slate-950 text-emerald-400 dark:text-emerald-300 rounded-xl p-5 overflow-auto max-h-[400px] text-xs font-mono custom-scrollbar shadow-inner transition-colors">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
                </div>
              </CollapsibleSection>

              {/* 3. Bias & Evidence Check (Collapsible) */}
              {status === 'DONE' && (
                <CollapsibleSection
                  title="Auditor Findings (Bias & Evidence Check)"
                  icon={hasBias ? ShieldAlert : ShieldCheck}
                  explanation="The Adversarial Auditor's red-team analysis isolating hallucinated claims or elite prestige bias."
                  defaultOpen={hasBias}
                  alert={hasBias}
                >
                  {hasBias ? (
                    <div className="space-y-6">
                      {Object.keys(groupedFlags).map((flagType, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/50 rounded-xl p-5 shadow-sm transition-colors">
                          <h4 className="text-lg font-black text-rose-800 dark:text-rose-300 mb-2 flex items-center transition-colors">
                            <AlertTriangle className="w-5 h-5 mr-2 text-rose-500 dark:text-rose-400" /> {flagType}
                          </h4>
                          {flagDefinitions[flagType] && (
                            <p className="text-sm text-rose-600/80 dark:text-rose-400 font-medium mb-4 italic transition-colors">
                              Definition: {flagDefinitions[flagType]}
                            </p>
                          )}
                          <ul className="space-y-3 pl-2 border-l-2 border-rose-200 dark:border-rose-800 transition-colors">
                            {groupedFlags[flagType].map((desc, j) => (
                              <li key={j} className="text-sm text-rose-900 dark:text-rose-200 font-medium pl-4 relative before:absolute before:w-2 before:h-2 before:bg-rose-400 dark:before:bg-rose-500 before:rounded-full before:left-[-5px] before:top-2 transition-colors">
                                {desc}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50 transition-colors">
                      <ShieldCheck className="w-12 h-12 mb-3 text-emerald-500 dark:text-emerald-400" />
                      <p className="text-lg font-bold">Passed Audit Smoothly</p>
                      <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80 mt-1">No massive evidence gaps or prestige bias detected.</p>
                    </div>
                  )}
                </CollapsibleSection>
              )}

              {/* 4. Cross-Verified Skills Inventory */}
              <CollapsibleSection
                title="Cross-Verified Skills Inventory"
                icon={Cpu}
                explanation="Hybrid Reasoning matrix combining resume claims vs GitHub code footprints."
                defaultOpen={true}
              >
                {data.skills_report && data.skills_report.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100/50 dark:bg-slate-800/50 transition-colors">
                          <th className="p-4 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">Skill / Technology</th>
                          <th className="p-4 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs text-center">In JD</th>
                          <th className="p-4 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs text-center">In Resume</th>
                          <th className="p-4 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs text-center">In GitHub</th>
                          <th className="p-4 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs">Verification Status</th>
                          <th className="p-4 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-xs w-[40%]">Reasoning / Evidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {data.skills_report.map((skill, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-4 font-black text-slate-800 dark:text-slate-200 text-sm whitespace-nowrap transition-colors">{skill.skill}</td>
                            <td className="p-4 text-center">
                              {skill.in_jd ? <Check className="w-4 h-4 mx-auto text-emerald-500 dark:text-emerald-400" strokeWidth={3} /> : <X className="w-4 h-4 mx-auto text-rose-400 dark:text-rose-500" />}
                            </td>
                            <td className="p-4 text-center">
                              {skill.in_resume ? <Check className="w-4 h-4 mx-auto text-emerald-500 dark:text-emerald-400" strokeWidth={3} /> : <X className="w-4 h-4 mx-auto text-rose-400 dark:text-rose-500" />}
                            </td>
                            <td className="p-4 text-center">
                              {skill.in_github ? <Check className="w-4 h-4 mx-auto text-indigo-500 dark:text-indigo-400" strokeWidth={3} /> : <X className="w-4 h-4 mx-auto text-slate-300 dark:text-slate-600" />}
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors
                                ${skill.status?.toLowerCase().includes('ghost') ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50' :
                                  skill.status?.toLowerCase().includes('web verified') ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800/50 shadow-sm' :
                                  skill.status?.toLowerCase().includes('verified') ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50' :
                                  'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                }`}>
                                {skill.status?.toLowerCase().includes('web verified') && <Globe className="w-3 h-3 mr-1" />}
                                {skill.status?.toLowerCase().includes('ghost') && <FileSearch className="w-3 h-3 mr-1" />}
                                {skill.status}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed transition-colors">{skill.evidence}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-10 text-center flex flex-col items-center">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
                    <p className="text-slate-500 font-medium">Hybrid Reasoning Node is processing skills analysis...</p>
                  </div>
                )}
              </CollapsibleSection>

              {/* 5. Career Trajectory Analysis */}
              {status === 'DONE' && data.career_trajectory && (
                <CollapsibleSection
                  title="Career Trajectory Analysis"
                  icon={Activity}
                  explanation="Analyzes Experience Progression scaling over time rather than flat skill logs."
                  defaultOpen={false}
                >
                  <div className="prose prose-slate max-w-none text-slate-700 dark:text-slate-300 leading-relaxed font-medium transition-colors">
                    {data.career_trajectory.split('\\n').map((para, i) => {
                      const cleaned = para.trim().replace(/\\*\\*/g, '');
                      return cleaned ? <p key={i}>{cleaned}</p> : null;
                    })}
                  </div>
                </CollapsibleSection>
              )}

              {/* 6. Success Velocity */}
              {status === 'DONE' && data.learning_velocity && (
                <CollapsibleSection
                  title="Success & Learning Velocity"
                  icon={Zap}
                  explanation="Evaluates 'created_at' timestamps of GitHub repos against codebase complexity to deduce learning speed."
                  defaultOpen={false}
                >
                  <div className="prose prose-slate max-w-none text-slate-700 dark:text-slate-300 leading-relaxed font-medium transition-colors">
                    {data.learning_velocity.split('\\n').map((para, i) => {
                      const cleaned = para.trim().replace(/\\*\\*/g, '');
                      return cleaned ? <p key={i}>{cleaned}</p> : null;
                    })}
                  </div>
                </CollapsibleSection>
              )}

              {/* 7. Agent Vox Interview Questions */}
              {status === 'DONE' && data.final_json?.recommended_questions && data.final_json.recommended_questions.length > 0 && (
                <CollapsibleSection
                  title="Agent Vox: Suggested Technical Realities"
                  icon={BookOpen}
                  explanation="Dynamically generated technical interview questions aimed strictly at probing the discovered Ghost Skills and Evidence Gaps."
                  defaultOpen={false}
                >
                  <ul className="space-y-4">
                    {data.final_json.recommended_questions.map((q, i) => (
                      <li key={i} className="flex items-start bg-slate-100 dark:bg-slate-900 p-5 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm transition-colors duration-300">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold mr-4 text-xs mt-0.5 shadow-sm">
                          {i + 1}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 font-semibold leading-relaxed transition-colors">{q}</span>
                      </li>
                    ))}
                  </ul>
                </CollapsibleSection>
              )}

            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center transition-colors">
                <Activity className="w-12 h-12 text-indigo-500 mb-4 animate-pulse" />
                <p className="text-slate-800 dark:text-slate-200 font-bold text-lg transition-colors">Initializing Workspace...</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-2 transition-colors">Connecting to LangGraph context...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
