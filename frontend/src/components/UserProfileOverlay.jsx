import React, { useState, useEffect } from "react";
import api from "../api";
import "../styles/UserProfile.css";

function UserProfileOverlay({ isOpen, onClose, username }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && username) {
      const fetchProfileData = async () => {
        try {
          setLoading(true);
          // Get combined profile data from backend
          const response = await api.get(`/api/user/profile-details/`);
          
          setProfileData(response.data);
          setError(null);
        } catch (err) {
          console.error("Failed to fetch profile data", err);
          setError("Failed to load profile data. Please try again.");
        } finally {
          setLoading(false);
        }
      };

      fetchProfileData();
    }
  }, [isOpen, username]);

  if (!isOpen) return null;

  return (
    <div className="profile-overlay">
      <div className="profile-overlay-content">
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        
        <h2>User Profile</h2>
        
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="profile-details">
            <div className="profile-header">
              <div className="avatar">
                {username[0]?.toUpperCase() || "U"}
              </div>
              <div className="user-info">
                <h3>{profileData?.full_name || username}</h3>
                <p className="user-type">
                  {profileData?.user_type === "HR" 
                    ? "HR Professional" 
                    : "Individual User"}
                </p>
              </div>
            </div>
            
            <div className="profile-section">
              <h4>Contact Information</h4>
              <p><strong>Email:</strong> {profileData?.email}</p>
              <p><strong>Mobile:</strong> {profileData?.mobile || "Not provided"}</p>
              <p><strong>Date of Birth:</strong> {profileData?.dob || "Not provided"}</p>
            </div>
            
            <div className="profile-section">
              <h4>Account Details</h4>
              <p><strong>Username:</strong> {username}</p>
              <p><strong>Member since:</strong> {new Date(profileData?.created_at).toLocaleDateString()}</p>
            </div>
            
            <div className="profile-actions">
              <button className="edit-button">Edit Profile</button>
              <button className="change-password-button">Change Password</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfileOverlay;