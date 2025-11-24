import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject, generateOutline } from '../api';
import Layout from '../components/Layout';
import { FileText, Presentation, Loader } from 'lucide-react';

const ConfigWizard = () => {
    const [step, setStep] = useState(1);
    const [docType, setDocType] = useState('docx');
    const [title, setTitle] = useState('');
    const [numSlides, setNumSlides] = useState('');
    const [customTitles, setCustomTitles] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleCreate = async () => {
        if (!title) return;
        setLoading(true);
        try {
            // 1. Create Project
            const project = await createProject(title, docType);

            // 2. Generate Outline (Optional but good for UX)
            const titlesArray = customTitles.split('\n').map(t => t.trim()).filter(t => t);
            await generateOutline(project.id, title, {
                numSlides: numSlides ? parseInt(numSlides) : null,
                customTitles: titlesArray.length > 0 ? titlesArray : null
            });

            navigate(`/editor/${project.id}`);
        } catch (error) {
            console.error('Failed to create project', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
                <h1 className="text-2xl font-bold mb-6 text-center">Create New Document</h1>

                {/* Step 1: Choose Type */}
                {step === 1 && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-medium text-gray-900">1. Select Document Type</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setDocType('docx')}
                                className={`p-6 border-2 rounded-xl flex flex-col items-center space-y-4 transition-colors ${docType === 'docx' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                                    }`}
                            >
                                <FileText className="h-12 w-12 text-blue-600" />
                                <span className="font-medium">Word Document (.docx)</span>
                            </button>
                            <button
                                onClick={() => setDocType('pptx')}
                                className={`p-6 border-2 rounded-xl flex flex-col items-center space-y-4 transition-colors ${docType === 'pptx' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                                    }`}
                            >
                                <Presentation className="h-12 w-12 text-orange-600" />
                                <span className="font-medium">PowerPoint (.pptx)</span>
                            </button>
                        </div>
                        <button
                            onClick={() => setStep(2)}
                            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Step 2: Define Topic */}
                {step === 2 && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-medium text-gray-900">2. What is this document about?</h2>
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                Topic / Title
                            </label>
                            <input
                                type="text"
                                id="title"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3 border"
                                placeholder="e.g., Market Analysis of EV Industry 2025"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setStep(1)}
                                className="w-1/2 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={!title}
                                className="w-1/2 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Outline Configuration */}
                {step === 3 && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-medium text-gray-900">3. Outline Configuration</h2>

                        {docType === 'pptx' ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Number of Slides (Optional)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3 border"
                                        placeholder="e.g., 10"
                                        value={numSlides}
                                        onChange={(e) => setNumSlides(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Leave blank for AI to decide.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Custom Slide Titles (Optional)
                                    </label>
                                    <textarea
                                        rows={5}
                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3 border"
                                        placeholder="Enter titles, one per line..."
                                        value={customTitles}
                                        onChange={(e) => setCustomTitles(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Overrides "Number of Slides" if provided.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-600">
                                <p>We will generate a standard outline for your Word document based on the topic.</p>
                                <p className="mt-2 text-sm">You can add/remove sections later in the editor.</p>
                            </div>
                        )}

                        <div className="flex space-x-4">
                            <button
                                onClick={() => setStep(2)}
                                className="w-1/2 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={loading}
                                className="w-1/2 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center"
                            >
                                {loading ? <Loader className="animate-spin h-5 w-5" /> : 'Create & Generate'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ConfigWizard;
