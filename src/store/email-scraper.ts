import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EmailResult {
  id: string;
  url: string;
  emails: string[];
  count: number;
  timestamp: string;
}

interface EmailScraperState {
  // Current scraping state
  isLoading: boolean;
  currentUrl: string;
  currentEmails: string[];
  error: string | null;
  
  // History
  history: EmailResult[];
  
  // Actions
  setLoading: (loading: boolean) => void;
  setCurrentUrl: (url: string) => void;
  setCurrentEmails: (emails: string[]) => void;
  setError: (error: string | null) => void;
  addToHistory: (result: EmailResult) => void;
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;
  reset: () => void;
}

export const useEmailScraperStore = create<EmailScraperState>()(
  persist(
    (set, get) => ({
      // Initial state
      isLoading: false,
      currentUrl: '',
      currentEmails: [],
      error: null,
      history: [],

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),
      
      setCurrentUrl: (url) => set({ currentUrl: url }),
      
      setCurrentEmails: (emails) => set({ currentEmails: emails }),
      
      setError: (error) => set({ error }),
      
      addToHistory: (result) => {
        const { history } = get();
        // Keep only the latest 10 results
        const newHistory = [result, ...history.slice(0, 9)];
        set({ history: newHistory });
      },
      
      clearHistory: () => set({ history: [] }),
      
      removeFromHistory: (id) => {
        const { history } = get();
        set({ history: history.filter(item => item.id !== id) });
      },
      
      reset: () => set({
        isLoading: false,
        currentUrl: '',
        currentEmails: [],
        error: null,
      }),
    }),
    {
      name: 'email-scraper-storage',
      partialize: (state) => ({
        history: state.history,
      }),
    }
  )
); 