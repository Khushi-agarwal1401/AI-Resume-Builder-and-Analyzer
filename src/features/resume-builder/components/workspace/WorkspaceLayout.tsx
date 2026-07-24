import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react";

interface WorkspaceLayoutProps {
  topBar: React.ReactNode;
  leftPanel: React.ReactNode;
  mainContent: React.ReactNode;
  rightPanel: React.ReactNode;
}

export function WorkspaceLayout({
  topBar,
  leftPanel,
  mainContent,
  rightPanel,
}: WorkspaceLayoutProps) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50 overflow-hidden">
      {/* Top Toolbar */}
      <div className="shrink-0 z-10 border-b border-gray-200 bg-white">
        {topBar}
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel */}
        <aside
          className={cn(
            "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shrink-0 overflow-hidden relative z-10",
            leftOpen ? "w-[260px]" : "w-0 border-r-0"
          )}
        >
          <div className="flex-1 overflow-y-auto w-[260px]">
            {leftPanel}
          </div>
        </aside>

        {/* Toggle Left Button */}
        <button
          onClick={() => setLeftOpen(!leftOpen)}
          className={cn(
            "absolute top-4 z-20 flex items-center justify-center w-9 h-9 bg-white border border-gray-200 rounded-xl shadow-md text-gray-500 hover:text-gray-900 hover:shadow-lg transition-all",
            leftOpen ? "left-[244px]" : "left-4"
          )}
        >
          {leftOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>

        {/* Main Content */}
        <main id="workspace-main-scroll" className="flex-1 overflow-y-auto relative bg-gray-50">
          <div className="max-w-[760px] mx-auto py-8 px-4 md:px-8 pb-32">
            {mainContent}
          </div>
        </main>

        {/* Toggle Right Button */}
        <button
          onClick={() => setRightOpen(!rightOpen)}
          className={cn(
            "absolute top-4 z-20 flex items-center justify-center w-9 h-9 bg-white border border-gray-200 rounded-xl shadow-md text-gray-500 hover:text-gray-900 hover:shadow-lg transition-all",
            rightOpen ? "right-[434px]" : "right-4"
          )}
        >
          {rightOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
        </button>

        {/* Right Panel */}
        <aside
          className={cn(
            "bg-white border-l border-gray-200 transition-all duration-300 flex flex-col shrink-0 overflow-hidden relative z-10",
            rightOpen ? "w-[450px]" : "w-0 border-l-0"
          )}
        >
          <div className="flex-1 w-[450px] flex flex-col h-full">
            {rightPanel}
          </div>
        </aside>
      </div>
    </div>
  );
}
