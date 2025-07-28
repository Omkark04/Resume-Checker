import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import AnalysisResults from './AnalysisResults';
import ErrorBoundary from './ErrorBoundary';
import Navbar from '../components/Navbar';
import { useResume } from "../features/ResumeContext";
import { Upload, FileText, Briefcase, Loader, AlertCircle, CheckCircle, X } from 'lucide-react';

function ResumeAnalyzer() {
    const { analysisResult, setAnalysisResult } = useResume();
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [analyses, setAnalyses] = useState([]);
    const [resumeFile, setResumeFile] = useState(null);
    const [jobDescription, setJobDescription] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                const profileRes = await api.get('/api/user/profile/');
                setUsername(profileRes.data.username || 'User');
                
                const analysesRes = await api.get('/api/resume/analyses/');
                setAnalyses(analysesRes.data || []);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to fetch data');
                console.error('Fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchData();
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'application/pdf' || 
                file.name.endsWith('.docx') || 
                file.type === 'text/plain') {
                setResumeFile(file);
            } else {
                setError('Please upload a PDF, DOCX, or TXT file');
            }
        }
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setResumeFile(e.target.files[0]);
        }
    };

    const removeFile = () => {
        setResumeFile(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!resumeFile) {
            setError('Please upload a resume file');
            return;
        }
        
        try {
            setIsLoading(true);
            setError(null);
            setAnalysisResult(null);
            setUploadProgress(0);
            
            const formData = new FormData();
            formData.append('resume', resumeFile);
            if (jobDescription.trim()) {
                formData.append('job_description', jobDescription);
            }
            
            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);
            
            const response = await api.post('/api/resume/analyze/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            clearInterval(progressInterval);
            setUploadProgress(100);
            
            if (response.data) {
                setAnalysisResult(response.data);
                setAnalyses(prev => [response.data, ...prev]);
                // Reset form
                setResumeFile(null);
                setJobDescription('');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Analysis failed. Please try again.');
            console.error('Analysis error:', err);
            setUploadProgress(0);
        } finally {
            setIsLoading(false);
        }
    };

    const getFileIcon = (filename) => {
        if (filename?.endsWith('.pdf')) return '📄';
        if (filename?.endsWith('.docx')) return '📝';
        if (filename?.endsWith('.txt')) return '📃';
        return '📄';
    };

    return (
        <div className="enhanced-resume-analyzer">
            <style jsx>{`
                .enhanced-resume-analyzer {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1e1b4b 100%);
                    color: #e2e8f0;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                }

                .analyzer-header {
                    text-align: center;
                    padding: 4rem 2rem 2rem;
                    background: linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(236, 72, 153, 0.1));
                    backdrop-filter: blur(20px);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .header-title {
                    font-size: 3.5rem;
                    font-weight: 800;
                    background: linear-gradient(90deg, #4f46e5, #ec4899, #06b6d4);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    background-size: 300% auto;
                    animation: shine 3s linear infinite;
                    margin-bottom: 1rem;
                }

                @keyframes shine {
                    to { background-position: 300% center; }
                }

                .header-subtitle {
                    font-size: 1.25rem;
                    color: #94a3b8;
                    margin-bottom: 0.5rem;
                }

                .header-welcome {
                    font-size: 1rem;
                    color: #cbd5e1;
                    font-weight: 500;
                }

                .analyzer-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 3rem 2rem;
                }

                .upload-section {
                    background: rgba(30, 41, 59, 0.8);
                    backdrop-filter: blur(16px);
                    border-radius: 24px;
                    padding: 3rem;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    margin-bottom: 3rem;
                    transition: all 0.3s ease;
                }

                .upload-section:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 20px 40px rgba(79, 70, 229, 0.2);
                }

                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 2rem;
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #e2e8f0;
                }

                .upload-area {
                    border: 3px dashed #4f46e5;
                    border-radius: 16px;
                    padding: 3rem 2rem;
                    text-align: center;
                    transition: all 0.3s ease;
                    cursor: pointer;
                    background: rgba(79, 70, 229, 0.05);
                    position: relative;
                    overflow: hidden;
                    margin-bottom: 2rem;
                }

                .upload-area::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle, rgba(79, 70, 229, 0.1) 0%, transparent 70%);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .upload-area:hover::before,
                .upload-area.dragging::before {
                    opacity: 1;
                }

                .upload-area:hover,
                .upload-area.dragging {
                    border-color: #ec4899;
                    background: rgba(236, 72, 153, 0.08);
                    transform: scale(1.02);
                }

                .upload-area.dragging {
                    animation: pulse 1s infinite;
                }

                @keyframes pulse {
                    0%, 100% { transform: scale(1.02); }
                    50% { transform: scale(1.05); }
                }

                .upload-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                    color: #4f46e5;
                    animation: float 3s ease-in-out infinite;
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                .upload-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    color: #e2e8f0;
                }

                .upload-subtitle {
                    color: #94a3b8;
                    margin-bottom: 1.5rem;
                }

                .file-input {
                    display: none;
                }

                .upload-button {
                    background: linear-gradient(90deg, #4f46e5, #7c3aed);
                    color: white;
                    border: none;
                    padding: 0.75rem 2rem;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .upload-button:hover {
                    background: linear-gradient(90deg, #4338ca, #6d28d9);
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(79, 70, 229, 0.3);
                }

                .file-preview {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    border-radius: 12px;
                    margin-bottom: 2rem;
                }

                .file-info {
                    flex: 1;
                }

                .file-name {
                    font-weight: 600;
                    color: #10b981;
                    margin-bottom: 0.25rem;
                }

                .file-size {
                    font-size: 0.875rem;
                    color: #94a3b8;
                }

                .remove-file {
                    background: #ef4444;
                    color: white;
                    border: none;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .remove-file:hover {
                    background: #dc2626;
                    transform: scale(1.1);
                }

                .job-description-section {
                    margin-top: 2rem;
                }

                .textarea-container {
                    position: relative;
                }

                .job-textarea {
                    width: 100%;
                    min-height: 120px;
                    padding: 1rem;
                    background: rgba(30, 41, 59, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    color: #e2e8f0;
                    font-size: 0.95rem;
                    resize: vertical;
                    transition: all 0.3s ease;
                }

                .job-textarea:focus {
                    outline: none;
                    border-color: #4f46e5;
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
                    background: rgba(30, 41, 59, 0.8);
                }

                .textarea-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.75rem;
                    font-weight: 500;
                    color: #cbd5e1;
                }

                .analyze-button {
                    width: 100%;
                    background: linear-gradient(90deg, #4f46e5, #ec4899);
                    color: white;
                    border: none;
                    padding: 1.25rem 2rem;
                    border-radius: 16px;
                    font-weight: 700;
                    font-size: 1.1rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    transition: all 0.3s ease;
                    margin-top: 2rem;
                    position: relative;
                    overflow: hidden;
                }

                .analyze-button::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                    transform: translateX(-100%);
                    transition: transform 0.6s ease;
                }

                .analyze-button:hover::before {
                    transform: translateX(100%);
                }

                .analyze-button:hover:not(:disabled) {
                    transform: translateY(-4px);
                    box-shadow: 0 20px 40px rgba(79, 70, 229, 0.4);
                    background: linear-gradient(90deg, #4338ca, #db2777);
                }

                .analyze-button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: none;
                }

                .progress-bar {
                    width: 100%;
                    height: 4px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 2px;
                    overflow: hidden;
                    margin-top: 1rem;
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #4f46e5, #ec4899);
                    border-radius: 2px;
                    transition: width 0.3s ease;
                }

                .loading-spinner {
                    width: 24px;
                    height: 24px;
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-top: 3px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .error-message {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 12px;
                    padding: 1rem;
                    margin: 1rem 0;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: #fca5a5;
                }

                .error-dismiss {
                    background: none;
                    border: none;
                    color: #ef4444;
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 4px;
                    transition: background 0.2s ease;
                }

                .error-dismiss:hover {
                    background: rgba(239, 68, 68, 0.2);
                }

                .analysis-status {
                    text-align: center;
                    margin: 2rem 0;
                    padding: 1.5rem;
                    background: rgba(79, 70, 229, 0.1);
                    border-radius: 12px;
                    border: 1px solid rgba(79, 70, 229, 0.3);
                }

                .status-dots {
                    display: flex;
                    justify-content: center;
                    gap: 0.5rem;
                    margin-top: 1rem;
                }

                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #4f46e5;
                    animation: pulse-dot 1.4s infinite ease-in-out;
                }

                .status-dot:nth-child(2) { animation-delay: 0.2s; }
                .status-dot:nth-child(3) { animation-delay: 0.4s; }

                @keyframes pulse-dot {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.7; }
                }

                @media (max-width: 768px) {
                    .analyzer-header {
                        padding: 3rem 1rem 2rem;
                    }
                    
                    .header-title {
                        font-size: 2.5rem;
                    }
                    
                    .analyzer-container {
                        padding: 2rem 1rem;
                    }
                    
                    .upload-section {
                        padding: 2rem 1.5rem;
                    }
                    
                    .upload-area {
                        padding: 2rem 1rem;
                    }
                }
            `}</style>

            <Navbar />
            
            <div className="analyzer-header">
                <h1 className="header-title">🎯 AI Resume Analyzer</h1>
                <p className="header-subtitle">Get comprehensive insights and ATS optimization tips</p>
                {username && <p className="header-welcome">Welcome back, <strong>{username}</strong>!</p>}
            </div>

            <div className="analyzer-container">
                {error && (
                    <div className="error-message">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="error-dismiss">
                            <X size={16} />
                        </button>
                    </div>
                )}

                <div className="upload-section">
                    <div className="section-header">
                        <Upload size={24} />
                        <span>Upload & Analyze Resume</span>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div 
                            className={`upload-area ${isDragging ? 'dragging' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById('resume-upload').click()}
                        >
                            <div className="upload-icon">
                                {resumeFile ? '✅' : '📄'}
                            </div>
                            <h3 className="upload-title">
                                {resumeFile ? 'File Selected!' : 'Drop your resume here'}
                            </h3>
                            <p className="upload-subtitle">
                                {resumeFile ? 'Click to change file' : 'Or click to browse files'}
                            </p>
                            <button type="button" className="upload-button">
                                <Upload size={18} />
                                {resumeFile ? 'Change File' : 'Browse Files'}
                            </button>
                            <p style={{marginTop: '1rem', fontSize: '0.875rem', color: '#94a3b8'}}>
                                Supports PDF, DOCX, and TXT files (Max 10MB)
                            </p>
                        </div>

                        <input
                            id="resume-upload"
                            type="file"
                            accept=".pdf,.docx,.txt"
                            onChange={handleFileChange}
                            className="file-input"
                        />

                        {resumeFile && (
                            <div className="file-preview">
                                <div style={{fontSize: '1.5rem'}}>
                                    {getFileIcon(resumeFile.name)}
                                </div>
                                <div className="file-info">
                                    <div className="file-name">{resumeFile.name}</div>
                                    <div className="file-size">
                                        {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={removeFile} 
                                    className="remove-file"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        <div className="job-description-section">
                            <label className="textarea-label">
                                <Briefcase size={18} />
                                Job Description (Optional but Recommended)
                            </label>
                            <div className="textarea-container">
                                <textarea
                                    className="job-textarea"
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    placeholder="Paste the job description here to get personalized matching insights, keyword analysis, and role-specific recommendations..."
                                    rows={6}
                                />
                            </div>
                            <p style={{fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.5rem'}}>
                                💡 Adding a job description unlocks advanced features like keyword matching, role predictions, and tailored optimization tips.
                            </p>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading || !resumeFile}
                            className="analyze-button"
                        >
                            {isLoading ? (
                                <>
                                    <div className="loading-spinner"></div>
                                    Analyzing Resume...
                                </>
                            ) : (
                                <>
                                    <FileText size={20} />
                                    Analyze Resume
                                </>
                            )}
                        </button>

                        {isLoading && uploadProgress > 0 && (
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{width: `${uploadProgress}%`}}
                                ></div>
                            </div>
                        )}
                    </form>

                    {isLoading && (
                        <div className="analysis-status">
                            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem'}}>
                                <FileText size={20} />
                                <span style={{fontWeight: '600'}}>AI Analysis in Progress</span>
                            </div>
                            <p style={{color: '#94a3b8', marginBottom: '0.5rem'}}>
                                Extracting information, analyzing skills, predicting roles...
                            </p>
                            <div className="status-dots">
                                <div className="status-dot"></div>
                                <div className="status-dot"></div>
                                <div className="status-dot"></div>
                            </div>
                        </div>
                    )}
                </div>

                {analysisResult && analysisResult.parsed_data && (
                    <ErrorBoundary>
                        <AnalysisResults analysis={analysisResult} />
                    </ErrorBoundary>
                )}
            </div>
        </div>
    );
}

export default ResumeAnalyzer;