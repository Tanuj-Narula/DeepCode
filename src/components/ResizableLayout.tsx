"use client";
import React, { useState, useRef, useEffect } from "react";

export default function ResizableLayout({ 
  leftPanel, 
  rightPanel, 
  bottomPanel 
}: { 
  leftPanel: React.ReactNode, 
  rightPanel: React.ReactNode,
  bottomPanel?: React.ReactNode
}) {
  const [leftWidth, setLeftWidth] = useState(65); // percentage
  const [rightPanelHeight, setRightPanelHeight] = useState(70); // percentage height of top-right
  const [isResizingH, setIsResizingH] = useState(false);
  const [isResizingV, setIsResizingV] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rightAsideRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingH && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        if (newWidth > 30 && newWidth < 80) setLeftWidth(newWidth);
      }
      
      if (isResizingV && rightAsideRef.current) {
        const asideRect = rightAsideRef.current.getBoundingClientRect();
        const newHeight = ((e.clientY - asideRect.top) / asideRect.height) * 100;
        if (newHeight > 20 && newHeight < 80) setRightPanelHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizingH(false);
      setIsResizingV(false);
    };

    if (isResizingH || isResizingV) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingH, isResizingV]);

  return (
    <div ref={containerRef} className="flex-1 flex overflow-hidden border-t border-zinc-800" style={{ cursor: isResizingH ? 'col-resize' : isResizingV ? 'ns-resize' : 'auto' }}>
      
      {/* Left panel (Editor) */}
      <section 
        className="h-full min-w-0 flex flex-col"
        style={{ width: `${leftWidth}%`, flexShrink: 0, backgroundColor: "var(--dc-bg-primary)" }}
      >
        {leftPanel}
      </section>

      {/* Vertical Resize Handle (Horizontal Split) */}
      <div 
        className="w-1.5 relative group flex items-center justify-center cursor-col-resize hover:bg-zinc-800 transition-colors z-20"
        onMouseDown={(e) => {
           e.preventDefault();
           setIsResizingH(true);
        }}
      >
        <div className={`w-0.5 h-12 rounded-full transition-colors ${isResizingH ? "bg-[#ea580c]" : "bg-zinc-700 group-hover:bg-[#ea580c]"}`} />
      </div>

      {/* Right side container */}
      <aside 
        ref={rightAsideRef}
        className={`flex-1 h-full min-w-0 flex flex-col border-l relative ${isResizingH || isResizingV ? "pointer-events-none select-none" : ""}`}
        style={{ backgroundColor: "var(--dc-bg-secondary)", borderColor: "var(--dc-border)" }}
      >
        <div style={{ height: `${rightPanelHeight}%`, position: 'relative' }} className="flex flex-col overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-4 bg-linear-to-b from-black/20 to-transparent pointer-events-none z-10" />
            {rightPanel}
        </div>

        {bottomPanel && (
            <>
                {/* Horizontal Resize Handle (Vertical Split) */}
                <div 
                  className="h-1.5 w-full relative group flex items-center justify-center cursor-row-resize hover:bg-zinc-800 transition-colors z-20"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsResizingV(true);
                  }}
                >
                    <div className={`h-0.5 w-12 rounded-full transition-colors ${isResizingV ? "bg-[#ea580c]" : "bg-zinc-700 group-hover:bg-[#ea580c]"}`} />
                </div>
                
                <div className="flex-1 overflow-y-auto flex flex-col border-t border-zinc-800/40">
                    {bottomPanel}
                </div>
            </>
        )}
      </aside>
    </div>
  );
}
