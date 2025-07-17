import { useState, useEffect } from "react";
import api from "../api";
import "../styles/Notes.css";
import Navbar from "../components/Navbar";

function Notes() {
    const [notes, setNotes] = useState([]);
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");

    useEffect(() => {
        getNotes();
    }, []);

    const getNotes = () => {
        api
            .get("/api/notes/")
            .then((res) => {
                setNotes(res.data);
                console.log(res.data);
            })
            .catch((err) => alert("Error fetching notes: " + err));
    };

    const deleteNote = (id) => {
        api
            .delete(`/api/notes/delete/${id}/`)
            .then((res) => {
                if (res.status === 204) alert("Note deleted!");
                else alert("Failed to delete note.");
                getNotes();
            })
            .catch((error) => alert("Delete error: " + error));
    };

    const createNote = (e) => {
        e.preventDefault();
        api
            .post("/api/notes/", { content, title })
            .then((res) => {
                if (res.status === 201) alert("Note created!");
                else alert("Failed to create note.");
                getNotes();
                setTitle("");
                setContent("");
            })
            .catch((err) => alert("Create error: " + err));
    };

    return (
        <div className="notes-app">
            <Navbar />
            <div className="notes-container">
                <h2 className="notes-title">Your Notes</h2>
                
                <div className="notes-grid">
                    {notes.length > 0 ? (
                        notes.map((note) => {
                            const formattedDate = new Date(note.created_at).toLocaleDateString("en-US", {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                            return (
                                <div className="note-card" key={note.id}>
                                    <div className="note-content">
                                        <h3 className="note-title">{note.title}</h3>
                                        <p className="note-text">{note.content}</p>
                                        <p className="note-date">{formattedDate}</p>
                                    </div>
                                    <button
                                        className="delete-button glow-on-hover"
                                        onClick={() => deleteNote(note.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            );
                        })
                    ) : (
                        <div className="empty-state">
                            <p>No notes found. Create your first note below!</p>
                        </div>
                    )}
                </div>

                <div className="create-note-section">
                    <h3 className="create-title">Create New Note</h3>
                    <form onSubmit={createNote} className="note-form">
                        <input
                            type="text"
                            id="title"
                            name="title"
                            placeholder="Note title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="form-input glow-on-focus"
                        />
                        <textarea
                            placeholder="Your note content..."
                            id="content"
                            name="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                            className="form-textarea glow-on-focus"
                        />
                        <button type="submit" className="submit-button glow-on-hover">
                            Add Note
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Notes;