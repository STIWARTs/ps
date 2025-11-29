import axios from 'axios';

const API_BASE = 'https://ps-p5on.onrender.com/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Board API
export const boardApi = {
    getAll: (teacherId) => api.get(`/boards/teacher/${teacherId}`),
    getOne: (boardId) => api.get(`/boards/${boardId}`),
    create: (data) => api.post('/boards', data),
    update: (boardId, data) => api.put(`/boards/${boardId}`, data),
    delete: (boardId) => api.delete(`/boards/${boardId}`),
    savePage: (boardId, pageNumber, data) => api.post(`/boards/${boardId}/pages/${pageNumber}`, data),
    addPage: (boardId) => api.post(`/boards/${boardId}/pages`),
    share: (boardId) => api.post(`/boards/${boardId}/share`)
};

// AI API
export const aiApi = {
    generateText: (data) => api.post('/ai/generate-text', data),
    generateImage: (data) => api.post('/ai/generate-image', data),
    chat: (data) => api.post('/ai/chat', data),
    searchContent: (data) => api.post('/ai/search-content', data)
};

// YouTube API
export const youtubeApi = {
    search: (query, maxResults = 10) => api.get(`/youtube/search?query=${encodeURIComponent(query)}&maxResults=${maxResults}`),
    getVideo: (videoId) => api.get(`/youtube/video/${videoId}`),
    searchEducational: (topic, maxResults = 10) => api.get(`/youtube/educational?topic=${encodeURIComponent(topic)}&maxResults=${maxResults}`)
};

// Upload API
export const uploadApi = {
    uploadPdf: (formData) => api.post('/upload/pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    uploadVoice: (formData) => api.post('/upload/voice', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getFile: (type, filename) => `${API_BASE}/upload/file/${type}/${filename}`,
    deleteFile: (type, filename, boardId, pageNumber) => api.delete(`/upload/file/${type}/${filename}`, {
        data: { boardId, pageNumber }
    })
};

export default api;
