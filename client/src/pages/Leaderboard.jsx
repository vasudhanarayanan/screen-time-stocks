import { useState, useEffect, useContext, useCallback } from 'react';
import { UserContext } from '../App.jsx';
import { api } from '../api.js';
import { useSocket } from '../hooks/useSocket.js';

export default function Leaderboard() {
  const user = useContext(UserContext);
  const [markets, setMarkets] = useState([]);
  const [activeMarket, setActiveMarket] = useState(null);
  const [inviteCode, setInviteCode] = useState('');
  const [newMarketName, setNewMarketName] = useState('');
  const [message, setMessage] = useState('');
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    if (!user) return;
    api.getUserMarkets(user.id).then(m => {
      setMarkets(m);
      if (m.length > 0) {
        api.getMarket(m[0].id).then(setActiveMarket);
      }
    });
  }, [user]);

  // Live WebSocket updates
  const handlePriceUpdate = useCallback((data) => {
    if (!activeMarket) return;
    // Refresh the leaderboard when any member logs time
    api.getMarket(activeMarket.id).then(setActiveMarket);
    setFlash(data.user_id);
    setTimeout(() => setFlash(null), 1500);
  }, [activeMarket]);

  useSocket(handlePriceUpdate);

  const handleJoin = async (e) => {
    e.preventDefault();
    try {
      const result = await api.joinMarket({ invite_code: inviteCode, user_id: user.id });
      setMessage(`Joined "${result.name}"!`);
      setInviteCode('');
      const m = await api.getUserMarkets(user.id);
      setMarkets(m);
      api.getMarket(result.market_id).then(setActiveMarket);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const result = await api.createMarket({ name: newMarketName, user_id: user.id });
      setMessage(`Created! Invite code: ${result.invite_code}`);
      setNewMarketName('');
      const m = await api.getUserMarkets(user.id);
      setMarkets(m);
      api.getMarket(result.id).then(setActiveMarket);
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem' }}>Leaderboard</h1>
        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 12, background: '#00d4aa22', color: '#00d4aa' }}>
          LIVE
        </span>
      </div>

      {message && (
        <div className="card" style={{ marginBottom: 16, padding: '12px 20px', borderColor: 'var(--green)' }}>
          <span className="mono" style={{ fontSize: '0.9rem' }}>{message}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <form onSubmit={handleJoin} className="card">
          <div className="form-group">
            <label>Join with Invite Code</label>
            <input
              placeholder="abc12345"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">Join Market</button>
        </form>

        <form onSubmit={handleCreate} className="card">
          <div className="form-group">
            <label>Create New Market</label>
            <input
              placeholder="Friend Group"
              value={newMarketName}
              onChange={e => setNewMarketName(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-success">Create</button>
        </form>
      </div>

      {activeMarket && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.2rem' }}>{activeMarket.name}</h2>
            <span className="ticker-badge">Code: {activeMarket.invite_code}</span>
          </div>

          {activeMarket.leaderboard?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No members yet.</p>
          ) : (
            activeMarket.leaderboard?.map((member, i) => (
              <div
                key={member.id}
                className="leaderboard-row"
                style={{
                  transition: 'background 0.3s',
                  background: flash === member.id ? 'rgba(0, 212, 170, 0.1)' : 'transparent',
                }}
              >
                <span className="rank" style={{ color: i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? '#cd7f32' : 'var(--text-muted)' }}>
                  #{i + 1}
                </span>
                <span className="name">{member.name}</span>
                <span className={`value ${member.total_change >= 0 ? 'positive' : 'negative'}`}>
                  ${member.portfolio_value.toFixed(2)}
                </span>
                <span className={member.total_change >= 0 ? 'positive' : 'negative'} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', width: 70, textAlign: 'right' }}>
                  {member.total_change >= 0 ? '+' : ''}{member.total_change.toFixed(1)}%
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {markets.length > 1 && (
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          {markets.map(m => (
            <button
              key={m.id}
              className="btn btn-primary"
              style={{ opacity: activeMarket?.id === m.id ? 1 : 0.5 }}
              onClick={() => api.getMarket(m.id).then(setActiveMarket)}
            >
              {m.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
