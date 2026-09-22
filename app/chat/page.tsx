import type { Metadata } from "next";

import { ChatClient } from "@/components/common/chat-client";

export const metadata: Metadata = {
  title: "Agent Chat",
  description:
    "Real multi-turn AI chat with your configured provider, or the honest built-in offline assistant when no provider is set.",
};

export default function ChatPage() {
  return <ChatClient />;
}