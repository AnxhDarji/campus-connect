import api from "./api";

export const createEventRequest = (data) => api.post("/api/event-requests", data);
export const getMyRequests = () => api.get("/api/event-requests/my");
export const getEventRequest = (id) => api.get(`/api/event-requests/${id}`);
export const updateEventRequest = (id, data) => api.put(`/api/event-requests/${id}`, data);
export const deleteEventRequest = (id) => api.delete(`/api/event-requests/${id}`);

export const uploadPoster = (file, onProgress) => {
  const form = new FormData();
  form.append("poster", file);
  return api.post("/api/uploads/poster", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
  });
};

export const uploadQR = (file, onProgress) => {
  const form = new FormData();
  form.append("qr", file);
  return api.post("/api/uploads/qr", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
  });
};

export const uploadBrochure = (file, onProgress) => {
  const form = new FormData();
  form.append("brochure", file);
  return api.post("/api/uploads/brochure", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
  });
};

export const getDepartments = () => api.get("/api/departments");

// Admin
export const adminGetStats = () => api.get("/api/admin/event-requests/stats");
export const adminListRequests = (params) => api.get("/api/admin/event-requests", { params });
export const adminGetRequest = (id) => api.get(`/api/admin/event-requests/${id}`);
export const adminApproveRequest = (id) => api.post(`/api/admin/event-requests/${id}/approve`);
export const adminRejectRequest = (id, rejection_reason) => api.post(`/api/admin/event-requests/${id}/reject`, { rejection_reason });
export const adminEditRequest = (id, data) => api.patch(`/api/admin/event-requests/${id}`, data);
