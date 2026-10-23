import { answerEventQuery } from "../services/chatService.js";

/**
 * POST /api/chat
 * Handle student natural language questions about events
 */
export const handleChat = async (req, res, next) => {
  try {
    const { message, history } = req.body;

    // Validate message
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message must be a non-empty string.",
      });
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Message is too long. Please keep questions under 500 characters.",
      });
    }

    // Validate optional history
    let validHistory = [];
    if (Array.isArray(history)) {
      validHistory = history
        .slice(-6)
        .filter(
          (item) =>
            item &&
            typeof item === "object" &&
            (item.role === "user" || item.role === "assistant") &&
            typeof item.content === "string"
        );
    }

    const response = await answerEventQuery({
      message: trimmedMessage,
      history: validHistory,
      user: req.user || null,
    });

    res.json({
      success: true,
      reply: response.reply,
      eventsCount: response.eventsCount,
    });
  } catch (error) {
    next(error);
  }
};
