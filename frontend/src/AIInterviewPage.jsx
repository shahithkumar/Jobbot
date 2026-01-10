import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, Target } from 'lucide-react';
import InterviewCoach from './InterviewCoach';

const AIInterviewPage = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState('');
    const [mode, setMode] = useState('select');

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await axios.get('/api/jobs/');
                setJobs(res.data);
            } catch (e) { console.error(e); }
        };
        fetchJobs();
    }, []);

    if (mode === 'interview') {
        const job = jobs.find(j => j.id == selectedJobId);
        return (
            <div className="min-h-screen bg-[#0E1015] p-6">
                <InterviewCoach job={job} onBack={() => setMode('select')} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0E1015] text-[#E6E8EB] font-sans flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-[#151821] border border-[#232838] rounded-xl p-8 shadow-2xl">
                <button onClick={() => navigate('/dashboard')} className="mb-6 text-[#9BA1AE] hover:text-[#E6E8EB] flex items-center space-x-2">
                    <ArrowLeft size={16} /> <span>Back to Dashboard</span>
                </button>

                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-pink-500/10 rounded-lg flex items-center justify-center mx-auto mb-4 border border-pink-500/20">
                        <Mic className="text-pink-500" size={24} />
                    </div>
                    <h1 className="text-xl font-bold mb-2">AI Interview Coach</h1>
                    <p className="text-[#9BA1AE] text-sm">Practice answering questions relevant to the job.</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-medium text-[#9BA1AE] mb-2 flex items-center gap-2">
                            <Target size={12} /> Target Job
                        </label>
                        <select
                            value={selectedJobId}
                            onChange={e => setSelectedJobId(e.target.value)}
                            className="linear-input w-full appearance-none bg-[#0E1015]"
                        >
                            <option value="">Select a job...</option>
                            {jobs.map(j => (
                                <option key={j.id} value={j.id}>{j.title} at {j.company}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => setMode('interview')}
                        disabled={!selectedJobId}
                        className="w-full py-3 bg-[#151821] hover:bg-[#232838] text-[#E6E8EB] border border-[#232838] rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                        <Mic size={16} />
                        <span>Start Session</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIInterviewPage;
