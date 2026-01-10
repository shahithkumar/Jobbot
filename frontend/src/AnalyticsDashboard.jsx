import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { TrendingUp, Users, CheckCircle, XCircle, Clock, Activity, Target, Briefcase, Zap } from 'lucide-react';

const COLORS = ['#5E6AD2', '#22C55E', '#F59E0B', '#EF4444', '#6B7280'];

const StatCard = ({ title, value, icon: Icon }) => (
    <div className="bg-[#151821] border border-[#232838] p-4 rounded-lg flex flex-col justify-between h-24 hover:border-[#3F4555] transition-colors">
        <div className="flex justify-between items-start">
            <h4 className="text-[10px] font-bold text-[#9BA1AE] uppercase tracking-wider">{title}</h4>
            <Icon size={14} className="text-[#6B7280]" />
        </div>
        <p className="text-2xl font-medium text-[#E6E8EB]">{value}</p>
    </div>
);

const AnalyticsDashboard = ({ apps }) => {
    // 1. Calculate Funnel Stats
    const stats = useMemo(() => {
        const total = apps.length;
        const applied = apps.filter(a => a.status === 'sent').length;
        const interview = apps.filter(a => a.status === 'interview').length;
        const offer = apps.filter(a => a.status === 'offer').length;
        const rejected = apps.filter(a => a.status === 'rejected').length;
        return { total, applied, interview, offer, rejected };
    }, [apps]);

    // 2. Prepare Chart Data
    const funnelData = [
        { name: 'Applied', value: stats.applied },
        { name: 'Interview', value: stats.interview },
        { name: 'Offer', value: stats.offer },
    ];

    const statusData = [
        { name: 'Sent', value: stats.applied },
        { name: 'Rejected', value: stats.rejected },
        { name: 'Draft', value: stats.total - stats.applied },
    ];

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total Apps" value={stats.total} icon={Clock} />
                <StatCard title="Interviews" value={stats.interview} icon={Users} />
                <StatCard title="Offers" value={stats.offer} icon={CheckCircle} />
                <StatCard title="Rejections" value={stats.rejected} icon={XCircle} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Funnel Chart */}
                <div className="bg-[#151821] border border-[#232838] p-4 rounded-lg">
                    <h3 className="text-xs font-medium text-[#E6E8EB] mb-4 flex items-center gap-2">
                        <Activity size={14} className="text-[#5E6AD2]" /> Pipeline Funnel
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={funnelData} layout="vertical" margin={{ left: -20 }}>
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={80}
                                    tick={{ fontSize: 10, fill: '#9BA1AE' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ background: '#0E1015', border: '1px solid #232838', borderRadius: '4px', fontSize: '12px' }}
                                    cursor={{ fill: '#232838', opacity: 0.4 }}
                                />
                                <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                                    {funnelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribution Chart */}
                <div className="bg-[#151821] border border-[#232838] p-4 rounded-lg">
                    <h3 className="text-xs font-medium text-[#E6E8EB] mb-4 flex items-center gap-2">
                        <Target size={14} className="text-[#5E6AD2]" /> Status Distribution
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#0E1015', border: '1px solid #232838', borderRadius: '4px', fontSize: '12px' }} />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    iconSize={8}
                                    formatter={(value) => <span className="text-[10px] text-[#9BA1AE] ml-1">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Activity & AI Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-[#151821] border border-[#232838] p-4 rounded-lg">
                    <h3 className="text-xs font-medium text-[#E6E8EB] mb-4 flex items-center gap-2">
                        <Clock size={14} className="text-[#5E6AD2]" /> Recent Activity
                    </h3>
                    <div className="space-y-3">
                        {apps.slice(0, 4).map((app, i) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-[#1B1F2A] transition-colors border border-transparent hover:border-[#232838] group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-[#232838] flex items-center justify-center text-[#9BA1AE] group-hover:text-[#E6E8EB] transition-colors">
                                        <Briefcase size={14} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm text-[#E6E8EB] font-medium leading-none mb-1">{app.job?.title || 'Unknown Role'}</h4>
                                        <p className="text-[10px] text-[#6B7280]">at {app.job?.company || 'Unknown Company'}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-mono text-[#5E6AD2] bg-[#5E6AD2]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">{app.status}</span>
                            </div>
                        ))}
                        {apps.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 text-[#6B7280]">
                                <Clock size={24} className="mb-2 opacity-20" />
                                <p className="text-xs">No recent activity found</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-[#151821] border border-[#232838] p-4 rounded-lg relative overflow-hidden group">
                    <div className="absolute -top-4 -right-4 p-3 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                        <Zap size={100} className="text-[#F59E0B]" />
                    </div>
                    <h3 className="text-xs font-medium text-[#E6E8EB] mb-4 flex items-center gap-2 relative z-10">
                        <Zap size={14} className="text-[#F59E0B]" /> AI Insights
                    </h3>
                    <div className="space-y-4 relative z-10">
                        <div className="p-3 bg-[#0E1015] rounded border border-[#232838] hover:border-[#3F4555] transition-colors">
                            <h4 className="text-[10px] font-bold text-[#9BA1AE] uppercase tracking-wider mb-1">Response Rate</h4>
                            <p className="text-xl font-medium text-[#E6E8EB]">12% <span className="text-[10px] text-[#22C55E] font-normal ml-1">↑ 2% vs last week</span></p>
                        </div>
                        <div className="p-3 bg-[#0E1015] rounded border border-[#232838] hover:border-[#3F4555] transition-colors">
                            <h4 className="text-[10px] font-bold text-[#9BA1AE] uppercase tracking-wider mb-1">Market Fit</h4>
                            <p className="text-xl font-medium text-[#E6E8EB]">High <span className="text-[10px] text-[#6B7280] font-normal ml-1">Based on keywords</span></p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-[#232838]">
                            <p className="text-[10px] text-[#6B7280] italic">
                                "Try adding more 'Leadership' keywords to your resume to increase visibility."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
