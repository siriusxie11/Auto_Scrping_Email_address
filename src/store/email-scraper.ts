import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EmailResult {
  id: string;
  url: string;
  emails: string[];
  count: number;
  timestamp: string;
  success?: boolean; // 添加可选的success字段
  error?: string; // 添加可选的error字段
}

// 批量抓取结果接口
export interface BatchResult {
  id: string;
  urls: string[];
  results: EmailResult[];
  totalEmails: string[];
  uniqueEmailCount: number;
  successCount: number;
  failureCount: number;
  timestamp: string;
  duration: number; // 抓取耗时（毫秒）
}

// 批量抓取进度接口
export interface BatchProgress {
  current: number;
  total: number;
  currentUrl: string;
  status: 'running' | 'completed' | 'error' | 'idle';
}

interface EmailScraperState {
  // Current scraping state
  isLoading: boolean;
  currentUrl: string;
  currentEmails: string[];
  error: string | null;
  
  // Batch scraping state
  isBatchLoading: boolean;
  batchProgress: BatchProgress;
  currentBatchResult: BatchResult | null;
  batchHistory: BatchResult[];
  
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
  
  // Batch actions
  setBatchLoading: (loading: boolean) => void;
  setBatchProgress: (progress: BatchProgress) => void;
  setCurrentBatchResult: (result: BatchResult | null) => void;
  addToBatchHistory: (result: BatchResult) => void;
  clearBatchHistory: () => void;
  removeFromBatchHistory: (id: string) => void;
  resetBatch: () => void;
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
      
      // Batch initial state
      isBatchLoading: false,
      batchProgress: {
        current: 0,
        total: 0,
        currentUrl: '',
        status: 'idle'
      },
      currentBatchResult: null,
      batchHistory: [],

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
      
      // Batch actions
      setBatchLoading: (loading) => set({ isBatchLoading: loading }),
      
      setBatchProgress: (progress) => set({ batchProgress: progress }),
      
      setCurrentBatchResult: (result) => set({ currentBatchResult: result }),
      
      addToBatchHistory: (result) => {
        const { batchHistory } = get();
        // Keep only the latest 5 batch results
        const newBatchHistory = [result, ...batchHistory.slice(0, 4)];
        set({ batchHistory: newBatchHistory });
      },
      
      clearBatchHistory: () => set({ batchHistory: [] }),
      
      removeFromBatchHistory: (id) => {
        const { batchHistory } = get();
        set({ batchHistory: batchHistory.filter(item => item.id !== id) });
      },
      
      resetBatch: () => set({
        isBatchLoading: false,
        batchProgress: {
          current: 0,
          total: 0,
          currentUrl: '',
          status: 'idle'
        },
        currentBatchResult: null,
      }),
    }),
    {
      name: 'email-scraper-storage',
      partialize: (state) => ({
        history: state.history,
        batchHistory: state.batchHistory,
      }),
    }
  )
); 