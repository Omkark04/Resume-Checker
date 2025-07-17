import React, { useState, useEffect } from 'react';
import api from '../api';
import AnalysisResults from './AnalysisResults';
import ErrorBoundary from './ErrorBoundary';
import '../styles/ResumeAnalyzer.css';
import Navbar from '../components/Navbar';

function ResumeAnalyzer() {
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [analyses, setAnalyses] = useState([]);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [resumeFile, setResumeFile] = useState(null);
    const [jobDescription, setJobDescription] = useState('');

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

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setResumeFile(e.target.files[0]);
        }
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
            
            const formData = new FormData();
            formData.append('resume', resumeFile);
            if (jobDescription) {
                formData.append('job_description', jobDescription);
            }
            
            const response = await api.post('/api/resume/analyze/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (response.data) {
                setAnalysisResult(response.data);
                setAnalyses(prev => [response.data, ...prev]);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Analysis failed. Please try again.');
            console.error('Analysis error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="resume-analyzer-container">
            <Navbar/>
            <div className="resume-analyzer-header">
                <h2>Resume Analyzer</h2>
                {username && <p>Welcome back, {username}</p>}
            </div>
            
            {error && (
                <div className="error-message">
                    <p>{error}</p>
                    <button onClick={() => setError(null)}>Dismiss</button>
                </div>
            )}
            
            <div className="resume-analysis-container">
                <div className="analysis-forms">
                    <div className="upload-form">
                        <h3>Analyze New Resume</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="resume">Upload Resume (PDF/DOCX):</label>
                                <input 
                                    type="file" 
                                    id="resume" 
                                    accept=".pdf,.docx" 
                                    onChange={handleFileChange}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="jobDescription">Job Description (Optional):</label>
                                <textarea 
                                    id="jobDescription"
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    placeholder="Paste job description here for matching analysis..."
                                    rows={5}
                                    disabled={isLoading}
                                />
                            </div>
                            
                            <button 
                                type="submit" 
                                disabled={isLoading || !resumeFile}
                                className={isLoading ? 'loading' : ''}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Analyzing...
                                    </>
                                ) : (
                                    'Analyze Resume'
                                )}
                            </button>
                        </form>
                    </div>
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