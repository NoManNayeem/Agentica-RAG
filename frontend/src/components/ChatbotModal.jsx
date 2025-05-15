'use client';

import { useRef, useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";

export default function ChatbotModal({ onClose }) {
  const [messages, setMessages] = useState([
    { type: "bot", text: "Hi! How can I assist you today?" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const userMessage = { type: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/chat/public/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.text }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setMessages((prev) => [...prev, { type: "bot", text: data.reply }]);
    } catch (err) {
      console.error("Public chat error:", err);
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Sorry, something went wrong." },
      ]);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  return (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-end">
      {/* Chat Modal Panel */}
      <div className="relative w-full sm:w-[400px] h-[80vh] sm:h-[90vh] bg-white shadow-xl rounded-t-lg sm:rounded-lg overflow-hidden flex flex-col z-[1000] animate-slide-in-up sm:animate-slide-in-right">
        {/* Header */}
        <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
          <h2 className="text-lg font-semibold">Agentica Chat</h2>
          <button onClick={onClose} aria-label="Close">
            <FaTimes size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg max-w-[80%] ${
                msg.type === "user"
                  ? "ml-auto bg-blue-100 text-right"
                  : "mr-auto bg-gray-100"
              }`}
            >
              {msg.text}
            </div>
          ))}

          {/* Loader while bot replies */}
          {sending && (
            <div className="mr-auto bg-gray-100 p-3 rounded-lg flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Thinking…</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t flex space-x-2">
          <input
            type="text"
            disabled={sending}
            className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring disabled:opacity-50"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
