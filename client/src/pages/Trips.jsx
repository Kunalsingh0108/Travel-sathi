import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/global.css';
import { apiFetch as fetch } from '../lib/api.js';

export default function Trips() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ownerToken = localStorage.getItem('triporaOwnerToken');
    fetch('/api/trips', {
      headers: {
        'x-owner-token': ownerToken || '',
        ...(localStorage.getItem('triporaSessionToken')
          ? { Authorization: `Bearer ${localStorage.getItem('triporaSessionToken')}` }
          : {}),
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load trips');
        return res.json();
      })
      .then((data) => setTrips(data.trips || []))
      .then(() => setLoading(false))
      .catch((err) => {
        setError(err.message || 'Failed to load trips');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main className="state" style={{ padding: 48 }}>
        <div>
          <div className="spinner" />
          <p style={{ fontSize: 16, color: '#7f8c8d' }}>Loading your trips…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: 48 }}>
        <div className="notice notice--error" style={{ maxWidth: 600, margin: 0 }}>
          {error}
        </div>
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

  return (
    <main style={{ padding: 24 }}>
      <div className="container">
        <div className="row row--between wrap" style={{ marginBottom: 32 }}>
          <a className="btn btn--ghost btn--sm" href="/">← Home</a>
          <a className="btn btn--pill btn--sm" href="/plan">Plan a new journey</a>
        </div>

        <h2 className="h-section" style={{ fontFamily: 'var(--serif)', fontWeight: 400, letterSpacing: -0.6, margin: 24 }}>
          My Trips
        </h2>

        {trips.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 24px',
              color: '#7f8c8d',
            }}
          >
            <p style={{ fontSize: 18, margin: '0 0 16px' }}>No trips yet</p>
            <p style={{ fontSize: 14, margin: 0 }}>
              Create your first trip on the <a href="/plan" style={{ color: '#b4531f' }}>Plan</a> page.
            </p>
          </div>
        )}

        <div className="grid-2">
          {trips.map((trip) => (
            <div
              key={trip.id}
              style={{
                background: '#faf9f7',
                border: '1px solid #e3e6e9',
                borderRadius: 14,
                padding: 24,
                minHeight: 200,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ flexGrow: 1 }}>
                <h4
                  style={{
                    fontFamily: 'var(--serif)',
                    fontWeight: 400,
                    fontSize: 18,
                    letterSpacing: -0.3,
                    margin: '0 0 12px',
                  }}
                >
                  {trip.destinationName || 'Untitled journey'}
                </h4>
                <p
                  style={{
                    fontSize: 14,
                    color: '#7f8c8d',
                    margin: '0 0 12px',
                  }}
                >
                  {trip.dayCount || 0} day(s) • Saved {trip.createdAt ? new Date(trip.createdAt).toLocaleDateString() : '—'}
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: '#b4531f',
                    fontWeight: 500,
                    margin: 0,
                  }}
                >
                  ₹{Number(trip.totalCost || 0).toLocaleString()}
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  className="btn btn--ghost small"
                  onClick={() => navigate(`/itinerary/${trip.id}`)}
                  style={{ fontSize: 13 }}
                >
                  View itinerary
                </button>
                <button
                  className="btn btn--ghost small"
                  onClick={() => navigate(`/itinerary/${trip.id}`)}
                  style={{ fontSize: 13 }}
                >
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}