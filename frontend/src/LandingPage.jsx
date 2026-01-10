import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, FileText, Send, Mic, CheckCircle, ArrowRight, Star } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0E1015] text-[#E6E8EB] font-sans selection:bg-[#6366F1] selection:text-white">
            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-[#0E1015]/80 backdrop-blur-md border-b border-[#232838]">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-lg flex items-center justify-center">
                            <Bot size={20} className="text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">JobBot AI</span>
                    </div>
                    <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-[#9BA1AE]">
                        <a href="#features" className="hover:text-[#E6E8EB] transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-[#E6E8EB] transition-colors">How it Works</a>
                        <a href="#testimonials" className="hover:text-[#E6E8EB] transition-colors">Success Stories</a>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-[#151821] hover:bg-[#1B1F2A] text-[#E6E8EB] px-4 py-2 rounded-lg text-sm font-medium border border-[#232838] transition-all"
                    >
                        Log In
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[#6366F1]/20 rounded-full blur-[120px] -z-10" />

                <div className="max-w-5xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="inline-block px-3 py-1 rounded-full bg-[#6366F1]/10 text-[#818CF8] text-xs font-medium border border-[#6366F1]/20 mb-6">
                            🚀 The Future of Job Hunting is Here
                        </span>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-[#9BA1AE]">
                            Your Personal <br />
                            <span className="text-[#6366F1]">AI Recruiter</span>
                        </h1>
                        <p className="text-lg md:text-xl text-[#9BA1AE] mb-10 max-w-2xl mx-auto leading-relaxed">
                            Stop applying manually. JobBot finds jobs, tailors your resume, and sends personalized emails to HR—all while you sleep.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/dashboard')}
                                className="w-full sm:w-auto px-8 py-4 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-xl font-semibold text-lg shadow-lg shadow-[#6366F1]/25 flex items-center justify-center space-x-2 transition-all"
                            >
                                <span>Get Started Free</span>
                                <ArrowRight size={20} />
                            </motion.button>
                            <button className="w-full sm:w-auto px-8 py-4 bg-[#151821] hover:bg-[#1B1F2A] text-[#E6E8EB] border border-[#232838] rounded-xl font-semibold text-lg transition-all">
                                View Demo
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Info Component */}
            <section id="features" className="py-24 bg-[#0E1015] relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to get hired</h2>
                        <p className="text-[#9BA1AE]">Automation tools that put your job search on autopilot.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Send className="text-[#6366F1]" />}
                            title="Automated Outreach"
                            desc="We scan for jobs and send 100% personalized emails to hiring managers. You just approve the drafts."
                        />
                        <FeatureCard
                            icon={<FileText className="text-[#EC4899]" />}
                            title="Resume Tailoring"
                            desc="Our AI rewrites your resume for EVERY single job application to beat the ATS and impress humans."
                        />
                        <FeatureCard
                            icon={<Mic className="text-[#10B981]" />}
                            title="AI Interview Coach"
                            desc="Practice with a realistic AI interviewer that knows the job description and your resume inside out."
                        />
                    </div>
                </div>
            </section>

            {/* Social Proof / Stats */}
            <section className="py-20 border-y border-[#232838] bg-[#11131A]">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <Stat number="500+" label="Jobs Applied" />
                    <Stat number="98%" label="Response Rate" />
                    <Stat number="24/7" label="Automation" />
                    <Stat number="10x" label="Faster Hiring" />
                </div>
            </section>

            {/* How it Works */}
            <section id="how-it-works" className="py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">How JobBot Works</h2>
                            <div className="space-y-8">
                                <Step
                                    number="01"
                                    title="Upload Your Base Resume"
                                    desc="We analyze your skills and experience to create a master profile."
                                />
                                <Step
                                    number="02"
                                    title="Set Your Preferences"
                                    desc="Tell us what roles, locations, and salary you are looking for."
                                />
                                <Step
                                    number="03"
                                    title="Approve & Send"
                                    desc="Review the daily drafts we generate. Click 'Approve' and we handle the rest."
                                />
                            </div>
                        </div>
                        <div className="relative h-[500px] bg-[#151821] border border-[#232838] rounded-2xl p-6 shadow-2xl overflow-hidden group">
                            {/* Abstract UI representation */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1]/5 to-transparent pointer-events-none" />

                            <div className="space-y-4">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                </div>

                                <div className="bg-[#1B1F2A] rounded-lg p-4 border border-[#232838] animate-pulse">
                                    <div className="h-4 w-3/4 bg-[#2D3342] rounded mb-2" />
                                    <div className="h-3 w-1/2 bg-[#2D3342] rounded" />
                                </div>
                                <div className="bg-[#1B1F2A] rounded-lg p-4 border border-[#232838] opacity-75">
                                    <div className="h-4 w-2/3 bg-[#2D3342] rounded mb-2" />
                                    <div className="h-3 w-1/2 bg-[#2D3342] rounded" />
                                </div>
                                <div className="bg-[#1B1F2A] rounded-lg p-4 border border-[#232838] opacity-50">
                                    <div className="h-4 w-4/5 bg-[#2D3342] rounded mb-2" />
                                    <div className="h-3 w-1/3 bg-[#2D3342] rounded" />
                                </div>

                                <div className="absolute bottom-6 left-6 right-6 bg-[#6366F1] p-4 rounded-xl text-center shadow-lg">
                                    <span className="font-semibold text-white">Generating Application...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <div className="bg-gradient-to-br from-[#151821] to-[#0E1015] border border-[#232838] rounded-3xl p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#6366F1]/10 rounded-full blur-[80px] -z-10" />

                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to land your dream job?</h2>
                        <p className="text-[#9BA1AE] mb-8 text-lg">Join thousands of candidates who are saving 20+ hours a week.</p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-8 py-4 bg-[#E6E8EB] hover:bg-white text-[#0E1015] rounded-xl font-bold text-lg transition-all"
                        >
                            Get Started Now
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-[#232838] text-center text-[#6B7280] text-sm">
                <p>&copy; 2024 JobBot AI. All rights reserved.</p>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }) => (
    <div className="p-8 rounded-2xl bg-[#151821] border border-[#232838] hover:border-[#6366F1]/50 transition-colors group">
        <div className="w-12 h-12 bg-[#1B1F2A] rounded-lg flex items-center justify-center mb-6 border border-[#232838] group-hover:bg-[#6366F1]/10 group-hover:border-[#6366F1]/50 transition-colors">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-[#9BA1AE] leading-relaxed">{desc}</p>
    </div>
);

const Stat = ({ number, label }) => (
    <div>
        <div className="text-4xl font-bold text-[#E6E8EB] mb-2">{number}</div>
        <div className="text-[#6B7280] font-medium uppercase tracking-wide text-xs">{label}</div>
    </div>
);

const Step = ({ number, title, desc }) => (
    <div className="flex space-x-4">
        <div className="text-2xl font-bold text-[#232838]">{number}</div>
        <div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-[#9BA1AE]">{desc}</p>
        </div>
    </div>
);

export default LandingPage;
