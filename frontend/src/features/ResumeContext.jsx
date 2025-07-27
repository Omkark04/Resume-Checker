import React, { createContext, useState, useContext } from 'react';

const ResumeContext = createContext();

export const ResumeProvider = ({ children }) => {
    const [resumeData, setResumeData] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    
    return (
        <ResumeContext.Provider 
            value={{ 
                resumeData, 
                setResumeData, 
                analysisResult, 
                setAnalysisResult 
            }}
        >
            {children}
        </ResumeContext.Provider>
    );
};

export const useResume = () => useContext(ResumeContext);