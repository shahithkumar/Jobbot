import { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, MoreHorizontal, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ResumeUpload = ({ onUploadSuccess, resumes = [], onDelete }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [file, setFile] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [latexCode, setLatexCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('latex_code', latexCode);
        if (file) formData.append('file', file);

        try {
            await axios.post('/api/resumes/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // Reset form
            setName(''); setDescription(''); setLatexCode(''); setFile(null); setIsUploading(false);
            if (onUploadSuccess) onUploadSuccess();
        } catch (error) {
            console.error(error);
            alert('Upload failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#232838] pb-4">
                <h3 className="text-sm font-medium text-[#E6E8EB]">My Resumes</h3>
                <button
                    onClick={() => setIsUploading(!isUploading)}
                    className="linear-button linear-button-secondary flex items-center space-x-2 text-xs"
                >
                    <Plus size={14} />
                    <span>Upload Resume</span>
                </button>
            </div>

            <AnimatePresence>
                {isUploading && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-[#151821] border border-[#232838] rounded-md p-4 mb-4">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-[#9BA1AE] mb-1">Name</label>
                                        <input
                                            type="text" required value={name} onChange={e => setName(e.target.value)}
                                            className="linear-input w-full" placeholder="e.g. Frontend V1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-[#9BA1AE] mb-1">Description</label>
                                        <input
                                            type="text" value={description} onChange={e => setDescription(e.target.value)}
                                            className="linear-input w-full" placeholder="Optional context"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-[#9BA1AE] mb-1">Content (File or Text)</label>
                                    <div className="flex space-x-4">
                                        <input
                                            type="file"
                                            onChange={e => setFile(e.target.files[0])}
                                            className="text-xs text-[#9BA1AE] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-[#232838] file:text-[#E6E8EB] hover:file:bg-[#2F3646]"
                                        />
                                        <div className="text-xs text-[#6B7280] flex items-center">OR</div>
                                        <textarea
                                            value={latexCode} onChange={e => setLatexCode(e.target.value)}
                                            className="linear-input flex-1 h-10 py-1 font-mono text-xs"
                                            placeholder="Paste LaTeX/Text if no file..."
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsUploading(false)}
                                        className="linear-button linear-button-secondary text-xs"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        disabled={loading}
                                        className="linear-button linear-button-primary text-xs"
                                    >
                                        {loading ? 'Uploading...' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="border border-[#232838] rounded-md overflow-hidden bg-[#151821]">
                {resumes.length === 0 ? (
                    <div className="p-8 text-center text-[#6B7280] text-xs">No resumes uploaded yet.</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <tbody>
                            {resumes.map((r, idx) => (
                                <tr key={r.id} className="border-b border-[#232838] last:border-0 hover:bg-[#1B1F2A] transition-colors group">
                                    <td className="p-3 w-8 text-[#9BA1AE]"><FileText size={16} /></td>
                                    <td className="p-3 text-sm font-medium text-[#E6E8EB]">{r.name}</td>
                                    <td className="p-3 text-sm text-[#9BA1AE] hidden sm:table-cell">{r.description || <span className="text-[#6B7280] italic">No description</span>}</td>
                                    <td className="p-3 text-right">
                                        <button className="text-[#6B7280] hover:text-[#E6E8EB] opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ResumeUpload;
