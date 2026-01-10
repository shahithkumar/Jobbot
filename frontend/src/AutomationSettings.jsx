import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Zap, Clock, Play, Save, CheckCircle, AlertTriangle } from 'lucide-react';

const AutomationSettings = () => {
    const [settings, setSettings] = useState({
        isActive: false,
        dailyTime: '09:00',
        maxApps: 10,
        autoApprove: false
    });
    const [status, setStatus] = useState('idle'); // idle, running, success, error

    useEffect(() => {
        const saved = localStorage.getItem('automation_settings');
        if (saved) {
            setSettings(JSON.parse(saved));
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem('automation_settings', JSON.stringify(settings));
        alert("Settings saved locally!");
    };

    const runNow = async () => {
        setStatus('running');
        try {
            await axios.post('/api/jobs/apply_all/', {
                limit: settings.maxApps,
                auto_approve: settings.autoApprove,
                resume_id: null
            });
            setStatus('success');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (err) {
            setStatus('error');
            alert("Failed to run automation: " + err.message);
        }
    };

    return (
        <div className="max-w-2xl mx-auto mt-10 space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-xl font-medium text-[#E6E8EB] flex items-center gap-3">
                    <Zap className="text-[#5E6AD2]" size={24} />
                    Automation
                </h2>
                <p className="text-[#9BA1AE] text-sm mt-1">
                    Configure JobBot to automatically find and apply for jobs on your behalf.
                </p>
            </div>

            {/* 1. MANUAL TRIGGER CARD (Prominent) */}
            <div className="bg-[#151821] border border-[#232838] rounded-lg p-6 flex items-center justify-between shadow-lg">
                <div>
                    <h3 className="text-base font-medium text-[#E6E8EB] flex items-center gap-2">
                        <Play size={18} className="text-green-500" /> Run Immediately
                    </h3>
                    <p className="text-xs text-[#9BA1AE] mt-1 max-w-sm">
                        Bypass the schedule and try to find & apply for new jobs right now.
                    </p>
                    {status === 'success' && <p className="text-xs text-green-500 mt-2 flex items-center gap-1"><CheckCircle size={12} /> Started successfully!</p>}
                    {status === 'error' && <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><AlertTriangle size={12} /> Failed to start.</p>}
                </div>
                <button
                    onClick={runNow}
                    disabled={status === 'running'}
                    className="linear-button-primary px-6 py-3 text-sm flex items-center gap-2 h-auto"
                >
                    {status === 'running' ? (
                        <>
                            <span className="animate-spin duration-1000">
                                <Zap size={16} />
                            </span>
                            Starting...
                        </>
                    ) : (
                        <>
                            <Play size={16} fill="currentColor" />
                            Run Now
                        </>
                    )}
                </button>
            </div>

            {/* 2. SCHEDULED AUTOMATION CARD */}
            <div className="bg-[#151821] border border-[#232838] rounded-lg overflow-hidden opacity-90">
                <div className="bg-[#0E1015] px-6 py-4 border-b border-[#232838]">
                    <h3 className="text-sm font-medium text-[#E6E8EB] flex items-center gap-2">
                        <Clock size={16} className="text-[#5E6AD2]" /> Daily Schedule
                    </h3>
                </div>

                <div className="p-6 space-y-6">
                    {/* Active Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-[#E6E8EB]">Enable Daily Schedule</h3>
                            <p className="text-xs text-[#6B7280]">Automatically runs once a day at the time below.</p>
                        </div>
                        <button
                            onClick={() => setSettings(s => ({ ...s, isActive: !s.isActive }))}
                            className={`w-12 h-6 rounded-full transition-colors relative ${settings.isActive ? 'bg-[#5E6AD2]' : 'bg-[#232838]'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${settings.isActive ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="h-px bg-[#232838]" />

                    {/* Schedule Inputs */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[#9BA1AE] uppercase tracking-wide">Time</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" size={16} />
                                <input
                                    type="time"
                                    value={settings.dailyTime}
                                    onChange={(e) => setSettings(s => ({ ...s, dailyTime: e.target.value }))}
                                    className="linear-input w-full pl-10"
                                    disabled={!settings.isActive}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[#9BA1AE] uppercase tracking-wide">Limit</label>
                            <input
                                type="number"
                                value={settings.maxApps}
                                onChange={(e) => setSettings(s => ({ ...s, maxApps: parseInt(e.target.value) }))}
                                className="linear-input w-full"
                                placeholder="10"
                                disabled={!settings.isActive}
                            />
                        </div>
                    </div>

                    {/* Auto Approve */}
                    <div className="flex items-center gap-3 p-3 rounded bg-[#0E1015] border border-[#232838]">
                        <input
                            type="checkbox"
                            checked={settings.autoApprove}
                            onChange={(e) => setSettings(s => ({ ...s, autoApprove: e.target.checked }))}
                            className="w-4 h-4 rounded border-[#232838] bg-[#151821] text-[#5E6AD2] focus:ring-0 focus:ring-offset-0"
                        />
                        <div>
                            <span className="text-sm text-[#E6E8EB]">Auto-approve low risk applications</span>
                            <p className="text-[10px] text-[#6B7280]">Skip manual review for high-confidence matches</p>
                        </div>
                    </div>
                </div>

                {/* Footer Save */}
                <div className="bg-[#0E1015] border-t border-[#232838] p-4 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="linear-button flex items-center gap-2"
                    >
                        <Save size={14} /> Save Schedule
                    </button>
                </div>
            </div>

            {/* Info Box */}
            <div className="p-4 rounded border border-yellow-900/30 bg-yellow-900/10 flex gap-3 text-yellow-500">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <h4 className="text-sm font-medium">Browser Requirement</h4>
                    <p className="text-xs opacity-80 leading-relaxed">
                        For the <strong>Scheduled</strong> automation to run, this tab must remain open.
                        The <strong>Run Immediately</strong> button works instantly regardless of schedule.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AutomationSettings;
