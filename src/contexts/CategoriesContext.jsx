import { createContext, useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import categoryService from '../api/categoryService';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

// Create Categories context
const CategoriesContext = createContext(null);

/**
 * Provider component for category-related state and operations
 * With improved authentication check to prevent 401 errors
 */
export function CategoriesProvider({ children }) {
  const queryClient = useQueryClient();
  const { isAdmin, isAuthenticated } = useAuth();
  
  // Categories query - Only fetch when authenticated
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
    select: (data) => data.data || [],
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: isAuthenticated, // Only run query if user is authenticated
  });
  
  // Admin-only mutations
  const createCategoryMutation = useMutation({
    mutationFn: categoryService.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create category';
      toast.error(message);
    },
  });
  
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }) => categoryService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update category';
      toast.error(message);
    },
  });
  
  const deleteCategoryMutation = useMutation({
    mutationFn: categoryService.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete category';
      toast.error(message);
    },
  });
  
  const resetCategoriesMutation = useMutation({
    mutationFn: categoryService.resetCategories,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categories reset to defaults');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to reset categories';
      toast.error(message);
    },
  });
  
  // Helper functions
  const getCategoryByName = (name) => {
    if (!categoriesQuery.data) return null;
    return categoriesQuery.data.find(
      (category) => category.name.toLowerCase() === name.toLowerCase()
    );
  };
  
  const getCategoriesByType = (type) => {
    if (!categoriesQuery.data) return [];
    return categoriesQuery.data.filter(
      (category) => category.type === type || category.type === 'both'
    );
  };
  
  const getCategoryById = (id) => {
    if (!categoriesQuery.data) return null;
    return categoriesQuery.data.find((category) => category._id === id);
  };
  
  // Combine state and functions into a single value
  const categoriesValue = {
    // Query data
    categories: categoriesQuery.data || [],
    incomeCategories: getCategoriesByType('income'),
    expenseCategories: getCategoriesByType('expense'),
    
    // Loading states
    isLoading: categoriesQuery.isLoading,
    isError: categoriesQuery.isError,
    
    // Helper functions
    getCategoryByName,
    getCategoriesByType,
    getCategoryById,
    
    // Admin-only functions
    ...(isAdmin && {
      createCategory: createCategoryMutation.mutate,
      updateCategory: updateCategoryMutation.mutate,
      deleteCategory: deleteCategoryMutation.mutate,
      resetCategories: resetCategoriesMutation.mutate,
      isMutating: 
        createCategoryMutation.isPending || 
        updateCategoryMutation.isPending || 
        deleteCategoryMutation.isPending || 
        resetCategoriesMutation.isPending
    })
  };

  return (
    <CategoriesContext.Provider value={categoriesValue}>
      {children}
    </CategoriesContext.Provider>
  );
}

/**
 * Hook to use the categories context
 */
export function useCategories() {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  return context;
}