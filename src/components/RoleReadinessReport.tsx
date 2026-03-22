"use client";

import { useSessionStore } from "@/stores/sessionStore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  BarChart3,
  X
} from "lucide-react";

export default function RoleReadinessReport() {
  const { roleReadiness, setRoleReadiness } = useSessionStore();

  if (!roleReadiness) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
    >
      <div className="w-full max-w-2xl bg-[#09090b] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative p-8 border-b border-zinc-800 bg-[#18181b]/50">
          <button 
            onClick={() => setRoleReadiness(null)}
            className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-zinc-500 transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-900/40">
              <Trophy size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">
                Role Readiness <span className="text-orange-500">Report</span>
              </h2>
              <p className="text-zinc-500 font-mono text-xs uppercase tracking-[0.2em]">Target: {roleReadiness.role.replace(/_/g, " ")}</p>
            </div>
          </div>

          <div className="flex items-end gap-4">
            <div className="flex-1 h-3 bg-zinc-900 rounded-full border border-zinc-800 overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${roleReadiness.overallScore}%` }}
                    className="h-full bg-gradient-to-r from-orange-600 to-amber-400"
                />
            </div>
            <span className="text-4xl font-black text-white leading-none">{roleReadiness.overallScore}%</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 grid grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto">
          {/* Left: Concept Breakdown */}
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <BarChart3 size={14} /> Technical Radar
            </h3>
            <div className="space-y-3">
              {roleReadiness.conceptBreakdown.map((c, i) => (
                <div key={i} className="space-y-1.5 font-mono">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-400">
                    <span>{c.concept.replace(/_/g, " ")}</span>
                    <span className={c.status === 'mastered' ? 'text-emerald-500' : c.status === 'developing' ? 'text-amber-500' : 'text-rose-500'}>
                        {c.score}%
                    </span>
                  </div>
                  <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${c.status === 'mastered' ? 'bg-emerald-500' : c.status === 'developing' ? 'bg-amber-500' : 'bg-rose-500'}`} 
                        style={{ width: `${c.score}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Gaps & Steps */}
          <div className="space-y-8">
             <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-[#ef4444] flex items-center gap-2 mb-3">
                  <AlertTriangle size={14} /> Critical Gaps
                </h3>
                <ul className="space-y-2">
                    {roleReadiness.criticalGaps.map((gap, i) => (
                        <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                            <span className="mt-1 w-1 h-1 bg-red-500 rounded-full shrink-0" /> {gap}
                        </li>
                    ))}
                </ul>
             </div>

             <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-[#10b981] flex items-center gap-2 mb-3">
                  <Target size={14} /> Immediate Actions
                </h3>
                <ul className="space-y-2">
                    {roleReadiness.concreteSteps.map((step, i) => (
                        <li key={i} className="text-xs text-zinc-300 flex items-start gap-2">
                            <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" /> {step}
                        </li>
                    ))}
                </ul>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-zinc-800 bg-[#18181b]/30 flex justify-end gap-4">
            <button 
                onClick={() => setRoleReadiness(null)}
                className="px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold uppercase tracking-widest transition-all"
            >
                Close Report
            </button>
        </div>
      </div>
    </motion.div>
  );
}
