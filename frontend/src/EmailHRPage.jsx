import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Mail, Edit } from 'lucide-react';

// Simplified Email Page - focuses on existing drafts or creating draft from application
const EmailHRPage = () => {
    const navigate = useNavigate();
    const [apps, setApps] = useState([]);
    const [selectedAppId, setSelectedAppId] = useState('');
    const [emailData, setEmailData] = useState({ hr_email: '', body: '' });
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState('select');

    useEffect(() => {
        fetchApps();
    }, []);

    const fetchApps = async () => {
        try {
            const res = await axios.get('/api/applications/');
            // Filter only apps that are ready for email or drafted
            setApps(res.data);
        } catch (e) { console.error(e); }
    };

    const handleSelect = async () => {
        if (!selectedAppId) return;
        setLoading(true);
        try {
            // Ideally we fetch the draft if exists, or generate
            // For MVP, we'll try to generate draft content
            const res = await axios.post(`/api/applications/${selectedAppId}/generate_email_draft/`);
            setEmailData({
                hr_email: res.data.hr_email || '',
                body: res.data.email_body || ''
            });
            setMode('edit');
        } catch (e) {
            alert("Could not load email draft: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        setLoading(true);
        try {
            await axios.post(`/api/applications/${selectedAppId}/send_email/`, {
                email_body: emailData.body,
                hr_email: emailData.hr_email
            });
            alert('Email sent successfully!');
            navigate('/dashboard');
        } catch (e) {
            alert("Failed to send: " + e.message);
        } finally {
            setLoading(false);
        }
    }

    if (mode === 'edit') {
        return (
            <div className="min-h-screen bg-[#0E1015] flex items-center justify-center p-6">
                <div className="max-w-2xl w-full bg-[#151821] border border-[#232838] rounded-xl overflow-hidden shadow-2xl">
                    <div className="p-4 border-b border-[#232838] flex items-center justify-between">
                        <h3 className="text-lg font-medium text-[#E6E8EB]">Compose Email</h3>
                        <button onClick={() => setMode('select')} className="text-sm text-[#9BA1AE] hover:text-[#E6E8EB]">Back</button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs text-[#9BA1AE] mb-1">To (HR)</label>
                            <input
                                type="text"
                                value={emailData.hr_email}
                                onChange={(e) => setEmailData({ ...emailData, hr_email: e.target.value })}
                                className="linear-input w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-[#9BA1AE] mb-1">Message</label>
                            <textarea
                                value={emailData.body}
                                onChange={e => setEmailData({ ...emailData, body: e.target.value })}
                                className="linear-input w-full h-96 font-sans text-sm leading-relaxed tracking-wide"
                            />
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={loading}
                            className="linear-button linear-button-primary w-full py-3 text-base"
                        >
                            {loading ? 'Sending...' : 'Send Application'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0E1015] text-[#E6E8EB] font-sans flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-[#151821] border border-[#232838] rounded-xl p-8 shadow-2xl">
                <button onClick={() => navigate('/dashboard')} className="mb-6 text-[#9BA1AE] hover:text-[#E6E8EB] flex items-center space-x-2">
                    <ArrowLeft size={16} /> <span>Back to Dashboard</span>
                </button>

                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-[#22C55E]/10 rounded-lg flex items-center justify-center mx-auto mb-4 border border-[#22C55E]/20">
                        <Mail className="text-[#22C55E]" size={24} />
                    </div>
                    <h1 className="text-xl font-bold mb-2">Email Outreach</h1>
                    <p className="text-[#9BA1AE] text-sm">Review drafts and send emails to HR.</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-medium text-[#9BA1AE] mb-2">Select Application</label>
                        <select
                            value={selectedAppId}
                            onChange={e => setSelectedAppId(e.target.value)}
                            className="linear-input w-full appearance-none bg-[#0E1015]"
                        >
                            <option value="">Select an application...</option>
                            {apps.map(app => (
                                <option key={app.tracking_id} value={app.tracking_id}>
                                    {app.job?.company} - {app.job?.title} ({app.status})
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleSelect}
                        disabled={!selectedAppId || loading}
                        className="w-full py-3 bg-[#151821] hover:bg-[#232838] text-[#E6E8EB] border border-[#232838] rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                        {loading ? <span className="animate-pulse">Loading...</span> : <><Edit size={16} /> <span>Review Draft</span></>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailHRPage;
