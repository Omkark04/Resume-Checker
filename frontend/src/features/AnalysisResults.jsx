import React from 'react';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import '../styles/AnalysisResults.css';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

function AnalysisResults({ analysis }) {
    // Helper functions moved to the top
    const getProgressColor = (score) => {
        if (score >= 90) return '#10b981';
        if (score >= 80) return '#3b82f6';
        if (score >= 70) return '#f59e0b';
        return '#ef4444';
    };

    const getScoreClass = (score) => {
        if (score >= 90) return 'excellent';
        if (score >= 80) return 'very-good';
        if (score >= 70) return 'good';
        if (score >= 60) return 'fair';
        return 'poor';
    };

    // Data extraction
    const parsedData = analysis?.parsed_data || {};
    const analysisResults = analysis?.analysis_results || {};
    const rolePredictions = analysisResults?.role_predictions || {};
    const similarityScores = analysisResults?.similarity_scores || {};
    const atsScore = analysis?.ats_score || 0;
    
    // ATS Score Doughnut Chart Data
    const atsChartData = {
        datasets: [{
            data: [atsScore, 100 - atsScore],
            backgroundColor: [
                getProgressColor(atsScore),
                'rgba(200, 200, 200, 0.1)'
            ],
            borderWidth: 0,
            cutout: '70%'
        }]
    };

    // Chart options
    const atsDoughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                enabled: false
            }
        },
        cutout: '70%'
    };

    return (
        <div className="analysis-results">
            <h3>Analysis Results</h3>
            
            <div className="results-grid">
                {/* Personal Info */}
                <div className="result-card personal-info">
                    <h4>Personal Information</h4>
                    <p><strong>Name:</strong> {parsedData.name || 'Not provided'}</p>
                    <p><strong>Email:</strong> {parsedData.email || 'Not provided'}</p>
                    <p><strong>Phone:</strong> {parsedData.phone || 'Not provided'}</p>
                </div>
                
                {/* ATS Score */}
                <div className="result-card ats-score">
                    <h4>ATS Compatibility Score</h4>
                    <div className="ats-score-container">
                        <div className="ats-doughnut-chart">
                            <Doughnut data={atsChartData} options={atsDoughnutOptions} />
                            <div className="ats-score-overlay">
                                <span className="score-value">{atsScore.toFixed(1)}</span>
                                <span className="score-label">/ 100</span>
                            </div>
                        </div>
                        <div className={`score-description ${getScoreClass(atsScore)}`}>
                            {atsScore >= 90 ? 'Excellent' : 
                             atsScore >= 80 ? 'Very Good' :
                             atsScore >= 70 ? 'Good' :
                             atsScore >= 60 ? 'Fair' : 'Needs Improvement'}
                        </div>
                    </div>
                </div>
                
                {/* Skills */}
                <div className="result-card skills">
                    <h4>Top Skills</h4>
                    {parsedData.skills?.length ? (
                        <>
                            <div className="skills-list">
                                {parsedData.skills.slice(0, 10).map((skill, i) => (
                                    <span key={i} className="skill-badge">{skill}</span>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p>No skills identified</p>
                    )}
                </div>
                
                {/* Role Predictions with Progress Bars */}
                <div className="result-card roles">
                    <h4>Role Predictions</h4>
                    {rolePredictions.roles?.length ? (
                        <>
                            <ul className="role-list">
                                {rolePredictions.roles.map((role, i) => {
                                    const score = rolePredictions.scores?.[i] || 0;
                                    return (
                                        <li key={i}>
                                            <div className="role-info">
                                                <span className="role-name">{role}</span>
                                                <span className="role-score">{score.toFixed(1)}%</span>
                                            </div>
                                            <div 
                                                className="progress-container" 
                                                role="progressbar"
                                                aria-valuenow={score}
                                                aria-valuemin="0"
                                                aria-valuemax="100"
                                            >
                                                <div 
                                                    className="progress-bar"
                                                    style={{
                                                        width: `${score}%`,
                                                        backgroundColor: getProgressColor(score)
                                                    }}
                                                ></div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </>
                    ) : (
                        <p>No role predictions available</p>
                    )}
                </div>
              
                {/* JD Matching (if available) */}
                {analysis.job_description && (
                    <div className="result-card jd-matching">
                        <h4>Job Description Matching</h4>
                        {similarityScores.combined_score ? (
                            <>
                                <div className="match-score">
                                    <span className="score-label">Overall Match:</span>
                                    <span className="score-value">{similarityScores.combined_score.toFixed(1)}%</span>
                                </div>
                                <div className="match-details">
                                    <p><strong>Content Match:</strong> {(similarityScores.tfidf_similarity || 0).toFixed(1)}%</p>
                                    <p><strong>Keyword Match:</strong> {(similarityScores.keyword_similarity || 0).toFixed(1)}%</p>
                                </div>
                                
                                {analysis.matched_keywords?.length > 0 && (
                                    <div className="keywords-section">
                                        <h5>Matched Keywords</h5>
                                        <div className="keywords-list">
                                            {analysis.matched_keywords.slice(0, 5).map((kw, i) => (
                                                <span key={i} className="keyword matched">{kw}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {analysis.missing_keywords?.length > 0 && (
                                    <div className="keywords-section">
                                        <h5>Missing Keywords</h5>
                                        <div className="keywords-list">
                                            {analysis.missing_keywords.slice(0, 5).map((kw, i) => (
                                                <span key={i} className="keyword missing">{kw}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p>No matching analysis available</p>
                        )}
                    </div>
               )}
                 
                {/* Recommendations */}
                <div className="result-card recommendations">
                    <h4>Recommendations</h4>
                    {analysis.recommendations?.length ? (
                        <ul>
                            {analysis.recommendations.slice(0, 5).map((rec, i) => (
                                <li key={i}>{rec}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>No specific recommendations</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AnalysisResults;