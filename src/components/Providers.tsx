"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "var(--dc-bg-elevated)",
              color: "var(--dc-text-primary)",
              border: "1px solid var(--dc-border)",
              borderRadius: "var(--dc-radius-md)",
              fontSize: "0.875rem",
            },
            success: {
              iconTheme: {
                primary: "var(--dc-success)",
                secondary: "var(--dc-bg-elevated)",
              },
            },
            error: {
              iconTheme: {
                primary: "var(--dc-error)",
                secondary: "var(--dc-bg-elevated)",
              },
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
