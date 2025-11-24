import axios from 'axios';
import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getProjects = async () => {
    const response = await api.get('/projects/');
    return response.data;
};

export const createProject = async (title, doc_type) => {
    const response = await api.post('/projects/', { title, doc_type });
    return response.data;
};

export const getProject = async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
};

export const deleteProject = async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
};

export const generateOutline = async (projectId, topic, options = {}) => {
    const response = await api.post('/generate/outline', {
        project_id: projectId,
        topic,
        num_slides: options.numSlides,
        custom_titles: options.customTitles
    });
    return response.data;
};

export const generateContent = async (projectId, contentId) => {
    const response = await api.post(`/generate/content?project_id=${projectId}&content_id=${contentId}`);
    return response.data;
};

export const refineContent = async (contentId, prompt) => {
    const response = await api.post('/generate/refine', { content_id: contentId, prompt });
    return response.data;
};

export const createContent = async (projectId, title, contentText = "") => {
    const response = await api.post(`/projects/${projectId}/content`, {
        section_order: 0, // Backend handles order
        title,
        content_text: contentText
    });
    return response.data;
};

export const deleteContent = async (projectId, contentId) => {
    const response = await api.delete(`/projects/${projectId}/content/${contentId}`);
    return response.data;
};

export const updateFeedback = async (projectId, contentId, feedback) => {
    const response = await api.put(`/projects/${projectId}/content/${contentId}/feedback`, { feedback });
    return response.data;
};

export const updateNotes = async (projectId, contentId, notes) => {
    const response = await api.put(`/projects/${projectId}/content/${contentId}/notes`, { notes });
    return response.data;
};

export const exportDocument = async (projectId, title, docType) => {
    const response = await api.get(`/export/${projectId}`, {
        responseType: 'blob',
    });

    // Create a blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    // Try to get filename from content-disposition
    let filename = null;
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch.length === 2)
            filename = filenameMatch[1];
    }

    // Fallback if filename not found or has no extension
    if (!filename) {
        filename = `${title || 'document'}.${docType || 'docx'}`;
    } else if (!filename.includes('.')) {
        filename = `${filename}.${docType || 'docx'}`;
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
};

export default api;
