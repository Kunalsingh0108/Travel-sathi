import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import '../styles/global.css';

const ownerHeaders = () => ({
  'x-owner-token': localStorage.getItem('triporaOwnerToken') || '',
  ...(localStorage.getItem('triporaSessionToken')
    ? { Authorization: `Bearer ${localStorage.getItem('triporaSessionToken')}` }
    : {}),
});

export default function Itinerary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(null);
  const [request, setRequest] = useState('');

  const itinerary = trip?.itinerary;
  const budget = itinerary?.budget;
  const activities = useMemo(
    () => itinerary?.days?.flatMap((day) => day.activities || []) || [],
    [itinerary],
  );

  const loadTrip = async () => {
    setLoading(true);
    try {
      const share = new URLSearchParams(window.location.search).get('share');
      const response = await fetch(`/api/trips/${id}${share ? `?share=${encodeURIComponent(share)}` : ''}`, { headers: ownerHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Itinerary not found.');
      setTrip(data.trip);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTrip(); }, [id]);

  const persist = async (nextItinerary) => {
    const response = await fetch(`/api/trips/${id}`, {
      method: 'PUT',
      headers: { ...ownerHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ itinerary: nextItinerary }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Could not save this change.');
    setTrip(data.trip);
  };

  const edit = async (action) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/itinerary/edit', {
        method: 'POST',
        headers: { ...ownerHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ itinerary, action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Edit failed.');
      await persist(data.itinerary);
      setNotice(data.message || 'Itinerary updated.');
    } catch (editError) {
      setError(editError.message);
    } finally {
      setLoading(false);
      setEditing(null);
    }
  };

  const replan = async (event) => {
    event.preventDefault();
    if (!request.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/itinerary/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itinerary, request }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Replanning failed.');
      await persist(data.itinerary);
      setRequest('');
      setNotice(data.message || 'Replanning request applied.');
    } catch (replanError) {
      setError(replanError.message);
    } finally {
      setLoading(false);
    }
  };

  const share = async () => {
    const response = await fetch(`/api/trips/${id}/share`, {
      method: 'POST',
      headers: { ...ownerHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ shared: !trip.shared }),
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error?.message || 'Sharing failed.');
    setTrip({ ...trip, shared: data.shared, shareId: data.shareId });
    if (data.shared) {
      await navigator.clipboard?.writeText(`${window.location.origin}/itinerary/${id}?share=${data.shareId}`);
      setNotice('Read-only share link copied.');
    } else setNotice('Sharing revoked.');
  };

  const duplicate = async () => {
    const response = await fetch(`/api/trips/${id}/duplicate`, { method: 'POST', headers: ownerHeaders() });
    const data = await response.json();
    if (!response.ok) return setError(data.error?.message || 'Could not duplicate trip.');
    if (data.ownerToken) localStorage.setItem('triporaOwnerToken', data.ownerToken);
    navigate(`/itinerary/${data.trip.id}`);
  };

  const removeTrip = async () => {
    if (!window.confirm('Delete this saved trip? This cannot be undone.')) return;
    const response = await fetch(`/api/trips/${id}`, { method: 'DELETE', headers: ownerHeaders() });
    if (response.ok) navigate('/trips');
    else setError('Could not delete this trip.');
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    let y = 18;
    doc.setFontSize(20);
    doc.text(itinerary.title || itinerary.destinationName || 'Tripora itinerary', 14, y);
    y += 12;
    doc.setFontSize(10);
    doc.text('Estimated information from Tripora sample data.', 14, y);
    y += 10;
    itinerary.days.forEach((day) => {
      if (y > 270) { doc.addPage(); y = 18; }
      doc.setFontSize(14);
      doc.text(`Day ${day.dayNumber} - ${day.dateLabel}`, 14, y);
      y += 7;
      doc.setFontSize(10);
      (day.activities || []).forEach((activity) => {
        const line = `${activity.startTime}-${activity.endTime}  ${activity.name}`;
        doc.text(line.slice(0, 100), 18, y);
        y += 5;
        if (y > 280) { doc.addPage(); y = 18; }
      });
      y += 5;
    });
    doc.save(`${(itinerary.destinationName || 'trip').toLowerCase().replace(/\s+/g, '-')}-itinerary.pdf`);
  };

  if (loading && !trip) return <main className="state"><div className="spinner" /><p>Loading itinerary…</p></main>;
  if (!itinerary) return <main className="state"><p className="state__title">{error || 'Itinerary unavailable.'}</p><Link className="btn btn--pill" to="/plan">Create a trip</Link></main>;

  return (
    <main className="section">
      <div className="container">
        <div className="itinerary-toolbar row row--between wrap" style={{ marginBottom: 24 }}>
          <div className="row wrap">
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => navigate(-1)}
              aria-label="Go back to the previous page"
            >
              ← Back
            </button>
            <Link className="btn btn--ghost btn--sm" to="/">Home</Link>
            <Link className="btn btn--ghost btn--sm" to="/trips">My trips</Link>
          </div>
          <div className="row wrap">
            <Link className="btn btn--ghost btn--sm" to={`/map/${id}`}>View map</Link>
            <button className="btn btn--ghost btn--sm" onClick={exportPdf}>Export PDF</button>
            <button className="btn btn--ghost btn--sm" onClick={share}>{trip.shared ? 'Revoke share' : 'Share trip'}</button>
            <button className="btn btn--ghost btn--sm" onClick={duplicate}>Duplicate</button>
            <button className="btn btn--danger btn--sm" onClick={removeTrip}>Delete</button>
          </div>
        </div>
        {error && <div className="notice notice--error" style={{ marginBottom: 16 }}>{error}</div>}
        {notice && <div className="notice notice--ok" style={{ marginBottom: 16 }}>{notice}</div>}
        <header style={{ marginBottom: 28 }}>
          <p className="small muted" style={{ marginBottom: 8 }}>
            Home / My trips / {itinerary.destinationName}
          </p>
          <p className="eyebrow">{itinerary.destinationRegion || 'Trip plan'}</p>
          <h1 className="h-section">{itinerary.destinationName}</h1>
          <p className="muted">{itinerary.title}</p>
        </header>

        <section className="card" aria-label="Budget summary" style={{ marginBottom: 32 }}>
          <div className="row row--between wrap">
            <div><p className="small muted">Total estimated cost</p><strong className="h-card">₹{Number(budget?.total || 0).toLocaleString()}</strong></div>
            <div><p className="small muted">Budget limit</p><strong className="h-card">₹{Number(budget?.budgetLimit || 0).toLocaleString()}</strong></div>
            <div><p className="small muted">Per traveller</p><strong className="h-card">₹{Number(budget?.perPerson || 0).toLocaleString()}</strong></div>
          </div>
          <div className="row wrap" style={{ marginTop: 16 }}>
            {(budget?.lines || []).map((line) => <span className="tag tag--estimate" key={line.key}>{line.label}: ₹{line.amount.toLocaleString()}</span>)}
          </div>
          {budget?.overBudget && <div className="notice notice--warn" style={{ marginTop: 16 }}>This estimate exceeds your budget by ₹{Math.abs(budget.remaining).toLocaleString()}.</div>}
          <p className="small muted" style={{ marginTop: 12 }}>{budget?.estimateNote}</p>
        </section>

        {itinerary.days.map((day) => (
          <section key={day.dayNumber} style={{ marginBottom: 34 }}>
            <div className="row row--between">
              <h2 className="h-card">Day {day.dayNumber} — {day.dateLabel}</h2>
              <span className="tag">{day.scheduleStatus}</span>
            </div>
            <div className="stack" style={{ gap: 10, marginTop: 14 }}>
              {(day.activities || []).map((activity) => (
                <article className="card" key={activity.id}>
                  <div className="row row--between wrap">
                    <div><span className="tag">{activity.kind === 'meal' ? 'meal break' : activity.category || 'activity'}</span><h3 className="h-card" style={{ marginTop: 8 }}>{activity.name}</h3></div>
                    <strong>{activity.startTime}–{activity.endTime}</strong>
                  </div>
                  <p className="muted small" style={{ marginTop: 8 }}>{activity.explanation || activity.description}</p>
                  <div className="row wrap small muted" style={{ marginTop: 10 }}>
                    <span>{activity.durationMin} min</span>
                    {activity.travelMinutesFromPrev > 0 && <span>Travel {activity.travelMinutesFromPrev} min</span>}
                    {activity.costPerPerson != null && <span>₹{activity.costPerPerson} per person (estimate)</span>}
                    {activity.coordinates && <a href={`https://www.openstreetmap.org/?mlat=${activity.coordinates.lat}&mlon=${activity.coordinates.lng}`} target="_blank" rel="noreferrer">Open location</a>}
                  </div>
                  {activity.kind === 'attraction' && <div className="row wrap" style={{ marginTop: 12 }}>
                    <button className="btn btn--quiet btn--sm" onClick={() => setEditing({ type: 'remove', activity })}>Remove</button>
                    <button className="btn btn--quiet btn--sm" onClick={() => setEditing({ type: 'time', activity })}>Change time</button>
                    <button className="btn btn--quiet btn--sm" onClick={() => setEditing({ type: 'move', activity, dayNumber: day.dayNumber })}>Move day</button>
                  </div>}
                </article>
              ))}
            </div>
          </section>
        ))}

        <section className="card">
          <h2 className="h-card">Replan this trip</h2>
          <p className="small muted" style={{ margin: '8px 0 14px' }}>Try “Make Day 2 less busy”, “Reduce the total budget”, or “Include more nature activities”.</p>
          <form className="row wrap" onSubmit={replan}>
            <input style={{ flex: 1, minWidth: 220 }} value={request} onChange={(event) => setRequest(event.target.value)} placeholder="Describe a change…" aria-label="Replanning request" />
            <button className="btn btn--pill" disabled={loading}>Apply change</button>
          </form>
        </section>

        {editing && <EditDialog editing={editing} days={itinerary.days} onClose={() => setEditing(null)} onSubmit={edit} />}
      </div>
    </main>
  );
}

function EditDialog({ editing, days, onClose, onSubmit }) {
  const [time, setTime] = useState(editing.activity.startTime);
  const [day, setDay] = useState(editing.dayNumber);
  return (
    <div className="dialog-backdrop">
      <div className="card dialog" role="dialog" aria-modal="true">
        <h2 className="h-card">{editing.type === 'remove' ? 'Remove activity?' : 'Edit activity'}</h2>
        <p className="muted">{editing.activity.name}</p>
        {editing.type === 'time' && <input type="time" value={time} onChange={(event) => setTime(event.target.value)} />}
        {editing.type === 'move' && <select value={day} onChange={(event) => setDay(Number(event.target.value))}>{days.map((item) => <option key={item.dayNumber} value={item.dayNumber}>Day {item.dayNumber} — {item.dateLabel}</option>)}</select>}
        <div className="row" style={{ marginTop: 18 }}>
          <button className="btn btn--pill" onClick={() => onSubmit({ type: editing.type, activityId: editing.activity.id, ...(editing.type === 'time' ? { startTime: time } : {}), ...(editing.type === 'move' ? { dayNumber: day } : {}) })}>{editing.type === 'remove' ? 'Remove' : 'Save'}</button>
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
