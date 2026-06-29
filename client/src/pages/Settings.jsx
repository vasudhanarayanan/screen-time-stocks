import { useState, useEffect, useContext } from 'react';
import { UserContext } from '../App.jsx';
import { api } from '../api.js';

export default function Settings({ onLogout }) {
  const user = useContext(UserContext);
  const [profile, setProfile] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getMe().then(setProfile);
  }, []);

  const handleRegenerate = async () => {
    if (!confirm('Generate a new API key? The old one will stop working.')) return;
    const { api_key } = await api.regenerateApiKey();
    setProfile(p => ({ ...p, api_key }));
  };

  const copyKey = () => {
    navigator.clipboard.writeText(profile?.api_key || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!profile) return <p style={{ color: 'var(--text-muted)', padding: 40 }}>Loading...</p>;

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', marginBottom: 24 }}>Settings</h1>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: 12 }}>Profile</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          {profile.avatar_url && (
            <img src={profile.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%' }} />
          )}
          <div>
            <div style={{ fontWeight: 600 }}>{profile.name}</div>
            {profile.email && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{profile.email}</div>}
          </div>
        </div>
        <button className="btn btn-primary" onClick={onLogout} style={{ background: '#ff4757' }}>
          Log Out
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: 8 }}>iOS Shortcuts Integration</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
          Use this API key to log screen time from iOS Shortcuts automatically.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <code style={{
            flex: 1, padding: '10px 14px', background: 'var(--bg-dark)',
            borderRadius: 8, fontSize: '0.8rem', wordBreak: 'break-all',
            border: '1px solid var(--border)',
          }}>
            {profile.api_key || 'No API key generated'}
          </code>
          <button className="btn btn-primary" onClick={copyKey}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <button className="btn btn-success" onClick={handleRegenerate} style={{ fontSize: '0.85rem' }}>
          Regenerate Key
        </button>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.1rem', marginBottom: 8 }}>Shortcut Setup</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 12 }}>
          Create an iOS Shortcut that runs daily via automation:
        </p>
        <ol style={{ color: 'var(--text-muted)', fontSize: '0.85rem', paddingLeft: 20, lineHeight: 1.8 }}>
          <li>Add a <strong>Get Contents of URL</strong> action</li>
          <li>URL: <code>{'<your-server>'}/api/shortcuts/log</code></li>
          <li>Method: POST</li>
          <li>Headers: <code>Authorization: Bearer {'<your-api-key>'}</code></li>
          <li>Body (JSON): <code>{`{"entries": [{"app": "Instagram", "minutes": 30}]}`}</code></li>
          <li>Set up a Personal Automation to run at end of day</li>
        </ol>
      </div>
    </div>
  );
}
