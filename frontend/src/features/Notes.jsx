// src/pages/Notes.jsx
import { useState, useEffect } from "react";
import api from "../api";
import "../styles/AdvancedNotes.css";
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
      })
      .catch((err) => console.error("Error fetching notes:", err));
  };

  const deleteNote = (id) => {
    api
      .delete(`/api/notes/delete/${id}/`)
      .then((res) => {
        if (res.status === 204) {
          alert("Note deleted!");
          getNotes();
        }
      })
      .catch((error) => alert("Delete error: " + error));
  };

  const createNote = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("Please fill in both title and content.");
      return;
    }

    api
      .post("/api/notes/", { content, title })
      .then((res) => {
        if (res.status === 201) {
          alert("Note created!");
          getNotes();
          setTitle("");
          setContent("");
        }
      })
      .catch((err) => alert("Create error: " + err));
  };

  return (
    <div className="notes-app">
      <Navbar />

      <div className="notes-container">
        {/* Header */}
        <h2 className="notes-title"> Your Notes</h2>

        {/* Notes Grid */}
        <div className="notes-grid">
          {notes.length > 0 ? (
            notes.map((note) => {
              const formattedDate = new Date(note.created_at).toLocaleDateString("en-US", {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
              return (
                <div key={note.id} className="note-card animate-slide-up">
                  <div className="note-content">
                    <h3 className="note-title">{note.title}</h3>
                    <p className="note-text">{note.content}</p>
                    <p className="note-date">{formattedDate}</p>
                  </div>
                  <button
                    className="delete-button"
                    onClick={() => deleteNote(note.id)}
                    aria-label="Delete note"
                  >
                    🗑️ Delete
                  </button>
                </div>
              );
            })
          ) : (
            <div className="empty-state animate-fade-in">
              <p>No notes found. Create your first note below!</p>
            </div>
          )}
        </div>

        {/* Create Note Section */}
        <div className="create-note-section">
          <h3 className="create-title"> Create New Note</h3>
          <form onSubmit={createNote} className="note-form">
            <input
              type="text"
              id="title"
              name="title"
              placeholder="Note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="form-input"
            />
            <textarea
              placeholder="Your note content..."
              id="content"
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="form-textarea"
            />
            <button type="submit" className="submit-button">
              Add Note
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Notes;