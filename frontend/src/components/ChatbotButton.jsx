// components/ChatbotButton.jsx
'use client';

import { FaCommentDots } from "react-icons/fa";

export const ChatbotButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-6 right-6 z-[1000] bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
    aria-label="Open chatbot"
  >
    <FaCommentDots size={24} />
  </button>
);
