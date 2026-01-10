import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, User, Bot, ArrowLeft, Mic, StopCircle } from 'lucide-react';

const InterviewCoach = ({ job, onBack }) => {
    const [sessionId, setSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(() => { scrollToBottom(); }, [messages]);

    useEffect(() => {
        const startSession = async () => {
            try {
                const res = await axios.post(`/api/interview/${job.id}/start/`);
                setSessionId(res.data.session_id);
                setMessages(res.data.messages);
            } catch (err) { alert("Failed to start interview: " + err.message); }
        };
        startSession();
    }, [job.id]);

    const handleSend = async () => {
        if (!input.trim() || !sessionId) return;
        const userMsg = input;
        setInput('');

        const newMsgs = [...messages, { role: 'user', content: userMsg }];
        setMessages(newMsgs);
        setLoading(true);

        try {
            const res = await axios.post(`/api/interview/${sessionId}/chat/`, { message: userMsg });
            setMessages(res.data.messages);
        } catch (err) {
            alert("Error sending message");
            setMessages(prev => [...prev, { role: 'ai', content: "[Error connection]" }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] border border-[#232838] bg-[#0E1015] rounded-lg overflow-hidden">
            {/* Header */}
            <div className="h-14 border-b border-[#232838] bg-[#151821] flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-[#9BA1AE] hover:text-[#E6E8EB] transition-colors"><ArrowLeft size={16} /></button>
                    <div>
                        <h2 className="text-sm font-medium text-[#E6E8EB] flex items-center gap-2">Mock Interview Session</h2>
                        <p className="text-[10px] text-[#9BA1AE]">{job.company} • {job.title}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs text-[#9BA1AE]">AI Active</span>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0E1015]">
                {messages.map((msg, idx) => {
                    const isAi = msg.role === 'ai';
                    return (
                        <div key={idx} className={`flex w-full ${isAi ? 'justify-start' : 'justify-end'}`}>
                            <div className={`flex max-w-[80%] gap-3 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
                                <div className={`w-8 h-8 rounded border border-[#232838] flex items-center justify-center shrink-0 text-[#9BA1AE] bg-[#151821]`}>
                                    {isAi ? <Bot size={16} /> : <User size={16} />}
                                </div>
                                <div className={`p-3 rounded text-sm leading-relaxed ${isAi
                                        ? 'text-[#E6E8EB]'
                                        : 'bg-[#232838] text-[#E6E8EB] border border-[#232838]'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {loading && (
                    <div className="flex justify-start">
                        <div className="flex items-center gap-2 text-[#9BA1AE] text-xs ml-11">
                            <span>Assistant is typing...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#151821] border-t border-[#232838]">
                <div className="flex gap-2 relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your answer..."
                        className="linear-input w-full pl-4 pr-12"
                        autoFocus
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#9BA1AE] hover:text-[#E6E8EB] disabled:opacity-50 transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InterviewCoach;
