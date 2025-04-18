import { createContext, useContext, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Create a new context for reminders
const RemindersContext = createContext(null);

/**
 * Provider component for reminder-related state and operations
 */
export function RemindersProvider({ children }) {
  const queryClient = useQueryClient();
  
  // In a real app, you'd fetch these from an API
  // This is a simplified example using local state
  const [reminders, setReminders] = useState([
    {
      id: 'r1',
      title: 'Rent Payment',
      dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
      amount: 1200,
      category: 'Housing',
      isPaid: false,
      isOverdue: false
    },
    {
      id: 'r2',
      title: 'Electricity Bill',
      dueDate: new Date(new Date().setDate(new Date().getDate() - 2)),
      amount: 85.50,
      category: 'Utilities',
      isPaid: false,
      isOverdue: true
    },
    {
      id: 'r3',
      title: 'Netflix Subscription',
      dueDate: new Date(new Date().setDate(new Date().getDate() + 15)),
      amount: 14.99,
      category: 'Entertainment',
      isPaid: false,
      isOverdue: false
    }
  ]);

  // Mark a reminder as paid
  const markAsPaid = (id) => {
    setReminders(prevReminders => 
      prevReminders.map(reminder => 
        reminder.id === id ? { ...reminder, isPaid: true } : reminder
      )
    );
  };

  // Add a new reminder
  const addReminder = (newReminder) => {
    setReminders(prev => [...prev, { 
      id: `r${Date.now()}`, 
      ...newReminder,
      isPaid: false,
      isOverdue: new Date(newReminder.dueDate) < new Date()
    }]);
  };

  // Delete a reminder
  const deleteReminder = (id) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== id));
  };

  // Check for overdue reminders daily
  useEffect(() => {
    const checkOverdueReminders = () => {
      const today = new Date();
      setReminders(prev => 
        prev.map(reminder => ({
          ...reminder,
          isOverdue: !reminder.isPaid && new Date(reminder.dueDate) < today
        }))
      );
    };
    
    // Initial check
    checkOverdueReminders();
    
    // Set up daily check
    const intervalId = setInterval(checkOverdueReminders, 1000 * 60 * 60 * 24);
    
    return () => clearInterval(intervalId);
  }, []);

  // Provide the reminders state and functions to components
  const contextValue = {
    reminders,
    markAsPaid,
    addReminder,
    deleteReminder,
    upcomingReminders: reminders.filter(r => !r.isPaid && !r.isOverdue),
    overdueReminders: reminders.filter(r => !r.isPaid && r.isOverdue),
    paidReminders: reminders.filter(r => r.isPaid)
  };

  return (
    <RemindersContext.Provider value={contextValue}>
      {children}
    </RemindersContext.Provider>
  );
}

/**
 * Hook to use the reminders context
 */
export function useReminders() {
  const context = useContext(RemindersContext);
  if (!context) {
    throw new Error('useReminders must be used within a RemindersProvider');
  }
  return context;
}