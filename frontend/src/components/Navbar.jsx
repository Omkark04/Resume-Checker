import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar() {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

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

    return (
        <>
            <div className="Navbar">
                <h1 id="Logo">CareerPulse</h1>
                
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
                
                <div className="Auth">
                    <button id="Login" onClick={() => handleNavigate("/login")}>Login</button>
                    <button id="Register" onClick={() => handleNavigate("/register")}>Register</button>
                </div>
                
                <div className="hamburger" onClick={toggleMenu}>
                    <div className={`line1 ${isMenuOpen ? "toggle" : ""}`}></div>
                    <div className={`line2 ${isMenuOpen ? "toggle" : ""}`}></div>
                    <div className={`line3 ${isMenuOpen ? "toggle" : ""}`}></div>
                </div>
                
                <button id="UserProfile"></button>
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
                
                <div className="Auth">
                    <button id="Login" onClick={() => handleNavigate("/login")}>Login</button>
                    <button id="Register" onClick={() => handleNavigate("/register")}>Register</button>
                </div>
            </div>
        </>
    );
}

export default Navbar;