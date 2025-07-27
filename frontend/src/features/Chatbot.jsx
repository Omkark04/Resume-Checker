// src/pages/Chatbot.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import '../styles/AdvancedChatbot.css';
import Navbar from '../components/Navbar';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typedMessages, setTypedMessages] = useState({});
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Load chat history from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatHistory');
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error('Failed to parse chat history:', e);
      }
    }
  }, []);

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [inputMessage]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing effect for assistant messages
  useEffect(() => {
    const newTyped = { ...typedMessages };
    const timers = [];
    
    messages.forEach((msg, index) => {
      if (msg.role === 'assistant' && !newTyped[index]) {
        let i = 0;
        const text = msg.content;
        newTyped[index] = '';
        
        const timer = setTimeout(() => {
          const type = () => {
            if (i < text.length) {
              newTyped[index] = text.substring(0, i + 1);
              setTypedMessages(prev => ({ ...prev, [index]: newTyped[index] }));
              i++;
              setTimeout(type, 15 + Math.random() * 25);
            }
          };
          type();
        }, index * 100);
        
        timers.push(timer);
      }
    });
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

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
        content: error.response?.data?.error || 'Sorry, I encountered an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setTypedMessages({});
    localStorage.removeItem('chatHistory');
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chatbot-container">
      <Navbar />

      <div className="chatbot-card">
        {/* Header */}
        <div className="chatbot-header">
          <div className="header-content">
            <h2 className="chatbot-title">
              <span className="chatbot-icon">🤖</span> Career AI Assistant
            </h2>
            <p className="chatbot-subtitle">
              Expert resume, cover letter, and interview advice — powered by intelligent matching
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="clear-chat-btn"
              aria-label="Clear conversation"
            >
              🗑️ Clear Chat
            </button>
          )}
        </div>

        {/* Messages Container */}
        <div className="chatbot-messages">
          {messages.length === 0 ? (
            <div className="empty-chat animate-fade-in">
              <div className="welcome-card">
                <h3>Welcome to your AI Career Assistant!</h3>
                <p>Here are some things you can ask:</p>
                <ul className="suggestion-list">
                  {[
                    "How should I structure my resume for a software engineering role?",
                    "What skills should I highlight for a marketing position?",
                    "Help me write a cover letter for a project manager job",
                    "Give me feedback on this resume section: [paste content]"
                  ].map((suggestion, idx) => (
                    <li 
                      key={idx} 
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="suggestion-item"
                    >
                      {suggestion}
                    </li>
                  ))}
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
                    {message.role === 'assistant' ? (
                      <p>{typedMessages[index] || '...'}</p>
                    ) : (
                      <p>{message.content}</p>
                    )}
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
            <div className="input-container">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about resumes, jobs, or career advice..."
                className="chatbot-input"
                disabled={isLoading}
                rows="1"
                aria-label="Type your message here"
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="send-btn"
                aria-label="Send message"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;