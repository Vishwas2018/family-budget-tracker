import { Link, NavLink, useLocation } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';

/**
 * Main navigation component with enhanced links for income and expenses
 */
function Navigation() {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  // Check if we're in the auth pages (login/register)
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  
  // Don't show navigation on auth pages
  if (isAuthPage) return null;
  
  return (
    <nav className="main-navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/" className="brand-link">
            <span className="brand-icon">💰</span>
            <span className="brand-name">Budget Tracker</span>
          </Link>
        </div>
        
        {user ? (
          <>
            <div className="nav-links">
              <NavLink 
                to="/dashboard" 
                end
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                Dashboard
              </NavLink>
              <NavLink 
                to="/dashboard/transactions" 
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                Transactions
              </NavLink>
              <NavLink 
                to="/dashboard/income" 
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                Income
              </NavLink>
              <NavLink 
                to="/dashboard/expenses" 
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                Expenses
              </NavLink>
              <NavLink 
                to="/dashboard/bills" 
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                Bills
              </NavLink>
              <NavLink 
                to="/dashboard/reports" 
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                Reports
              </NavLink>
            </div>
            
            <div className="nav-user">
              <div className="user-menu-container">
                <div className="user-info">
                  <span className="user-greeting">Hello, {user.name.split(' ')[0]}</span>
                </div>
                <div className="user-menu">
                  <Link to="/profile" className="menu-item">
                    Profile
                  </Link>
                  <button onClick={logout} className="menu-item logout-item">
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="nav-auth">
            <Link to="/login" className="nav-link">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navigation;