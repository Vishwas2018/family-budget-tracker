import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

import TransactionForm from '../components/transactions/TransactionForm';
import transactionService from '../api/transactionService';
import { useTransactions } from '../contexts/TransactionsContext';

/**
 * EditTransaction page component
 * Loads transaction data and provides it to the TransactionForm
 */
function EditTransaction() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch transaction data
  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setIsLoading(true);
        const data = await transactionService.getTransaction(id);
        setTransaction(data);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to fetch transaction:', err);
        setError('Failed to load transaction data. It may have been deleted or you do not have permission to view it.');
        setIsLoading(false);
      }
    };
    
    fetchTransaction();
  }, [id]);
  
  // Handle loading and error states
  if (isLoading) {
    return <div className="loading-container">Loading transaction data...</div>;
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <Link to="/dashboard" className="btn btn-primary">
          Return to Dashboard
        </Link>
      </div>
    );
  }
  
  if (!transaction) {
    return (
      <div className="not-found-container">
        <h2>Transaction Not Found</h2>
        <p>The transaction you're looking for doesn't exist or has been deleted.</p>
        <Link to="/dashboard" className="btn btn-primary">
          Return to Dashboard
        </Link>
      </div>
    );
  }
  
  return (
    <div className="edit-transaction-page">
      <div className="page-header">
        <h1>Edit Transaction</h1>
        <Link to="/dashboard" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>
      
      <TransactionForm 
        transaction={transaction} 
        isEditing={true} 
      />
    </div>
  );
}

export default EditTransaction;