import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/global.css';

const steps = [
  { number: '01', title: 'Tell us how you travel', copy: 'Choose your destination, dates, interests, pace, and budget. Tripora keeps every preference in one calm, simple flow.' },
  { number: '02', title: 'Receive a considered plan', copy: 'Our itinerary engine turns your preferences into realistic day plans with travel time, meal breaks, opening hours, and cost estimates.' },
  { number: '03', title: 'Make it yours', copy: 'Move, remove, or replan activities, explore your route on a map, and save or share the finished journey.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const reveal = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          reveal.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16 });
    document.querySelectorAll('.scroll-reveal').forEach((element) => reveal.observe(element));
    return () => reveal.disconnect();
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="landing">
      <section className="hero landing__hero" id="home">
        <video className="hero__video" autoPlay loop muted playsInline aria-hidden="true">
          <source src="https://designerstephen.github.io/public-assets/videos/serene-art-hero.mp4" type="video/mp4" />
        </video>
        <div className="hero__overlay" />
        <div className="hero__content">
          <nav className="hero__nav" aria-label="Primary navigation">
            <a className="hero__logo" href="#home" onClick={closeMenu}>Tripora<sup>®</sup></a>
            <div className={`hero__links ${menuOpen ? 'hero__links--open' : ''}`} id="mobile-navigation">
              <a href="#home" onClick={closeMenu}>Home</a>
              <a href="#journey" onClick={closeMenu}>How it works</a>
              <a href="#features" onClick={closeMenu}>Features</a>
              <a href="#about" onClick={closeMenu}>About</a>
            </div>
            <div className="hero__actions">
              <button className="hero__menu" type="button" aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen((open) => !open)}>
                <span className="sr-only">Toggle navigation</span>{menuOpen ? 'Close' : 'Menu'}
              </button>
            </div>
          </nav>
          <div className="hero__copy">
            <p className="eyebrow hero__eyebrow fade-rise delay-0">Your next story starts here</p>
            <h1 className="h-display fade-rise delay-0">Plan Better,<br />Travel Deeper.</h1>
            <p className="hero__description fade-rise delay-200">Your personal AI travel planner. Create custom itineraries, discover amazing places, manage your budget, and explore the world — your way.</p>
            <button className="btn btn--pill fade-rise delay-400" onClick={() => navigate('/plan')}>Plan my journey <span aria-hidden="true">→</span></button>
          </div>
          <a className="hero__scroll" href="#intro"><span>Scroll to explore</span><span aria-hidden="true">↓</span></a>
        </div>
      </section>

      <section className="landing-section landing-section--intro" id="intro">
        <div className="container landing-intro">
          <div className="scroll-reveal">
            <p className="eyebrow">Travel, thoughtfully arranged</p>
            <h2 className="h-section">Less time planning.<br /><em>More time being there.</em></h2>
          </div>
          <div className="landing-intro__copy scroll-reveal">
            <p>Tripora brings the details together so your trip feels spacious before it even begins. From the first idea to the last saved map, every choice is shaped around the way you want to travel.</p>
            <a className="text-link" href="#journey">See how it works <span aria-hidden="true">↘</span></a>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--dark" id="journey">
        <div className="container">
          <div className="scroll-reveal">
            <p className="eyebrow landing-eyebrow">A simpler way to go</p>
            <h2 className="h-section">From dream<br />to departure.</h2>
          </div>
          <div className="landing-steps">
            {steps.map((step) => (
              <article className="landing-step scroll-reveal" key={step.number}>
                <span className="landing-step__number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section" id="features">
        <div className="container">
          <div className="landing-feature-grid">
            <div className="scroll-reveal">
              <p className="eyebrow">Designed for the whole journey</p>
              <h2 className="h-section">A beautiful plan<br /><em>you can actually use.</em></h2>
              <p className="landing-feature-grid__lead">Not just a list of places. A practical, editable companion for the days you are actually going to live.</p>
            </div>
            <div className="landing-feature-list">
              {[
                ['01', 'Day-wise itineraries', 'Realistic schedules with activity duration, travel time, meals, and opening-hour awareness.'],
                ['02', 'Budget clarity', 'Estimated accommodation, food, transport, and attraction costs in one view.'],
                ['03', 'Your route, in view', 'See planned stops on an OpenStreetMap-powered interactive map.'],
                ['04', 'Plans that flex', 'Remove, move, retime, or replan activities without starting over.'],
              ].map(([number, title, copy]) => (
                <article className="landing-feature scroll-reveal" key={number}>
                  <span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--cta" id="about">
        <div className="container landing-cta scroll-reveal">
          <p className="eyebrow">Your way, from here</p>
          <h2 className="h-section">The world is waiting.<br /><em>Let’s make a plan.</em></h2>
          <p>Start as a guest. Save your itinerary when it feels right.</p>
          <button className="btn btn--pill" onClick={() => navigate('/plan')}>Plan my journey <span aria-hidden="true">→</span></button>
          <div className="landing-cta__links">
            <Link to="/trips">Open my trips</Link><Link to="/auth">Create an account</Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container row row--between wrap">
          <span className="hero__logo">Tripora<sup>®</sup></span>
          <span>Plan better, travel deeper.</span>
          <a href="#home">Back to top ↑</a>
        </div>
      </footer>
    </main>
  );
}
