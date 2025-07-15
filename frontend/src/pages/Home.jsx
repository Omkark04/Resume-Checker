import { useEffect, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import "../styles/Home.css";

function Home() {
    const [username, setUsername] = useState("");

    useEffect(() => {
        api.get("/api/user/profile/")
            .then((res) => {
                setUsername(res.data.username);
            })
            .catch((err) => {
                console.error("Failed to fetch user profile", err);
            });
    }, []);

    return (
        <div className="home-clean">
            <Navbar />
            <div className="home-content">
                <h2 className="welcome-text">Welcome to CareerPulse</h2>
                <h4 className="welcome-text">Hi there, {username}</h4>
            </div>
        </div>
    );
}

export default Home;