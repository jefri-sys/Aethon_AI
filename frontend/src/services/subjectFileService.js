import api from './api';

const API_URL = '/subjects';

export const subjectFileService = {
  getContents: async (subjectId, folderId = null) => {
    const res = await api.get(`${API_URL}/${subjectId}/storage/contents`, {
      params: { folderId }
    });
    return res.data;
  },

  getAllFolders: async (subjectId) => {
    const res = await api.get(`${API_URL}/${subjectId}/storage/folders/all`);
    return res.data;
  },
  
  createFolder: async (subjectId, name, parentFolderId = null) => {
    const res = await api.post(`${API_URL}/${subjectId}/storage/folders`, {
      name,
      parentFolderId
    });
    return res.data;
  },

  renameFolder: async (subjectId, folderId, name) => {
    const res = await api.patch(`${API_URL}/${subjectId}/storage/folders/${folderId}`, { name });
    return res.data;
  },

  deleteFolder: async (subjectId, folderId) => {
    const res = await api.delete(`${API_URL}/${subjectId}/storage/folders/${folderId}`);
    return res.data;
  },

  moveFolder: async (subjectId, folderId, parentFolderId = null) => {
    const res = await api.patch(`${API_URL}/${subjectId}/storage/folders/${folderId}/move`, { parentFolderId });
    return res.data;
  },

  uploadFile: async (subjectId, file, onUploadProgress, folderId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);

    const res = await api.post(`${API_URL}/${subjectId}/storage/files`, formData, {
      onUploadProgress,
    });
    return res.data;
  },

  renameFile: async (subjectId, fileId, name) => {
    const res = await api.patch(`${API_URL}/${subjectId}/storage/files/${fileId}`, { name });
    return res.data;
  },

  deleteFile: async (subjectId, fileId) => {
    const res = await api.delete(`${API_URL}/${subjectId}/storage/files/${fileId}`);
    return res.data;
  },

  moveFile: async (subjectId, fileId, folderId = null) => {
    const res = await api.patch(`${API_URL}/${subjectId}/storage/files/${fileId}/move`, { folderId });
    return res.data;
  }
};
