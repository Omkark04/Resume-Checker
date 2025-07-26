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
            <h1>Create Account</h1>
            <p>Join CareerPulse and start your career journey</p>
          </div>
          <Form route="api/register-data/" method="register" />
          <div className="auth-footer">
            <p>
              Already have an account? <Link to="/login" className="link">Login</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right: Visual */}
      <div className="auth-visual-side">
        <div className="blob"></div>
        <div className="blob blob-2"></div>
        <div className="visual-content">
          <img src="/images/undraw_sign_up.svg" alt="Join Us" />
        </div>
      </div>
    </div>
  );
}