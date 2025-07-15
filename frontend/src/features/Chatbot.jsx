import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import '../styles/Chatbot.css';
import Navbar from '../components/Navbar';

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        const userMessage = { role: 'user', content: inputMessage };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setInputMessage('');

        try {
            const response = await api.post('/api/chat/', {
                prompt: inputMessage
            });

            if (response.data.success) {
                const assistantMessage = {
                    role: 'assistant',
                    content: response.data.response
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else {
                throw new Error(response.data.error || 'Failed to get response');
            }
        } catch (error) {
            console.error('Error:', error);
            const errorMessage = {
                role: 'assistant',
                content: error.response?.data?.error || 
                       'Sorry, I encountered an error. Please try again.'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([]);
    };

    return (
        <div className={`chatbot-container `}>
            <Navbar/>
            <div className="chatbot-card">
                {/* Header */}
                <div className="chatbot-header">
                    <div className="header-content">
                        <h2 className="chatbot-title">
                            <span className="chatbot-icon">✨</span> Career AI Assistant
                        </h2>
                        <p className="chatbot-subtitle">
                            Expert resume, cover letter, and interview advice
                        </p>
                    </div>
                    {messages.length > 0 && (
                        <button
                            onClick={clearChat}
                            className="clear-chat-btn"
                            aria-label="Clear conversation"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            Clear Chat
                        </button>
                    )}
                </div>

                {/* Messages Container */}
                <div className="chatbot-messages">
                    {messages.length === 0 ? (
                        <div className="empty-chat">
                            <div className="welcome-card">
                                <h3>Welcome to your AI Career Assistant!</h3>
                                <p>Here are some things you can ask:</p>
                                <ul className="suggestion-list">
                                    <li>"How should I structure my resume for a software engineering role?"</li>
                                    <li>"What skills should I highlight for a marketing position?"</li>
                                    <li>"Help me write a cover letter for a project manager job"</li>
                                    <li>"Give me feedback on this resume section: [paste content]"</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="messages-list">
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`message-bubble ${message.role}-message`}
                                >
                                    <div className="message-avatar">
                                        {message.role === 'user' ? (
                                            <span className="user-avatar">👤</span>
                                        ) : (
                                            <span className="assistant-avatar">🤖</span>
                                        )}
                                    </div>
                                    <div className="message-content">
                                        {message.content.split('\n').map((paragraph, i) => (
                                            <p key={i}>{paragraph}</p>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="message-bubble assistant-message loading">
                                    <div className="message-avatar">
                                        <span className="assistant-avatar">🤖</span>
                                    </div>
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="chatbot-input-area">
                    <form onSubmit={handleSubmit} className="input-form">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="Ask anything about resumes, jobs, or career advice..."
                            className="chatbot-input"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !inputMessage.trim()}
                            className="send-btn"
                            aria-label="Send message"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;