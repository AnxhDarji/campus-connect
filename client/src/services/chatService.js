import api from "./api";

/**
 * Send a message to the AI Chatbot backend
 * @param {string} message - The student's question
 * @param {Array<{role: string, content: string}>} history - Recent conversation history
 */
export const sendChatMessage = async (message, history = []) => {
  const response = await api.post("/api/chat", { message, history });
  return response.data;
};
