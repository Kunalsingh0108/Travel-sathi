import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/global.css';
import L from 'leaflet';

export default function Map() {
  const { id } = useParams();
  const [markers, setMarkers] = useState([]);
  const [dayFilter, setDayFilter] = useState('all');
  const [trip, setTrip] = useState(null);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  // Sample attraction data - using a subset of destinations
  const sampleAttractions = [
    { id: 'goa-calangute', lat: 15.5439, lng: 73.7560, name: 'Calangute Beach', category: 'beaches', description: 'The most popular beach in North Goa, with shacks, water sports and sunset views.', destination: 'Goa' },
    { id: 'goa-baga', lat: 15.5570, lng: 73.7510, name: 'Baga Beach', category: 'beaches', description: 'Lively beach known for its nightlife, parasailing and beachside cafes.', destination: 'Goa' },
    { id: 'goa-basilica', lat: 15.5009, lng: 74.0780, name: 'Basilica of Bom Jesus', category: 'history', description: 'UNESCO World Heritage church holding the mortal remains of St. Francis Xavier.', destination: 'Goa' },
    { id: 'goa-dudhsagar', lat: 15.3144, lng: 74.3143, name: 'Dudhsagar Falls', category: 'nature', description: 'A four-tiered 310 m waterfall on the Goa-Karnataka border, reached by jeep.', destination: 'Goa' },
    { id: 'jaipur-amber', lat: 26.9855, lng: 75.8513, name: 'Amber Fort', category: 'history', description: 'Hilltop fort of mirror halls, courtyards and the Sheesh Mahal.', destination: 'Jaipur' },
    { id: 'jaipur-city-palace', lat: 26.9239, lng: 75.8240, name: 'City Palace', category: 'history', description: 'Still-royal palace complex with courtyards, armoury and textile galleries.', destination: 'Jaipur' },
    { id: 'agra-taj', lat: 27.1751, lng: 78.0421, name: 'Taj Mahal', category: 'history', description: 'The white marble mausoleum, best in the first hour after opening.', destination: 'Agra' },
    { id: 'agra-fort', lat: 27.1820, lng: 78.0210, name: 'Agra Fort', category: 'history', description: 'Red sandstone fort of palaces, audience halls and river views.', destination: 'Agra' },
    { id: 'udaipur-city-palace', lat: 24.5765, lng: 73.6800, name: 'City Palace', category: 'history', description: 'Lakefront palace of balconies, towers and museum courtyards.', destination: 'Udaipur' },
    { id: 'udaipur-pichola-boat', lat: 24.5760, lng: 73.6800, name: 'Lake Pichola boat ride', category: 'relaxation', description: 'Shared boat crossing past Jag Mandir and the palaces on the lake.', destination: 'Udaipur' },
    { id: 'manali-hadimba', lat: 32.2432, lng: 77.1892, name: 'Hadimba Devi Temple', category: 'culture', description: 'Cedar-roofed pagoda temple set inside a deodar forest grove.', destination: 'Manali' },
    { id: 'manali-solang', lat: 32.3050, lng: 77.1560, name: 'Solang Valley', category: 'adventure', description: 'Valley for paragliding, zorbing and snow activities depending on season.', destination: 'Manali' },
  ];

  useEffect(() => {
    if (!id) {
      setMarkers(sampleAttractions);
      return;
    }
    fetch(`/api/trips/${id}?share=${encodeURIComponent(new URLSearchParams(window.location.search).get('share') || '')}`, {
      headers: { 'x-owner-token': localStorage.getItem('triporaOwnerToken') || '' },
    })
      .then((response) => response.json().then((data) => ({ response, data })))
      .then(({ response, data }) => {
        if (!response.ok) throw new Error(data.error?.message || 'Map unavailable.');
        setTrip(data.trip);
      })
      .catch(() => setMarkers([]));
  }, [id]);

  useEffect(() => {
    if (!trip?.itinerary) return;
    const next = trip.itinerary.days
      .filter((day) => dayFilter === 'all' || String(day.dayNumber) === dayFilter)
      .flatMap((day) => (day.activities || []).map((activity) => ({
        ...activity,
        name: activity.name,
        description: activity.description || activity.explanation || '',
        category: activity.category || activity.kind,
        destination: trip.itinerary.destinationName,
      })))
      .filter((activity) => Number.isFinite(Number(activity.lat)) && Number.isFinite(Number(activity.lng)));
    setMarkers(next);
  }, [trip, dayFilter]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return undefined;
    const nextMap = L.map(mapContainerRef.current).setView([20, 78], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(nextMap);
    mapRef.current = nextMap;
    return () => {
      nextMap.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const nextMap = mapRef.current;
    if (!nextMap || !markers.length) return;
    const markerLayer = L.layerGroup().addTo(nextMap);
    markers.forEach((m) => {
      const popupContent = `
        <div style="font-family: sans-serif; font-size: 13px; min-width: 200px;">
          <strong>${m.name}</strong>
          <p>${m.description}</p>
          <small>${m.category} · ${m.destination || ''}</small>
        </div>
      `;
      L.marker([m.lat, m.lng], { riseOnHover: true })
        .addTo(markerLayer)
        .bindPopup(popupContent);
    });
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    nextMap.fitBounds(bounds, { padding: [32, 32] });
    return () => {
      nextMap.removeLayer(markerLayer);
    };
  }, [markers]);

  return (
    <main style={{ padding: '32px 0' }}>
      <div className="container">
        {id ? (
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 14, color: '#7f8c8d' }}>
              Map for {trip?.itinerary?.destinationName || `itinerary ${id}`}
            </p>
            {trip?.itinerary?.days?.length > 0 && (
              <label className="field" style={{ maxWidth: 240, marginTop: 12 }}>
                <span className="field__label">Show day</span>
                <select value={dayFilter} onChange={(event) => setDayFilter(event.target.value)}>
                  <option value="all">All days</option>
                  {trip.itinerary.days.map((day) => <option value={String(day.dayNumber)} key={day.dayNumber}>Day {day.dayNumber}</option>)}
                </select>
              </label>
            )}
          </div>
        ) : (
          <p style={{ fontSize: 14, color: '#7f8c8d' }}>
            Interactive map of travel attractions
          </p>
        )}
        <div
          style={{
            width: '100%',
            height: '500px',
            borderRadius: 14,
            overflow: 'hidden',
            marginBottom: 32,
            border: '1px solid var(--line)',
          }}
          ref={mapContainerRef}
        >
          {/* Leaflet map will be initialized in ref callback */}
        </div>
        <div style={{ fontSize: 12, color: '#7f8c8d' }}>
          <a
            href="https://www.openstreetmap.org"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#7f8c8d', textDecoration: 'none' }}
          >
            Map tiles by OpenStreetMap
          </a>
        </div>
      </div>
    </main>
  );
}