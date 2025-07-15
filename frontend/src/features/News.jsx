import React, { useState, useEffect } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import '../styles/News.css';

const News = () => {
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCategories();
        fetchNews();
    }, []);

    useEffect(() => {
        if (selectedCategory !== 'all') {
            fetchCategoryNews(selectedCategory);
        } else {
            fetchNews();
        }
    }, [selectedCategory]);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/api/news/categories/');
            setCategories(response.data.categories || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchNews = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('/api/news/');
            if (response.data.success) {
                setArticles(response.data.articles || []);
            } else {
                setError('Failed to fetch news');
            }
        } catch (error) {
            console.error('Error fetching news:', error);
            setError('Failed to fetch news. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCategoryNews = async (category) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get(`/api/news/category/${category}/`);
            if (response.data.success) {
                setArticles(response.data.articles || []);
            } else {
                setError('Failed to fetch category news');
            }
        } catch (error) {
            console.error('Error fetching category news:', error);
            setError('Failed to fetch news. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid date';
        }
    };

    const refreshNews = () => {
        if (selectedCategory !== 'all') {
            fetchCategoryNews(selectedCategory);
        } else {
            fetchNews();
        }
    };

    return (
        <div className={`news-dashboard `}>
            <Navbar />
            <div className="news-content">
                <div className="news-header">
                    <div className="header-text">
                        <h1>CareerPulse</h1>
                        <h2>Latest Technical & Job-Oriented News</h2>
                        <p>Stay updated with the latest technology and career-related news from around the world.</p>
                    </div>
                    <button
                        onClick={refreshNews}
                        disabled={isLoading}
                        className={`refresh-btn ${isLoading ? 'loading' : ''}`}
                    >
                        {isLoading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>

                <div className="category-tabs">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`tab-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                    >
                        All News
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`tab-btn ${selectedCategory === category.id ? 'active' : ''}`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                    </div>
                ) : articles.length === 0 ? (
                    <div className="empty-state">
                        <p>No news articles available at the moment.</p>
                        <button onClick={refreshNews} className="retry-button">
                            Try Again
                        </button>
                    </div>
                ) : (
                    <div className="news-grid">
                        {articles.map((article, index) => (
                            <div key={index} className="news-card">
                                {article.urlToImage && (
                                    <div className="card-image-container">
                                        <img
                                            src={article.urlToImage}
                                            alt={article.title || 'News image'}
                                            className="card-image"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.parentElement.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                                <div className="card-body">
                                    <div className="card-header">
                                        <span className="source">{article.source?.name || 'Unknown'}</span>
                                        <span className="date">
                                            {formatDate(article.publishedAt)}
                                        </span>
                                    </div>
                                    <h3 className="card-title">{article.title || 'No title available'}</h3>
                                    <p className="card-desc">{article.description || 'No description available'}</p>
                                    <a
                                        href={article.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="read-more"
                                    >
                                        Read More →
                                    </a>
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