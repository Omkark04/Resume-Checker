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
            <h1 className="fade-in-down">Welcome Back</h1>
            <p className="fade-in-down delay-1">Sign in to unlock AI-powered job matching</p>
          </div>
          
          <div className="form-wrapper fade-in-up delay-2">
            <Form route="api/token/" method="login" />
          </div>
          
          <div className="auth-footer fade-in delay-3">
            <p>
              Don't have an account? <Link to="/register" className="link">Register</Link>
            </p>
            <p>
              <Link to="/forgot-password" className="link">Forgot password?</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right: Visual */}
      <div className="auth-visual-side">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        
        <div className="visual-content fade-in-right">
          <div className="floating-animation">
            <img 
              src="/images/undraw_sign_in.svg" 
              alt="Sign In" 
              className="illustration"
            />
          </div>
          <div className="visual-text">
            <h2>Smart Career Matching</h2>
            <p>AI-powered recommendations just for you</p>
          </div>
        </div>
      </div>
    </div>
  );
}