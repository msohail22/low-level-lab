// react imports
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// tanstack
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./libs/query-client.ts";

import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
