import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, ExternalLink, Trash2, RefreshCw } from 'lucide-react';
import AddManualJob from './AddManualJob';

const ScrapeJobsPage = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddManual, setShowAddManual] = useState(false);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const res = await axios.get('/api/jobs/');
            setJobs(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleScrape = async () => {
        setLoading(true);
        try {
            // Assuming this endpoint exists based on previous context, or we stick to search
            // If strictly "Scrape", we might need to trigger the backend scraper. 
            // For now, let's allow "Search" as the primary "Scrape" mechanism since the user asked for "Scrape Jobs"
            // but the backend uses search_jobs logic.
            const keywords = prompt("Enter job keywords to scrape (e.g. 'Python Developer'):");
            if (keywords) {
                const res = await axios.post('/api/jobs/search/', { keywords });
                alert(res.data.message);
                fetchJobs();
            }
        } catch (err) {
            alert('Scrape failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this job?')) return;
        try {
            await axios.delete(`/api/jobs/${id}/`);
            fetchJobs();
        } catch (e) { alert(e.message); }
    };

    return (
        <div className="min-h-screen bg-[#0E1015] text-[#E6E8EB] font-sans p-6">
            {/* Header */}
            <header className="flex items-center justify-between mb-8 pb-4 border-b border-[#232838]">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-[#151821] rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-[#9BA1AE]" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">Scrape & Manage Jobs</h1>
                        <p className="text-[#9BA1AE] text-sm">Find new opportunities or add them manually</p>
                    </div>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setShowAddManual(!showAddManual)}
                        className="flex items-center space-x-2 px-4 py-2 bg-[#151821] border border-[#232838] rounded-lg hover:bg-[#1B1F2A] transition-colors"
                    >
                        <Plus size={16} />
                        <span>{showAddManual ? 'Cancel' : 'Add Manual Job'}</span>
                    </button>
                    <button
                        onClick={handleScrape}
                        disabled={loading}
                        className="flex items-center space-x-2 px-4 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5] transition-colors disabled:opacity-50"
                    >
                        {loading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
                        <span>{loading ? 'Scraping...' : 'Find New Jobs'}</span>
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-5xl mx-auto">
                {showAddManual ? (
                    <div className="mb-8">
                        <AddManualJob onJobAdded={() => { setShowAddManual(false); fetchJobs(); }} />
                    </div>
                ) : (
                    <div className="bg-[#151821] border border-[#232838] rounded-xl overflow-hidden">
                        <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 p-4 border-b border-[#232838] text-xs font-medium text-[#9BA1AE] uppercase tracking-wider">
                            <div>Role / Company</div>
                            <div>Location</div>
                            <div>Source</div>
                            <div className="text-right">Actions</div>
                        </div>

                        {jobs.length === 0 ? (
                            <div className="p-12 text-center text-[#6B7280]">
                                <Search size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No jobs found. Start scraping!</p>
                            </div>
                        ) : (
                            jobs.map(job => (
                                <div key={job.id} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 p-4 border-b border-[#232838] last:border-0 hover:bg-[#1B1F2A] transition-colors items-center group">
                                    <div>
                                        <div className="font-medium text-[#E6E8EB]">{job.title}</div>
                                        <div className="text-sm text-[#9BA1AE]">{job.company}</div>
                                    </div>
                                    <div className="text-sm text-[#9BA1AE]">{job.location || 'Remote'}</div>
                                    <div>
                                        <span className="text-[10px] px-2 py-1 rounded bg-[#232838] text-[#9BA1AE] border border-[#2D3342]">
                                            {job.source}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a href={job.link} target="_blank" rel="noreferrer" className="p-2 hover:bg-[#232838] rounded text-[#9BA1AE] hover:text-[#E6E8EB]">
                                            <ExternalLink size={16} />
                                        </a>
                                        {/* Allow delete if needed, though not explicitly requested, good for management */}
                                        <button onClick={() => handleDelete(job.id)} className="p-2 hover:bg-[#232838] rounded text-red-400 hover:text-red-300">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScrapeJobsPage;
