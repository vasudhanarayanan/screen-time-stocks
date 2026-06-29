import { createContext } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuth } from './hooks/useAuth.js';
import Login from './pages/Login.jsx';

export const UserContext = createContext(null);

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function App() {
  const { user, loading, loginWithGoogle, loginDemo, logout } = useAuth();

  if (loading) {
    return <div className="container"><p style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading...</p></div>;
  }

  if (!user) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <div className="container">
          <Login onGoogleLogin={loginWithGoogle} onDemoLogin={loginDemo} />
        </div>
      </GoogleOAuthProvider>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <UserContext.Provider value={{ ...user, logout }}>
        <div className="container">
          <nav>
            <span className="logo">STS</span>
            <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>Portfolio</NavLink>
            <NavLink to="/log" className={({ isActive }) => isActive ? 'active' : ''}>Log Time</NavLink>
            <NavLink to={`/leaderboard/first`} className={({ isActive }) => isActive ? 'active' : ''}>Leaderboard</NavLink>
            <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>Settings</NavLink>
          </nav>
          <Outlet />
        </div>
      </UserContext.Provider>
    </GoogleOAuthProvider>
  );
}
