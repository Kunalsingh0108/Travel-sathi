import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch as fetch } from '../lib/api.js';
import '../styles/global.css';

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [state, setState] = useState({ loading: false, error: '' });

  const submit = async (event) => {
    event.preventDefault();
    setState({ loading: true, error: '' });
    try {
      const response = await fetch(`/api/auth/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Authentication failed.');
      localStorage.setItem('triporaSessionToken', data.token);
      navigate('/trips');
    } catch (error) {
      setState({ loading: false, error: error.message });
    }
  };

  return (
    <main className="section">
      <div className="container">
        <div className="card auth-card">
          <Link to="/" className="auth-card__logo">Tripora<sup>®</sup></Link>
          <h1 className="h-section">{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</h1>
          <p className="muted">Save, revisit, and manage your private itineraries across devices.</p>
          {state.error && <div className="notice notice--error">{state.error}</div>}
          <form className="stack auth-form" onSubmit={submit}>
            {mode === 'register' && (
              <label className="field">
                <span className="field__label">Name</span>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
              </label>
            )}
            <label className="field">
              <span className="field__label">Email</span>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
            </label>
            <label className="field">
              <span className="field__label">Password</span>
              <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            </label>
            <button className="btn btn--pill" disabled={state.loading}>{state.loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
          </form>
          <button className="btn btn--quiet" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Need an account? Register' : 'Already registered? Sign in'}
          </button>
          <Link className="small muted" to="/plan">Continue as a guest</Link>
        </div>
      </div>
    </main>
  );
}
