import React from 'react';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Link, ExternalLink, MapPin, Phone, Mail, Linkedin, Github, 
         Briefcase, GraduationCap, Code, Award, Languages, Heart, 
         TrendingUp, Target, CheckCircle, XCircle, Lightbulb } from 'lucide-react';

// Register ChartJS components
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function AnalysisResults({ analysis }) {
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
        className="text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors"
      >
        {icon}
        <span className="truncate">{text || url}</span>
        <ExternalLink size={14} />
      </a>
    );
  };

  return (
    <div className="enhanced-analysis-results">
      <style jsx>{`
        .enhanced-analysis-results {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1e1b4b 100%);
          min-height: 100vh;
          color: #e2e8f0;
        }

        .results-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .results-title {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(90deg, #4f46e5, #ec4899, #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        }

        .results-subtitle {
          font-size: 1.2rem;
          color: #94a3b8;
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .results-card {
          background: rgba(30, 41, 59, 0.8);
          backdrop-filter: blur(16px);
          border-radius: 20px;
          padding: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .results-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent, rgba(79, 70, 229, 0.1), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .results-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(79, 70, 229, 0.3);
        }

        .results-card:hover::before {
          opacity: 1;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .ats-score-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .chart-container {
          position: relative;
          width: 200px;
          height: 200px;
        }

        .score-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .big-score {
          font-size: 2.5rem;
          font-weight: 800;
          color: #e2e8f0;
        }

        .score-out-of {
          font-size: 1rem;
          color: #94a3b8;
        }

        .score-badge {
          padding: 0.5rem 1.5rem;
          border-radius: 50px;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.9rem;
          letter-spacing: 0.05em;
        }

        .score-badge.excellent {
          background: linear-gradient(90deg, #10b981, #059669);
          color: white;
        }

        .score-badge.very-good {
          background: linear-gradient(90deg, #3b82f6, #2563eb);
          color: white;
        }

        .score-badge.good {
          background: linear-gradient(90deg, #f59e0b, #d97706);
          color: white;
        }

        .score-badge.fair {
          background: linear-gradient(90deg, #f97316, #ea580c);
          color: white;
        }

        .score-badge.poor {
          background: linear-gradient(90deg, #ef4444, #dc2626);
          color: white;
        }

        .info-grid {
          display: grid;
          gap: 1rem;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          transition: background 0.2s ease;
        }

        .info-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .info-label {
          font-weight: 500;
          color: #94a3b8;
          min-width: 80px;
        }

        .info-value {
          color: #e2e8f0;
          flex: 1;
        }

        .skills-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .skill-chip {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
          transition: transform 0.2s ease;
        }

        .skill-chip:hover {
          transform: translateY(-2px);
        }

        .experience-item {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1rem;
          border-left: 4px solid #4f46e5;
        }

        .experience-header {
          margin-bottom: 1rem;
        }

        .job-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #e2e8f0;
        }

        .company-name {
          color: #4f46e5;
          font-weight: 500;
        }

        .job-details {
          color: #94a3b8;
          font-size: 0.9rem;
          margin-top: 0.25rem;
        }

        .responsibilities-list {
          list-style: none;
          padding: 0;
          margin-top: 1rem;
        }

        .responsibilities-list li {
          padding: 0.25rem 0;
          color: #cbd5e1;
          position: relative;
          padding-left: 1.5rem;
        }

        .responsibilities-list li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: #4f46e5;
          font-weight: bold;
        }

        .project-item {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1rem;
          border-left: 4px solid #ec4899;
        }

        .project-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #e2e8f0;
          margin-bottom: 0.5rem;
        }

        .tech-stack {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin: 1rem 0;
        }

        .tech-chip {
          background: linear-gradient(135deg, #ec4899, #f97316);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
        }

        .keyword-chip {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
          margin: 0.25rem;
          transition: transform 0.2s ease;
        }

        .keyword-chip:hover {
          transform: translateY(-2px);
        }

        .keyword-present {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }

        .keyword-missing {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
        }

        .role-analysis-item {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1rem;
          border-left: 4px solid #06b6d4;
        }

        .role-match-score {
          font-size: 1.5rem;
          font-weight: 700;
          color: #06b6d4;
          margin-bottom: 0.5rem;
        }

        .role-description {
          color: #cbd5e1;
          margin-bottom: 1rem;
          line-height: 1.6;
        }

        .role-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .role-detail-item {
          background: rgba(255, 255, 255, 0.05);
          padding: 1rem;
          border-radius: 8px;
        }

        .role-detail-label {
          font-size: 0.8rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .role-detail-value {
          color: #e2e8f0;
          font-weight: 500;
        }

        .tips-list {
          list-style: none;
          padding: 0;
        }

        .tip-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          margin-bottom: 0.75rem;
          transition: background 0.2s ease;
        }

        .tip-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .tip-icon {
          color: #f59e0b;
          margin-top: 0.125rem;
          flex-shrink: 0;
        }

        .similarity-scores {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .similarity-score {
          text-align: center;
          background: rgba(255, 255, 255, 0.05);
          padding: 1rem;
          border-radius: 12px;
        }

        .similarity-score-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #4f46e5;
        }

        .similarity-score-label {
          font-size: 0.9rem;
          color: #94a3b8;
          margin-top: 0.25rem;
        }

        .cta-section {
          text-align: center;
          margin-top: 3rem;
        }

        .cta-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(90deg, #4f46e5, #ec4899);
          color: white;
          padding: 1rem 2rem;
          border-radius: 50px;
          text-decoration: none;
          font-weight: 600;
          font-size: 1.1rem;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px rgba(79, 70, 229, 0.3);
        }

        .cta-button:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 40px rgba(79, 70, 229, 0.5);
          background: linear-gradient(90deg, #4338ca, #db2777);
        }

        @media (max-width: 768px) {
          .enhanced-analysis-results {
            padding: 1rem;
          }
          
          .results-grid {
            grid-template-columns: 1fr;
          }
          
          .results-title {
            font-size: 2rem;
          }
          
          .chart-container {
            width: 150px;
            height: 150px;
          }
        }
      `}</style>

      <header className="results-header">
        <h1 className="results-title">🎯 Comprehensive Resume Analysis</h1>
        <p className="results-subtitle">Advanced AI-powered insights to maximize your career potential</p>
      </header>

      <div className="results-grid">
        {/* ATS Score */}
        <div className="results-card">
          <div className="card-header">
            <Target size={24} />
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
            <Mail size={24} />
            <span>Personal Information</span>
          </div>
          <div className="info-grid">
            <div className="info-item">
              <Mail size={18} />
              <span className="info-label">Name:</span>
              <span className="info-value">{parsedData.name || 'Not provided'}</span>
            </div>
            <div className="info-item">
              <Mail size={18} />
              <span className="info-label">Email:</span>
              <span className="info-value">{parsedData.email || 'Not provided'}</span>
            </div>
            <div className="info-item">
              <Phone size={18} />
              <span className="info-label">Phone:</span>
              <span className="info-value">{parsedData.phone || 'Not provided'}</span>
            </div>
            <div className="info-item">
              <MapPin size={18} />
              <span className="info-label">Location:</span>
              <span className="info-value">{parsedData.location || 'Not provided'}</span>
            </div>
            <div className="info-item">
              <Linkedin size={18} />
              <span className="info-label">LinkedIn:</span>
              <div className="info-value">
                {renderLink(parsedData.linkedin, 'LinkedIn Profile', <Linkedin size={16} />)}
              </div>
            </div>
            <div className="info-item">
              <Github size={18} />
              <span className="info-label">GitHub:</span>
              <div className="info-value">
                {renderLink(parsedData.github, 'GitHub Profile', <Github size={16} />)}
              </div>
            </div>
          </div>
        </div>

        {/* Overall Resume Analysis */}
        <div className="results-card">
          <div className="card-header">
            <TrendingUp size={24} />
            <span>Overall Resume Analysis</span>
          </div>
          <div className="info-grid">
            <div className="info-item">
              <Briefcase size={18} />
              <span className="info-label">Top Role:</span>
              <span className="info-value">{rolePredictions.roles?.[0] || 'Not determined'}</span>
            </div>
            <div className="info-item">
              <Target size={18} />
              <span className="info-label">JD Match:</span>
              <span className="info-value">{similarityScores.combined_score || 0}%</span>
            </div>
            <div className="info-item">
              <Code size={18} />
              <span className="info-label">Skills Found:</span>
              <span className="info-value">{parsedData.skills?.length || 0}</span>
            </div>
            <div className="info-item">
              <Award size={18} />
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
            <Code size={24} />
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
            <p style={{color: '#94a3b8', textAlign: 'center', padding: '2rem'}}>
              No technical skills detected. Consider adding a skills section.
            </p>
          )}
        </div>

        {/* Professional Information - Experience */}
        <div className="results-card">
          <div className="card-header">
            <Briefcase size={24} />
            <span>Professional Experience</span>
          </div>
          <div className="info-item" style={{marginBottom: '1rem'}}>
            <TrendingUp size={18} />
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
            <p style={{color: '#94a3b8', textAlign: 'center', padding: '2rem'}}>
              No detailed work experience found. Add specific roles and achievements.
            </p>
          )}
        </div>

        {/* Education */}
        <div className="results-card">
          <div className="card-header">
            <GraduationCap size={24} />
            <span>Education</span>
          </div>
          {parsedData.education?.length > 0 ? (
            parsedData.education.map((edu, i) => (
              <div key={i} className="experience-item">
                <div className="job-title">{edu.degree}</div>
                <div className="company-name">{edu.institution}</div>
                <div className="job-details">
                  {edu.year} {edu.gpa_score && edu.gpa_score !== 'Not specified' && `• ${edu.gpa_score}`}
                </div>
              </div>
            ))
          ) : (
            <p style={{color: '#94a3b8', textAlign: 'center', padding: '2rem'}}>
              No education information found.
            </p>
          )}
        </div>

        {/* Projects */}
        <div className="results-card">
          <div className="card-header">
            <Code size={24} />
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
                  <div style={{marginTop: '0.5rem'}}>
                    {renderLink(project.project_link, 'View Project', <ExternalLink size={16} />)}
                  </div>
                )}
                <p style={{color: '#cbd5e1', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: '1.5'}}>
                  {project.description?.length > 150 
                    ? `${project.description.substring(0, 150)}...` 
                    : project.description}
                </p>
              </div>
            ))
          ) : (
            <p style={{color: '#94a3b8', textAlign: 'center', padding: '2rem'}}>
              No projects found. Add relevant projects to showcase your skills.
            </p>
          )}
        </div>

        {/* Extra Qualities */}
        <div className="results-card">
          <div className="card-header">
            <Heart size={24} />
            <span>Additional Qualities</span>
          </div>
          
          {/* Languages */}
          {parsedData.languages?.length > 0 && (
            <div style={{marginBottom: '1.5rem'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem'}}>
                <Languages size={18} />
                <span style={{fontWeight: '500'}}>Languages:</span>
              </div>
              <div className="skills-grid">
                {parsedData.languages.map((lang, i) => (
                  <div key={i} className="skill-chip" style={{background: 'linear-gradient(135deg, #06b6d4, #0891b2)'}}>
                    {lang}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          {parsedData.achievements?.length > 0 && (
            <div style={{marginBottom: '1.5rem'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem'}}>
                <Award size={18} />
                <span style={{fontWeight: '500'}}>Achievements:</span>
              </div>
              <ul className="responsibilities-list">
                {parsedData.achievements.slice(0, 3).map((achievement, i) => (
                  <li key={i}>{achievement}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Hobbies */}
          {parsedData.hobbies?.length > 0 && (
            <div>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem'}}>
                <Heart size={18} />
                <span style={{fontWeight: '500'}}>Interests:</span>
              </div>
              <div className="skills-grid">
                {parsedData.hobbies.slice(0, 5).map((hobby, i) => (
                  <div key={i} className="skill-chip" style={{background: 'linear-gradient(135deg, #ec4899, #be185d)'}}>
                    {hobby}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!parsedData.languages?.length && !parsedData.achievements?.length && !parsedData.hobbies?.length && (
            <p style={{color: '#94a3b8', textAlign: 'center', padding: '2rem'}}>
              No additional qualities found. Consider adding languages, achievements, or interests.
            </p>
          )}
        </div>
      </div>

      {/* JD Matching Section - Only show if job description was provided */}
      {analysis.job_description && (
        <>
          <h2 style={{fontSize: '2rem', fontWeight: '700', textAlign: 'center', margin: '3rem 0 2rem', color: '#e2e8f0'}}>
            📊 Job Description Matching Analysis
          </h2>
          
          <div className="results-grid">
            {/* Keywords Analysis */}
            <div className="results-card">
              <div className="card-header">
                <CheckCircle size={24} />
                <span>Keywords Analysis</span>
              </div>
              
              {keywordsAnalysis.present_keywords?.length > 0 && (
                <div style={{marginBottom: '1.5rem'}}>
                  <h4 style={{color: '#10b981', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                    <CheckCircle size={18} />
                    Present Keywords ({keywordsAnalysis.present_keywords.length})
                  </h4>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
                    {keywordsAnalysis.present_keywords.slice(0, 10).map((keyword, i) => (
                      <div key={i} className="keyword-chip keyword-present">
                        {keyword}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {keywordsAnalysis.missing_keywords?.length > 0 && (
                <div>
                  <h4 style={{color: '#ef4444', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                    <XCircle size={18} />
                    Missing Keywords ({keywordsAnalysis.missing_keywords.length})
                  </h4>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
                    {keywordsAnalysis.missing_keywords.slice(0, 10).map((keyword, i) => (
                      <div key={i} className="keyword-chip keyword-missing">
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
                <TrendingUp size={24} />
                <span>Role Match Predictions</span>
              </div>
              <div style={{height: '300px'}}>
                <Bar data={roleChartData} options={roleChartOptions} />
              </div>
            </div>

            {/* Similarity Scores */}
            <div className="results-card">
              <div className="card-header">
                <Target size={24} />
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
            {detailedRoleAnalysis.length > 0 && (
              <div className="results-card" style={{gridColumn: '1 / -1'}}>
                <div className="card-header">
                  <Briefcase size={24} />
                  <span>Detailed Role Analysis</span>
                </div>
                {detailedRoleAnalysis.slice(0, 3).map((role, i) => (
                  <div key={i} className="role-analysis-item">
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem'}}>
                      <h3 style={{color: '#e2e8f0', fontSize: '1.25rem', fontWeight: '600', margin: 0}}>
                        {role.role}
                      </h3>
                      <div className="role-match-score">{role.match_score}% Match</div>
                    </div>
                    <p className="role-description">{role.description}</p>
                    <div className="role-details">
                      <div className="role-detail-item">
                        <div className="role-detail-label">Key Skills</div>
                        <div className="role-detail-value">{role.key_skills?.join(', ')}</div>
                      </div>
                      <div className="role-detail-item">
                        <div className="role-detail-label">Growth Prospects</div>
                        <div className="role-detail-value">{role.growth_prospects}</div>
                      </div>
                      <div className="role-detail-item">
                        <div className="role-detail-label">Salary Range</div>
                        <div className="role-detail-value">{role.avg_salary}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Resume Optimization Tips */}
      <h2 style={{fontSize: '2rem', fontWeight: '700', textAlign: 'center', margin: '3rem 0 2rem', color: '#e2e8f0'}}>
        💡 Resume Optimization Tips
      </h2>
      
      <div className="results-grid">
        <div className="results-card" style={{gridColumn: '1 / -1'}}>
          <div className="card-header">
            <Lightbulb size={24} />
            <span>Personalized Recommendations</span>
          </div>
          
          {optimizationTips.length > 0 ? (
            <ul className="tips-list">
              {optimizationTips.slice(0, 8).map((tip, i) => (
                <li key={i} className="tip-item">
                  <Lightbulb size={18} className="tip-icon" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{color: '#94a3b8', textAlign: 'center', padding: '2rem'}}>
              No specific recommendations available. Your resume looks good overall!
            </p>
          )}
        </div>
      </div>

      {/* Analysis Summary */}
      {analysisResults.analysis_summary && (
        <div className="results-card" style={{marginTop: '2rem', textAlign: 'center'}}>
          <h3 style={{color: '#e2e8f0', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem'}}>
            📋 Analysis Summary
          </h3>
          <p style={{color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.6'}}>
            {analysisResults.analysis_summary}
          </p>
        </div>
      )}

      {/* Call to Action */}
      <div className="cta-section">
        <Link to="/resume-builder" className="cta-button">
          <Code size={20} />
          Build Enhanced Resume
        </Link>
      </div>
    </div>
  );
}

export default AnalysisResults;