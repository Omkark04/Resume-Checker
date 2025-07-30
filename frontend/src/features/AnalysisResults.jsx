import React from 'react';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import '../styles/AnalysisResults.css';

// Register ChartJS components
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function AnalysisResults({ analysis, onResumeBuilder }) {
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
  const rolePredictions = analysisResults?.role_predictions || analysis?.role_predictions || {};
  const similarityScores = analysisResults?.similarity_scores || analysis?.similarity_scores || {};
  const keywordsAnalysis = analysis?.keywords_analysis || {};
  const detailedRoleAnalysis = analysis?.detailed_role_analysis || [];
  const optimizationTips = analysis?.optimization_tips || analysis?.recommendations || [];
  const atsScore = analysis?.ats_score || 0;
  const atsBreakdown = analysis?.ats_breakdown || {};

  // ATS Score Doughnut Chart
  const atsChartData = {
    datasets: [
      {
        data: [atsScore, 100 - atsScore],
        backgroundColor: [getProgressColor(atsScore), 'rgba(200, 200, 200, 0.1)'],
        borderWidth: 0,
        cutout: '75%',
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    animation: {
      animateRotate: true,
      duration: 1500,
    },
  };

  // Role predictions bar chart
  const roleChartData = {
    labels: rolePredictions.roles?.slice(0, 5) || [],
    datasets: [
      {
        data: rolePredictions.scores?.slice(0, 5) || [],
        backgroundColor: rolePredictions.scores?.slice(0, 5).map(score => getProgressColor(score)) || [],
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const roleChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: '#94a3b8' },
      },
      x: {
        grid: { display: false },
        ticks: { 
          color: '#94a3b8',
          maxRotation: 45,
        },
      },
    },
  };

  const renderLink = (url, text, icon) => {
    if (!url || url === "Not found") return <span className="text-gray-400">Not provided</span>;
    
    return (
      <a 
        href={url.startsWith('http') ? url : `https://${url}`} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="link-external"
      >
        {icon}
        <span className="link-text">{text || url}</span>
        <span>🔗</span>
      </a>
    );
  };

  return (
    <div className="analysis-results">
      <header className="results-header">
        <h1 className="results-title">🎯 Comprehensive Resume Analysis</h1>
        <p className="results-subtitle">Advanced AI-powered insights to maximize your career potential</p>
      </header>

      <div className="results-grid">
        {/* ATS Score */}
        <div className="results-card">
          <div className="card-header">
            <span>🎯</span>
            <span>ATS Compatibility Score</span>
          </div>
          <div className="ats-score-container">
            <div className="chart-container">
              <Doughnut data={atsChartData} options={chartOptions} />
              <div className="score-overlay">
                <div className="big-score">{atsScore}</div>
                <div className="score-out-of">/100</div>
              </div>
            </div>
            <div className={`score-badge ${getScoreClass(atsScore)}`}>
              {atsScore >= 90 ? 'Excellent' : atsScore >= 80 ? 'Very Good' : atsScore >= 70 ? 'Good' : atsScore >= 60 ? 'Fair' : 'Needs Improvement'}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="results-card">
          <div className="card-header">
            <span>📧</span>
            <span>Personal Information</span>
          </div>
          <div className="info-grid">
            <div className="info-item">
              <span>👤</span>
              <span className="info-label">Name:</span>
              <span className="info-value">{parsedData.name || 'Not provided'}</span>
            </div>
            <div className="info-item">
              <span>📧</span>
              <span className="info-label">Email:</span>
              <span className="info-value">{parsedData.email || 'Not provided'}</span>
            </div>
            <div className="info-item">
              <span>📞</span>
              <span className="info-label">Phone:</span>
              <span className="info-value">{parsedData.phone || 'Not provided'}</span>
            </div>
            <div className="info-item">
              <span>📍</span>
              <span className="info-label">Location:</span>
              <span className="info-value">{parsedData.location || 'Not provided'}</span>
            </div>
            <div className="info-item">
              <span>💼</span>
              <span className="info-label">LinkedIn:</span>
              <div className="info-value">
                {renderLink(parsedData.linkedin, 'LinkedIn Profile', '💼')}
              </div>
            </div>
            <div className="info-item">
              <span>💻</span>
              <span className="info-label">GitHub:</span>
              <div className="info-value">
                {renderLink(parsedData.github, 'GitHub Profile', '💻')}
              </div>
            </div>
          </div>
        </div>

        {/* Overall Resume Analysis */}
        <div className="results-card">
          <div className="card-header">
            <span>📈</span>
            <span>Overall Resume Analysis</span>
          </div>
          <div className="info-grid">
            <div className="info-item">
              <span>💼</span>
              <span className="info-label">Top Role:</span>
              <span className="info-value">{rolePredictions.roles?.[0] || 'Not determined'}</span>
            </div>
            <div className="info-item">
              <span>🎯</span>
              <span className="info-label">JD Match:</span>
              <span className="info-value">{similarityScores.combined_score || 0}%</span>
            </div>
            <div className="info-item">
              <span>💻</span>
              <span className="info-label">Skills Found:</span>
              <span className="info-value">{parsedData.skills?.length || 0}</span>
            </div>
            <div className="info-item">
              <span>🏆</span>
              <span className="info-label">Summary:</span>
              <span className="info-value">
                {parsedData.summary && parsedData.summary !== 'Not found' 
                  ? (parsedData.summary.length > 100 
                      ? `${parsedData.summary.substring(0, 100)}...` 
                      : parsedData.summary)
                  : 'Not provided'}
              </span>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="results-card">
          <div className="card-header">
            <span>💻</span>
            <span>Technical Skills ({parsedData.skills?.length || 0})</span>
          </div>
          {parsedData.skills?.length > 0 ? (
            <div className="skills-grid">
              {parsedData.skills.slice(0, 20).map((skill, i) => (
                <div key={i} className="skill-chip">
                  {skill}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">
              No technical skills detected. Consider adding a skills section.
            </p>
          )}
        </div>

        {/* Professional Information - Experience */}
        <div className="results-card">
          <div className="card-header">
            <span>💼</span>
            <span>Professional Experience</span>
          </div>
          <div className="info-item experience-level">
            <span>📈</span>
            <span className="info-label">Level:</span>
            <span className="info-value">{parsedData.experience_level || 'Not specified'}</span>
          </div>
          
          {parsedData.experience_details?.length > 0 ? (
            parsedData.experience_details.map((exp, i) => (
              <div key={i} className="experience-item">
                <div className="experience-header">
                  <div className="job-title">{exp.job_title}</div>
                  <div className="company-name">{exp.company}</div>
                  <div className="job-details">
                    {exp.location} • {exp.duration}
                  </div>
                </div>
                {exp.responsibilities?.length > 0 && (
                  <ul className="responsibilities-list">
                    {exp.responsibilities.slice(0, 3).map((resp, j) => (
                      <li key={j}>{resp}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          ) : (
            <p className="empty-state">
              No detailed work experience found. Add specific roles and achievements.
            </p>
          )}
        </div>

        {/* Education */}
        <div className="results-card">
          <div className="card-header">
            <span>🎓</span>
            <span>Education</span>
          </div>
          {parsedData.education?.length > 0 ? (
            parsedData.education.map((edu, i) => (
              <div key={i} className="education-item">
                <div className="education-degree">{edu.degree}</div>
                <div className="education-institution">{edu.institution}</div>
                <div className="education-details">
                  {edu.year} {edu.gpa_score && edu.gpa_score !== 'Not specified' && `• ${edu.gpa_score}`}
                </div>
              </div>
            ))
          ) : (
            <p className="empty-state">
              No education information found.
            </p>
          )}
        </div>

        {/* Projects */}
        <div className="results-card">
          <div className="card-header">
            <span>💻</span>
            <span>Projects ({parsedData.projects?.length || 0})</span>
          </div>
          {parsedData.projects?.length > 0 ? (
            parsedData.projects.map((project, i) => (
              <div key={i} className="project-item">
                <div className="project-title">{project.title}</div>
                <div className="tech-stack">
                  {project.technologies?.slice(0, 5).map((tech, j) => (
                    <div key={j} className="tech-chip">{tech}</div>
                  ))}
                </div>
                {project.project_link && project.project_link !== 'Not found' && (
                  <div className="project-link">
                    {renderLink(project.project_link, 'View Project', '🔗')}
                  </div>
                )}
                <p className="project-description">
                  {project.description?.length > 150 
                    ? `${project.description.substring(0, 150)}...` 
                    : project.description}
                </p>
              </div>
            ))
          ) : (
            <p className="empty-state">
              No projects found. Add relevant projects to showcase your skills.
            </p>
          )}
        </div>

        {/* Extra Qualities */}
        <div className="results-card">
          <div className="card-header">
            <span>❤️</span>
            <span>Additional Qualities</span>
          </div>
          
          {/* Languages */}
          {parsedData.languages?.length > 0 && (
            <div className="quality-section">
              <div className="quality-header">
                <span>🌐</span>
                <span>Languages:</span>
              </div>
              <div className="skills-grid">
                {parsedData.languages.map((lang, i) => (
                  <div key={i} className="skill-chip language-chip">
                    {lang}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          {parsedData.achievements?.length > 0 && (
            <div className="quality-section">
              <div className="quality-header">
                <span>🏆</span>
                <span>Achievements:</span>
              </div>
              <ul className="achievements-list">
                {parsedData.achievements.slice(0, 3).map((achievement, i) => (
                  <li key={i}>{achievement}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Hobbies */}
          {parsedData.hobbies?.length > 0 && (
            <div className="quality-section">
              <div className="quality-header">
                <span>❤️</span>
                <span>Interests:</span>
              </div>
              <div className="skills-grid">
                {parsedData.hobbies.slice(0, 5).map((hobby, i) => (
                  <div key={i} className="skill-chip hobby-chip">
                    {hobby}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!parsedData.languages?.length && !parsedData.achievements?.length && !parsedData.hobbies?.length && (
            <p className="empty-state">
              No additional qualities found. Consider adding languages, achievements, or interests.
            </p>
          )}
        </div>
      </div>

      {/* JD Matching Section - Only show if job description was provided */}
      {analysis.job_description && (
        <>
          <h2 className="section-title">
            📊 Job Description Matching Analysis
          </h2>
          
          <div className="results-grid">
            {/* Keywords Analysis */}
            <div className="results-card">
              <div className="card-header">
                <span>✅</span>
                <span>Keywords Analysis</span>
              </div>
              
              {keywordsAnalysis.present_keywords?.length > 0 && (
                <div className="keywords-section">
                  <h4 className="keywords-title present">
                    <span>✅</span>
                    Present Keywords ({keywordsAnalysis.present_keywords.length})
                  </h4>
                  <div className="keywords-grid">
                    {keywordsAnalysis.present_keywords.slice(0, 10).map((keyword, i) => (
                      <div key={i} className="keyword-chip present">
                        {keyword}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {keywordsAnalysis.missing_keywords?.length > 0 && (
                <div className="keywords-section">
                  <h4 className="keywords-title missing">
                    <span>❌</span>
                    Missing Keywords ({keywordsAnalysis.missing_keywords.length})
                  </h4>
                  <div className="keywords-grid">
                    {keywordsAnalysis.missing_keywords.slice(0, 10).map((keyword, i) => (
                      <div key={i} className="keyword-chip missing">
                        {keyword}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Job Role Predictions */}
            <div className="results-card">
              <div className="card-header">
                <span>📈</span>
                <span>Role Match Predictions</span>
              </div>
              <div className="chart-container bar-chart">
                <Bar data={roleChartData} options={roleChartOptions} />
              </div>
            </div>

            {/* Similarity Scores */}
            <div className="results-card" id = "Similarity">
              <div className="card-header">
                <span>🎯</span>
                <span>JD Matching Scores</span>
              </div>
              <div className="similarity-scores">
                <div className="similarity-score">
                  <div className="similarity-score-value">{similarityScores.combined_score || 0}%</div>
                  <div className="similarity-score-label">Combined Score</div>
                </div>
                <div className="similarity-score">
                  <div className="similarity-score-value">{similarityScores.tfidf_similarity || 0}%</div>
                  <div className="similarity-score-label">Content Match</div>
                </div>
                <div className="similarity-score">
                  <div className="similarity-score-value">{similarityScores.keyword_similarity || 0}%</div>
                  <div className="similarity-score-label">Keyword Match</div>
                </div>
              </div>
            </div>

            {/* Detailed Role Analysis */}
            {detailedRoleAnalysis?.length > 0 && (
              <div className="results-card">
                <div className="card-header">
                  <span>🔍</span>
                  <span>Detailed Role Analysis</span>
                </div>
                {detailedRoleAnalysis.map((role, i) => (
                  <div key={i} className="role-analysis-item">
                    <div className="role-match-score">{role.match_score}% Match</div>
                    <div className="role-name">{role.role}</div>
                    <div className="role-description">{role.description}</div>
                    <div className="role-details">
                      <div className="role-detail-item">
                        <div className="role-detail-label">Required Skills</div>
                        <div className="role-detail-value">{role.required_skills?.join(', ')}</div>
                      </div>
                      <div className="role-detail-item">
                        <div className="role-detail-label">Experience Level</div>
                        <div className="role-detail-value">{role.experience_level}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Optimization Tips */}
            {optimizationTips?.length > 0 && (
              <div className="results-card">
                <div className="card-header">
                  <span>💡</span>
                  <span>Optimization Tips</span>
                </div>
                <ul className="tips-list">
                  {optimizationTips.map((tip, i) => (
                    <li key={i} className="tip-item">
                      <span className="tip-icon">💡</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}

      {/* CTA Section */}
      <div className="cta-section">
        <button onClick={onResumeBuilder} className="cta-button">
          <span>🎨</span>
          Build Enhanced Resume
        </button>
      </div>
    </div>
  );
}

export default AnalysisResults;