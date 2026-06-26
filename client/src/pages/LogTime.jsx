import { useState, useEffect, useContext } from 'react';
import { UserContext } from '../App.jsx';
import { api } from '../api.js';

export default function LogTime() {
  const user = useContext(UserContext);
  const [apps, setApps] = useState([]);
  const [entries, setEntries] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newApp, setNewApp] = useState({ ticker: '', display_name: '', daily_goal_minutes: 30 });

  useEffect(() => {
    if (!user) return;
    api.getUserApps(user.id).then(setApps);
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validEntries = Object.entries(entries)
      .filter(([_, mins]) => mins !== '' && mins != null)
      .map(([app_id, actual_minutes]) => ({ app_id, actual_minutes: parseInt(actual_minutes) }));

    if (validEntries.length === 0) {
      setMessage('Enter at least one app\'s usage time');
      return;
    }

    try {
      const results = await api.logTimeBatch({ user_id: user.id, date, entries: validEntries });
      const changes = results.map(r => `$${r.ticker}: ${r.pct_change >= 0 ? '+' : ''}${r.pct_change.toFixed(1)}%`);
      setMessage(`Market closed! ${changes.join(', ')}`);
      setEntries({});
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleAddApp = async (e) => {
    e.preventDefault();
    try {
      const created = await api.createApp({ ...newApp, user_id: user.id, ticker: newApp.ticker.toUpperCase() });
      setApps(prev => [...prev, created]);
      setNewApp({ ticker: '', display_name: '', daily_goal_minutes: 30 });
      setShowAdd(false);
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem' }}>Log Screen Time</h1>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : '+ Add App'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddApp} className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <div className="form-group">
              <label>Ticker</label>
              <input
                placeholder="INSTA"
                value={newApp.ticker}
                onChange={e => setNewApp(p => ({ ...p, ticker: e.target.value }))}
                maxLength={6}
                required
              />
            </div>
            <div className="form-group">
              <label>App Name</label>
              <input
                placeholder="Instagram"
                value={newApp.display_name}
                onChange={e => setNewApp(p => ({ ...p, display_name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Daily Goal (min)</label>
              <input
                type="number"
                min="1"
                value={newApp.daily_goal_minutes}
                onChange={e => setNewApp(p => ({ ...p, daily_goal_minutes: parseInt(e.target.value) }))}
                required
              />
            </div>
            <button type="submit" className="btn btn-success" style={{ marginBottom: 16 }}>Add</button>
          </div>
        </form>
      )}

      {message && (
        <div className="card" style={{ marginBottom: 16, padding: '12px 20px', borderColor: 'var(--blue)' }}>
          <span className="mono" style={{ fontSize: '0.9rem' }}>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ maxWidth: 200, marginBottom: 20 }}>
          <label>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        {apps.length === 0 ? (
          <div className="empty-state">
            <h2>No apps to track</h2>
            <p>Click "+ Add App" to start tracking your screen time.</p>
          </div>
        ) : (
          <div className="card">
            {apps.map(app => (
              <div key={app.id} className="log-entry">
                <span className="ticker-badge">${app.ticker}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {app.display_name} — goal: {app.daily_goal_minutes}m
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="min"
                  value={entries[app.id] || ''}
                  onChange={e => setEntries(prev => ({ ...prev, [app.id]: e.target.value }))}
                  style={{
                    width: 80,
                    padding: '8px 12px',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    color: 'var(--text)',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.9rem',
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {apps.length > 0 && (
          <button type="submit" className="btn btn-success" style={{ marginTop: 20, width: '100%' }}>
            Close Market (Submit)
          </button>
        )}
      </form>
    </div>
  );
}
