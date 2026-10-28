import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/global.css';
import { apiFetch as fetch } from '../lib/api.js';

export default function Admin() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState(localStorage.getItem('triporaAdminToken') || '');
  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetch('/api/admin/overview', { headers: { 'x-admin-token': token } })
      .then((res) => {
        if (!res.ok) throw new Error('Admin metrics not found');
        return res.json();
      })
      .then((data) => {
        if (data.adminConfigured === false) throw new Error('Admin access is not configured on the server.');
        setMetrics(data);
        localStorage.setItem('triporaAdminToken', token);
        return fetch('/api/admin/destinations', { headers: { 'x-admin-token': token } });
      })
      .then((res) => (res?.ok ? res.json() : null))
      .then((data) => {
        if (data?.destinations) setDestinations(data.destinations);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load admin metrics');
        setLoading(false);
      });
  }, [token]);

  if (!token && !metrics) {
    return (
      <main className="section"><div className="container"><div className="card auth-card">
        <h1 className="h-section">Administration</h1>
        <p className="muted">Enter the server-configured admin token. It is never displayed after submission.</p>
        <form className="stack auth-form" onSubmit={(event) => { event.preventDefault(); setLoading(true); setError(''); setToken(event.currentTarget.elements.token.value); }}>
          <input name="token" type="password" required autoComplete="off" aria-label="Admin token" />
          <button className="btn btn--pill">Open admin</button>
        </form>
        {error && <div className="notice notice--error">{error}</div>}
      </div></div></main>
    );
  }

  if (loading) {
    return (
      <main style={{ padding: 48 }}>
        <div style={{ fontSize: 16, color: '#7f8c8d' }}>Loading metrics…</div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: 48 }}>
        <div style={{ maxWidth: 600, margin: 0 }}> {error} </div>
        <button
          className="btn btn--ghost"
          onClick={() => window.location.reload()}
          style={{ marginTop: 16 }}
        >
          Retry
        </button>
      </main>
    );
  }

  if (!metrics) {
    return (
      <main style={{ padding: 48 }}>
        <div style={{ maxWidth: 600, margin: 0 }}> Admin metrics not available </div>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <div className="container">
        <nav style={{ marginBottom: 32 }}>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            <li style={{ fontSize: 14, color: '#7f8c8d' }}>
              <a href="/" style={{ textDecoration: 'none', color: '#7f8c8d' }}>Home</a>
            </li>
          </ul>
        </nav>

        <h2
          style={{
            fontFamily: 'var(--serif)',
            fontWeight: 400,
            fontSize: 32,
            letterSpacing: -0.6,
            margin: 24,
          }}
        >
          Administration
        </h2>

        <p
          style={{
            fontSize: 14,
            color: '#7f8c8d',
            margin: '0 0 24px',
          }}
        >
          Authorized administrator view. Sensitive tokens and logs are not exposed.
        </p>

        {/* Application metrics grid */}
        <div style={{ display: 'grid', gap: 24, marginBottom: 32 }}>
          {metrics.metrics?.trips !== undefined && (
            <div style={{ background: '#faf9f7', border: '1px solid #e3e6e9', borderRadius: 10, padding: 20 }}>
              <p style={{ fontSize: 12, color: '#7f8c8d', margin: '0 0 8px' }}>Saved trips</p>
              <p style={{ fontFamily: 'var(--serif)', fontSize: 32, color: '#0f172a', margin: '0' }}>
                {metrics.metrics.trips}
              </p>
            </div>
          )}

          {metrics.metrics?.sharedTrips !== undefined && (
            <div style={{ background: '#faf9f7', border: '1px solid #e3e6e9', borderRadius: 10, padding: 20 }}>
              <p style={{ fontSize: 12, color: '#7f8c8d', margin: '0 0 8px' }}>Shared trips</p>
              <p style={{ fontFamily: 'var(--serif)', fontSize: 32, color: '#0f172a', margin: '0' }}>
                {metrics.metrics.sharedTrips}
              </p>
            </div>
          )}

          {metrics.metrics?.datasetDestinations !== undefined && (
            <div style={{ background: '#faf9f7', border: '1px solid #e3e6e9', borderRadius: 10, padding: 20 }}>
              <p style={{ fontSize: 12, color: '#7f8c8d', margin: '0 0 8px' }}>Dataset destinations</p>
              <p style={{ fontFamily: 'var(--serif)', fontSize: 32, color: '#0f172a', margin: '0' }}>
                {metrics.metrics.datasetDestinations}
              </p>
            </div>
          )}

          {metrics.metrics?.trackedErrors !== undefined && (
            <div style={{ background: '#faf9f7', border: '1px solid #e3e6e9', borderRadius: 10, padding: 20 }}>
              <p style={{ fontSize: 12, color: '#7f8c8d', margin: '0 0 8px' }}>Tracked errors</p>
              <p style={{ fontFamily: 'var(--serif)', fontSize: 24, color: '#0f172a', margin: '0' }}>
                {metrics.metrics.trackedErrors}
              </p>
            </div>
          )}
        </div>

        <section className="card" style={{ marginTop: 32 }}>
          <h3 className="h-card">Destination availability</h3>
          <p className="small muted" style={{ margin: '8px 0 16px' }}>Disable destinations temporarily without removing their curated data.</p>
          <div className="stack" style={{ gap: 10 }}>
            {destinations.map((destination) => (
              <div className="row row--between wrap" key={destination.id}>
                <span>{destination.name} <span className="small muted">({destination.attractions} attractions)</span></span>
                <button className={`btn btn--sm ${destination.enabled ? 'btn--ghost' : 'btn--danger'}`} onClick={async () => {
                  const response = await fetch(`/api/admin/destinations/${destination.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
                    body: JSON.stringify({ enabled: !destination.enabled }),
                  });
                  if (response.ok) setDestinations(destinations.map((item) => item.id === destination.id ? { ...item, enabled: !item.enabled } : item));
                }}>
                  {destination.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Recent errors section */}
        {metrics && metrics.recentErrors && metrics.recentErrors.length > 0 && (
          <div style={{ background: '#faf9f7', border: '1px solid #e3e6e9', borderRadius: 10, padding: 20, marginTop: 32 }}>
            <h3
              style={{
                fontFamily: 'var(--serif)',
                fontWeight: 400,
                fontSize: 20,
                letterSpacing: -0.5,
                margin: '0 0 16px',
              }}
            >
              Recent errors ({metrics.recentErrors.length})
            </h3>
            <ul style={{ margin: 0, padding: '0 0 0 16', fontSize: 13, color: '#555' }}>
              {metrics.recentErrors.slice(0, 5).map((err, i) => (
                <li key={i} style={{ margin: '8px 0' }}>
                  {err.message || err}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Integration status */}
        {metrics && metrics.integrations && Object.keys(metrics.integrations).length > 0 && (
          <div style={{ background: '#faf9f7', border: '1px solid #e3e6e9', borderRadius: 10, padding: 20, marginTop: 32 }}>
            <h3
              style={{
                fontFamily: 'var(--serif)',
                fontWeight: 400,
                fontSize: 20,
                letterSpacing: -0.5,
                margin: '0 0 16px',
              }}
            >
              External integration status
            </h3>
            <ul style={{ margin: 0, padding: '0 0 0 16', fontSize: 13, color: '#555' }}>
              {Object.entries(metrics.integrations).map(([key, status], i) => (
                <li key={i} style={{ margin: '8px 0' }}>
                  <strong style={{ color: '#0f172a' }}>{key}:</strong> {status}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}