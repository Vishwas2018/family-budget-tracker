import { Link } from 'react-router-dom';
import TransactionForm from '../components/transactions/TransactionForm';

/**
 * NewTransaction page component
 * Page wrapper for creating a new transaction
 */
function NewTransaction() {
  return (
    <div className="new-transaction-page">
      <div className="page-header">
        <h1>New Transaction</h1>
        <Link to="/dashboard" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>
      
      <TransactionForm />
    </div>
  );
}

export default NewTransaction;