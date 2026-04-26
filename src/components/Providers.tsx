"use client";
import React from "react";
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";

// ─── Create Client ───────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 mins
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

type Props = {
  children: React.ReactNode;
};

const Providers = ({ children }: Props) => {
  const [queryClient] = React.useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export default Providers;