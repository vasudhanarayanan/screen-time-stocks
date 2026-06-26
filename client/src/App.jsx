import { useState, useEffect, createContext } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { api } from './api.js';

export const UserContext = createContext(null);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('userId');
    if (stored) {
      api.getUser(stored).then(setUser).catch(() => localStorage.removeItem('userId')).finally(() => setLoading(false));
    } else {
      api.getUsers().then(users => {
        if (users.length > 0) {
          setUser(users[0]);
          localStorage.setItem('userId', users[0].id);
        }
      }).finally(() => setLoading(false));
    }
  }, []);

  if (loading) return <div className="container"><p style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading...</p></div>;

  if (!user) {
    return (
      <div className="container">
        <div className="empty-state">
          <h2>Welcome to Screen Time Stocks</h2>
          <p>Run <code>npm run seed</code> in the server directory to create demo data.</p>
        </div>
      </div>
    );
  }

  return (
    <UserContext.Provider value={user}>
      <div className="container">
        <nav>
          <span className="logo">STS</span>
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>Portfolio</NavLink>
          <NavLink to="/log" className={({ isActive }) => isActive ? 'active' : ''}>Log Time</NavLink>
          <NavLink to={`/leaderboard/first`} className={({ isActive }) => isActive ? 'active' : ''}>Leaderboard</NavLink>
        </nav>
        <Outlet />
      </div>
    </UserContext.Provider>
  );
}
