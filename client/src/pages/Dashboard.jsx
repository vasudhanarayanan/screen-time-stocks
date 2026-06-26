import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../App.jsx';
import { api } from '../api.js';
import Sparkline from '../components/Sparkline.jsx';

export default function Dashboard() {
  const user = useContext(UserContext);
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [histories, setHistories] = useState({});

  useEffect(() => {
    if (!user) return;
    api.getUser(user.id).then(data => {
      setApps(data.apps || []);
      data.apps?.forEach(app => {
        api.getAppHistory(app.id).then(h => {
          setHistories(prev => ({ ...prev, [app.id]: h.snapshots }));
        });
      });
    });
  }, [user]);

  const portfolioValue = apps.reduce((sum, app) => sum + app.current_price, 0);
  const initialValue = apps.length * 100;
  const totalChange = initialValue > 0 ? ((portfolioValue - initialValue) / initialValue) * 100 : 0;

  return (
    <div>
      <div className="portfolio-header">
        <h1>Your Portfolio</h1>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span className="value">${portfolioValue.toFixed(2)}</span>
          <span className={`change ${totalChange >= 0 ? 'positive' : 'negative'}`}>
            {totalChange >= 0 ? '+' : ''}{totalChange.toFixed(2)}%
          </span>
        </div>
      </div>

      {apps.length === 0 ? (
        <div className="empty-state">
          <h2>No apps tracked yet</h2>
          <p>Go to Log Time to add your first app and start tracking.</p>
        </div>
      ) : (
        <div className="grid">
          {apps.map(app => {
            const change = app.current_price - 100;
            const pct = change;
            const snapshots = histories[app.id] || [];
            const lastSnapshot = snapshots[snapshots.length - 1];
            const dailyChange = lastSnapshot?.pct_change ?? 0;

            return (
              <div key={app.id} className="stock-card" onClick={() => navigate(`/stock/${app.id}`)}>
                <div className="header">
                  <div>
                    <div className="ticker">${app.ticker}</div>
                    <div className="name">{app.display_name}</div>
                  </div>
                  <span className={`change ${dailyChange >= 0 ? 'up' : 'down'}`}>
                    {dailyChange >= 0 ? '+' : ''}{dailyChange.toFixed(1)}%
                  </span>
                </div>
                <div className="price">${app.current_price.toFixed(2)}</div>
                <Sparkline
                  data={snapshots}
                  color={app.current_price >= 100 ? '#00d4aa' : '#ff4757'}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
