import { z } from "zod";

export const RoleReadinessSchema = z.object({
  role: z.string(),
  overallScore: z.number().min(0).max(100),
  conceptBreakdown: z.array(z.object({
    concept: z.string(),
    score: z.number().min(0).max(100),
    status: z.enum(["mastered", "developing", "weak"]),
  })),
  criticalGaps: z.array(z.string()),
  concreteSteps: z.array(z.string()),
});

export type RoleReadiness = z.infer<typeof RoleReadinessSchema>;

export const ROLE_DEFINITIONS = {
  "frontend_mid": [
    "closures", "async_await", "promises", "dom_manipulation", "event_loop", "component_lifecycle"
  ],
  "backend_mid": [
    "error_handling", "concurrency", "rate_limiting", "sql_injection", "memory_management", "caching"
  ],
  "fullstack_mid": [
    "async_await", "api_design", "authentication", "state_management", "sql_queries", "error_handling"
  ]
};
