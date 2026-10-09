import api from "./api";

// Mode
export const getSocialMode = () => api.get("/api/social/mode");

// Drafts
export const listDrafts = (eventId) => api.get(`/api/social/events/${eventId}/drafts`);
export const getDraftByType = (eventId, postType) =>
  api.get(`/api/social/events/${eventId}/drafts/${postType}`);
export const createDraft = (eventId, postType) =>
  api.post(`/api/social/events/${eventId}/drafts`, { postType });
export const getDraft = (draftId) => api.get(`/api/social/drafts/${draftId}`);
export const updateDraft = (draftId, data) => api.patch(`/api/social/drafts/${draftId}`, data);

// Caption
export const generateCaption = (draftId) =>
  api.post(`/api/social/drafts/${draftId}/generate-caption`);

// Approval & Publishing
export const approveDraft = (draftId) => api.post(`/api/social/drafts/${draftId}/approve`);
export const publishDraft = (draftId) => api.post(`/api/social/drafts/${draftId}/publish`);
export const scheduleDraft = (draftId, scheduledAt) =>
  api.post(`/api/social/drafts/${draftId}/schedule`, { scheduledAt });

// History
export const getPublishingHistory = (eventId) =>
  api.get(`/api/social/events/${eventId}/history`);
