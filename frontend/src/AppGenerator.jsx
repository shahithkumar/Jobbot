import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Sparkles, Download, Send, Edit, ArrowLeft, Target, Eye, MessageSquare, Mic, X, BarChart2, AlertCircle, CheckCircle, Lightbulb, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AppGenerator = ({ job, resumes, onBack }) => {
    const [selectedResumeId, setSelectedResumeId] = useState(resumes[0]?.id || '');
    const [prompt, setPrompt] = useState('Enhance my resume for this job. Improve the impact of my bullet points.');
    const [pdfUrl, setPdfUrl] = useState(null);
    const [appId, setAppId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('draft');

    // Email State
    const [showEmail, setShowEmail] = useState(false);
    const [emailBody, setEmailBody] = useState('');
    const [hrEmail, setHrEmail] = useState('');
    const [matchAnalysis, setMatchAnalysis] = useState(null);

    // Interview State
    const [showInterview, setShowInterview] = useState(false);
    const [interviewMessages, setInterviewMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analyzingId, setAnalyzingId] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(() => { scrollToBottom(); }, [interviewMessages, showInterview]);

    const handleCreateDraft = async () => {
        setLoading(true);
        try {
            const res = await axios.post('/api/applications/', {
                job_id: job.id,
                resume_id: selectedResumeId
            });
            const id = res.data.tracking_id;
            setAppId(id);

            const codeRes = await axios.post(`/api/applications/${id}/generate_code/`, { prompt });
            const pdfRes = await axios.post(`/api/applications/${id}/generate_pdf/`, { latex_code: codeRes.data.code });
            setPdfUrl(`http://127.0.0.1:8000${pdfRes.data.pdf_url}`);
            setStatus('pdf_ready');
        } catch (err) {
            console.error(err);
            alert('Generation failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = () => { if (pdfUrl) window.open(pdfUrl, '_blank'); };
    const handlePrepareEmail = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`/api/applications/${appId}/generate_email_draft/`);
            setEmailBody(res.data.email_body || '');
            setHrEmail(res.data.hr_email || '');
            setShowEmail(true);
        } catch (err) { alert("Email draft failed: " + err.message); }
        finally { setLoading(false); }
    };

    const handleSendEmail = async () => {
        setLoading(true);
        try {
            await axios.post(`/api/applications/${appId}/send_email/`, { email_body: emailBody, hr_email: hrEmail });
            alert('Email Sent Successfully!');
            setStatus('sent');
            setShowEmail(false);
            onBack();
        } catch (err) { alert('Failed to send email: ' + err.message); }
        finally { setLoading(false); }
    };

    // Interview Logic
    const startInterview = async () => {
        setShowInterview(true);
        if (!sessionId) {
            try {
                const res = await axios.post(`/api/interview/${job.id}/start/`);
                setSessionId(res.data.session_id);
                const msgs = typeof res.data.messages === 'string' ? JSON.parse(res.data.messages) : res.data.messages;
                setInterviewMessages(msgs);
            } catch (err) { alert("Failed to start interview: " + err.message); setShowInterview(false); }
        }
    };

    const sendInterviewMessage = async () => {
        if (!currentMessage.trim()) return;
        const newMsg = { role: 'user', content: currentMessage };
        setInterviewMessages(prev => [...prev, newMsg]);
        setCurrentMessage('');
        try {
            const res = await axios.post(`/api/interview/${sessionId}/chat/`, { message: newMsg.content });
            const msgs = typeof res.data.messages === 'string' ? JSON.parse(res.data.messages) : res.data.messages;
            setInterviewMessages(msgs);
        } catch (err) { console.error("Chat Error:", err); }
    };

    const analyzeAnswer = async (index) => {
        const answer = interviewMessages[index].content;
        const question = interviewMessages[index - 1]?.content || "Introduction";
        setAnalyzingId(index);
        try {
            const res = await axios.post(`/api/interview/${sessionId}/analyze_answer/`, { question, answer });
            setAnalysisResult(res.data);
        } catch (err) { alert("Analysis failed: " + err.message); }
        finally { setAnalyzingId(null); }
    };

    if (showEmail) {
        return (
            <div className="max-w-3xl mx-auto mt-6 bg-[#151821] border border-[#232838] rounded-md overflow-hidden">
                <div className="p-4 border-b border-[#232838] flex items-center justify-between">
                    <h3 className="text-sm font-medium text-[#E6E8EB]">Compose Application Email</h3>
                    <button onClick={() => setShowEmail(false)} className="text-xs text-[#9BA1AE] hover:text-[#E6E8EB]">Cancel</button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs text-[#9BA1AE] mb-1">To</label>
                        <input type="text" value={hrEmail} onChange={(e) => setHrEmail(e.target.value)} className="linear-input w-full" placeholder="hr@company.com" />
                    </div>
                    <div>
                        <label className="block text-xs text-[#9BA1AE] mb-1">Message</label>
                        <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} className="linear-input w-full h-64 font-sans text-sm leading-relaxed" />
                    </div>
                    <button onClick={handleSendEmail} disabled={loading} className="linear-button linear-button-primary w-full">
                        {loading ? 'Sending...' : 'Send Application'}
                    </button>
                </div>
            </div>
        )
    }

    const selectedResume = resumes.find(r => r.id == selectedResumeId);

    return (
        <div className="flex h-[calc(100vh-6rem)] border border-[#232838] rounded-md overflow-hidden bg-[#0E1015]">
            {/* Left Panel: Inputs */}
            <div className="w-[400px] flex flex-col border-r border-[#232838] bg-[#151821]">
                <div className="h-12 border-b border-[#232838] flex items-center px-4 space-x-2">
                    <button onClick={onBack} className="text-[#9BA1AE] hover:text-[#E6E8EB]"><ArrowLeft size={16} /></button>
                    <div className="truncate">
                        <h2 className="text-sm font-medium text-[#E6E8EB] truncate">{job.title}</h2>
                        <p className="text-[10px] text-[#9BA1AE] truncate">{job.company}</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div>
                        <label className="block text-xs font-medium text-[#9BA1AE] mb-2">Base Resume</label>
                        <select value={selectedResumeId} onChange={e => setSelectedResumeId(e.target.value)} className="linear-input w-full appearance-none bg-[#0E1015]">
                            {resumes.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[#9BA1AE] mb-2">Tailoring Instructions</label>
                        <textarea
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            className="linear-input w-full h-32 text-xs leading-relaxed bg-[#0E1015] resize-none"
                        />
                        <div className="flex gap-2 mt-2">
                            <button onClick={() => setPrompt("Optimize for ATS keywords, preserve details.")} className="text-[10px] px-2 py-1 bg-[#232838] hover:bg-[#2F3646] text-[#9BA1AE] rounded border border-[#232838]">Safe</button>
                            <button onClick={() => setPrompt("Enhance impact. Quantify achievements.")} className="text-[10px] px-2 py-1 bg-[#232838] hover:bg-[#2F3646] text-[#9BA1AE] rounded border border-[#232838]">Impact</button>
                        </div>
                    </div>

                    <button onClick={handleCreateDraft} disabled={loading} className="linear-button linear-button-primary w-full flex items-center justify-center space-x-2">
                        <Sparkles size={14} /> <span>Generate Application</span>
                    </button>

                    {/* Tools */}
                    <div className="pt-4 border-t border-[#232838] space-y-2">
                        <div className="text-xs font-medium text-[#9BA1AE] mb-2">Analysis Tools</div>
                        <div className="grid grid-cols-2 gap-2">
                            {appId && !matchAnalysis && (
                                <button onClick={async () => {
                                    setLoading(true);
                                    try {
                                        const res = await axios.post(`/api/applications/${appId}/analyze_match/`);
                                        setMatchAnalysis(res.data);
                                    } catch (e) { alert(e.message); }
                                    setLoading(false);
                                }} className="linear-button linear-button-secondary text-xs flex flex-col items-center py-3 gap-1">
                                    <Target size={16} /> Match Score
                                </button>
                            )}
                            <button onClick={startInterview} className="linear-button linear-button-secondary text-xs flex flex-col items-center py-3 gap-1">
                                <MessageSquare size={16} /> Mock Interview
                            </button>
                        </div>
                    </div>

                    {matchAnalysis && (
                        <div className="bg-[#0E1015] border border-[#232838] rounded p-3">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-[#9BA1AE]">Match Score</span>
                                <span className={`text-sm font-bold ${matchAnalysis.score > 70 ? 'text-green-400' : 'text-yellow-400'}`}>{matchAnalysis.score}%</span>
                            </div>
                            <p className="text-[10px] text-[#6B7280]">{matchAnalysis.tip}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Output */}
            <div className="flex-1 bg-[#0E1015] flex flex-col">
                <div className="h-12 border-b border-[#232838] flex items-center justify-between px-4">
                    <div className="flex items-center space-x-2 text-xs text-[#9BA1AE]">
                        <Code size={14} />
                        <span className="font-mono">preview.pdf</span>
                        {status === 'draft' && <span className="text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded text-[10px]">Generating...</span>}
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={handleDownloadPDF} disabled={!pdfUrl} className="linear-button linear-button-secondary text-xs h-7 flex items-center space-x-1 disabled:opacity-50">
                            <Download size={12} /> <span>PDF</span>
                        </button>
                        <button onClick={handlePrepareEmail} disabled={!pdfUrl} className="linear-button linear-button-secondary text-xs h-7 flex items-center space-x-1 disabled:opacity-50">
                            <Send size={12} /> <span>Email</span>
                        </button>
                        <button onClick={() => document.getElementById('final_upload').click()} className="linear-button linear-button-secondary text-xs h-7 flex items-center space-x-1" title="Upload Signed">
                            <Edit size={12} />
                            <input type="file" id="final_upload" className="hidden" onChange={async (e) => { if (e.target.files[0]) { setLoading(true); const formData = new FormData(); formData.append('final_resume', e.target.files[0]); await axios.post(`/api/applications/${appId}/upload_final/`, formData); alert('Uploaded!'); setLoading(false); } }} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 relative bg-[#0E1015]">
                    {pdfUrl ? (
                        <iframe src={pdfUrl} className="w-full h-full border-none" title="Generated Resume" />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-[#232838]">
                            <Sparkles size={48} className="mb-4 opacity-50" />
                            <p className="text-sm font-medium text-[#6B7280]">Ready to generate</p>
                        </div>
                    )}
                    {loading && (
                        <div className="absolute inset-0 bg-[#0E1015]/80 flex items-center justify-center z-10">
                            <div className="text-[#E6E8EB] text-xs font-mono animate-pulse">Processing...</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Analysis Overlay (Minimal) */}
            <AnimatePresence>
                {analysisResult && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setAnalysisResult(null)}>
                        <div className="w-[600px] max-h-[80vh] bg-[#151821] border border-[#232838] rounded-lg shadow-2xl overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-medium text-[#E6E8EB]">Answer Analysis</h3>
                                <button onClick={() => setAnalysisResult(null)}><X size={16} className="text-[#6B7280]" /></button>
                            </div>
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#0E1015] border border-[#232838] p-3 rounded">
                                        <div className="text-[10px] text-[#9BA1AE] uppercase">Rating</div>
                                        <div className={`text-xl font-bold ${analysisResult.rating === 'Strong' ? 'text-green-400' : 'text-[#E6E8EB]'}`}>{analysisResult.rating}</div>
                                    </div>
                                    <div className="bg-[#0E1015] border border-[#232838] p-3 rounded">
                                        <div className="text-[10px] text-[#9BA1AE] uppercase">Tone</div>
                                        <div className="text-sm text-[#E6E8EB]">{analysisResult.communication?.tone}</div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-medium text-[#E6E8EB] mb-2">Feedback</h4>
                                    <p className="text-sm text-[#9BA1AE] leading-relaxed">{analysisResult.feedback_summary}</p>
                                </div>
                                <div className="bg-[#232838]/30 p-3 rounded border border-[#232838]">
                                    <h4 className="text-xs font-medium text-[#E6E8EB] mb-2">Better Answer</h4>
                                    <p className="text-xs text-[#9BA1AE] italic">"{analysisResult.improved_version}"</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Interview Overlay (Minimal Split) */}
            <AnimatePresence>
                {showInterview && (
                    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 bottom-0 w-[400px] bg-[#151821] border-l border-[#232838] shadow-2xl z-40 flex flex-col">
                        <div className="h-12 border-b border-[#232838] flex items-center justify-between px-4 bg-[#151821]">
                            <span className="text-sm font-medium text-[#E6E8EB]">Interview Mode</span>
                            <button onClick={() => setShowInterview(false)}><X size={16} className="text-[#6B7280]" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0E1015]">
                            {interviewMessages.map((msg, idx) => (
                                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded text-sm ${msg.role === 'user' ? 'bg-[#232838] text-[#E6E8EB]' : 'text-[#9BA1AE]'}`}>
                                        {msg.content}
                                    </div>
                                    {msg.role === 'user' && (
                                        <button onClick={() => analyzeAnswer(idx)} className="mt-1 text-[10px] text-[#6B7280] hover:text-[#E6E8EB] underline">
                                            {analyzingId === idx ? 'Analyzing...' : 'Analyze'}
                                        </button>
                                    )}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 border-t border-[#232838] bg-[#151821]">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={currentMessage}
                                    onChange={e => setCurrentMessage(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && sendInterviewMessage()}
                                    className="linear-input flex-1"
                                    placeholder="Type answer..."
                                />
                                <button onClick={sendInterviewMessage} className="linear-button linear-button-primary"><Send size={14} /></button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AppGenerator;
