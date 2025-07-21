import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Navbar.css";
import api from "../api";

function Navbar() {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [username, setUsername] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check authentication status and user profile
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await api.get("/api/check-session/");
                setIsAuthenticated(response.data.isAuthenticated);
                
                if (response.data.isAuthenticated) {
                    const profileResponse = await api.get("/api/user/profile/");
                    setUsername(profileResponse.data.username);
                }
            } catch (err) {
                console.error("Failed to fetch auth status", err);
                setIsAuthenticated(false);
            }
        };

        checkAuth();

        // Set up periodic session check
        const interval = setInterval(checkAuth, 5 * 60 * 1000); // Check every 5 minutes
        return () => clearInterval(interval);
    }, []);

    // Check for saved theme preference or system preference
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            setDarkMode(true);
        }
    }, []);

    // Apply theme class to body
    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const handleNavigate = (path) => {
        navigate(path);
        setIsMenuOpen(false);
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const toggleTheme = () => {
        setDarkMode(!darkMode);
    };

    const handleLogout = async () => {
        try {
            await api.post("/api/logout/");
            setIsAuthenticated(false);
            setUsername("");
            navigate("/login");
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    return (
        <>
            <div className="Navbar">
                <h1 id="Logo" onClick={() => handleNavigate("/")}>CareerPulse</h1>
                
                <div className="nav-links">
                    <a className="links-nav" onClick={() => handleNavigate("/resume")}>ResumeAnalyzer</a>
                    <a className="links-nav" onClick={() => handleNavigate("/news")}>News</a>
                    <a className="links-nav" onClick={() => handleNavigate("/chatbot")}>Chatbot</a>
                    <a className="links-nav" onClick={() => handleNavigate("/notes")}>Notes</a>
                </div>
                
                <button className="theme-toggle" onClick={toggleTheme}>
                    {darkMode ? (
                        <span>☀️ Light</span>
                    ) : (
                        <span>🌙 Dark</span>
                    )}
                </button>
                
                {/* Desktop Auth Buttons */}
                {!isAuthenticated && (
                    <div className="desktop-auth">
                        <button id="Login" onClick={() => handleNavigate("/login")}>Login</button>
                        <button id="Register" onClick={() => handleNavigate("/register")}>Register</button>
                    </div>
                )}
                
                {/* Desktop Profile and Logout */}
                {isAuthenticated && (
                    <div className="desktop-auth">
                        <button 
                            id="UserProfile" 
                            onClick={() => handleNavigate("/profile")}
                            className="profile-button"
                        >
                            {username[0]?.toUpperCase() || "U"}
                        </button>
                        <button id="Logout" onClick={handleLogout}>Logout</button>
                    </div>
                )}
                
                <div className="hamburger" onClick={toggleMenu}>
                    <div className={`line1 ${isMenuOpen ? "toggle" : ""}`}></div>
                    <div className={`line2 ${isMenuOpen ? "toggle" : ""}`}></div>
                    <div className={`line3 ${isMenuOpen ? "toggle" : ""}`}></div>
                </div>
            </div>
            
            {/* Mobile Menu */}
            <div className={`overlay ${isMenuOpen ? "active" : ""}`} onClick={toggleMenu}></div>
            
            <div className={`mobile-menu ${isMenuOpen ? "active" : ""}`}>
                <div className="mobile-links">
                    <a className="links-nav" onClick={() => handleNavigate("/resume")}>ResumeAnalyzer</a>
                    <a className="links-nav" onClick={() => handleNavigate("/news")}>News</a>
                    <a className="links-nav" onClick={() => handleNavigate("/chatbot")}>Chatbot</a>
                    <a className="links-nav" onClick={() => handleNavigate("/notes")}>Notes</a>
                </div>
                
                {isAuthenticated ? (
                    <div className="mobile-auth">
                        
                        <button id="mobile-logout" onClick={handleLogout}>Logout</button>
                    </div>
                ) : (
                    <div className="mobile-auth">
                        <button id="Login" onClick={() => handleNavigate("/login")}>Login</button>
                        <button id="Register" onClick={() => handleNavigate("/register")}>Register</button>
                    </div>
                )}
            </div>
        </>
    );
}

export default Navbar;