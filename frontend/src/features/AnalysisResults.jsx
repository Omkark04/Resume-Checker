// src/pages/AnalysisResults.jsx
import React from 'react';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import '../styles/AnalysisResults.css';
import { Link } from 'react-router-dom';

// Register ChartJS components
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function AnalysisResults({ analysis }) {
  const getProgressColor = (score) => {
    if (score >= 90) return '#10b981'; // green-500
    if (score >= 80) return '#3b82f6'; // blue-500
    if (score >= 70) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
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
  const education = analysis.education ? JSON.parse(analysis.education) : [];
  const recommendations = analysis?.recommendations || [];

  // ATS Score Doughnut Chart
  const atsChartData = {
    datasets: [
      {
        data: [atsScore, 100 - atsScore],
        backgroundColor: [getProgressColor(atsScore), 'rgba(200, 200, 200, 0.1)'],
        borderWidth: 0,
        cutout: '70%',
        borderRadius: 10,
        hoverOffset: 10,
      },
    ],
  };

  const atsDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
    },
  };

  return (
    <div className="analysis-results-modern">
      <header className="results-header">
        <h2>📊 Resume Analysis Report</h2>
        <p className="subtitle">Detailed insights to help you land your dream job</p>
      </header>

      <div className="results-grid-modern">
        {/* Personal Info */}
        <div className="card personal-info fade-in">
          <h4>👤 Personal Info</h4>
          <div className="info-item">
            <strong>Name:</strong> <span>{parsedData.name || 'Not provided'}</span>
          </div>
          <div className="info-item">
            <strong>Email:</strong> <span>{parsedData.email || 'Not provided'}</span>
          </div>
          <div className="info-item">
            <strong>Phone:</strong> <span>{parsedData.phone || 'Not provided'}</span>
          </div>
        </div>

        {/* ATS Score */}
        <div className="card ats-score-card fade-in">
          <h4>🎯 ATS Compatibility</h4>
          <div className="doughnut-container">
            <Doughnut data={atsChartData} options={atsDoughnutOptions} />
            <div className="score-overlay">
              <span className="big-score">{atsScore.toFixed(1)}</span>
              <span className="score-out-of">/100</span>
            </div>
          </div>
          <div className={`score-badge ${getScoreClass(atsScore)}`}>
            {atsScore >= 90
              ? 'Excellent'
              : atsScore >= 80
              ? 'Very Good'
              : atsScore >= 70
              ? 'Good'
              : atsScore >= 60
              ? 'Fair'
              : 'Needs Improvement'}
          </div>
        </div>

        {/* Skills */}
        <div className="card skills-card fade-in">
          <h4>🔧 Top Skills</h4>
          {parsedData.skills?.length > 0 ? (
            <div className="skills-chips">
              {parsedData.skills.slice(0, 10).map((skill, i) => (
                <span key={i} className="chip skill" style={{ animationDelay: `${i * 0.1}s` }}>
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="no-data">No skills detected</p>
          )}
        </div>

        {/* Role Predictions */}
        <div className="card roles-card fade-in">
          <h4>💼 Role Matches</h4>
          {rolePredictions.roles?.length > 0 ? (
            <ul className="role-progress-list">
              {rolePredictions.roles.slice(0, 4).map((role, i) => {
                const score = rolePredictions.scores?.[i] || 0;
                return (
                  <li key={i} className="role-item">
                    <div className="role-header">
                      <span className="role-title">{role}</span>
                      <span className="role-pct">{score.toFixed(1)}%</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: '0%',
                          backgroundColor: getProgressColor(score),
                          animation: `fillProgress 1.2s ease-out forwards`,
                          animationDelay: `${i * 0.2}s`,
                        }}
                      ></div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="no-data">No predictions available</p>
          )}
        </div>

        {/* Job Matching */}
        {analysis.job_description && (
          <div className="card jd-matching-card fade-in">
            <h4>🔍 Job Match Score</h4>
            <div className="match-score-large">{similarityScores.combined_score?.toFixed(1) || 0}%</div>
            <div className="match-details-grid">
              <div className="detail">
                <small>📄 Content Match</small>
                <b>{(similarityScores.tfidf_similarity || 0).toFixed(1)}%</b>
              </div>
              <div className="detail">
                <small>🔑 Keyword Match</small>
                <b>{(similarityScores.keyword_similarity || 0).toFixed(1)}%</b>
              </div>
            </div>

            {analysis.matched_keywords?.length > 0 && (
              <div className="keywords-section">
                <h5>✅ Matched Keywords</h5>
                <div className="keywords-chips">
                  {analysis.matched_keywords.slice(0, 5).map((kw, i) => (
                    <span key={i} className="chip matched">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysis.missing_keywords?.length > 0 && (
              <div className="keywords-section">
                <h5>❌ Missing Keywords</h5>
                <div className="keywords-chips">
                  {analysis.missing_keywords.slice(0, 5).map((kw, i) => (
                    <span key={i} className="chip missing">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Education */}
        <div className="card education-card fade-in">
          <h4>🎓 Education</h4>
          {education.length > 0 ? (
            <ul className="education-timeline">
              {education.map((edu, i) => (
                <li key={i} className="edu-item">
                  <div className="edu-bullet"></div>
                  <span>{edu}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">No education info found</p>
          )}
        </div>

        {/* Recommendations */}
        <div className="card recommendations-card fade-in">
          <h4>💡 Recommendations</h4>
          {recommendations.length > 0 ? (
            <ul className="recommendations-list">
              {recommendations.slice(0, 5).map((rec, i) => (
                <li key={i} className="rec-item">
                  <span>📌</span> {rec}
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">No recommendations available</p>
          )}
        </div>
      </div>

      <div className="cta-section fade-in">
        <Link to="/resume-builder" className="btn-primary glow">
          🛠️ Open Resume Builder
        </Link>
      </div>
    </div>
  );
}

export default AnalysisResults
