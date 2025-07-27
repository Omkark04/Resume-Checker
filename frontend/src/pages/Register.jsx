// src/pages/Register.jsx
import Form from "../components/Form";
import { Link } from "react-router-dom";
import "../styles/Register.css";

export default function Register() {
  return (
    <div className="auth-container">
      {/* Left: Register Form */}
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Join CareerPulse and start your career journey</p>
          </div>
          
          <Form route="api/register-data/" method="register" />
          
          <div className="auth-footer">
            <p className="auth-switch">
              Already have an account? <Link to="/login" className="auth-link">Login</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right: Visual */}
      <div className="auth-visual-side">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        
        <div className="visual-content">
          <div className="visual-wrapper">
            <img 
              src="/images/undraw_sign_up.svg" 
              alt="Join Us" 
              className="visual-image"
            />
          </div>
          
          <div className="visual-text">
            <h2 className="visual-heading">Your Career Journey Starts Here</h2>
            <p className="visual-subheading">Connect with opportunities that matter</p>
          </div>
        </div>
      </div>
    </div>
  );
}