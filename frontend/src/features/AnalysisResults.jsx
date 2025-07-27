import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js"
import { Doughnut } from "react-chartjs-2"
import "../styles/AnalysisResults.css"
import { Link } from "react-router-dom"

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

function AnalysisResults({ analysis }) {
  const getProgressColor = (score) => {
    if (score >= 90) return "#10b981"
    if (score >= 80) return "#3b82f6"
    if (score >= 70) return "#f59e0b"
    return "#ef4444"
  }

  const parsedData = analysis?.parsed_data || {}
  const analysisResults = analysis?.analysis_results || {}
  const rolePredictions = analysisResults?.role_predictions || {}
  const similarityScores = analysisResults?.similarity_scores || {}
  const atsScore = analysis?.ats_score || 0
  const education = analysis.education ? JSON.parse(analysis.education) : []
  const recommendations = analysis.recommendations || []

  const processedEducation = education.map((edu) => {
    if (typeof edu === "string") {
      const collegeMatch = edu.match(/^(.*?)(?=\d{4}|$)/)
      const college = collegeMatch ? collegeMatch[0].trim() : "Not specified"

      const yearMatch = edu.match(/(\d{4}\s*(?:-|to)\s*\d{4})/)
      const years = yearMatch ? yearMatch[0] : "Not specified"

      const degreeMatch = edu.match(/$$(.*?)$$/)
      const degree = degreeMatch ? degreeMatch[1] : "Not specified"

      const scoreMatch = edu.match(/(?:CGPA|GPA|Score)[^\d]*(\d+\.?\d*)/i)
      const score = scoreMatch ? `CGPA ${scoreMatch[1]}` : "Not specified"

      return { college, years, degree, score }
    }
    return edu
  })

  const atsChartData = {
    datasets: [
      {
        data: [atsScore, 100 - atsScore],
        backgroundColor: ["#3b82f6", "#e5e7eb"],
        borderWidth: 0,
        cutout: "70%",
      },
    ],
  }

  const atsDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    cutout: "70%",
  }

  return (
    <div className="analysis-dashboard">
      <div className="analysis-content">
        <div className="header-section">
          <h1>Resume Analysis Dashboard</h1>
        </div>

        <div className="candidate-overview">
          <div className="candidate-card">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <h2>Candidate Profile</h2>
            <div className="candidate-details">
              <h3>{parsedData.name || "Not provided"}</h3>
              <p className="top-role">{rolePredictions.roles?.[0] || "Role not predicted"}</p>
              <div className="match-score">
                <span>JD Match</span>
                <span className="score-value">{similarityScores.combined_score?.toFixed(1) || 0}%</span>
              </div>
              <div className="skills-count">
                <span>Skills Found</span>
                <span className="count-value">{parsedData.skills?.length || 0}</span>
              </div>
            </div>
          </div>

          <div className="ats-score-card">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <h3>ATS Compatibility Score</h3>
            <div className="ats-score-container">
              <div className="ats-doughnut-chart">
                <Doughnut data={atsChartData} options={atsDoughnutOptions} />
                <div className="ats-score-overlay">
                  <span className="score-value">{atsScore.toFixed(1)}</span>
                  <span className="score-label">/ 100</span>
                </div>
              </div>
              <div className="score-description">
                {atsScore >= 90
                  ? "Excellent"
                  : atsScore >= 80
                    ? "Very Good"
                    : atsScore >= 70
                      ? "Good"
                      : atsScore >= 60
                        ? "Fair"
                        : "Needs Improvement"}
              </div>
            </div>
          </div>
        </div>

        <div className="analysis-sections">
          <div className="main-section">
            <div className="personal-info-section">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <h3>Personal Information</h3>
              <div className="info-grid">
                <div>
                  <label>Full Name</label>
                  <p>{parsedData.name || "Not provided"}</p>
                </div>
                <div>
                  <label>Email Address</label>
                  <p>{parsedData.email || "Not provided"}</p>
                </div>
                <div>
                  <label>Phone Number</label>
                  <p>{parsedData.phone || "Not provided"}</p>
                </div>
                <div>
                  <label>LinkedIn</label>
                  <p>{parsedData.linkedin || "Not mentioned"}</p>
                </div>
              </div>
            </div>

            <div className="score-breakdown-section">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <h3>Score Breakdown</h3>
              <div className="vertical-score-breakdown">
                {[
                  { label: "Contact Info", value: 3.0 },
                  { label: "Experience & Education", value: 16.0 },
                  { label: "Skills & Keywords", value: 16.6 },
                  { label: "Formatting & Structure", value: 12.0 },
                  { label: "Achievements", value: 10.0 },
                  { label: "Customization", value: 2.8 },
                ].map((item, index) => (
                  <div key={index} className="score-item">
                    <div className="score-label">
                      <span>{item.label}</span>
                      <span className="score-value">{item.value}</span>
                    </div>
                    <div className="progress-container">
                      <div
                        className="progress-bar"
                        style={{
                          width: `${(item.value / 20) * 100}%`,
                          backgroundColor: getProgressColor(item.value * 5),
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="role-predictions-section">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <h3>AI-Powered Role Predictions</h3>
              <div className="role-predictions">
                {rolePredictions.roles?.map((role, i) => {
                  const score = rolePredictions.scores?.[i] || 0
                  return (
                    <div key={i} className="role-item">
                      <div className="role-info">
                        <span className="role-name">{role}</span>
                        <span className="role-score">{score.toFixed(1)}%</span>
                      </div>
                      <div className="progress-container">
                        <div
                          className="progress-bar"
                          style={{
                            width: `${score}%`,
                            backgroundColor: getProgressColor(score),
                          }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="education-section">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <h3>Education</h3>
              {processedEducation.length > 0 ? (
                <ul className="education-list">
                  {processedEducation.map((edu, i) => (
                    <li key={i}>
                      <p className="institution">{edu.college}</p>
                      <p className="years">{edu.years}</p>
                      <p className="degree">{edu.degree}</p>
                      <p className="score">{edu.score}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No education information found</p>
              )}
            </div>

            <div className="recommendations-section">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <h3>Recommendations</h3>
              <ul>
                {recommendations.slice(0, 5).map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>

            <div className="skills">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <h4>Top Skills</h4>
              {parsedData.skills?.length ? (
                <div className="skills-container">
                  <div className="skills-list">
                    {parsedData.skills.slice(0, 10).map((skill, i) => (
                      <span key={i} className="skill-badge">
                        {skill}
                        <span className="skill-index">{i + 1}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="no-skills">No skills identified</p>
              )}
            </div>
          </div>
        </div>

        <div className="next-steps">
          <h3>Recommended Next Steps</h3>
          <div className="steps-grid">
            <div className="step-card">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <h4>Quantify Achievements</h4>
              <p>
                Add specific metrics and numbers to your experience section to make your accomplishments more impactful
              </p>
            </div>
            <div className="step-card">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <h4>Emphasize Transferable Skills</h4>
              <p>Highlight skills that apply across different roles and industries to increase your versatility</p>
            </div>
            <div className="step-card">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <h4>Download Resources</h4>
              <p>Get our comprehensive resume templates and professional guides to enhance your application</p>
            </div>
          </div>
        </div>

        <Link to="/resume-builder" className="resume-builder-link">
          Build Enhanced Resume
        </Link>
      </div>
    </div>
  )
}

export default AnalysisResults
