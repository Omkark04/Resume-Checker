// src/pages/ResumeAnalyzer.jsx
import React, { useState, useEffect, useRef } from 'react';
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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch user data and past analyses
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

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setResumeFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data) {
        setAnalysisResult(response.data);
        setAnalyses((prev) => [response.data, ...prev]);
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
      <Navbar />

      {/* Header */}
      <div className="resume-analyzer-header">
        <h2 className="header-title">📄 Resume Analyzer</h2>
        {username && <p className="header-subtitle">Welcome back, <strong>{username}</strong></p>}
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Main Content */}
      <div className="resume-analysis-container">
        <div className="analysis-forms">
          <div className="upload-form">
            <h3 className="form-title">
              <span className="icon">✨</span> Analyze New Resume
            </h3>

            <form onSubmit={handleSubmit}>
              {/* Drag & Drop Upload */}
              <div
                className={`file-upload-area ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileInput}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx"
                  style={{ display: 'none' }}
                />
                {resumeFile ? (
                  <div className="file-preview">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{resumeFile.name}</span>
                    <button
                      type="button"
                      className="remove-file"
                      onClick={(e) => {
                        e.stopPropagation();
                        setResumeFile(null);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="upload-instructions">
                    <span>📁 Drag & drop your resume</span>
                    <span>or click to browse (.pdf, .docx)</span>
                  </div>
                )}
              </div>

              {/* Job Description */}
              <div className="form-group job-description-section">
                <label htmlFor="jobDescription">Job Description (Optional):</label>
                <textarea
                  id="jobDescription"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste job description for AI-powered matching..."
                  rows={5}
                  disabled={isLoading}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !resumeFile}
                className={`analyze-btn ${isLoading ? 'loading' : ''}`}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    <span>AI is analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Analyze Resume</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Results */}
        {analysisResult && analysisResult.parsed_data && (
          <ErrorBoundary>
            <div className="results-wrapper animate-fade-in">
              <div className="ai-typing-header">
                <span className="ai-dot"></span>
                <span className="ai-dot"></span>
                <span className="ai-dot"></span>
                <span className="ai-text">AI is generating insights...</span>
              </div>
              <AnalysisResults analysis={analysisResult} />
            </div>
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}

export default ResumeAnalyzer;