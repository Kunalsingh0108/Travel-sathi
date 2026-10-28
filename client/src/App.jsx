import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Plan from './pages/Plan.jsx';
import Itinerary from './pages/Itinerary.jsx';
import Trips from './pages/Trips.jsx';
import About from './pages/About.jsx';
import Admin from './pages/Admin.jsx';
import Map from './pages/Map.jsx';
import Auth from './pages/Auth.jsx';

export default function App() {
  const location = useLocation();
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Landing />} />
      <Route path="/plan" element={<Plan />} />
      <Route path="/itinerary/:id" element={<Itinerary />} />
      <Route path="/trips" element={<Trips />} />
      <Route path="/about" element={<About />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/map" element={<Map />} />
      <Route path="/map/:id" element={<Map />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
