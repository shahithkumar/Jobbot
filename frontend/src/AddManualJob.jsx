import { useState } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const AddManualJob = ({ onJobAdded }) => {
    const [title, setTitle] = useState('');
    const [company, setCompany] = useState('');
    const [link, setLink] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/jobs/', {
                title, company, link, description,
                source: 'Manual Entry'
            });
            setTitle(''); setCompany(''); setLink(''); setDescription('');
            if (onJobAdded) onJobAdded();
        } catch (err) {
            console.error(err);
            alert('Failed to add job.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto mt-10"
        >
            <div className="bg-[#151821] border border-[#232838] rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-[#232838] flex items-center justify-between">
                    <h2 className="text-sm font-medium text-[#E6E8EB]">New Job Application</h2>
                    <span className="text-xs text-[#6B7280]">Manual Entry</span>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-[#9BA1AE] mb-1.5">Company</label>
                                <input
                                    type="text" required value={company} onChange={e => setCompany(e.target.value)}
                                    className="linear-input w-full" placeholder="Acme Corp"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[#9BA1AE] mb-1.5">Job Title</label>
                                <input
                                    type="text" required value={title} onChange={e => setTitle(e.target.value)}
                                    className="linear-input w-full" placeholder="Software Engineer"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-[#9BA1AE] mb-1.5">Job URL</label>
                            <input
                                type="url" required value={link} onChange={e => setLink(e.target.value)}
                                className="linear-input w-full" placeholder="https://..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-[#9BA1AE] mb-1.5">Description</label>
                            <textarea
                                required value={description} onChange={e => setDescription(e.target.value)}
                                className="linear-input w-full h-32 font-mono text-xs leading-relaxed resize-none"
                                placeholder="Paste job description..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            disabled={loading}
                            className="linear-button linear-button-primary flex items-center space-x-1.5"
                        >
                            {loading ? <span>Saving...</span> : (
                                <>
                                    <Plus size={14} />
                                    <span>Add Job</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
};

export default AddManualJob;
