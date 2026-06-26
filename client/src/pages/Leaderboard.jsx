import { useState, useEffect, useContext } from 'react';
import { UserContext } from '../App.jsx';
import { api } from '../api.js';

export default function Leaderboard() {
  const user = useContext(UserContext);
  const [markets, setMarkets] = useState([]);
  const [activeMarket, setActiveMarket] = useState(null);
  const [inviteCode, setInviteCode] = useState('');
  const [newMarketName, setNewMarketName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    api.getUserMarkets(user.id).then(m => {
      setMarkets(m);
      if (m.length > 0) {
        api.getMarket(m[0].id).then(setActiveMarket);
      }
    });
  }, [user]);

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
      <h1 style={{ fontSize: '1.5rem', marginBottom: 24 }}>Leaderboard</h1>

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
              <div key={member.id} className="leaderboard-row">
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
