import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api.js';
import StockChart from '../components/StockChart.jsx';

export default function StockDetail() {
  const { appId } = useParams();
  const [app, setApp] = useState(null);
  const [snapshots, setSnapshots] = useState([]);

  useEffect(() => {
    api.getAppHistory(appId).then(data => {
      setApp(data);
      setSnapshots(data.snapshots || []);
    });
  }, [appId]);

  if (!app) return <p style={{ color: 'var(--text-muted)' }}>Loading...</p>;

  const lastSnapshot = snapshots[snapshots.length - 1];
  const dailyChange = lastSnapshot?.pct_change ?? 0;
  const allTimeChange = ((app.current_price - 100) / 100) * 100;

  const highPrice = Math.max(...snapshots.map(s => s.price), app.current_price);
  const lowPrice = Math.min(...snapshots.map(s => s.price), app.current_price);
  const avgMinutes = snapshots.length > 0
    ? (snapshots.reduce((sum, s) => sum + s.actual_minutes, 0) / snapshots.length).toFixed(0)
    : 0;

  const streak = (() => {
    let count = 0;
    for (let i = snapshots.length - 1; i >= 0; i--) {
      if (snapshots[i].actual_minutes <= app.daily_goal_minutes) count++;
      else break;
    }
    return count;
  })();

  return (
    <div>
      <div className="detail-header">
        <div className="ticker">${app.ticker}</div>
        <div style={{ color: 'var(--text-muted)', marginBottom: 8 }}>{app.display_name}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span className="price">${app.current_price.toFixed(2)}</span>
          <span className={`change ${dailyChange >= 0 ? 'positive' : 'negative'}`} style={{ fontSize: '1.1rem' }}>
            {dailyChange >= 0 ? '+' : ''}{dailyChange.toFixed(2)}% today
          </span>
        </div>
      </div>

      <StockChart data={snapshots} />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">All-Time</div>
          <div className={`value ${allTimeChange >= 0 ? 'positive' : 'negative'}`}>
            {allTimeChange >= 0 ? '+' : ''}{allTimeChange.toFixed(1)}%
          </div>
        </div>
        <div className="stat-card">
          <div className="label">52-Day High</div>
          <div className="value">${highPrice.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="label">52-Day Low</div>
          <div className="value">${lowPrice.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Daily Goal</div>
          <div className="value">{app.daily_goal_minutes}m</div>
        </div>
        <div className="stat-card">
          <div className="label">Avg Usage</div>
          <div className="value">{avgMinutes}m</div>
        </div>
        <div className="stat-card">
          <div className="label">Streak</div>
          <div className="value positive">{streak} days</div>
        </div>
      </div>

      {snapshots.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 12, fontSize: '1rem', color: 'var(--text-muted)' }}>Recent Activity</h3>
          <div className="card">
            {snapshots.slice(-7).reverse().map(s => (
              <div key={s.id} className="log-entry">
                <span className="ticker-badge">{s.date}</span>
                <span>{s.actual_minutes}m / {app.daily_goal_minutes}m goal</span>
                <span className={s.pct_change >= 0 ? 'positive' : 'negative'} style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                  {s.pct_change >= 0 ? '+' : ''}{s.pct_change.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
