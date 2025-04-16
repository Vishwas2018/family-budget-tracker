import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useState } from 'react';

/**
 * Provider for React Query with default configuration.
 * This version doesn't include React Query Devtools to reduce dependencies.
 */
function QueryProvider({ children }) {
  // Create a client with config that persists across renders
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        retry: 1,
        refetchOnWindowFocus: false, // Disabled for simplicity
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export default QueryProvider;