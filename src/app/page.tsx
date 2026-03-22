"use client";

import dynamic from "next/dynamic";
import Header from "@/components/Header";
import TriviaPanel from "@/components/TriviaPanel";
import UnderstandPanel from "@/components/UnderstandPanel";
import RoleReadinessReport from "@/components/RoleReadinessReport";
import { useSessionStore } from "@/stores/sessionStore";


// Lazy-load Monaco — requires browser APIs, cannot SSR
const CodeEditor = dynamic(() => import("@/components/CodeEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-zinc-950">
      <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-[#ea580c] animate-spin" />
    </div>
  ),
});
import ResizableLayout from "@/components/ResizableLayout";

export default function HomePage() {
  const { mode } = useSessionStore();

  return (
    <div className="h-screen w-full flex flex-col bg-[var(--dc-bg-primary)] text-[var(--dc-text-primary)] overflow-hidden text-[13px] transition-colors">
      <Header />
      <ResizableLayout 
        leftPanel={<CodeEditor />}
        rightPanel={mode === "trivia" ? <TriviaPanel /> : <UnderstandPanel />}
      />
      <RoleReadinessReport />
    </div>
  );
}
