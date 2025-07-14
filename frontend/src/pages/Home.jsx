import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

function Home() {
    const navigate = useNavigate();

    const handleNavigate = () => {
        navigate("/notes");
    };

    return (
        <div className="home-clean">
            <h1>Welcome to CareerPulse</h1>
            <button className="notes-button" onClick={handleNavigate}>
                Go to Notes
            </button>
        </div>
    );
}

export default Home;
