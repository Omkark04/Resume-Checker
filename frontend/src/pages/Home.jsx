// src/pages/Home.jsx or src/components/Home.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from "../components/Navbar";
import '../styles/Home.css';

const Home = () => {
  const [showScroll, setShowScroll] = useState(false);

  // Show scroll-to-top button after scrolling 400px
  useEffect(() => {
    const checkScrollTop = () => {
      if (!showScroll && window.scrollY > 400) {
        setShowScroll(true);
      } else if (showScroll && window.scrollY <= 400) {
        setShowScroll(false);
      }
    };

    window.addEventListener('scroll', checkScrollTop);
    return () => window.removeEventListener('scroll', checkScrollTop);
  }, [showScroll]);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="home-container">
      <Navbar />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="highlight">CareerPulse</span>
          </h1>
          <h2 className="hero-subtitle">
            Find Your Dream Job Faster With Intelligent Matching
          </h2>
          <p className="hero-description">
            CareerPulse analyzes your resume and skills to connect you with the most relevant job opportunities, saving you hours of searching.
          </p>
          <div className="hero-buttons">
            <Link to="/resume" className="btn-primary" >
              📄 Upload Your Resume
            </Link>
            <button className="btn-secondary">
              ▶️ Watch Demo
            </button>
          </div>
          <div className="stats">
            <div><span>10K+</span> Jobs Matched</div>
            <div><span>95%</span> Success Rate</div>
            <div><span>4.9</span> User Rating ⭐</div>
          </div>
        </div>
        <div className="hero-image">
          <img src="/images/hero-illustration.svg" alt="Career Dashboard" />
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="why-choose-us">
        <h2 className="section-title">Why Choose Us</h2>
        <p className="section-subtitle">Smart Features That Get You Hired</p>

        <div className="features-grid">
          {[
            { title: "AI-Powered Matching", desc: "Our intelligent algorithm analyzes thousands of jobs to find the perfect matches for your skills and experience." },
            { title: "Resume Scoring", desc: "Get an instant rating of your resume's strength with detailed feedback on how to improve it." },
            { title: "Smart Filters", desc: "Automatically filters jobs by experience level, job type, location, and salary range to save you time." },
            { title: "Match Probability", desc: "See your chances of getting each job with our proprietary scoring system based on employer requirements." },
            { title: "Improvement Tips", desc: "Personalized suggestions to enhance your skills and make your profile more attractive to employers." },
            { title: "Download Analysis", desc: "Save your resume analysis and improvement suggestions for future reference and tracking." }
          ].map((feature, index) => (
            <div className="feature-card" key={index}>
              <div className="feature-icon">✨</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2 className="section-title">How CareerPulse Works</h2>
        <p className="section-subtitle">Just a few simple steps to find your perfect job match with our intelligent platform.</p>

        <div className="steps-grid">
          {[
            { step: "1", title: "Select Your Career Stage", desc: "Tell us whether you're a student or experienced professional to get customized recommendations tailored to your level." },
            { step: "2", title: "Upload Your Resume", desc: "Our system will analyze your skills, experience, and education to understand your qualifications and preferences." },
            { step: "3", title: "Get Instant Matches", desc: "We'll show you the best matching jobs and internships based on your profile, ranked by relevance." },
            { step: "4", title: "See Your Chances & Improve", desc: "Get a probability score for each job and receive personalized suggestions to improve your chances." }
          ].map((item, index) => (
            <div className="step-card" key={index}>
              <div className="step-number">{item.step}</div>
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>CareerPulse</h4>
            <p>
              AI-powered job matching platform that connects talent with the right opportunities using intelligent algorithms.
            </p>
          </div>
          <div className="footer-section">
            <h4>Platform</h4>
            <ul>
              <li>Features</li>
              <li>How It Works</li>
              <li>Pricing</li>
              <li>Testimonials</li>
              <li>Demo</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Resources</h4>
            <ul>
              <li>Blog</li>
              <li>Career Tips</li>
              <li>Resume Guide</li>
              <li>Interview Prep</li>
              <li>Help Center</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Company</h4>
            <ul>
              <li>About Us</li>
              <li>Careers</li>
              <li>Press</li>
              <li>Partners</li>
              <li>Contact</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 CareerPulse. All rights reserved. | <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a></p>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <div className={`scroll-to-top ${showScroll ? 'show' : ''}`} onClick={scrollToTop}>
        <button aria-label="Scroll to top">
          ↑
        </button>
      </div>
    </div>
  );
};

export default Home;
