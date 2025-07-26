// src/pages/Login.jsx
import Form from "../components/Form";
import { Link } from "react-router-dom";
import "../styles/Login.css";

export default function Login() {
  return (
    <div className="auth-container">
      {/* Left: Login Form */}
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Welcome Back</h1>
            <p>Sign in to unlock AI-powered job matching</p>
          </div>
          <Form route="api/token/" method="login" />
          <div className="auth-footer">
            <p>
              Don’t have an account? <Link to="/register" className="link">Register</Link>
            </p>
            <p>
              <Link to="/forgot-password" className="link">Forgot password?</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right: Visual */}
      <div className="auth-visual-side">
        <div className="blob"></div>
        <div className="blob blob-2"></div>
        <div className="visual-content">
          <img src="/images/undraw_sign_in.svg" alt="Sign In" />
        </div>
      </div>
    </div>
  );
}