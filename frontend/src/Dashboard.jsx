import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { remoteLog } from './utils/logger'
import { LogIn, Send, Briefcase, FileText, LayoutGrid, List as ListIcon, Plus, Search, ExternalLink, Mic, Zap } from 'lucide-react'
import ResumeUpload from './ResumeUpload'
import AppGenerator from './AppGenerator'
import AddManualJob from './AddManualJob'
import InterviewCoach from './InterviewCoach'
import KanbanBoard from './KanbanBoard'
import AnalyticsDashboard from './AnalyticsDashboard'
import AutomationSettings from './AutomationSettings'

// Configure Axios
axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';

function Dashboard() {
    // Force token to exist so we skip login screen
    const [token, setToken] = useState('auto-login-active');
    const [loading, setLoading] = useState(false);

    // Dashboard State
    const [activeTab, setActiveTab] = useState('jobs');
    const [jobs, setJobs] = useState([]);
    const [resumes, setResumes] = useState([]);
    const [apps, setApps] = useState([]);
    const [keywords, setKeywords] = useState('');

    // View State
    const [viewState, setViewState] = useState('list'); // 'list', 'generate', 'interview', 'manual_job'
    const [appViewMode, setAppViewMode] = useState('board'); // 'list', 'board'
    const [selectedJob, setSelectedJob] = useState(null);

    useEffect(() => {
        remoteLog(`App Mounted. Active Tab: ${activeTab}`);
        if (activeTab === 'resumes') fetchResumes();
        if (activeTab === 'apps') fetchApps();
        if (activeTab === 'jobs') fetchJobs(); // Auto-fetch jobs on load
    }, [activeTab]);

    const handleSearch = async () => {
        remoteLog(`User started search for: ${keywords}`);
        setLoading(true);
        try {
            const res = await axios.post('/api/jobs/search/', { keywords });
            alert(res.data.message);
            fetchJobs();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchJobs = async () => {
        try {
            const res = await axios.get('/api/jobs/');
            setJobs(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchResumes = async () => {
        try {
            const res = await axios.get('/api/resumes/');
            setResumes(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchApps = async () => {
        try {
            const res = await axios.get('/api/applications/');
            setApps(res.data);
        } catch (e) { console.error(e); }
    };

    const startApplication = (job) => {
        setSelectedJob(job);
        fetchResumes().then(() => setViewState('generate'));
    };

    const startInterview = (job) => {
        setSelectedJob(job);
        setViewState('interview');
    };

    return (
        <div className="min-h-screen bg-[#0E1015] text-[#E6E8EB] font-sans flex">
            {/* Sidebar (Linear Style) */}
            <aside className="w-60 bg-[#0E1015] border-r border-[#232838] flex flex-col fixed h-full z-10">
                <div className="h-12 flex items-center px-4 border-b border-[#232838]">
                    <span className="text-sm font-medium text-[#E6E8EB]">JobBot AI</span>
                </div>

                <nav className="flex-1 py-2">
                    {[
                        { id: 'jobs', icon: Briefcase, label: 'Search Jobs' },
                        { id: 'resumes', icon: FileText, label: 'Resumes' },
                        { id: 'apps', icon: Send, label: 'Applications' },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id); setViewState('list'); if (item.id === 'jobs') fetchJobs(); }}
                            className={`w-full h-8 flex items-center space-x-2 px-4 transition-colors text-sm ${activeTab === item.id
                                ? 'bg-[#151821] text-[#E6E8EB] border-l-2 border-[#6366F1]'
                                : 'text-[#9BA1AE] hover:bg-[#151821] hover:text-[#E6E8EB] border-l-2 border-transparent'
                                }`}
                        >
                            <item.icon size={16} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`w-full h-8 flex items-center space-x-2 px-4 transition-colors text-sm ${activeTab === 'analytics'
                            ? 'bg-[#151821] text-[#E6E8EB] border-l-2 border-[#6366F1]'
                            : 'text-[#9BA1AE] hover:bg-[#151821] hover:text-[#E6E8EB] border-l-2 border-transparent'
                            }`}
                    >
                        <LayoutGrid size={16} />
                        <span>Analytics</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('automation')}
                        className={`w-full h-8 flex items-center space-x-2 px-4 transition-colors text-sm ${activeTab === 'automation'
                            ? 'bg-[#151821] text-[#E6E8EB] border-l-2 border-[#6366F1]'
                            : 'text-[#9BA1AE] hover:bg-[#151821] hover:text-[#E6E8EB] border-l-2 border-transparent'
                            }`}
                    >
                        <Zap size={16} />
                        <span>Automation</span>
                    </button>
                </nav>

                {/* Automation Tools Section */}
                <div className="px-4 py-2">
                    <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">Automation Tools</div>
                    <nav className="space-y-1">
                        {[
                            { label: 'Scrape Jobs', path: '/scrape-jobs', icon: Search },
                            { label: 'Tailor Resume', path: '/tailor-resume', icon: FileText },
                            { label: 'Email Outreach', path: '/email-hr', icon: Send },
                            { label: 'AI Interview', path: '/ai-interview', icon: Mic },
                        ].map(tool => (
                            <button
                                key={tool.path}
                                onClick={() => window.location.href = tool.path} // Simple nav for now since we are inside BrowserRouter but want to switch route completely
                                className="w-full h-8 flex items-center space-x-2 px-2 rounded hover:bg-[#151821] text-[#9BA1AE] hover:text-[#E6E8EB] transition-colors text-sm"
                            >
                                <tool.icon size={14} />
                                <span>{tool.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-4 border-t border-[#232838]">
                    <div className="flex items-center space-x-2 text-xs text-[#6B7280]">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>System Operational</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-60 bg-[#0E1015] min-h-screen">
                <div className="max-w-[1200px] mx-auto p-6">

                    {/* Header */}
                    <header className="flex justify-between items-center mb-6 h-12">
                        <h2 className="text-xl font-medium text-[#E6E8EB] capitalize">
                            {viewState !== 'list' ? viewState.replace('_', ' ') : activeTab}
                        </h2>
                    </header>

                    {viewState === 'generate' && selectedJob ? (
                        <AppGenerator
                            job={selectedJob}
                            resumes={resumes}
                            onBack={() => setViewState('list')}
                        />
                    ) : viewState === 'interview' && selectedJob ? (
                        <InterviewCoach
                            job={selectedJob}
                            onBack={() => setViewState('list')}
                        />
                    ) : viewState === 'manual_job' ? (
                        <AddManualJob onJobAdded={() => { setViewState('list'); fetchJobs(); }} />
                    ) : (
                        <>
                            {activeTab === 'jobs' && (
                                <div className="space-y-4">
                                    {/* Toolbar */}
                                    <div className="flex items-center space-x-2 mb-6">
                                        <div className="relative flex-1 max-w-sm group">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] group-focus-within:text-[#E6E8EB] transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Search jobs..."
                                                value={keywords}
                                                onChange={(e) => setKeywords(e.target.value)}
                                                className="w-full bg-[#151821] border border-[#232838] rounded-md py-1.5 pl-9 pr-3 text-sm text-[#E6E8EB] placeholder-[#6B7280] focus:outline-none focus:border-[#6B7280] transition-colors"
                                            />
                                        </div>
                                        <button
                                            onClick={handleSearch}
                                            disabled={loading}
                                            className="linear-button linear-button-secondary"
                                        >
                                            {loading ? 'Searching...' : 'Search'}
                                        </button>
                                        <div className="flex-1"></div>
                                        <button
                                            onClick={async () => {
                                                if (!confirm('Create drafts for ALL jobs?')) return;
                                                setLoading(true);
                                                try {
                                                    const res = await axios.post('/api/jobs/apply_all/');
                                                    alert(res.data.message);
                                                    setActiveTab('apps');
                                                    fetchApps();
                                                } catch (e) { alert('Error: ' + e.message); }
                                                setLoading(false);
                                            }}
                                            className="linear-button linear-button-secondary text-red-400 hover:text-red-300 border-red-900/30"
                                        >
                                            Apply All
                                        </button>
                                        <button
                                            onClick={() => setViewState('manual_job')}
                                            className="linear-button linear-button-primary flex items-center space-x-1"
                                        >
                                            <Plus size={14} />
                                            <span>Add Job</span>
                                        </button>
                                    </div>

                                    {/* Job List (Compact Rows) */}
                                    <div className="border border-[#232838] rounded-md overflow-hidden bg-[#151821]">
                                        {jobs.length === 0 ? (
                                            <div className="p-8 text-center text-[#6B7280] text-sm">No jobs found. Try searching.</div>
                                        ) : (
                                            jobs.map((job, idx) => (
                                                <div
                                                    key={job.id}
                                                    className={`flex items-center p-3 hover:bg-[#1B1F2A] transition-colors group ${idx !== jobs.length - 1 ? 'border-b border-[#232838]' : ''}`}
                                                >
                                                    <div className="flex-1 min-w-0 pr-4">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <h3 className="text-sm font-medium text-[#E6E8EB] truncate">{job.title}</h3>
                                                            <span className="text-[10px] uppercase tracking-wider text-[#6B7280] border border-[#232838] px-1 rounded">{job.source}</span>
                                                        </div>
                                                        <p className="text-xs text-[#9BA1AE] truncate">{job.company}</p>
                                                    </div>

                                                    {/* Actions (visible on hover or always visible but subtle) */}
                                                    <div className="flex items-center space-x-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            className="p-1.5 text-[#9BA1AE] hover:text-[#E6E8EB] hover:bg-[#232838] rounded"
                                                            title="View Details"
                                                        >
                                                            <ExternalLink size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => startInterview(job)}
                                                            className="p-1.5 text-[#9BA1AE] hover:text-[#E6E8EB] hover:bg-[#232838] rounded"
                                                            title="Interview Prep"
                                                        >
                                                            <Mic size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => startApplication(job)}
                                                            className="linear-button linear-button-secondary text-xs"
                                                        >
                                                            Draft App
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'resumes' && (
                                <div className="space-y-6">
                                    <ResumeUpload onUploadSuccess={fetchResumes} resumes={resumes} onDelete={() => { }} />
                                    {/* Note: Resume list is now inside ResumeUpload per user request logic (table style), but ResumeUpload acts as the view. 
                                        However, I'll pass resumes to it or let it handle its own list. 
                                        Let's stick to the current architecture: App fetches, ResumeUpload handles upload.
                                        Wait, ResumeList was inline in App.jsx before.
                                        I should move the resume list INTO ResumeUpload.jsx or keep it here but styled.
                                        User said: "ResumeUpload.jsx (Linear Style) -> Resume List: Row-based... Looks like a table".
                                        I will move the list logic into ResumeUpload.jsx in the next step to keep App.jsx clean.
                                        For now, I'll just render ResumeUpload and pass the resumes prop if I modify it to accept it, or let it fetch?
                                        The original App.jsx passed `resumes` simply to map over them below.
                                        I will pass `resumes` to ResumeUpload and let IT render the list.
                                    */}
                                </div>
                            )}

                            {activeTab === 'apps' && (
                                <div className="space-y-6">
                                    <AnalyticsDashboard apps={apps} />

                                    <div className="flex justify-between items-center mt-8 mb-4">
                                        <h3 className="text-sm font-medium text-[#E6E8EB]">Pipeline</h3>
                                        <div className="bg-[#151821] border border-[#232838] rounded flex p-0.5">
                                            <button
                                                onClick={() => setAppViewMode('list')}
                                                className={`p-1.5 rounded ${appViewMode === 'list' ? 'bg-[#232838] text-[#E6E8EB]' : 'text-[#6B7280] hover:text-[#9BA1AE]'}`}
                                            >
                                                <ListIcon size={14} />
                                            </button>
                                            <button
                                                onClick={() => setAppViewMode('board')}
                                                className={`p-1.5 rounded ${appViewMode === 'board' ? 'bg-[#232838] text-[#E6E8EB]' : 'text-[#6B7280] hover:text-[#9BA1AE]'}`}
                                            >
                                                <LayoutGrid size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {appViewMode === 'board' ? (
                                        <KanbanBoard apps={apps} onUpdate={fetchApps} />
                                    ) : (
                                        <div className="border border-[#232838] rounded-md overflow-hidden bg-[#151821]">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-[#1B1F2A] text-xs text-[#9BA1AE] uppercase tracking-wider font-medium">
                                                    <tr>
                                                        <th className="p-3 border-b border-[#232838] font-medium">Job</th>
                                                        <th className="p-3 border-b border-[#232838] font-medium">Status</th>
                                                        <th className="p-3 border-b border-[#232838] font-medium text-right">Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-sm">
                                                    {apps.map(app => (
                                                        <tr key={app.tracking_id} className="border-b border-[#232838] last:border-0 hover:bg-[#1B1F2A] transition-colors">
                                                            <td className="p-3 font-medium text-[#E6E8EB]">{app.job?.title}</td>
                                                            <td className="p-3">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-medium border ${app.status === 'sent'
                                                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                                    : 'bg-[#232838] text-[#9BA1AE] border-[#232838]'
                                                                    }`}>
                                                                    {app.status}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 text-[#6B7280] text-right font-mono text-xs">{new Date(app.sent_at || Date.now()).toLocaleDateString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'automation' && <AutomationSettings />}
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}

export default Dashboard
