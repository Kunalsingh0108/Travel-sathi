import React from 'react';
import '../styles/global.css';

export default function About() {
  return (
    <main style={{ padding: 64 }}>
      <div className="container">
        <nav style={{ marginBottom: 32 }}>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            <li style={{ fontSize: 14, color: '#7f8c8d' }}>
              <a href="/" style={{ textDecoration: 'none', color: '#7f8c8d' }}>Home</a>
            </li>
            <li style={{ marginLeft: 16, fontSize: 14, color: '#7f8c8d' }}>
              <a href="/plan" style={{ textDecoration: 'none', color: '#7f8c8d' }}>Plan</a>
            </li>
          </ul>
        </nav>

        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2
            style={{
              fontFamily: 'var(--serif)',
              fontWeight: 400,
              fontSize: 32,
              letterSpacing: -0.6,
              margin: 24,
            }}
          >
            About Tripora
          </h2>

          <p
            style={{
              fontSize: 18,
              lineHeight: 1.8,
              color: '#555',
              margin: '0 0 24px',
            }}
          >
            Tripora is a Smart Trip Planner designed to help you create personalized,
            day-wise itineraries with estimated costs, map visualization, and budget tracking.
          </p>

          <dl
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 24,
              margin: '0 0 32px',
              fontSize: 15,
              lineHeight: 1.8,
            }}
          >
            <div>
              <dt
                style={{
                  color: '#7f8c8d',
                  fontWeight: 500,
                  margin: '0 0 4px',
                  fontSize: 13,
                }}
              >
                Purpose
              </dt>
              <dd style={{ margin: 0 }}>
                To make travel planning accessible, personalized, and enjoyable for everyone.
              </dd>
            </div>
            <div>
              <dt
                style={{
                  color: '#7f8c8d',
                  fontWeight: 500,
                  margin: '0 0 4px',
                  fontSize: 13,
                }}
              >
                Mission
              </dt>
              <dd style={{ margin: 0 }}>
                To help travelers discover amazing places, manage their budget, and explore
                the world their way — with elegance and simplicity.
              </dd>
            </div>
          </dl>

          <p
            style={{
              fontSize: 15,
              lineHeight: 1.8,
              color: '#555',
              margin: '0',
            }}
          >
            Built as a college SEA mini project, Tripora combines structured itinerary
            generation with a premium editorial design. The application prioritizes
            reliable core features over unnecessary complexity.
          </p>

          <hr style={{ margin: '32px 0', borderColor: '#e3e6e9' }} />

          <p
            style={{
              fontSize: 14,
              color: '#7f8c8d',
              margin: '0',
            }}
          >
            2024 © Tripora. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}