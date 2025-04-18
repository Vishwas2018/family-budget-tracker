import PropTypes from 'prop-types';

/**
 * A reusable card component for displaying summary information
 */
const SummaryCard = ({ 
  title, 
  amount, 
  icon, 
  type = 'default', 
  isLoading = false,
  trend = null,
  trendLabel = ''
}) => {
  // Determine card styling based on type
  const cardClassName = `summary-card ${type}`;
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);

  return (
    <div className={cardClassName}>
      <div className="card-icon">
        <span>{icon}</span>
      </div>
      <div className="card-content">
        <h3>{title}</h3>
        <p className="amount">
          {isLoading ? '$...' : formattedAmount}
        </p>
        
        {trend !== null && (
          <div className={`trend ${trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral'}`}>
            <span className="trend-icon">
              {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}
            </span>
            <span className="trend-value">
              {Math.abs(trend)}% {trendLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  amount: PropTypes.number,
  icon: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['income', 'expense', 'balance', 'savings', 'default']),
  isLoading: PropTypes.bool,
  trend: PropTypes.number,
  trendLabel: PropTypes.string
};

export default SummaryCard;