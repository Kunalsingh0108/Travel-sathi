import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/global.css';
import { apiFetch as fetch } from '../lib/api.js';

export default function Plan() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    travellers: 1,
    stayLocation: '',
    budget: '',
    flexibleBudget: false,
    interests: [],
    pace: 'balanced',
    transport: '',
    dayStart: '08:00',
    dayEnd: '20:00',
    mustVisit: '',
  });
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setInterests(form.interests);
  }, [form.interests]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]:
        type === 'checkbox'
          ? checked
          : name === 'travellers'
            ? Number(value)
            : value,
    });
  };

  const handleInterestsChange = (interest) => {
    setForm({
      ...form,
      interests: form.interests.includes(interest)
        ? form.interests.filter((i) => i !== interest)
        : [...form.interests, interest],
    });
  };

  const handleGenerate = async () => {
    let validationErrors = [];

    if (!form.destination) validationErrors.push('Destination is required');
    if (!form.startDate) validationErrors.push('Start date is required');
    if (!form.endDate) validationErrors.push('End date is required');
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      validationErrors.push('End date must be on or after the start date');
    }
    if (form.travellers <= 0) validationErrors.push('Number of travellers must be positive');
    if (!form.budget || Number(form.budget) <= 0) validationErrors.push('Budget must be a positive number');
    if (form.dayStart >= form.dayEnd) validationErrors.push('Daily end time must be after start time');

    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sessionToken = localStorage.getItem('triporaSessionToken');
      const authHeaders = sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
      const generateResponse = await fetch('/api/itinerary/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          destination: form.destination,
          startDate: form.startDate,
          endDate: form.endDate,
          travellers: form.travellers,
          stayLocation: form.stayLocation,
          budget: Number(form.budget),
          budgetFlexible: form.flexibleBudget,
          interests: form.interests,
          pace: form.pace,
          transport: form.transport || 'local',
          dayStart: form.dayStart,
          dayEnd: form.dayEnd,
          mustVisit: form.mustVisit,
        }),
      });

      if (!generateResponse.ok) {
        const errData = await generateResponse.json();
        throw new Error(errData.message || 'Generation failed');
      }

      const generated = await generateResponse.json();
      const itinerary = generated.itinerary || generated;

      // Save the trip to the backend
      const saveResponse = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          itinerary,
          title: `${form.destination} Trip`,
          shared: false,
        }),
      });

      if (!saveResponse.ok) {
        const errData = await saveResponse.json();
        throw new Error('Failed to save trip: ' + (errData?.message || 'Unknown error'));
      }

      const savedTrip = await saveResponse.json();
      if (savedTrip?.ownerToken) {
        localStorage.setItem('triporaOwnerToken', savedTrip.ownerToken);
      }
      const targetId = savedTrip?.trip?.id;
      if (!targetId) throw new Error('Trip was generated but could not be opened.');
      navigate(`/itinerary/${targetId}`);
    } catch (err) {
      setError(err.message || 'Failed to generate itinerary');
    } finally {
      setLoading(false);
    }
  };

  const interestsList = [
    'nature', 'history', 'adventure', 'shopping',
    'food', 'beaches', 'culture', 'relaxation',
  ];

  return (
    <main style={{ padding: 24 }}>
      <div className="container">
        <nav className="row row--between wrap" aria-label="Trip planning navigation" style={{ marginBottom: 32 }}>
          <a className="btn btn--ghost btn--sm" href="/">← Home</a>
          <a className="btn btn--pill btn--sm" href="/trips">My Trip</a>
        </nav>

        <div className="card" style={{ maxWidth: 600, margin: 0 }}>
          <h2
            style={{
              fontFamily: 'var(--serif)',
              fontWeight: 400,
              fontSize: 32,
              letterSpacing: -0.6,
              margin: 24,
              textAlign: 'center',
            }}
          >
            Create Your Trip
          </h2>

          {error && (
            <div
              className="notice notice--error"
              style={{ background: '#fef3f2', borderColor: '#fecaca', marginBottom: 20, padding: '14px 16px' }}
            >
              {error}
            </div>
          )}

          {loading && (
            <div
              className="state"
              style={{ padding: '48px 24px' }}
            >
              <div className="spinner" />
              <p style={{ fontSize: 16, color: '#7f8c8d' }}>Generating your itinerary…</p>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerate();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
          >
            <div className="field">
              <label className="field__label" htmlFor="destination">
                Destination
              </label>
              <select
                name="destination"
                id="destination"
                value={form.destination}
                onChange={handleChange}
                style={{
                  fontFamily: 'var(--sans)',
                  fontSize: 16,
                  padding: '12px 14px',
                  background: 'var(--surface)',
                  border: '1px solid var(--line-strong)',
                  borderRadius: 10,
                  color: 'var(--fg)',
                  width: '100%',
                }}
                required
              >
                <option value="">Select a destination…</option>
                <option value="goa">Goa, India</option>
                <option value="jaipur">Jaipur, India</option>
                <option value="agra">Agra, India</option>
                <option value="udaipur">Udaipur, India</option>
                <option value="kochi">Kochi, India</option>
              </select>
              <p className="field__hint">
                Choose where you'd like to travel.
              </p>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="startDate">
                Start date
              </label>
              <input
                type="date"
                name="startDate"
                id="startDate"
                value={form.startDate}
                onChange={handleChange}
                style={{
                  fontFamily: 'var(--sans)',
                  fontSize: 16,
                  padding: '12px 14px',
                  background: 'var(--surface)',
                  border: '1px solid var(--line-strong)',
                  borderRadius: 10,
                  color: 'var(--fg)',
                  width: '100%',
                }}
                required
              />
              <p className="field__hint">
                The start of your journey.
              </p>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="endDate">
                End date
              </label>
              <input
                type="date"
                name="endDate"
                id="endDate"
                value={form.endDate}
                onChange={handleChange}
                style={{
                  fontFamily: 'var(--sans)',
                  fontSize: 16,
                  padding: '12px 14px',
                  background: 'var(--surface)',
                  border: '1px solid var(--line-strong)',
                  borderRadius: 10,
                  color: 'var(--fg)',
                  width: '100%',
                }}
                required
              />
              <p className="field__hint">
                The end of your journey.
              </p>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="travellers">
                Number of travellers
              </label>
              <input
                type="number"
                name="travellers"
                id="travellers"
                min="1"
                value={form.travellers}
                onChange={handleChange}
                style={{
                  fontFamily: 'var(--sans)',
                  fontSize: 16,
                  padding: '12px 14px',
                  background: 'var(--surface)',
                  border: '1px solid var(--line-strong)',
                  borderRadius: 10,
                  color: 'var(--fg)',
                  width: '100%',
                }}
                required
              />
              <p className="field__hint">
                How many people are traveling?
              </p>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="stayLocation">
                Stay location or accommodation
              </label>
              <input
                type="text"
                name="stayLocation"
                id="stayLocation"
                placeholder="e.g. City centre, beachfront resort, etc."
                value={form.stayLocation}
                onChange={handleChange}
                style={{
                  fontFamily: 'var(--sans)',
                  fontSize: 16,
                  padding: '12px 14px',
                  background: 'var(--surface)',
                  border: '1px solid var(--line-strong)',
                  borderRadius: 10,
                  color: 'var(--fg)',
                  width: '100%',
                }}
              />
              <p className="field__hint">
                Where will you be staying during the trip?
              </p>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="budget">
                Total budget (INR)
              </label>
              <input
                type="number"
                name="budget"
                id="budget"
                min="1"
                value={form.budget}
                onChange={handleChange}
                style={{
                  fontFamily: 'var(--sans)',
                  fontSize: 16,
                  padding: '12px 14px',
                  background: 'var(--surface)',
                  border: '1px solid var(--line-strong)',
                  borderRadius: 10,
                  color: 'var(--fg)',
                  width: '100%',
                }}
                required
              />
              <p className="field__hint">
                Your total budget in Indian Rupees.
              </p>
              <label className="choice" data-selected={form.flexibleBudget}>
                <input
                  type="checkbox"
                  name="flexibleBudget"
                  checked={form.flexibleBudget}
                  onChange={handleChange}
                />
                Flexible budget
              </label>
              <p className="field__hint small">
                Allow the itinerary to exceed the budget slightly for unique experiences.
              </p>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="interests">
                Interests
              </label>
              <div className="choices" style={{ flexWrap: 'wrap', gap: 8 }}>
                {interestsList.map((interest) => (
                  <label className="choice" key={interest} data-selected={interests.includes(interest)}>
                    <input
                      type="checkbox"
                      name="interest"
                      value={interest}
                      checked={interests.includes(interest)}
                      onChange={() => handleInterestsChange(interest)}
                      style={{ opacity: 0, pointerEvents: 'none' }}
                    />
                    {interest}
                  </label>
                ))}
              </div>
              <p className="field__hint small">
                Select all that apply.
              </p>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="pace">
                Travel pace
              </label>
              <div className="choices" style={{ flexWrap: 'wrap', gap: 8 }}>
                <label className="choice" data-selected={form.pace === 'relaxed'}>
                  <input
                    type="radio"
                    name="pace"
                    value="relaxed"
                    checked={form.pace === 'relaxed'}
                    onChange={(e) => setForm({ ...form, pace: 'relaxed' })}
                    style={{ opacity: 0, pointerEvents: 'none' }}
                  />
                  Relaxed
                </label>
                <label className="choice" data-selected={form.pace === 'balanced'}>
                  <input
                    type="radio"
                    name="pace"
                    value="balanced"
                    checked={form.pace === 'balanced'}
                    onChange={(e) => setForm({ ...form, pace: 'balanced' })}
                    style={{ opacity: 0, pointerEvents: 'none' }}
                  />
                  Balanced
                </label>
                <label className="choice" data-selected={form.pace === 'packed'}>
                  <input
                    type="radio"
                    name="pace"
                    value="packed"
                    checked={form.pace === 'packed'}
                    onChange={(e) => setForm({ ...form, pace: 'packed' })}
                    style={{ opacity: 0, pointerEvents: 'none' }}
                  />
                  Packed
                </label>
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="transport">
                How will you get around?
              </label>
              <select
                name="transport"
                id="transport"
                value={form.transport}
                onChange={handleChange}
                style={{
                  fontFamily: 'var(--sans)',
                  fontSize: 16,
                  padding: '12px 14px',
                  background: 'var(--surface)',
                  border: '1px solid var(--line-strong)',
                  borderRadius: 10,
                  color: 'var(--fg)',
                  width: '100%',
                }}
              >
                <option value="">Select transport…</option>
                <option value="walk">Walk</option>
                <option value="public">Public transport</option>
                <option value="scooter">Scooter</option>
                <option value="taxi">Taxi</option>
                <option value="self-drive">Self-drive</option>
              </select>
              <p className="field__hint small">
                Optional. Leave blank for local transport.
              </p>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="dayStart">
                Preferred daily start time
              </label>
              <input
                type="time"
                name="dayStart"
                id="dayStart"
                value={form.dayStart}
                onChange={handleChange}
                style={{
                  fontFamily: 'var(--sans)',
                  fontSize: 16,
                  padding: '12px 14px',
                  background: 'var(--surface)',
                  border: '1px solid var(--line-strong)',
                  borderRadius: 10,
                  color: 'var(--fg)',
                  width: '100%',
                }}
              />
              <p className="field__hint small">
                e.g. 08:00 for early starts
              </p>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="dayEnd">
                Preferred daily end time
              </label>
              <input
                type="time"
                name="dayEnd"
                id="dayEnd"
                value={form.dayEnd}
                onChange={handleChange}
                style={{
                  fontFamily: 'var(--sans)',
                  fontSize: 16,
                  padding: '12px 14px',
                  background: 'var(--surface)',
                  border: '1px solid var(--line-strong)',
                  borderRadius: 10,
                  color: 'var(--fg)',
                  width: '100%',
                }}
              />
              <p className="field__hint small">
                e.g. 20:00 for early evenings
              </p>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="mustVisit">
                Optional: Must-visit attractions
              </label>
              <input
                type="text"
                name="mustVisit"
                id="mustVisit"
                placeholder="e.g. Taj Mahal, Machu Picchu, etc."
                value={form.mustVisit}
                onChange={handleChange}
                style={{
                  fontFamily: 'var(--sans)',
                  fontSize: 16,
                  padding: '12px 14px',
                  background: 'var(--surface)',
                  border: '1px solid var(--line-strong)',
                  borderRadius: 10,
                  color: 'var(--fg)',
                  width: '100%',
                }}
              />
              <p className="field__hint small">
                List specific attractions you don't want to miss, separated by commas.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                type="submit"
                className="btn btn--pill"
                disabled={loading}
              >
                {loading ? 'Generating…' : 'Generate itinerary'}
              </button>
            </div>
          </form>
        </div>

        <div
          style={{ marginTop: 40, textAlign: 'center', color: '#7f8c8d', fontSize: 14 }}
        >
          <p>Continue as guest — no registration required.</p>
        </div>
      </div>
    </main>
  );
}