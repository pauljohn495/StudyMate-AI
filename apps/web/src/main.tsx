import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './store/AuthContext';
import { PwaProvider, PwaStatus } from './store/PwaContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RouteEffects } from './components/RouteEffects';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } });

createRoot(document.getElementById('root')!).render(<StrictMode><ErrorBoundary><PwaProvider><QueryClientProvider client={queryClient}><BrowserRouter><RouteEffects/><AuthProvider><App/><PwaStatus/></AuthProvider></BrowserRouter></QueryClientProvider></PwaProvider></ErrorBoundary></StrictMode>);
