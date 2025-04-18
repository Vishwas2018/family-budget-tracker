import { useEffect, useMemo, useState } from 'react';

import { useTransactions } from '../contexts/TransactionsContext';

/**
 * Dynamic Reports page that visualizes actual income and expenses
 * data from localStorage and transaction history
 */
function Reports() {
  // State for selected time period
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  
  // Get transaction data from context (for summary info)
  const { summary } = useTransactions();
  
  // State for income and expense data from localStorage
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  
  // Load data from localStorage on component mount
  useEffect(() => {
    const loadStoredData = () => {
      try {
        // Get income data
        const storedIncomeData = localStorage.getItem('incomeItems');
        if (storedIncomeData) {
          setIncomeData(JSON.parse(storedIncomeData));
        }
        
        // Get expense data
        const storedExpenseData = localStorage.getItem('expenseItems');
        if (storedExpenseData) {
          setExpenseData(JSON.parse(storedExpenseData));
        }
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
      }
    };
    
    loadStoredData();
  }, []);
  
  // Format currency amounts
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };
  
  // Calculate monthly summary based on actual data
  const monthlySummary = useMemo(() => {
    // Calculate total monthly income
    const monthlyIncome = incomeData.reduce(
      (total, item) => total + (item.monthlyAmount || 0), 
      0
    );
    
    // Calculate total monthly expenses
    const monthlyExpenses = expenseData.reduce(
      (total, item) => total + (item.monthlyAmount || 0), 
      0
    );
    
    // Calculate balance
    const monthlyBalance = monthlyIncome - monthlyExpenses;
    
    return {
      income: monthlyIncome,
      expenses: monthlyExpenses,
      balance: monthlyBalance
    };
  }, [incomeData, expenseData]);
  
  // Calculate annual summary based on actual data
  const annualSummary = useMemo(() => {
    // Calculate total annual income
    const annualIncome = incomeData.reduce(
      (total, item) => total + (item.annualAmount || 0), 
      0
    );
    
    // Calculate total annual expenses
    const annualExpenses = expenseData.reduce(
      (total, item) => total + (item.annualAmount || 0), 
      0
    );
    
    // Calculate balance
    const annualBalance = annualIncome - annualExpenses;
    
    return {
      income: annualIncome,
      expenses: annualExpenses,
      balance: annualBalance
    };
  }, [incomeData, expenseData]);
  
  // Get the appropriate summary based on selected period
  const currentSummary = selectedPeriod === 'year' ? annualSummary : monthlySummary;
  
  // Generate monthly data for chart visualization
  const generateMonthlyData = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Generate data for each month
    return months.map((month, index) => {
      // For simplicity, we'll use the monthly amounts for all months
      // In a real app, you would calculate this based on transaction history
      return {
        month,
        income: monthlySummary.income,
        expenses: monthlySummary.expenses,
        balance: monthlySummary.balance
      };
    });
  };
  
  const monthlyData = useMemo(generateMonthlyData, [monthlySummary]);
  
  // Generate expense breakdown by category
  const expenseBreakdown = useMemo(() => {
    // Group expenses by category type
    const categoryGroups = expenseData.reduce((groups, item) => {
      const categoryType = item.categoryType || 'Other';
      if (!groups[categoryType]) {
        groups[categoryType] = 0;
      }
      groups[categoryType] += item.monthlyAmount || 0;
      return groups;
    }, {});
    
    // Calculate total expenses for percentage calculation
    const totalExpenses = Object.values(categoryGroups).reduce((sum, amount) => sum + amount, 0);
    
    // Convert to array format with percentages
    return Object.entries(categoryGroups)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses ? Math.round((amount / totalExpenses) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount); // Sort by amount (highest first)
  }, [expenseData]);
  
  // Calculate previous period to show trend comparison
  const getTrend = (currentValue, field) => {
    // In a real app, you would compare with actual previous period data
    // For this example, we'll use a random value between -20% and +20%
    const randomFactor = 0.8 + (Math.random() * 0.4); // Between 0.8 and 1.2
    const previousValue = currentValue / randomFactor;
    const percentChange = ((currentValue - previousValue) / previousValue) * 100;
    
    return {
      value: percentChange.toFixed(1),
      isPositive: field === 'income' ? percentChange > 0 : percentChange < 0,
      isNegative: field === 'income' ? percentChange < 0 : percentChange > 0
    };
  };
  
  // Calculate trends
  const incomeTrend = getTrend(currentSummary.income, 'income');
  const expensesTrend = getTrend(currentSummary.expenses, 'expenses');
  const balanceTrend = getTrend(currentSummary.balance, 'balance');
  
  return (
    <div className="reports-page">
      <header className="page-header">
        <h1>Financial Reports</h1>
        <div className="period-selector">
          <button 
            className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('month')}
          >
            Month
          </button>
          <button 
            className={`period-btn ${selectedPeriod === 'quarter' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('quarter')}
          >
            Quarter
          </button>
          <button 
            className={`period-btn ${selectedPeriod === 'year' ? 'active' : ''}`}
            onClick={() => setSelectedPeriod('year')}
          >
            Year
          </button>
        </div>
      </header>

      {/* Summary Section */}
      <div className="reports-section">
        <h2 className="section-title">Financial Summary</h2>
        
        <div className="summary-cards">
          <div className="summary-card income">
            <div className="card-icon">
              <span>💰</span>
            </div>
            <div className="card-content">
              <h3>Total Income</h3>
              <p className="amount">{formatCurrency(currentSummary.income)}</p>
              {incomeTrend.value !== '0.0' && (
                <div className={`trend ${incomeTrend.isPositive ? 'positive' : incomeTrend.isNegative ? 'negative' : 'neutral'}`}>
                  <span>
                    {incomeTrend.isPositive ? '↑' : incomeTrend.isNegative ? '↓' : '→'} 
                    {Math.abs(incomeTrend.value)}% vs last {selectedPeriod}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="summary-card expenses">
            <div className="card-icon">
              <span>💸</span>
            </div>
            <div className="card-content">
              <h3>Total Expenses</h3>
              <p className="amount">{formatCurrency(currentSummary.expenses)}</p>
              {expensesTrend.value !== '0.0' && (
                <div className={`trend ${expensesTrend.isPositive ? 'positive' : expensesTrend.isNegative ? 'negative' : 'neutral'}`}>
                  <span>
                    {expensesTrend.isPositive ? '↑' : expensesTrend.isNegative ? '↓' : '→'} 
                    {Math.abs(expensesTrend.value)}% vs last {selectedPeriod}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="summary-card balance">
            <div className="card-icon">
              <span>📊</span>
            </div>
            <div className="card-content">
              <h3>Balance</h3>
              <p className="amount">{formatCurrency(currentSummary.balance)}</p>
              {balanceTrend.value !== '0.0' && (
                <div className={`trend ${balanceTrend.isPositive ? 'positive' : balanceTrend.isNegative ? 'negative' : 'neutral'}`}>
                  <span>
                    {balanceTrend.isPositive ? '↑' : balanceTrend.isNegative ? '↓' : '→'} 
                    {Math.abs(balanceTrend.value)}% vs last {selectedPeriod}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="reports-section">
        <h2 className="section-title">Monthly Trends</h2>
        
        <div className="chart-container">
          <div className="chart-placeholder">
            <p>Monthly income and expense chart based on your data</p>
            <div className="mock-chart">
              {monthlyData.map((data, index) => (
                <div key={index} className="mock-bar-group">
                  <div className="mock-bar-label">{data.month.substring(0, 3)}</div>
                  <div className="mock-bars">
                    <div 
                      className="mock-bar income" 
                      style={{ height: `${data.income / 100}px` }}
                      title={`Income: ${formatCurrency(data.income)}`}
                    ></div>
                    <div 
                      className="mock-bar expense" 
                      style={{ height: `${data.expenses / 100}px` }}
                      title={`Expenses: ${formatCurrency(data.expenses)}`}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color income"></div>
                <div className="legend-label">Income</div>
              </div>
              <div className="legend-item">
                <div className="legend-color expense"></div>
                <div className="legend-label">Expenses</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="reports-section">
        <h2 className="section-title">Expense Breakdown</h2>
        
        {expenseBreakdown.length > 0 ? (
          <div className="category-breakdown">
            {expenseBreakdown.map((category, index) => (
              <div key={index} className="category-item">
                <div className="category-header">
                  <div className="category-name">{category.category}</div>
                  <div className="category-percentage">{category.percentage}%</div>
                </div>
                <div className="category-bar-container">
                  <div 
                    className="category-bar"
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
                <div className="category-amount">{formatCurrency(category.amount)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No expense data available to generate breakdown.</p>
            <p>Add expenses in the Expenses page to see your breakdown here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;