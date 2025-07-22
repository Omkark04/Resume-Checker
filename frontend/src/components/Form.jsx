import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/Form.css";
import LoadingIndicator from "./LoadingIndicator";

function Form({ route, route2, method }) {
    const [username, setUsername] = useState("");
    const [full_name, setFullname] = useState("");
    const [user_type, setUsertype] = useState("Individual");
    const [email, setEmail] = useState("");
    const [mobile, setMobile] = useState("");
    const [dob, setDob] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const name = method === "login" ? "Login" : "Register";

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        try {
            if (method === "login") {
                const res = await api.post(route, { username, password });
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
                navigate("/");
            } else {
                // Register flow - send all data to the register endpoint
                const userData = {
                    username,
                    password,
                    full_name,
                    email,
                    mobile,
                    dob,
                    user_type
                };
                const res = await api.post(route, userData);
                if (res.data.status) {
                    navigate("/login");
                } else {
                    alert(res.data.errors || "Registration failed");
                }
            }
        } catch (error) {
            alert(error.response?.data?.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form-container">
            <h1>{name}</h1>
            
            {/* Always visible fields */}
            <input
                className="form-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
            />
            
            <input
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
            />

            {/* Only show these fields for registration */}
            {method === "register" && (
                <>
                    <input
                        className="form-input"
                        type="text"
                        value={full_name}
                        onChange={(e) => setFullname(e.target.value)}
                        placeholder="Full Name"
                        required
                    />
                    
                    <select
                        className="form-input"
                        value={user_type}
                        onChange={(e) => setUsertype(e.target.value)}
                        required
                    >
                        <option value="Individual">Individual User</option>
                        <option value="HR">HR Professional</option>
                    </select>
                    
                    <input
                        className="form-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        required
                    />
                    
                    <input
                        className="form-input"
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="Mobile Number"
                        required
                    />
                    
                    <label className="form-label">Date of Birth</label>
                    <input
                        className="form-input"
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        required
                    />
                </>
            )}

            {loading && <LoadingIndicator />}
            
            <button className="form-button" type="submit">
                {name}
            </button>

            {method === "login" ? (
                <p className="form-footer">
                    Don't have an account? <a href="/register">Register</a>
                </p>
            ) : (
                <p className="form-footer">
                    Already have an account? <a href="/login">Login</a>
                </p>
            )}
        </form>
    );
}

export default Form;