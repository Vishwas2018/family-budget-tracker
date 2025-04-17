import { Link } from 'react-router-dom';
import TransactionList from '../components/transactions/TransactionList';
import { useTransactions } from '../contexts/TransactionsContext';

/**
 * Transactions page component
 * Displays all transactions with filtering, sorting, and pagination
 */
function Transactions() {
  const { summary = { income: 0, expenses: 0, balance: 0 }, isLoading } = useTransactions();

  return (
    <div className="transactions-page">
      <div className="page-header">
        <div className="page-title">
          <h1>Transactions</h1>
          <p className="page-subtitle">View and manage your financial transactions</p>
        </div>
        
        <Link to="/dashboard/transactions/new" className="btn btn-primary">
          Add Transaction
        </Link>
      </div>
      
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card income">
          <h3>Income</h3>
          <p className="amount">${(summary?.income || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
        
        <div className="summary-card expense">
          <h3>Expenses</h3>
          <p className="amount">${(summary?.expenses || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
        
        <div className="summary-card balance">
          <h3>Balance</h3>
          <p className="amount">${(summary?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
      </div>
      
      {/* Transaction List Component */}
      <TransactionList />
    </div>
  );
}

export default Transactions;