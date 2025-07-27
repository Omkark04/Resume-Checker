// src/pages/News.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import '../styles/ModernNews.css'; // Updated CSS file

const News = () => {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/api/news/categories/');
        setCategories(response.data.categories || []);
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    };

    fetchCategories();
    fetchNews();
  }, []);

  // Refetch news when category changes
  useEffect(() => {
    if (selectedCategory === 'all') {
      fetchNews();
    } else {
      fetchCategoryNews(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchNews = async () => {
    await fetchNewsData('/api/news/');
  };

  const fetchCategoryNews = async (category) => {
    await fetchNewsData(`/api/news/category/${category}/`);
  };

  const fetchNewsData = async (url) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(url);
      if (response.data.success) {
        setArticles(response.data.articles || []);
      } else {
        setError('Failed to load news');
      }
    } catch (err) {
      setError('Failed to fetch news. Please try again.');
      console.error('News fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const refreshNews = () => {
    if (selectedCategory === 'all') {
      fetchNews();
    } else {
      fetchCategoryNews(selectedCategory);
    }
  };

  return (
    <div className="news-dashboard">
      <Navbar />

      <div className="news-content">
        {/* Header */}
        <div className="news-header">
          <div className="header-text">
            <h1 className="headline animate-fade-in">
              <span className="pulse-glow">📰</span> CareerPulse
            </h1>
            <h2 className="subheadline animate-fade-in-delay">Latest Career & Tech Insights</h2>
            <p className="description animate-fade-in-delay">
              Stay ahead with AI-curated job market trends, tech breakthroughs, and hiring insights.
            </p>
          </div>

          <button
            onClick={refreshNews}
            disabled={isLoading}
            className="refresh-btn modern-button"
          >
            {isLoading ? (
              <>
                <span className="spinner-ring"></span>
                <span>Loading...</span>
              </>
            ) : (
              '🔄 Refresh Feed'
            )}
          </button>
        </div>

        {/* Category Tabs */}
        <div className="category-tabs modern-tabs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`tab-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          >
            🌐 All News
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`tab-btn ${selectedCategory === cat.id ? 'active' : ''}`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="error-message modern-alert">
            <p>⚠️ {error}</p>
            <button onClick={refreshNews} className="modern-button">Retry</button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="loading-container modern-grid">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className="skeleton-card modern-card"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="skeleton-image shimmer"></div>
                <div className="skeleton-body">
                  <div className="skeleton-header">
                    <div className="skeleton-source shimmer"></div>
                    <div className="skeleton-date shimmer"></div>
                  </div>
                  <div className="skeleton-title shimmer"></div>
                  <div className="skeleton-desc shimmer"></div>
                  <div className="skeleton-link shimmer"></div>
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="empty-state modern-card">
            <div className="empty-icon">📰</div>
            <h3>No Articles Found</h3>
            <p>Try selecting a different category or check back later</p>
            <button onClick={refreshNews} className="modern-button">🔄 Refresh</button>
          </div>
        ) : (
          <div className="news-grid modern-grid">
            {articles.map((article, index) => (
              <div
                key={index}
                className="news-card modern-card animate-slide-up"
                style={{ transitionDelay: `${index * 0.05}s` }}
              >
                {/* Image */}
                {article.urlToImage && (
                  <div className="card-image-container">
                    <img
                      src={article.urlToImage}
                      alt={article.title}
                      className="card-image"
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.style.display = 'none';
                      }}
                    />
                    <div className="image-overlay">
                      <span className="source-badge">{article.source?.name || 'Unknown'}</span>
                    </div>
                  </div>
                )}

                {/* Body */}
                <div className="card-body">
                  <div className="card-meta">
                    <span className="date">{formatDate(article.publishedAt)}</span>
                    <span className="read-time">5 min read</span>
                  </div>
                  <h3 className="card-title">{article.title || 'No title'}</h3>
                  <p className="card-desc">{article.description || 'No description available.'}</p>
                  <div className="card-actions">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="read-more modern-button"
                    >
                      Read Full Article
                    </a>
                    <button className="bookmark-btn">🔖</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default News;