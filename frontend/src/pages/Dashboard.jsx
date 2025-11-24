import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, deleteProject } from '../api';
import Layout from '../components/Layout';
import { Plus, FileText, Presentation, Trash2 } from 'lucide-react';

const Dashboard = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const data = await getProjects();
            setProjects(data);
        } catch (error) {
            console.error('Failed to fetch projects', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (projectId, e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!window.confirm('Are you sure you want to delete this project?')) {
            return;
        }

        try {
            await deleteProject(projectId);
            fetchProjects();
        } catch (error) {
            console.error('Failed to delete project', error);
            alert('Failed to delete project');
        }
    };

    return (
        <Layout>
            <div className="px-4 sm:px-0">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">My Projects</h1>
                    <Link
                        to="/create"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        New Project
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-10">Loading...</div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-lg shadow">
                        <p className="text-gray-500">No projects found. Create one to get started!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className="block bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200 relative group"
                            >
                                <Link to={`/editor/${project.id}`} className="block">
                                    <div className="px-4 py-5 sm:p-6">
                                        <div className="flex items-center">
                                            <div className={`flex-shrink-0 rounded-md p-3 ${project.doc_type === 'docx' ? 'bg-blue-100' : 'bg-orange-100'}`}>
                                                {project.doc_type === 'docx' ? (
                                                    <FileText className={`h-6 w-6 ${project.doc_type === 'docx' ? 'text-blue-600' : 'text-orange-600'}`} />
                                                ) : (
                                                    <Presentation className={`h-6 w-6 ${project.doc_type === 'docx' ? 'text-blue-600' : 'text-orange-600'}`} />
                                                )}
                                            </div>
                                            <div className="ml-5 w-0 flex-1">
                                                <dl>
                                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                                        {project.doc_type.toUpperCase()} Document
                                                    </dt>
                                                    <dd>
                                                        <div className="text-lg font-medium text-gray-900 truncate">
                                                            {project.title}
                                                        </div>
                                                    </dd>
                                                </dl>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 px-4 py-4 sm:px-6">
                                        <div className="text-sm text-gray-500">
                                            Created {new Date(project.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </Link>
                                <button
                                    onClick={(e) => handleDelete(project.id, e)}
                                    className="absolute top-2 right-2 p-2 bg-red-100 text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                                    title="Delete project"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Dashboard;
