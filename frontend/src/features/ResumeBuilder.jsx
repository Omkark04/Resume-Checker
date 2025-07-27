import React, { useState, useEffect, useContext } from "react";
import "../styles/ResumeBuilder.css";
import Navbar from "../components/Navbar";
import { useResume } from "../features/ResumeContext";
import { useNavigate } from "react-router-dom";
import api from "../api";
import ResumeTemplates from './ResumeTemplates';
import { saveAs } from 'file-saver';

function ResumeBuilder() {
  const { analysisResult } = useResume();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedResumeId, setSavedResumeId] = useState(null);
  const [generatedTemplates, setGeneratedTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState({});
  const [theme, setTheme] = useState('light');

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
  
  const [formData, setFormData] = useState({
    personalDetails: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      linkedIn: "",
      github: "",
      portfolio: ""
    },
    summary: "",
    skills: [{ name: "", level: "" }],
    experience: [{
      jobTitle: "",
      company: "",
      location: "",
      duration: "",
      responsibilities: [""]
    }],
    education: [{
      institution: "",
      degree: "",
      year: "",
      grade: ""
    }],
    projects: [{
      title: "",
      description: "",
      techStack: "",
      githubLink: ""
    }],
    languages: [""],
    interests: [""],
    profile_pic: ""
  });

  // Helper function to safely convert to array
  const toArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return [data];
  };

  // Load analysis data into form when component mounts or analysisResult changes
  useEffect(() => {
    if (analysisResult && analysisResult.parsed_data) {
      const parsed = analysisResult.parsed_data;
      
      // Safely process all data fields
      const newFormData = {
        personalDetails: {
          fullName: parsed.name || "",
          email: parsed.email || "",
          phone: parsed.phone || "",
          location: parsed.location || "",
          linkedIn: parsed.linkedin || "",
          github: parsed.github || "",
          portfolio: parsed.portfolio || ""
        },
        summary: parsed.summary || parsed.objective || "",
        skills: toArray(parsed.skills).map(skill => ({
          name: typeof skill === 'string' ? skill : skill.name || "",
          level: skill.level || ""
        })) || [{ name: "", level: "" }],
        experience: toArray(parsed.experience).map(exp => ({
          jobTitle: exp.title || exp.jobTitle || "",
          company: exp.company || "",
          location: exp.location || "",
          duration: exp.duration || exp.years || "",
          responsibilities: toArray(exp.description || exp.responsibilities || [""])
        })),
        education: toArray(parsed.education).map(edu => ({
          institution: edu.college || edu.institution || "",
          degree: edu.degree || "",
          year: edu.years || edu.year || "",
          grade: edu.score || edu.grade || ""
        })),
        projects: toArray(parsed.projects).map(proj => ({
          title: proj.title || "",
          description: proj.description || "",
          techStack: proj.tech_stack || proj.techStack || "",
          githubLink: proj.link || proj.githubLink || ""
        })),
        languages: toArray(parsed.languages),
        interests: toArray(parsed.interests),
        profile_pic: ""
      };

      // Ensure at least one item in each array field
      if (newFormData.skills.length === 0) newFormData.skills = [{ name: "", level: "" }];
      if (newFormData.experience.length === 0) newFormData.experience = [{
        jobTitle: "",
        company: "",
        location: "",
        duration: "",
        responsibilities: [""]
      }];
      if (newFormData.education.length === 0) newFormData.education = [{
        institution: "",
        degree: "",
        year: "",
        grade: ""
      }];
      if (newFormData.projects.length === 0) newFormData.projects = [{
        title: "",
        description: "",
        techStack: "",
        githubLink: ""
      }];
      if (newFormData.languages.length === 0) newFormData.languages = [""];
      if (newFormData.interests.length === 0) newFormData.interests = [""];

      setFormData(newFormData);
    }
  }, [analysisResult]);

  const handleChange = (section, index, field, value) => {
    const updatedData = { ...formData };
    if (index !== undefined) {
      updatedData[section][index][field] = value;
    } else {
      updatedData[section][field] = value;
    }
    setFormData(updatedData);
  };

  const handleArrayChange = (section, index, subIndex, value) => {
    const updatedData = { ...formData };
    updatedData[section][index].responsibilities[subIndex] = value;
    setFormData(updatedData);
  };

  const addItem = (section) => {
    const updatedData = { ...formData };
    const template = {
      skills: { name: "", level: "" },
      experience: {
        jobTitle: "",
        company: "",
        location: "",
        duration: "",
        responsibilities: [""]
      },
      education: {
        institution: "",
        degree: "",
        year: "",
        grade: ""
      },
      projects: {
        title: "",
        description: "",
        techStack: "",
        githubLink: ""
      },
      languages: "",
      interests: ""
    };
    updatedData[section].push(template[section]);
    setFormData(updatedData);
  };

  const removeItem = (section, index) => {
    const updatedData = { ...formData };
    updatedData[section].splice(index, 1);
    setFormData(updatedData);
  };

  const addResponsibility = (expIndex) => {
    const updatedData = { ...formData };
    updatedData.experience[expIndex].responsibilities.push("");
    setFormData(updatedData);
  };

  const removeResponsibility = (expIndex, respIndex) => {
    const updatedData = { ...formData };
    updatedData.experience[expIndex].responsibilities.splice(respIndex, 1);
    setFormData(updatedData);
  };

  // Enhanced submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError(null);
      
      // First save the resume data to database
      const resumeData = {
        full_name: formData.personalDetails.fullName,
        email: formData.personalDetails.email,
        phone: formData.personalDetails.phone,
        location: formData.personalDetails.location,
        linkedin_url: formData.personalDetails.linkedIn,
        github_url: formData.personalDetails.github,
        portfolio_url: formData.personalDetails.portfolio,
        summary: formData.summary,
        profile_pic: formData.profile_pic,
        skills: formData.skills,
        experiences: formData.experience.map(exp => ({
          job_title: exp.jobTitle,
          company: exp.company,
          location: exp.location,
          duration: exp.duration,
          responsibilities: exp.responsibilities.map(resp => ({ description: resp }))
        })),
        educations: formData.education,
        projects: formData.projects,
        languages: formData.languages.map(lang => ({ name: lang })),
        interests: formData.interests.map(int => ({ name: int }))
      };

      // Save resume data
      const saveResponse = await api.post('/api/resumes/', resumeData);
      setSavedResumeId(saveResponse.data.id);
      
      console.log('Resume saved successfully:', saveResponse.data);
      
      // Now generate and store templates
      await generateTemplates(saveResponse.data.id);
      
    } catch (error) {
      console.error('Error saving resume:', error);
      setError(error.response?.data || 'Failed to save resume');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate templates function
  const generateTemplates = async (resumeId = null) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Prepare data for template generation
      const generationData = {
        ...formData,
        resume_id: resumeId || savedResumeId
      };
      
      const response = await api.post('/api/resumes/generate-and-store/', generationData);
      
      if (response.data.success) {
        setGeneratedTemplates(response.data.templates);
        setShowTemplates(true);
        console.log('Templates generated successfully:', response.data);
      } else {
        throw new Error(response.data.error || 'Failed to generate templates');
      }
      
    } catch (error) {
      console.error('Error generating templates:', error);
      setError(error.response?.data?.error || error.message || 'Failed to generate templates');
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Download function for generated templates
  const downloadGeneratedResume = async (templateId, templateName) => {
    try {
      setDownloadLoading(prev => ({...prev, [templateId]: true}));
      
      const response = await api.get(
        `/api/resumes/download/${templateId}/`,
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      saveAs(blob, `${templateName}_resume.pdf`);
      
      // Update download count in local state
      setGeneratedTemplates(prev => 
        prev.map(template => 
          template.id === templateId 
            ? { ...template, download_count: template.download_count + 1 }
            : template
        )
      );
      
    } catch (err) {
      setError(err.response?.data?.error || 'Download failed');
    } finally {
      setDownloadLoading(prev => ({...prev, [templateId]: false}));
    }
  };

  // Handle profile picture upload
  const handleProfilePicture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({
          ...formData,
          profile_pic: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackToAnalysis = () => {
    navigate(-1);
  };

  const handleReset = () => {
    setFormData({
      personalDetails: {
        fullName: "",
        email: "",
        phone: "",
        location: "",
        linkedIn: "",
        github: "",
        portfolio: ""
      },
      summary: "",
      skills: [{ name: "", level: "" }],
      experience: [{
        jobTitle: "",
        company: "",
        location: "",
        duration: "",
        responsibilities: [""]
      }],
      education: [{
        institution: "",
        degree: "",
        year: "",
        grade: ""
      }],
      projects: [{
        title: "",
        description: "",
        techStack: "",
        githubLink: ""
      }],
      languages: [""],
      interests: [""],
      profile_pic: ""
    });
    setGeneratedTemplates([]);
    setShowTemplates(false);
    setSavedResumeId(null);
    setError(null);
  };

  // Helper function to get template info
  const getTemplateInfo = (templateName) => {
    const templateDescriptions = {
      modern: {
        title: "Modern Design",
        description: "Clean layout with sidebar and circular profile picture"
      },
      classic: {
        title: "Classic Design", 
        description: "Traditional format with profile picture at top"
      },
      minimalist: {
        title: "Minimalist Design",
        description: "Simple and compact layout without profile picture"
      }
    };
    return templateDescriptions[templateName] || { title: templateName, description: '' };
  };

  return (
    <div className={`resume-templates-container ${theme}`}>
      <Navbar/>
      
      <div className="builder-header">
        <h1>Create Your Perfect Resume</h1>
        <p className="builder-subtitle">Build a professional resume that stands out and gets you noticed by employers</p>
        {analysisResult && (
          <button 
            onClick={handleBackToAnalysis}
            className="back-to-analysis-btn"
          >
            ← Back to Analysis
          </button>
        )}
      </div>
      
      {error && (
        <div className="error-message">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <div>
              <h4>Oops! Something went wrong</h4>
              <p>{error}</p>
            </div>
          </div>
          <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="resume-form">
        {/* Personal Details */}
        <section className="form-section">
          <div className="section-header">
            <h2>👋 Personal Information</h2>
            <p>Let's start with the basics - tell us about yourself</p>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={formData.personalDetails.fullName}
                onChange={(e) => handleChange("personalDetails", undefined, "fullName", e.target.value)}
                required
                placeholder="John Doe"
              />
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                value={formData.personalDetails.email}
                onChange={(e) => handleChange("personalDetails", undefined, "email", e.target.value)}
                required
                placeholder="john.doe@email.com"
              />
            </div>
            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                value={formData.personalDetails.phone}
                onChange={(e) => handleChange("personalDetails", undefined, "phone", e.target.value)}
                required
                placeholder="8293193245"
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={formData.personalDetails.location}
                onChange={(e) => handleChange("personalDetails", undefined, "location", e.target.value)}
                placeholder="New York, NY"
              />
            </div>
            <div className="form-group">
              <label>LinkedIn Profile</label>
              <input
                type="url"
                value={formData.personalDetails.linkedIn}
                onChange={(e) => handleChange("personalDetails", undefined, "linkedIn", e.target.value)}
                placeholder="https://linkedin.com/in/johndoe"
              />
            </div>
            <div className="form-group">
              <label>GitHub Profile</label>
              <input
                type="url"
                value={formData.personalDetails.github}
                onChange={(e) => handleChange("personalDetails", undefined, "github", e.target.value)}
                placeholder="https://github.com/johndoe"
              />
            </div>
            <div className="form-group">
              <label>Portfolio Website</label>
              <input
                type="url"
                value={formData.personalDetails.portfolio}
                onChange={(e) => handleChange("personalDetails", undefined, "portfolio", e.target.value)}
                placeholder="https://johndoe.com"
              />
            </div>
            <div className="form-group">
              <label>Profile Picture</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePicture}
                className="file-input"
              />
              {formData.profile_pic && (
                <div className="profile-pic-preview">
                  <img src={formData.profile_pic} alt="Profile Preview" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="form-section">
          <div className="section-header">
            <h2>✨ Professional Summary</h2>
            <p>Write a compelling summary that highlights your unique value proposition</p>
          </div>
          <div className="form-group">
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({...formData, summary: e.target.value})}
              rows="4"
              placeholder="I am a passionate and results-driven professional with X years of experience in [your field]. I excel at [key skills] and have successfully [major achievements]. I'm looking to bring my expertise in [relevant areas] to help [type of company] achieve their goals..."
            />
          </div>
        </section>

        {/* Skills */}
        <section className="form-section">
          <div className="section-header">
            <h2>🎯 Skills & Expertise</h2>
            <p>Showcase the skills that make you stand out from the crowd</p>
          </div>
          {formData.skills.map((skill, index) => (
            <div key={index} className="skill-group">
              <div className="form-grid">
                <div className="form-group">
                  <label>Skill Name</label>
                  <input
                    type="text"
                    value={skill.name}
                    onChange={(e) => handleChange("skills", index, "name", e.target.value)}
                    placeholder="e.g., JavaScript, Leadership, Data Analysis"
                  />
                </div>
                <div className="form-group">
                  <label>Proficiency Level</label>
                  <select
                    value={skill.level}
                    onChange={(e) => handleChange("skills", index, "level", e.target.value)}
                  >
                    <option value="">Choose your level</option>
                    <option value="Beginner">Beginner - Learning the basics</option>
                    <option value="Intermediate">Intermediate - Comfortable using</option>
                    <option value="Advanced">Advanced - Highly proficient</option>
                    <option value="Expert">Expert - Can teach others</option>
                  </select>
                </div>
              </div>
              {index > 0 && (
                <button type="button" className="remove-btn" onClick={() => removeItem("skills", index)}>
                  Remove Skill
                </button>
              )}
            </div>
          ))}
          <button type="button" className="add-btn" onClick={() => addItem("skills")}>
            <span>+</span> Add Another Skill
          </button>
        </section>

        {/* Experience */}
        <section className="form-section">
          <div className="section-header">
            <h2>💼 Work Experience</h2>
            <p>Share your professional journey and highlight your achievements</p>
          </div>
          {formData.experience.map((exp, expIndex) => (
            <div key={expIndex} className="experience-group">
              <div className="form-grid">
                <div className="form-group">
                  <label>Job Title</label>
                  <input
                    type="text"
                    value={exp.jobTitle}
                    onChange={(e) => handleChange("experience", expIndex, "jobTitle", e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>
                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => handleChange("experience", expIndex, "company", e.target.value)}
                    placeholder="e.g., Google, Microsoft, Startup Inc."
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={exp.location}
                    onChange={(e) => handleChange("experience", expIndex, "location", e.target.value)}
                    placeholder="e.g., San Francisco, CA or Remote"
                  />
                </div>
                <div className="form-group">
                  <label>Duration</label>
                  <input
                    type="text"
                    value={exp.duration}
                    onChange={(e) => handleChange("experience", expIndex, "duration", e.target.value)}
                    placeholder="e.g., Jan 2020 - Present or 2 years"
                  />
                </div>
              </div>
              
              <div className="responsibilities-section">
                <h4>🎯 Key Responsibilities & Achievements</h4>
                {exp.responsibilities.map((resp, respIndex) => (
                  <div key={respIndex} className="responsibility-group">
                    <div className="form-group">
                      <textarea
                        value={resp}
                        onChange={(e) => handleArrayChange("experience", expIndex, respIndex, e.target.value)}
                        rows="2"
                        placeholder="• Led a team of 5 developers to build a web application that increased user engagement by 40%"
                      />
                      {exp.responsibilities.length > 1 && (
                        <button
                          type="button"
                          className="remove-btn small"
                          onClick={() => removeResponsibility(expIndex, respIndex)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="add-btn small"
                  onClick={() => addResponsibility(expIndex)}
                >
                  <span>+</span> Add Achievement
                </button>
              </div>
              
              {expIndex > 0 && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeItem("experience", expIndex)}
                >
                  Remove This Experience
                </button>
              )}
            </div>
          ))}
          <button type="button" className="add-btn" onClick={() => addItem("experience")}>
            <span>+</span> Add Work Experience
          </button>
        </section>

        {/* Education */}
        <section className="form-section">
          <div className="section-header">
            <h2>🎓 Education</h2>
            <p>Share your educational background and academic achievements</p>
          </div>
          {formData.education.map((edu, index) => (
            <div key={index} className="education-group">
              <div className="form-grid">
                <div className="form-group">
                  <label>Institution</label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => handleChange("education", index, "institution", e.target.value)}
                    placeholder="e.g., Harvard University, MIT, Local Community College"
                  />
                </div>
                <div className="form-group">
                  <label>Degree</label>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => handleChange("education", index, "degree", e.target.value)}
                    placeholder="e.g., Bachelor of Computer Science, MBA"
                  />
                </div>
                <div className="form-group">
                  <label>Year of Graduation</label>
                  <input
                    type="text"
                    value={edu.year}
                    onChange={(e) => handleChange("education", index, "year", e.target.value)}
                    placeholder="e.g., 2020 or 2016-2020"
                  />
                </div>
                <div className="form-group">
                  <label>GPA / Grade</label>
                  <input
                    type="text"
                    value={edu.grade}
                    onChange={(e) => handleChange("education", index, "grade", e.target.value)}
                    placeholder="e.g., 3.8/4.0 or First Class Honors"
                  />
                </div>
              </div>
              {index > 0 && (
                <button type="button" className="remove-btn" onClick={() => removeItem("education", index)}>
                  Remove Education
                </button>
              )}
            </div>
          ))}
          <button type="button" className="add-btn" onClick={() => addItem("education")}>
            <span>+</span> Add Education
          </button>
        </section>

        {/* Projects */}
        <section className="form-section">
          <div className="section-header">
            <h2>🚀 Projects</h2>
            <p>Showcase your best work and personal projects</p>
          </div>
          {formData.projects.map((project, index) => (
            <div key={index} className="project-group">
              <div className="form-grid">
                <div className="form-group">
                  <label>Project Title</label>
                  <input
                    type="text"
                    value={project.title}
                    onChange={(e) => handleChange("projects", index, "title", e.target.value)}
                    placeholder="e.g., E-commerce Platform, Mobile App, Data Visualization"
                  />
                </div>
                <div className="form-group">
                  <label>Technologies Used</label>
                  <input
                    type="text"
                    value={project.techStack}
                    onChange={(e) => handleChange("projects", index, "techStack", e.target.value)}
                    placeholder="e.g., React, Node.js, Python, AWS"
                  />
                </div>
                <div className="form-group">
                  <label>Project Link</label>
                  <input
                    type="url"
                    value={project.githubLink}
                    onChange={(e) => handleChange("projects", index, "githubLink", e.target.value)}
                    placeholder="https://github.com/username/project or https://myproject.com"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Project Description</label>
                <textarea
                  value={project.description}
                  onChange={(e) => handleChange("projects", index, "description", e.target.value)}
                  rows="3"
                  placeholder="Built a full-stack e-commerce platform that handles 1000+ daily transactions. Implemented secure payment processing, real-time inventory management, and responsive design. Achieved 99.9% uptime and improved user experience by 50%."
                />
              </div>
              {index > 0 && (
                <button type="button" className="remove-btn" onClick={() => removeItem("projects", index)}>
                  Remove Project
                </button>
              )}
            </div>
          ))}
          <button type="button" className="add-btn" onClick={() => addItem("projects")}>
            <span>+</span> Add Project
          </button>
        </section>

        {/* Languages */}
        <section className="form-section">
          <div className="section-header">
            <h2>🌍 Languages</h2>
            <p>List the languages you speak and your proficiency level</p>
          </div>
          {formData.languages.map((language, index) => (
            <div key={index} className="language-group">
              <div className="form-group">
                <input
                  type="text"
                  value={language}
                  onChange={(e) => {
                    const updatedLanguages = [...formData.languages];
                    updatedLanguages[index] = e.target.value;
                    setFormData({...formData, languages: updatedLanguages});
                  }}
                  placeholder="e.g., English (Native), Spanish (Conversational), French (Basic)"
                />
                {index > 0 && (
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeItem("languages", index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          <button type="button" className="add-btn" onClick={() => addItem("languages")}>
            <span>+</span> Add Language
          </button>
        </section>

        {/* Interests */}
        <section className="form-section">
          <div className="section-header">
            <h2>🎨 Interests & Hobbies</h2>
            <p>Share what you're passionate about outside of work</p>
          </div>
          {formData.interests.map((interest, index) => (
            <div key={index} className="interest-group">
              <div className="form-group">
                <input
                  type="text"
                  value={interest}
                  onChange={(e) => {
                    const updatedInterests = [...formData.interests];
                    updatedInterests[index] = e.target.value;
                    setFormData({...formData, interests: updatedInterests});
                  }}
                  placeholder="e.g., Photography, Hiking, Volunteer Work, Playing Guitar"
                />
                {index > 0 && (
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeItem("interests", index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          <button type="button" className="add-btn" onClick={() => addItem("interests")}>
            <span>+</span> Add Interest
          </button>
        </section>

        <div className="form-actions">
          <button 
            type="submit" 
            className={`submit-btn ${isSaving || isLoading ? 'loading' : ''}`}
            disabled={isSaving || isLoading}
          >
            {isSaving ? (
              <>
                <span className="spinner"></span>
                Saving Your Resume...
              </>
            ) : isLoading ? (
              <>
                <span className="spinner"></span>
                Creating Templates...
              </>
            ) : (
              <>
                <span>✨</span>
                Create My Resume Templates
              </>
            )}
          </button>
          <button type="button" className="reset-btn" onClick={handleReset}>
            <span>🔄</span>
            Start Over
          </button>
          {savedResumeId && !showTemplates && (
            <button 
              type="button" 
              className="generate-btn"
              onClick={() => generateTemplates()}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Generating...
                </>
              ) : (
                <>
                  <span>🎨</span>
                  Generate Templates
                </>
              )}
            </button>
          )}
        </div>
      </form>
      
      {/* Enhanced Templates Display */}
      {showTemplates && generatedTemplates.length > 0 && (
        <div className="templates-section">
          <div className="templates-header">
            <h2>🎉 Your Resume Templates Are Ready!</h2>
            <p>Choose from these professionally designed templates and download your favorite</p>
          </div>
          <div className="templates-grid">
            {generatedTemplates.map((template) => (
              <div key={template.id} className="template-card">
                <div className="template-header">
                  <h3>{template.template_info.title}</h3>
                  <div className="template-type-badge">
                    {template.template_name.charAt(0).toUpperCase() + template.template_name.slice(1)}
                  </div>
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
                        <span className="preview-icon">📄</span>
                        <div>
                          <div className="placeholder-title">Template Preview</div>
                          <div className="placeholder-subtitle">Professional Design</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="template-actions">
                  <button
                    className="download-btn"
                    onClick={() => downloadGeneratedResume(template.id, template.template_name)}
                    disabled={downloadLoading[template.id]}
                  >
                    {downloadLoading[template.id] ? (
                      <>
                        <span className="spinner small"></span>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <span>📥</span>
                        Download PDF
                      </>
                    )}
                  </button>
                </div>
                
                <div className="template-meta">
                  <div className="meta-item">
                    <span className="meta-icon">📊</span>
                    <span className="meta-text">{template.download_count} downloads</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">🕒</span>
                    <span className="meta-text">
                      {new Date(template.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="templates-stats">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <div className="stat-number">{generatedTemplates.length}</div>
                <div className="stat-label">Templates Created</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📥</div>
              <div className="stat-info">
                <div className="stat-number">
                  {generatedTemplates.reduce((sum, t) => sum + t.download_count, 0)}
                </div>
                <div className="stat-label">Total Downloads</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✨</div>
              <div className="stat-info">
                <div className="stat-number">
                  {new Set(generatedTemplates.map(t => t.template_name)).size}
                </div>
                <div className="stat-label">Unique Styles</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Keep the original ResumeTemplates component for backwards compatibility */}
      <ResumeTemplates resumeData={formData} />
    </div>
  );
}

export default ResumeBuilder;