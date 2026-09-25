import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import './Landing.css';

const Arrow = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Mark = () => (
  <span className="home-mark" aria-hidden="true">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="5.5" width="17" height="15" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7.5 3.5v4m9-4v4M3.5 10h17m-12 5 2.2 2.2 4.8-4.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);

const Brand = () => <Link className="home-brand" to="/" aria-label="Bookly home"><Mark />Bookly<span className="brand-dot">.</span></Link>;

function DashboardPreview({ compact = false }) {
  return (
    <div className={`home-dashboard ${compact ? 'home-dashboard-compact' : ''}`} aria-label="Preview of the Bookly dashboard">
      <aside className="dash-sidebar">
        <div className="dash-logo"><Mark /><span>Bookly</span></div>
        <div className="dash-side-active">▦ <span>Overview</span></div>
        <div>▣ <span>Calendar</span></div>
        <div>♧ <span>Clients</span></div>
        <div>▤ <span>Services</span></div>
        <div>◫ <span>Reports</span></div>
        <div className="dash-side-bottom">◎ <span>Settings</span></div>
      </aside>
      <div className="dash-main">
        <div className="dash-top"><span>Overview <span className="dash-chevron">⌄</span></span><span className="dash-avatar">A</span></div>
        <div className="dash-heading">
          <div><small>GOOD MORNING, ALEX</small><strong>Here’s your business at a glance.</strong></div>
          <span className="dash-date">This month ⌄</span>
        </div>
        <div className="dash-stats">
          <div className="dash-stat lilac"><span>Appointments</span><strong>312</strong><small>↗ 12.8% this month</small></div>
          <div className="dash-stat sand"><span>Revenue</span><strong>$18,923</strong><small>↗ 8.2% this month</small></div>
          <div className="dash-stat mint"><span>New clients</span><strong>84</strong><small>↗ 24.6% this month</small></div>
        </div>
        <div className="dash-bottom">
          <div className="dash-graph">
            <div className="dash-panel-head"><strong>Booking activity</strong><span>Last 7 days ⌄</span></div>
            <div className="dash-grid">
              <svg viewBox="0 0 370 115" preserveAspectRatio="none" aria-hidden="true">
                <defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#96ddd2" stopOpacity=".35"/><stop offset="1" stopColor="#96ddd2" stopOpacity="0"/></linearGradient></defs>
                <path d="M0 85 C25 76 30 48 50 55 S80 85 104 58 S129 21 149 39 S177 90 196 64 S217 71 235 42 S260 52 278 30 S303 60 326 37 S348 50 370 18 L370 115 L0 115Z" fill="url(#chartFill)" />
                <path d="M0 85 C25 76 30 48 50 55 S80 85 104 58 S129 21 149 39 S177 90 196 64 S217 71 235 42 S260 52 278 30 S303 60 326 37 S348 50 370 18" fill="none" stroke="#148a79" strokeWidth="2.7" strokeLinecap="round" />
              </svg>
            </div>
            <div className="dash-chart-labels"><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div>
          </div>
          <div className="dash-next">
            <div className="dash-panel-head"><strong>Up next</strong><span>Today</span></div>
            <div className="dash-appointment"><span className="dash-time">09:30</span><span><b>Haircut & style</b><small>Olivia M. · 60 min</small></span><i /></div>
            <div className="dash-appointment"><span className="dash-time">11:00</span><span><b>Full color</b><small>Jordan K. · 120 min</small></span><i /></div>
            <div className="dash-appointment"><span className="dash-time">14:15</span><span><b>Consultation</b><small>Taylor R. · 30 min</small></span><i /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

const featureList = [
  ['01', 'Online booking, around the clock', 'Give clients a simple way to book while you focus on the work in front of you.'],
  ['02', 'A calendar that keeps up', 'Manage appointments, availability, and your team’s time in one clear view.'],
  ['03', 'Clients, all in one place', 'Keep the details that matter close, from visit history to preferences.'],
  ['04', 'Payments without the scramble', 'Handle deposits and checkout with the tools already in your workflow.'],
];

const tiers = [
  { name: 'Starter', label: 'For the independent professional', features: ['Online booking page', 'Appointment calendar', 'Client profiles', 'Service menu'] },
  { name: 'Growth', label: 'For teams finding their rhythm', features: ['Everything in Starter', 'Team schedules', 'Waitlist management', 'Reports and insights'], featured: true },
  { name: 'Studio', label: 'For businesses doing more', features: ['Everything in Growth', 'Multiple locations', 'Pricing rules', 'Client engagement tools'] },
];

const faqs = [
  ['Can clients book online?', 'Yes. Each business can share a booking page where clients can browse services and request a time.'],
  ['Can I manage my team’s schedules?', 'Yes. Keep staff availability, shifts, time off, and appointments together in Bookly.'],
  ['Does Bookly help with payments?', 'Bookly includes checkout and deposit flows. Online card payments require a connected payment provider.'],
  ['Can I keep track of my clients?', 'Yes. Client profiles help you organize contact details, notes, and visit history.'],
  ['Can I start without a demo account?', 'Absolutely. Create your own account and set up your business in a few steps.'],
  ['How do I get started?', 'Choose “Get started” to create an account, then follow the setup flow for your business.'],
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoAvailable, setDemoAvailable] = useState(false);

  useEffect(() => {
    api.get('/auth/demo-status')
      .then(({ available }) => setDemoAvailable(Boolean(available)))
      .catch(() => setDemoAvailable(false));
  }, []);

  return (
    <div className="home">
      <header className="home-header">
        <div className="home-container nav-inner">
          <Brand />
          <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>
          <nav className={`home-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#plans" onClick={() => setMenuOpen(false)}>Plans</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
            <Link to="/login" className="nav-login">Log in</Link>
            <Link to="/signup" className="home-button home-button-dark nav-cta">Get started <Arrow /></Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="home-hero">
          <div className="hero-glow hero-glow-one" /><div className="hero-glow hero-glow-two" />
          <div className="home-container hero-inner">
            <div className="hero-copy">
              <span className="eyebrow hero-eyebrow"><span className="eyebrow-spark">✦</span> THE SMARTER WAY TO RUN YOUR DAY</span>
              <h1>Bookings in.<br />Business <em>moving.</em></h1>
              <p>Less time juggling appointments. More time doing what you love. Bookly brings your bookings, team, clients, and payments into one beautifully simple place.</p>
              <div className="hero-actions">
                <Link to="/signup" className="home-button home-button-dark">Get started <Arrow /></Link>
                <a className="home-text-link" href="#how-it-works">See how it works <Arrow /></a>
              </div>
              <div className="hero-proof"><span className="hero-proof-icon">✓</span> Built for service businesses of every size</div>
            </div>
            <div className="hero-visual">
              <span className="hero-visual-orbit orbit-a" /><span className="hero-visual-orbit orbit-b" />
              <DashboardPreview />
              <div className="floating-booking"><span className="floating-check">✓</span><span><strong>Booking confirmed</strong><small>Today at 2:30 PM</small></span></div>
              <div className="floating-tag">A better day starts here ✳</div>
            </div>
          </div>
        </section>

        <section className="home-intro home-container" id="how-it-works">
          <div className="intro-art">
            <div className="intro-art-sun" />
            <div className="intro-window window-one" /><div className="intro-window window-two" /><div className="intro-window window-three" />
            <div className="intro-art-card"><span>YOUR DAY, SIMPLIFIED</span><strong>More of what you love.<br />Less of the admin.</strong></div>
          </div>
          <div className="intro-copy">
            <span className="eyebrow">BUILT FOR THE PEOPLE BEHIND THE BUSINESS</span>
            <h2>Good days are<br />good for business.</h2>
            <p>From your first booking to your busiest Friday, Bookly helps keep the moving parts moving. Everything feels easier when it’s all in one place.</p>
            <Link to="/signup" className="home-button home-button-dark">Get started <Arrow /></Link>
            <div className="intro-points">
              <div><strong>01</strong><span>One place for your day</span></div>
              <div><strong>02</strong><span>More room to grow</span></div>
              <div><strong>03</strong><span>Time back for you</span></div>
            </div>
          </div>
        </section>

        <section className="home-problems" id="features">
          <div className="home-container">
            <div className="section-heading centered">
              <span className="eyebrow">YOU'VE GOT ENOUGH ON YOUR PLATE</span>
              <h2>Running a business shouldn’t<br /><em>feel chaotic.</em></h2>
              <p>Bookly makes the everyday things a whole lot easier.</p>
            </div>
            <div className="comparison">
              <div className="comparison-before">
                <span className="comparison-label">THE OLD WAY</span>
                <h3>Too many tabs.<br />Not enough time.</h3>
                <ul><li>Bookings scattered everywhere</li><li>Last-minute schedule surprises</li><li>Client details hard to find</li><li>Payment follow-ups piling up</li></ul>
              </div>
              <div className="comparison-arrow" aria-hidden="true">→</div>
              <div className="comparison-after">
                <span className="comparison-label"><Mark /> THE BOOKLY WAY</span>
                <h3>One calmer way<br />to work.</h3>
                <ul><li>One clear booking calendar</li><li>Team schedules in sync</li><li>Client information on hand</li><li>Checkout in your workflow</li></ul>
              </div>
            </div>
          </div>
        </section>

        <section className="home-feature-band">
          <div className="home-container">
            <div className="feature-band-top">
              <div><span className="eyebrow">EVERYTHING WORKS BETTER TOGETHER</span><h2>All the essentials.<br /><em>None of the noise.</em></h2></div>
              <Link to="/signup" className="home-button home-button-light">Make your day easier <Arrow /></Link>
            </div>
            <div className="feature-grid">
              {featureList.map(([number, title, description]) => (
                <div className="feature-item" key={number}>
                  <span className="feature-number">{number} / 04</span>
                  <span className="feature-symbol" aria-hidden="true">{number === '01' ? '▦' : number === '02' ? '◷' : number === '03' ? '♡' : '↗'}</span>
                  <h3>{title}</h3><p>{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="home-product home-container">
          <div className="section-heading centered">
            <span className="eyebrow">A CLOSER LOOK</span>
            <h2>See Bookly in action.</h2>
            <p>A clear view of your business, wherever the day takes you.</p>
          </div>
          <div className="product-frame"><div className="product-frame-bar"><span /><span /><span /><small>bookly / overview</small></div><DashboardPreview compact /></div>
        </section>

        <section className="home-plans" id="plans">
          <div className="home-container">
            <div className="section-heading centered">
              <span className="eyebrow">MADE TO FIT YOUR BUSINESS</span>
              <h2>Room to start. <em>Room to grow.</em></h2>
              <p>Explore the tools that meet you where you are today.</p>
            </div>
            <div className="plan-grid">
              {tiers.map(tier => (
                <article className={`plan-card ${tier.featured ? 'plan-featured' : ''}`} key={tier.name}>
                  {tier.featured && <span className="plan-popular">POPULAR PICK</span>}
                  <div className="plan-top"><h3>{tier.name}</h3><p>{tier.label}</p></div>
                  <div className="plan-rule" />
                  <span className="plan-includes">HIGHLIGHTS</span>
                  <ul>{tier.features.map(item => <li key={item}><span>✓</span>{item}</li>)}</ul>
                  <Link to="/signup" className={`home-button ${tier.featured ? 'home-button-light' : 'home-button-dark'}`}>Get started <Arrow /></Link>
                </article>
              ))}
            </div>
            <p className="plan-note">Looking for the right fit? Start with an account and explore what Bookly can do.</p>
          </div>
        </section>

        <section className="home-faq home-container" id="faq">
          <div className="section-heading centered"><span className="eyebrow">A FEW GOOD QUESTIONS</span><h2>Frequently asked questions.</h2><p>Everything you need to know to get started.</p></div>
          <div className="faq-grid">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div>
        </section>

        <section className="home-final">
          <div className="home-container final-inner">
            <span className="eyebrow">LET'S MAKE MORE ROOM FOR THE GOOD STUFF</span>
            <h2>Run your day.<br /><em>Love your work.</em></h2>
            <p>Bookly helps your business run smoothly, so you can get back to why you started.</p>
            <Link to="/signup" className="home-button home-button-light">Get started with Bookly <Arrow /></Link>
            {demoAvailable && <span className="demo-available">A sample business is available in this environment.</span>}
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="home-container footer-inner">
          <div><Brand /><p>A simpler way to run your service business.</p></div>
          <nav aria-label="Footer navigation"><a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#plans">Plans</a><Link to="/login">Log in</Link></nav>
        </div>
        <div className="home-container footer-bottom"><span>© {new Date().getFullYear()} Bookly. All rights reserved.</span><span>Made for the people who make it happen.</span></div>
      </footer>
    </div>
  );
}