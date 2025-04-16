import { useState } from 'react';

const TabView = ({ tabs, defaultTab }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  // Early return if no tabs are provided
  if (!tabs || tabs.length === 0) {
    return <div className="empty-tabs">No tabs available</div>;
  }

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className="tab-view">
      <div className="tab-navigation">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            {tab.icon && <span className="tab-icon">{tab.icon}</span>}
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="tab-content">
        {activeTabContent}
      </div>
    </div>
  );
};

export default TabView;