import { useState, useEffect } from "react";
import api from "../api";
import "../styles/Notes.css";

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
        <div className="notes-container">
            <h2>Your Notes</h2>
            {notes.length > 0 ? (
                notes.map((note) => {
                    const formattedDate = new Date(note.created_at).toLocaleDateString("en-US");
                    return (
                        <div className="note-container" key={note.id}>
                            <p className="note-title">{note.title}</p>
                            <p className="note-content">{note.content}</p>
                            <p className="note-date">{formattedDate}</p>
                            <button
                                className="delete-button"
                                onClick={() => deleteNote(note.id)}
                            >
                                Delete
                            </button>
                        </div>
                    );
                })
            ) : (
                <p>No notes found.</p>
            )}

            <h3>Create a New Note</h3>
            <form onSubmit={createNote} className="note-form">
                <input
                    type="text"
                    id="title"
                    name="title"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
                <textarea
                    placeholder="Content"
                    id="content"
                    name="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                />
                <button type="submit">Add Note</button>
            </form>
        </div>
    );
}

export default Notes;
