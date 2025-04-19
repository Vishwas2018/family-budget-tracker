import { createContext, useContext, useEffect, useState } from 'react';

// Create context
const RemindersContext = createContext();

// Custom hook to use the reminders context
export const useReminders = () => {
  const context = useContext(RemindersContext);
  if (!context) {
    throw new Error('useReminders must be used within a RemindersProvider');
  }
  return context;
};

export const RemindersProvider = ({ children }) => {
  // State for reminders
  const [reminders, setReminders] = useState(() => {
    // Try to get saved reminders from localStorage
    const savedReminders = localStorage.getItem('reminders');
    return savedReminders
      ? JSON.parse(savedReminders)
      : [
          {
            id: 'r1',
            title: 'Rent Payment',
            dueDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
            amount: 1200,
            category: 'Housing',
            isPaid: false,
            isOverdue: false,
          },
          {
            id: 'r2',
            title: 'Electricity Bill',
            dueDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
            amount: 85.5,
            category: 'Utilities',
            isPaid: false,
            isOverdue: true,
          },
          {
            id: 'r3',
            title: 'Netflix Subscription',
            dueDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(),
            amount: 14.99,
            category: 'Entertainment',
            isPaid: false,
            isOverdue: false,
          },
        ];
  });

  // Save reminders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Update overdue status whenever reminders change or component renders
  useEffect(() => {
    const today = new Date();
    const updatedReminders = reminders.map((reminder) => ({
      ...reminder,
      isOverdue:
        !reminder.isPaid &&
        new Date(reminder.dueDate) < today,
    }));

    // Only update if there's an actual change to avoid infinite loops
    if (JSON.stringify(updatedReminders) !== JSON.stringify(reminders)) {
      setReminders(updatedReminders);
    }
  }, [reminders]);

  // Derived state for filtered reminders
  const upcomingReminders = reminders.filter(
    (reminder) => !reminder.isPaid && !reminder.isOverdue
  );

  const overdueReminders = reminders.filter(
    (reminder) => !reminder.isPaid && reminder.isOverdue
  );

  const paidReminders = reminders.filter(
    (reminder) => reminder.isPaid
  );

  // Add a new reminder
  const addReminder = (reminder) => {
    const newReminder = {
      ...reminder,
      id: `r${Date.now()}`, // Generate a unique ID
      isOverdue: new Date(reminder.dueDate) < new Date(),
    };
    setReminders((prev) => [...prev, newReminder]);
  };

  // Mark a reminder as paid
  const markAsPaid = (id) => {
    setReminders((prevReminders) =>
      prevReminders.map((reminder) =>
        reminder.id === id
          ? { ...reminder, isPaid: true }
          : reminder
      )
    );
  };

  // Delete a reminder
  const deleteReminder = (id) => {
    setReminders((prevReminders) =>
      prevReminders.filter((reminder) => reminder.id !== id)
    );
  };

  return (
    <RemindersContext.Provider
      value={{
        reminders,
        upcomingReminders,
        overdueReminders,
        paidReminders,
        addReminder,
        markAsPaid,
        deleteReminder,
      }}
    >
      {children}
    </RemindersContext.Provider>
  );
};

export default RemindersContext;