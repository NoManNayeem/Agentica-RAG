"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FiSend, FiLoader } from "react-icons/fi";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ChatPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Welcome! Ask me something about your uploaded documents.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  // Load conversation history
  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      const token = localStorage.getItem("agenticaAccessToken");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      try {
        const res = await fetch(`${API_URL}/chat/chat/private/history/`, { headers });
        if (!res.ok) throw new Error("Failed to load chat history");

        const data = await res.json();

        const formatted = data
          .map((conv) => [
            {
              sender: "user",
              text: conv.query,
              timestamp: new Date(conv.created_at || Date.now()),
            },
            {
              sender: "bot",
              text: conv.answer,
              timestamp: new Date(conv.created_at || Date.now()),
            },
          ])
          .flat();

        setMessages([
          {
            sender: "bot",
            text: "Welcome! What do we get started with?",
            timestamp: new Date().toISOString(),
          },
          ...formatted, // no reverse here
        ]);
      } catch (e) {
        console.error("History error:", e);
        setError("Could not load chat history.");
      }
    };

    fetchHistory();
  }, [user]);

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message to private chat API
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const text = input.trim();
    const token = localStorage.getItem("agenticaAccessToken");

    const newUserMsg = {
      sender: "user",
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/chat/chat/private/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: data.reply,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error("Private chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, something went wrong while processing your message.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-white px-6 py-4 shadow rounded-lg">
        <h2 className="text-2xl font-semibold text-gray-900">Agentica Private Chat</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 bg-white rounded-lg shadow space-y-4 max-h-[60vh]">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] px-4 py-2 rounded-lg ${
                msg.sender === "user"
                  ? "bg-blue-100 text-gray-900"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              <span className="block text-xs text-gray-500 mt-1 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg animate-pulse">
              ...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-2">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Type a message..."
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="p-3 bg-blue-600 text-white rounded-full disabled:opacity-50 hover:bg-blue-700 transition"
          >
            {loading ? (
              <FiLoader className="animate-spin text-white" />
            ) : (
              <FiSend size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
