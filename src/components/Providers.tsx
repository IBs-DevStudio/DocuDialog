"use client";
import React from "react";
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// ─── Create Client ───────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // cache garbage collection
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

type Props = {
  children: React.ReactNode;
};

const Providers = ({ children }: Props) => {
  const [queryClient] = React.useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools (enable in development only) */}
      {/* {process.env.NODE_ENV === "development" && <ReactQueryDevtools />} */}
    </QueryClientProvider>
  );
};

export default Providers;