import React, { useState, useEffect } from 'react';
import api from '../api';
import { saveAs } from 'file-saver';
import '../styles/ResumeTemplates.css';

function ResumeTemplates({ resumeData }) {
    const [generatedTemplates, setGeneratedTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState({});
    const [error, setError] = useState(null);
    const [showLegacyGeneration, setShowLegacyGeneration] = useState(false);
    const [theme, setTheme] = useState('light');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        loadGeneratedTemplates();
        detectTheme();
        
        const observer = new MutationObserver(detectTheme);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        
        return () => observer.disconnect();
    }, []);

    const detectTheme = () => {
        const bodyClass = document.body.className;
        if (bodyClass.includes('dark')) {
            setTheme('dark');
        } else if (bodyClass.includes('light')) {
            setTheme('light');
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setTheme(prefersDark ? 'dark' : 'light');
        }
    };

    const loadGeneratedTemplates = async () => {
        try {
            const response = await api.get('/api/resumes/generated/');
            if (response.data.success) {
                setGeneratedTemplates(response.data.templates);
            }
        } catch (error) {
            console.error('Error loading generated templates:', error);
        }
    };

    const showSuccess = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 4000);
    };

    const generateAndStoreTemplates = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await api.post('/api/resumes/generate-and-store/', {
                ...resumeData,
                personalDetails: resumeData.personalDetails || {},
                profile_pic: resumeData.profile_pic || ''
            });
            
            if (!response.data?.success) {
                throw new Error(response.data?.error || 'Failed to generate templates');
            }
            
            setGeneratedTemplates(response.data.templates);
            showSuccess('🎉 Templates generated successfully! Your professional resumes are ready to download.');
            
        } catch (err) {
            const errorMessage = err.response?.data?.error || 
                               err.message || 
                               'Failed to generate templates. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const downloadGeneratedResume = async (templateId, templateName) => {
        try {
            setDownloadLoading(prev => ({...prev, [templateId]: true}));
            
            const response = await api.get(
                `/api/resumes/download/${templateId}/`,
                { responseType: 'blob' }
            );

            const blob = new Blob([response.data], { type: 'application/pdf' });
            saveAs(blob, `${templateName}_resume.pdf`);
            
            setGeneratedTemplates(prev => 
                prev.map(template => 
                    template.id === templateId 
                        ? { ...template, download_count: template.download_count + 1 }
                        : template
                )
            );

            showSuccess(`✅ ${templateName} template downloaded successfully!`);
            
        } catch (err) {
            setError(err.response?.data?.error || 'Download failed. Please try again.');
        } finally {
            setDownloadLoading(prev => ({...prev, [templateId]: false}));
        }
    };

    const generateLegacyTemplates = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await api.post('/api/resumes/generate/', {
                ...resumeData,
                full_name: resumeData.personalDetails?.fullName || resumeData.full_name || 'Resume'
            });
            
            if (!response.data?.templates) {
                throw new Error('Invalid response format from server');
            }
            
            const legacyTemplates = response.data.templates.map(template => ({
                id: `legacy_${template.template_name}`,
                template_name: template.template_name,
                template_info: getTemplateInfo(template.template_name),
                thumbnail: null,
                download_url: template.download_url,
                created_at: new Date().toISOString(),
                download_count: 0,
                isLegacy: true
            }));
            
            setGeneratedTemplates(prev => [...prev, ...legacyTemplates]);
            showSuccess('📄 Legacy templates generated successfully!');
            
        } catch (err) {
            const errorMessage = err.response?.data?.error || 
                               err.message || 
                               'Failed to generate legacy templates. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const downloadLegacyResume = async (templateName) => {
        try {
            setDownloadLoading(prev => ({...prev, [`legacy_${templateName}`]: true}));
            
            const flattenObject = (obj, prefix = '') => {
                return Object.keys(obj).reduce((acc, k) => {
                    const pre = prefix ? `${prefix}.` : '';
                    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
                        Object.assign(acc, flattenObject(obj[k], pre + k));
                    } else {
                        acc[pre + k] = obj[k];
                    }
                    return acc;
                }, {});
            };

            const flatData = flattenObject(resumeData);
            
            const response = await api.post(
                `/api/resumes/download-post/${templateName}/`,
                flatData,
                { responseType: 'blob' }
            );

            const blob = new Blob([response.data], { type: 'application/pdf' });
            saveAs(blob, `${templateName}_resume.pdf`);

            showSuccess(`✅ Legacy ${templateName} template downloaded successfully!`);
            
        } catch (err) {
            setError(err.response?.data?.error || 'Legacy download failed. Please try again.');
        } finally {
            setDownloadLoading(prev => ({...prev, [`legacy_${templateName}`]: false}));
        }
    };

    const getTemplateInfo = (templateName) => {
        const templateDescriptions = {
            modern: {
                title: "Modern Professional",
                description: "Contemporary design with clean layout and modern typography"
            },
            classic: {
                title: "Classic Traditional", 
                description: "Timeless format that works well across all industries"
            },
            minimalist: {
                title: "Clean Minimalist",
                description: "Simple and elegant design that highlights your content"
            }
        };
        return templateDescriptions[templateName] || { 
            title: templateName.charAt(0).toUpperCase() + templateName.slice(1), 
            description: 'Professional resume template designed to impress'
        };
    };

    const handleDownload = (template) => {
        if (template.isLegacy) {
            downloadLegacyResume(template.template_name);
        } else {
            downloadGeneratedResume(template.id, template.template_name);
        }
    };

    const deleteTemplate = async (templateId) => {
        if (window.confirm('Are you sure you want to delete this resume template? This action cannot be undone.')) {
            try {
                setGeneratedTemplates(prev => prev.filter(t => t.id !== templateId));
                showSuccess('🗑️ Template deleted successfully.');
            } catch (error) {
                setError('Failed to delete template. Please try again.');
            }
        }
    };

    const groupedTemplates = generatedTemplates.reduce((acc, template) => {
        const date = new Date(template.created_at).toLocaleDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(template);
        return acc;
    }, {});

    return (
        <div className={`resume-templates-container ${theme}`}>
            <div className="templates-hero">
                <div className="hero-content">
                    <h1 className="templates-title">Resume Templates</h1>
                    <p className="templates-subtitle">
                        Create professional, ATS-friendly resumes that get you noticed by employers
                    </p>
                </div>
                <div className="hero-actions">
                    <button 
                        className={`generate-btn primary ${loading ? 'loading' : ''}`}
                        onClick={generateAndStoreTemplates}
                        disabled={loading}
                    >
                        {loading ? '⏳ Creating Magic...' : '✨ Generate My Templates'}
                    </button>
                    
                    <button 
                        className="toggle-legacy-btn"
                        onClick={() => setShowLegacyGeneration(!showLegacyGeneration)}
                    >
                        {showLegacyGeneration ? '🔼 Hide' : '🔽 Show'} Legacy Options
                    </button>
                </div>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="success-message">
                    <div className="success-content">
                        <p>{successMessage}</p>
                    </div>
                    <button 
                        onClick={() => setSuccessMessage('')}
                        className="success-close"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="error-message">
                    <div className="error-content">
                        <h4>😔 Something went wrong</h4>
                        <p>{error}</p>
                    </div>
                    <button 
                        onClick={() => setError(null)}
                        className="error-close"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Legacy Section */}
            {showLegacyGeneration && (
                <div className="legacy-section">
                    <div className="legacy-header">
                        <h3>⚡ Legacy Template Generation</h3>
                        <p className="legacy-note">
                            Generate templates without database storage for quick testing
                        </p>
                    </div>
                    <button 
                        className={`generate-btn secondary ${loading ? 'loading' : ''}`}
                        onClick={generateLegacyTemplates}
                        disabled={loading}
                    >
                        {loading ? '⏳ Generating...' : '🔧 Generate Legacy Templates'}
                    </button>
                </div>
            )}

            {/* Templates Content */}
            {Object.keys(groupedTemplates).length > 0 ? (
                <div className="templates-content">
                    <div className="templates-stats">
                        <div className="stat-card">
                            <div className="stat-number">{generatedTemplates.length}</div>
                            <div className="stat-label">Total Templates</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">
                                {generatedTemplates.reduce((sum, t) => sum + t.download_count, 0)}
                            </div>
                            <div className="stat-label">Downloads</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">
                                {new Set(generatedTemplates.map(t => t.template_name)).size}
                            </div>
                            <div className="stat-label">Unique Designs</div>
                        </div>
                    </div>

                    <div className="templates-list">
                        {Object.entries(groupedTemplates).map(([date, templates]) => (
                            <div key={date} className="template-group">
                                <div className="group-header">
                                    <h3 className="group-date">Created on {date}</h3>
                                    <span className="group-count">
                                        {templates.length} template{templates.length > 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="templates-grid">
                                    {templates.map((template) => (
                                        <div key={template.id} className={`template-card ${template.isLegacy ? 'legacy' : ''}`}>
                                            
                                            <div className="template-header">
                                                <div className="template-title-section">
                                                    <h4 className="template-title">{template.template_info.title}</h4>
                                                    <span className="template-type">{template.template_name}</span>
                                                </div>
                                                {template.isLegacy && (
                                                    <div className="legacy-badge">Legacy</div>
                                                )}
                                            </div>
                                            
                                            <p className="template-description">
                                                {template.template_info.description}
                                            </p>
                                            
                                            <div className="template-preview">
                                                {template.thumbnail ? (
                                                    <img 
                                                        src={template.thumbnail}
                                                        alt={`${template.template_name} Preview`}
                                                        className="preview-thumbnail"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="no-preview">
                                                        <div className="preview-placeholder">
                                                            <div className="placeholder-title">📄 Template Preview</div>
                                                            <div className="placeholder-subtitle">
                                                                {template.isLegacy ? 'Legacy Style' : 'Modern Design'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="template-actions">
                                                <button
                                                    className="download-btn"
                                                    onClick={() => handleDownload(template)}
                                                    disabled={downloadLoading[template.id] || downloadLoading[`legacy_${template.template_name}`]}
                                                >
                                                    {(downloadLoading[template.id] || downloadLoading[`legacy_${template.template_name}`]) ? 
                                                        '⏳ Downloading...' : 'Download PDF'
                                                    }
                                                </button>
                                                
                                                {!template.isLegacy && (
                                                    <button
                                                        className="delete-btn"
                                                        onClick={() => deleteTemplate(template.id)}
                                                        title="Delete template"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                            
                                            <div className="template-meta">
                                                <div className="meta-item">
                                                    <span className="meta-text">
                                                        📊 {template.download_count} download{template.download_count !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <div className="meta-item">
                                                    <span className="meta-text">
                                                        🕒 {new Date(template.created_at).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="no-templates">
                    <div className="no-templates-content">
                        <h3 className="empty-state-title">Ready to Create Your First Resume?</h3>
                        <p className="empty-state-description">
                            Generate professional resume templates in seconds. Our AI-powered system creates 
                            multiple designs optimized for different industries and roles.
                        </p>
                        
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎨</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>Multiple Designs</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>Instant Generation</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏆</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>ATS Optimized</div>
                                </div>
                            </div>
                        </div>
                        
                        <button 
                            className="cta-button"
                            onClick={generateAndStoreTemplates}
                            disabled={loading}
                        >
                            {loading ? '⏳ Creating Your Templates...' : '🚀 Create My Resume Templates'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ResumeTemplates;