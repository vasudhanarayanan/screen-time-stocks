import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';

export default function Login({ onGoogleLogin, onDemoLogin }) {
  const [demoName, setDemoName] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 32 }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: 8 }}>Screen Time Stocks</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          Your screen time, gamified as a stock portfolio.
        </p>
      </div>

      <div className="card" style={{ padding: 32, width: '100%', maxWidth: 360 }}>
        <div style={{ marginBottom: 24 }}>
          <GoogleLogin
            onSuccess={(response) => onGoogleLogin(response.credential)}
            onError={() => console.error('Google login failed')}
            theme="filled_black"
            size="large"
            width="100%"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onDemoLogin(demoName || 'Demo User'); }}>
          <div className="form-group">
            <label>Demo Login</label>
            <input
              placeholder="Enter a name"
              value={demoName}
              onChange={e => setDemoName(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Continue as Guest
          </button>
        </form>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        No account needed for demo mode. Google login enables cross-device sync.
      </p>
    </div>
  );
}
