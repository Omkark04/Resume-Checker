// src/components/UserProfileOverlay.jsx
import React, { useState, useEffect } from "react";
import api from "../api";

function UserProfileOverlay({ isOpen, onClose, username }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null); // State to hold fetch errors

  useEffect(() => {
    if (isOpen && username) {
      const fetchProfile = async () => {
        try {
          setLoading(true); // Ensure loading is true at the start
          setFetchError(null); // Clear previous errors
          const res = await api.get("/api/user/profile-details/");
          console.log("Fetched profile data:", res.data); // Debug: Log the response
          setProfileData(res.data);
        } catch (err) {
          console.error("Failed to load profile", err);
          // Set a user-friendly error message
          setFetchError("Could not load profile details. Please try again later.");
          // Optionally, you might want to set profileData to null or an empty object here too
          // setProfileData(null);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [isOpen, username]);

  if (!isOpen) return null;

  return (
    // ✅ Full-screen overlay with responsive centering
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(135deg, #4f46e5, #ec4899, #8b5cf6, #06b6d4)",
        backgroundSize: "300% 300%",
        animation: "gradientShift 8s ease-in-out infinite alternate",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px", // 👉 Prevents edge overflow
        boxSizing: "border-box",
      }}
      onClick={onClose}
    >
      {/* ✅ Responsive Modal */}
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "linear-gradient(145deg, #ffffff, #f8fafd)",
          borderRadius: "24px",
          padding: "40px 24px",
          position: "relative",
          boxShadow: "0 25px 60px rgba(79, 70, 229, 0.3)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          maxHeight: "90vh",
          overflowY: "auto", // ✅ Scroll if content is too tall
          transform: "scale(1)",
          opacity: 1,
          transition: "all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1.5)",
        }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        {/* ✕ Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            width: "40px",
            height: "40px",
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            borderRadius: "50%",
            fontSize: "1.5rem",
            fontWeight: "bold",
            cursor: "pointer",
            zIndex: 10,
            backdropFilter: "blur(6px)",
            color: "#4f46e5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "rotate(90deg) scale(1.1)";
            e.target.style.background = "rgba(236, 72, 153, 0.2)";
            e.target.style.color = "#ec4899";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "";
            e.target.style.background = "rgba(255, 255, 255, 0.2)";
            e.target.style.color = "#4f46e5";
          }}
        >
          ✕
        </button>
        {/* 👤 Header */}
        <div
          style={{
            textAlign: "center",
            padding: "70px 16px 30px",
            background: "linear-gradient(135deg, #4f46e5, #ec4899)",
            color: "white",
            borderRadius: "20px 20px 0 0",
            marginTop: "-40px",
            marginBottom: "28px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Glow */}
          <div
            style={{
              position: "absolute",
              width: "200%",
              height: "200%",
              background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
              top: "-50%",
              left: "-50%",
              animation: "pulseGlow 3s infinite",
              pointerEvents: "none",
            }}
          ></div>
          {/* Avatar */}
          <div
            style={{
              width: "80px",
              height: "80px",
              background: "rgba(255, 255, 255, 0.25)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.2rem",
              fontWeight: "bold",
              margin: "0 auto 14px",
              backdropFilter: "blur(8px)",
              border: "3px solid rgba(255, 255, 255, 0.3)",
              boxShadow: "0 8px 20px rgba(0, 0, 0, 0.1)",
            }}
          >
            {username?.[0]?.toUpperCase() || "U"}
          </div>
          <h2
            style={{
              margin: "0 0 6px 0",
              fontSize: "1.6rem",
              fontWeight: "700",
              textShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
          >
            {username}
          </h2>
          <p style={{ margin: 0, opacity: 0.9, fontSize: "0.95rem" }}>
            Welcome back!
          </p>
        </div>
        {/* 📄 Content */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "4px solid #e0e0e0",
                borderTop: "4px solid #4f46e5",
                borderRadius: "50%",
                margin: "0 auto 16px",
                animation: "spin 0.8s linear infinite",
              }}
            ></div>
            <p style={{ color: "#6b7280", fontWeight: 500 }}>Loading profile...</p>
          </div>
        ) : fetchError ? ( // Display error message if fetch failed
           <div style={{ textAlign: "center", padding: "60px 20px" }}>
             <p style={{ color: "#ef4444", fontWeight: 500, fontSize: "1.1rem" }}>{fetchError}</p>
             <p style={{ color: "#6b7280", marginTop: "10px" }}>Check console for details.</p>
           </div>
        ) : (
          <div>
            {/* Contact Info */}
            <div style={{ marginBottom: "24px" }}>
              <h3
                style={{
                  color: "#4f46e5",
                  margin: "0 0 16px 0",
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                📬 Contact Information
              </h3>
              {/* Ensure email is displayed or show 'Not set' */}
              <div
                style={{
                  padding: "12px 16px",
                  background: "#f8fafd",
                  borderRadius: "12px",
                  border: "1px solid rgba(79, 70, 229, 0.1)",
                  marginBottom: "10px",
                  fontSize: "0.95rem",
                }}
              >
                <strong style={{ color: "#4b5563" }}>Email:</strong>{" "}
                <span style={{ color: "#1e293b", fontWeight: 500 }}>
                  {profileData?.email || profileData?.user?.email || "Not set"} {/* Check common paths */}
                </span>
              </div>
              {[
                // { label: "Email", value: profileData?.email }, // Moved above
                { label: "Mobile", value: profileData?.mobile || "Not set" },
                { label: "Date of Birth", value: profileData?.dob || "Not set" },
              ].map((item, i) => (
                <div
                  key={i} /* Added key for list items */
                  style={{
                    padding: "12px 16px",
                    background: "#f8fafd",
                    borderRadius: "12px",
                    border: "1px solid rgba(79, 70, 229, 0.1)",
                    marginBottom: "10px",
                    fontSize: "0.95rem",
                  }}
                >
                  <strong style={{ color: "#4b5563" }}>{item.label}:</strong>{" "}
                  <span style={{ color: "#1e293b", fontWeight: 500 }}>{item.value}</span>
                </div>
              ))}
            </div>
            {/* Account Info */}
            <div style={{ marginBottom: "24px" }}>
              <h3
                style={{
                  color: "#4f46e5",
                  margin: "0 0 16px 0",
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                ⚙️ Account Details
              </h3>
              {[
                { label: "Username", value: username },
                {
                  label: "Member Since",
                  value: profileData?.created_at
                    ? new Date(profileData.created_at).toLocaleDateString()
                    : "Unknown",
                },
              ].map((item, i) => (
                <div
                  key={i} /* Added key for list items */
                  style={{
                    padding: "12px 16px",
                    background: "#f8fafd",
                    borderRadius: "12px",
                    border: "1px solid rgba(79, 70, 229, 0.1)",
                    marginBottom: "10px",
                    fontSize: "0.95rem",
                  }}
                >
                  <strong style={{ color: "#4b5563" }}>{item.label}:</strong>{" "}
                  <span style={{ color: "#1e293b", fontWeight: 500 }}>{item.value}</span>
                </div>
              ))}
            </div>
            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
              <button
                style={{
                  flex: 1,
                  padding: "14px",
                  border: "none",
                  borderRadius: "14px",
                  background: "linear-gradient(90deg, #4f46e5, #7e22ce)",
                  color: "white",
                  fontWeight: "600",
                  fontSize: "1rem",
                  cursor: "pointer",
                  boxShadow: "0 6px 15px rgba(79, 70, 229, 0.3)",
                  minWidth: "130px",
                }}
              >
                ✏️ Edit
              </button>
              <button
                style={{
                  flex: 1,
                  padding: "14px",
                  border: "none",
                  borderRadius: "14px",
                  background: "linear-gradient(90deg, #f97316, #ec4899)",
                  color: "white",
                  fontWeight: "600",
                  fontSize: "1rem",
                  cursor: "pointer",
                  boxShadow: "0 6px 15px rgba(236, 72, 153, 0.3)",
                  minWidth: "130px",
                }}
              >
                🔑 Password
              </button>
            </div>
          </div>
        )}
      </div>
      {/* 💡 Inline Animations */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes pulseGlow {
            0% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.1); }
            100% { opacity: 0.4; transform: scale(1); }
          }
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
          }
          /* Mobile: Prevent zoom on focus */
          input, button {
            font-size: 16px;
          }
        `}
      </style>
    </div>
  );
}

export default UserProfileOverlay;