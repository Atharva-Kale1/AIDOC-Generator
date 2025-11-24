import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProject, generateContent, refineContent, exportDocument, createContent, deleteContent, updateFeedback, updateNotes } from '../api';
import Layout from '../components/Layout';
import { Save, Download, RefreshCw, MessageSquare, ThumbsUp, ThumbsDown, GripVertical, Trash2, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import axios from 'axios';

const Editor = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generatingId, setGeneratingId] = useState(null);
    const [refiningId, setRefiningId] = useState(null);
    const [refinePrompts, setRefinePrompts] = useState({});
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [notesOpen, setNotesOpen] = useState({});
    const [notesText, setNotesText] = useState({});

    useEffect(() => {
        fetchProject();
    }, [id]);

    const fetchProject = async () => {
        try {
            const data = await getProject(id);
            if (data.contents) {
                data.contents.sort((a, b) => a.section_order - b.section_order);
            }
            setProject(data);
        } catch (error) {
            console.error('Failed to fetch project', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (contentId) => {
        setGeneratingId(contentId);
        try {
            const updatedContent = await generateContent(id, contentId);
            setProject(prev => ({
                ...prev,
                contents: prev.contents.map(c => c.id === contentId ? updatedContent : c)
            }));
        } catch (error) {
            console.error('Generation failed', error);
        } finally {
            setGeneratingId(null);
        }
    };

    const handleRefine = async (contentId) => {
        const prompt = refinePrompts[contentId];
        if (!prompt) return;

        setRefiningId(contentId);
        try {
            const updatedContent = await refineContent(contentId, prompt);
            setProject(prev => ({
                ...prev,
                contents: prev.contents.map(c => c.id === contentId ? updatedContent : c)
            }));
            setRefinePrompts(prev => ({ ...prev, [contentId]: '' }));
        } catch (error) {
            console.error('Refinement failed', error);
        } finally {
            setRefiningId(null);
        }
    };

    const handleExport = async () => {
        try {
            await exportDocument(id, project.title, project.doc_type);
        } catch (error) {
            console.error("Export failed", error);
            alert("Export failed. Please try again.");
        }
    };

    const handleAddSection = async () => {
        if (!newSectionTitle) return;
        setIsAdding(true);
        try {
            const newContent = await createContent(id, newSectionTitle);
            setProject(prev => ({
                ...prev,
                contents: [...prev.contents, newContent]
            }));
            setNewSectionTitle('');
        } catch (error) {
            console.error("Failed to add section", error);
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteSection = async (contentId) => {
        if (!window.confirm("Are you sure you want to delete this section?")) return;
        try {
            await deleteContent(id, contentId);
            setProject(prev => ({
                ...prev,
                contents: prev.contents.filter(c => c.id !== contentId)
            }));
        } catch (error) {
            console.error("Failed to delete section", error);
        }
    };

    const handleFeedback = async (contentId, feedback) => {
        try {
            await updateFeedback(id, contentId, feedback);
            setProject(prev => ({
                ...prev,
                contents: prev.contents.map(c => c.id === contentId ? { ...c, feedback } : c)
            }));
        } catch (error) {
            console.error("Failed to update feedback", error);
        }
    };

    const handleNotesSave = async (contentId) => {
        const notes = notesText[contentId];
        try {
            await updateNotes(id, contentId, notes);
            setProject(prev => ({
                ...prev,
                contents: prev.contents.map(c => c.id === contentId ? { ...c, user_notes: notes } : c)
            }));
        } catch (error) {
            console.error("Failed to save notes", error);
        }
    };

    const toggleNotes = (contentId, currentNotes) => {
        setNotesOpen(prev => ({ ...prev, [contentId]: !prev[contentId] }));
        if (!notesText[contentId]) {
            setNotesText(prev => ({ ...prev, [contentId]: currentNotes || '' }));
        }
    };

    const onDragEnd = async (result) => {
        if (!result.destination) return;

        const items = Array.from(project.contents);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const updatedItems = items.map((item, index) => ({
            ...item,
            section_order: index
        }));

        setProject(prev => ({
            ...prev,
            contents: updatedItems
        }));

        try {
            const { auth } = await import('../firebase');
            const user = auth.currentUser;
            if (user) {
                const token = await user.getIdToken();
                await axios.put(`http://localhost:8000/projects/${id}/reorder`, {
                    ordered_content_ids: updatedItems.map(c => c.id)
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch (error) {
            console.error("Failed to save new order", error);
            fetchProject();
        }
    };

    if (loading) return <Layout><div>Loading...</div></Layout>;
    if (!project) return <Layout><div>Project not found</div></Layout>;

    return (
        <Layout>
            <div className="max-w-5xl mx-auto px-4">
                <div className="flex justify-between items-center mb-8 sticky top-0 bg-gray-50 py-4 z-10">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
                        <span className="text-sm text-gray-500 uppercase tracking-wide">{project.doc_type}</span>
                    </div>
                    <button
                        onClick={handleExport}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </button>
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="contents">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="space-y-8 pb-20"
                            >
                                {project.contents && project.contents.map((content, index) => (
                                    <Draggable key={content.id} draggableId={String(content.id)} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className="bg-white shadow sm:rounded-lg overflow-hidden relative group"
                                            >
                                                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                                    <div className="flex items-center">
                                                        <div {...provided.dragHandleProps} className="mr-3 cursor-move text-gray-400 hover:text-gray-600">
                                                            <GripVertical className="h-5 w-5" />
                                                        </div>
                                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                                            {content.title}
                                                        </h3>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        {!content.content_text && (
                                                            <button
                                                                onClick={() => handleGenerate(content.id)}
                                                                disabled={generatingId === content.id}
                                                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                                            >
                                                                {generatingId === content.id ? <RefreshCw className="animate-spin h-4 w-4" /> : 'Generate Content'}
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteSection(content.id)}
                                                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                            title="Delete Section"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="px-4 py-5 sm:p-6">
                                                    {content.content_text ? (
                                                        <div className="prose max-w-none text-gray-800">
                                                            <ReactMarkdown>{content.content_text}</ReactMarkdown>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-8 text-gray-400 italic">
                                                            No content generated yet.
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Refinement Tools & Feedback */}
                                                {content.content_text && (
                                                    <div className="bg-gray-50 px-4 py-4 sm:px-6 border-t border-gray-200 space-y-4">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={() => handleFeedback(content.id, 'like')}
                                                                    className={`p-1 rounded hover:bg-gray-200 ${content.feedback === 'like' ? 'text-green-600' : 'text-gray-400'}`}
                                                                >
                                                                    <ThumbsUp className="h-5 w-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleFeedback(content.id, 'dislike')}
                                                                    className={`p-1 rounded hover:bg-gray-200 ${content.feedback === 'dislike' ? 'text-red-600' : 'text-gray-400'}`}
                                                                >
                                                                    <ThumbsDown className="h-5 w-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => toggleNotes(content.id, content.user_notes)}
                                                                    className={`p-1 rounded hover:bg-gray-200 ${notesOpen[content.id] ? 'text-indigo-600' : 'text-gray-400'}`}
                                                                    title="Add Notes"
                                                                >
                                                                    <MessageSquare className="h-5 w-5" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {notesOpen[content.id] && (
                                                            <div className="mt-2">
                                                                <textarea
                                                                    rows={3}
                                                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                                    placeholder="Add your notes here..."
                                                                    value={notesText[content.id] || ''}
                                                                    onChange={(e) => setNotesText(prev => ({ ...prev, [content.id]: e.target.value }))}
                                                                    onBlur={() => handleNotesSave(content.id)}
                                                                />
                                                            </div>
                                                        )}

                                                        <div className="flex space-x-4">
                                                            <input
                                                                type="text"
                                                                placeholder="Refine this section (e.g., 'Make it shorter', 'Add bullet points')"
                                                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border"
                                                                value={refinePrompts[content.id] || ''}
                                                                onChange={(e) => setRefinePrompts(prev => ({ ...prev, [content.id]: e.target.value }))}
                                                            />
                                                            <button
                                                                onClick={() => handleRefine(content.id)}
                                                                disabled={refiningId === content.id || !refinePrompts[content.id]}
                                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                                                            >
                                                                {refiningId === content.id ? <RefreshCw className="animate-spin h-4 w-4" /> : 'Refine'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

                <div className="mt-8 mb-20 p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Section</h3>
                    <div className="flex max-w-md mx-auto space-x-4">
                        <input
                            type="text"
                            placeholder="Section Title (e.g., Conclusion)"
                            className="flex-1 block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border"
                            value={newSectionTitle}
                            onChange={(e) => setNewSectionTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
                        />
                        <button
                            onClick={handleAddSection}
                            disabled={isAdding || !newSectionTitle}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isAdding ? <RefreshCw className="animate-spin h-4 w-4" /> : <Plus className="h-4 w-4 mr-2" />}
                            Add
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Editor;
