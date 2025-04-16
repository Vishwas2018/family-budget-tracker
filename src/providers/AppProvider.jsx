import { createContext, useContext, useState } from 'react';

import { AuthProvider } from '../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { CategoriesProvider } from '../contexts/CategoriesContext';
import QueryProvider from './QueryProvider';
import { TransactionsProvider } from '../contexts/TransactionsContext';

// Create a notification context for a simpler toast alternative
const NotificationContext = createContext(null);

/**
 * Simple notification provider as an alternative to react-hot-toast
 */
function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  
  // Add a notification
  const notify = (type, message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };
  
  const success = (message) => notify('success', message);
  const error = (message) => notify('error', message);
  const info = (message) => notify('info', message);
  
  return (
    <NotificationContext.Provider value={{ success, error, info }}>
      {children}
      
      {/* Simple notification UI */}
      <div className="notifications-container">
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`notification notification-${notification.type}`}
          >
            {notification.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

/**
 * Hook to use the notification context
 */
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

/**
 * Root application provider that composes all providers in the correct order
 * This version doesn't require external dependencies like react-hot-toast
 */
function AppProvider({ children }) {
  return (
    <BrowserRouter>
      <QueryProvider>
        <NotificationProvider>
          <AuthProvider>
            <CategoriesProvider>
              <TransactionsProvider>
                {children}
              </TransactionsProvider>
            </CategoriesProvider>
          </AuthProvider>
        </NotificationProvider>
      </QueryProvider>
    </BrowserRouter>
  );
}

export default AppProvider;