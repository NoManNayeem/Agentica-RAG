'use client';

import { useState } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotModal from "@/components/ChatbotModal";
import { ChatbotButton } from "@/components/ChatbotButton";

function ChatbotGuestUI() {
  const { isAuthenticated, loading } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => setIsChatOpen(prev => !prev);

  if (loading || isAuthenticated) return null; // Don't show if loading or authenticated

  return (
    <>
        {!isChatOpen && <ChatbotButton onClick={toggleChat} />}
        {isChatOpen && <ChatbotModal onClose={toggleChat} />}

    </>
  );
}

export default function ClientLayout({ children }) {
  return (
    <AuthProvider>
      <Navbar />
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {children}
      </main>
      <Footer />

      {/* Only show to unauthenticated users */}
      <ChatbotGuestUI />
    </AuthProvider>
  );
}
