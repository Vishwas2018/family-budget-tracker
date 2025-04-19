import { createContext, useContext, useState } from 'react';
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import toast from 'react-hot-toast';
import transactionService from '../api/transactionService';
import { useAuth } from './AuthContext';

// Create Transactions context
const TransactionsContext = createContext(null);

/**
 * Provider component for transaction-related state and operations
 * With improved authentication check to prevent 401 errors
 */
export function TransactionsProvider({ children }) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  
  // State for current date filters
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    return {
      startDate: startOfMonth(today),
      endDate: endOfMonth(today),
    };
  });
  
  // State for current filters
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    page: 1,
    limit: 20,
  });
  
  // Transactions query with filters - Only fetch when authenticated
  const transactionsQuery = useQuery({
    queryKey: ['transactions', { ...filters, ...dateRange }],
    queryFn: () => transactionService.getTransactions({
      ...filters,
      startDate: dateRange.startDate ? format(dateRange.startDate, 'yyyy-MM-dd') : undefined,
      endDate: dateRange.endDate ? format(dateRange.endDate, 'yyyy-MM-dd') : undefined,
    }),
    enabled: isAuthenticated, // Only run query if user is authenticated
    keepPreviousData: true,
  });
  
  // Transaction summary query - Only fetch when authenticated
  const summaryQuery = useQuery({
    queryKey: ['transactions', 'summary', dateRange],
    queryFn: () => transactionService.getTransactionSummary({
      startDate: dateRange.startDate ? format(dateRange.startDate, 'yyyy-MM-dd') : undefined,
      endDate: dateRange.endDate ? format(dateRange.endDate, 'yyyy-MM-dd') : undefined,
    }),
    enabled: isAuthenticated, // Only run query if user is authenticated
  });
  
  // Category breakdown query - Only fetch when authenticated
  const breakdownQuery = useQuery({
    queryKey: ['transactions', 'breakdown', { type: 'expense' }, dateRange],
    queryFn: () => transactionService.getCategoryBreakdown({
      type: 'expense',
      startDate: dateRange.startDate ? format(dateRange.startDate, 'yyyy-MM-dd') : undefined,
      endDate: dateRange.endDate ? format(dateRange.endDate, 'yyyy-MM-dd') : undefined,
    }),
    enabled: isAuthenticated, // Only run query if user is authenticated
  });
  
  // Monthly data query for reports - Only fetch when authenticated
  const monthlyQuery = useQuery({
    queryKey: ['transactions', 'monthly', new Date().getFullYear()],
    queryFn: () => transactionService.getMonthlyTransactions({
      year: new Date().getFullYear(),
    }),
    enabled: isAuthenticated, // Only run query if user is authenticated
  });
  
  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: transactionService.createTransaction,
    onSuccess: () => {
      // Invalidate affected queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction created successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create transaction';
      toast.error(message);
    },
  });
  
  // Update transaction mutation
  const updateTransactionMutation = useMutation({
    mutationFn: ({ id, data }) => transactionService.updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update transaction';
      toast.error(message);
    },
  });
  
  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: transactionService.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction deleted successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete transaction';
      toast.error(message);
    },
  });
  
  // Helper function to set date range
  const setCurrentMonth = () => {
    const today = new Date();
    setDateRange({
      startDate: startOfMonth(today),
      endDate: endOfMonth(today),
    });
  };
  
  const setPreviousMonth = () => {
    const today = new Date();
    const prevMonth = subMonths(today, 1);
    setDateRange({
      startDate: startOfMonth(prevMonth),
      endDate: endOfMonth(prevMonth),
    });
  };
  
  // Combine state and functions into a single value
  const transactionsValue = {
    // Queries - Provide empty defaults when not authenticated
    transactions: transactionsQuery.data?.data?.transactions || [],
    pagination: transactionsQuery.data?.data?.pagination || { total: 0, page: 1, pages: 1 },
    summary: summaryQuery.data?.data || { income: 0, expenses: 0, balance: 0 },
    breakdown: breakdownQuery.data?.data?.breakdown || [],
    monthlyData: monthlyQuery.data?.data || [],
    
    // Loading states
    isLoading: {
      transactions: transactionsQuery.isLoading,
      summary: summaryQuery.isLoading,
      breakdown: breakdownQuery.isLoading,
      monthly: monthlyQuery.isLoading,
      creating: createTransactionMutation.isPending,
      updating: updateTransactionMutation.isPending,
      deleting: deleteTransactionMutation.isPending,
    },
    
    // Error states
    errors: {
      transactions: transactionsQuery.error,
      summary: summaryQuery.error,
      breakdown: breakdownQuery.error,
      monthly: monthlyQuery.error,
    },
    
    // Mutations
    createTransaction: createTransactionMutation.mutate,
    updateTransaction: updateTransactionMutation.mutate,
    deleteTransaction: deleteTransactionMutation.mutate,
    
    // Filters
    filters,
    setFilters: (newFilters) => setFilters(prev => ({ ...prev, ...newFilters, page: newFilters.page || 1 })),
    resetFilters: () => setFilters({ type: '', category: '', page: 1, limit: 20 }),
    
    // Date range
    dateRange,
    setDateRange,
    setCurrentMonth,
    setPreviousMonth,
  };

  return (
    <TransactionsContext.Provider value={transactionsValue}>
      {children}
    </TransactionsContext.Provider>
  );
}

/**
 * Hook to use the transactions context
 */
export function useTransactions() {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
}