import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

import { useEffect, useState } from "react";
import axios from "axios";

const safeParse = (key) => {
  const raw = localStorage.getItem(key);
  if (!raw || raw === "undefined" || raw === "null") return null;
  try { return JSON.parse(raw); } catch { return null; }
};

const toYMD = (d) => {
  if (!d) return "";
  if (typeof d === "number") return new Date(d).toISOString().slice(0,10);
  return String(d).slice(0,10);
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const u = safeParse("user");
    setUser(u);

    const load = async () => {
      try {
        // '/api/notes' mı '/notes' mu? Backend’ine göre tam yaz.
        const r = await axios.get("/api/notes"); 
        const data = Array.isArray(r.data) ? r.data :
                     Array.isArray(r.data?.notes) ? r.data.notes : [];
        setNotes(data);
      } catch (e) {
        setError(e.response?.data?.message || e.message);
        setNotes([]); // .some güvenli olsun
      }
    };

    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const today = new Date().toISOString().slice(0,10);
  const notesArr = Array.isArray(notes) ? notes : [];
  const hasSubmittedToday = user
    ? notesArr.some(n => n && n.userId === user.id && toYMD(n.date) === today)
    : false;

  if (error) return <div style={{color:"#c00"}}>Hata: {error}</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      {hasSubmittedToday ? "Bugün kayıt var ✅" : "Bugün kayıt yok"}
      {/* ... geri kalan içerik ... */}
    </div>
  );
}



const Dashboard = () => {
  const [notes, setNotes] = useState([]);
  const [streak, setStreak] = useState({ currentStreak: 0, bestStreak: 0, lastNoteDate: null });
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchNotes();
    fetchStreak();
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchNotes();
      fetchStreak();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await axios.get('/api/notes');
      setNotes(response.data);
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  };

  const fetchStreak = async () => {
    try {
      const response = await axios.get('/api/streak');
      setStreak(response.data);
    } catch (err) {
      console.error('Error fetching streak:', err);
    }
  };


  const handleSubmitNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || submitting) return;

    setSubmitting(true);
    try {
      await axios.post('/api/notes', { 
        content: newNote
      });
      
      setNewNote('');
      fetchNotes();
      fetchStreak();
    } catch (err) {
      console.error('Submit error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Not gönderilemedi';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFixStreak = async () => {
    if (fixing) return;
    
    setFixing(true);
    try {
      await axios.post('/api/streak/fix');
      fetchStreak();
      alert('Seri güncellendi!');
    } catch (err) {
      alert('Seri güncellenemedi: ' + (err.response?.data?.error || 'Bilinmeyen hata'));
    } finally {
      setFixing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };


  const formatDateTime = (createdAt) => {
    const date = new Date(createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    if (date.toDateString() === today.toDateString()) {
      return `Bugün ${timeStr}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Dün ${timeStr}`;
    } else {
      const dateStr = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
      return `${dateStr} ${timeStr}`;
    }
  };

  const hasSubmittedToday = notes.some(note => {
    const userData = localStorage.getItem('user');
    if (!userData) return false;
    const currentUser = JSON.parse(userData);
    return note.userId === currentUser.id && 
           note.date === new Date().toISOString().split('T')[0];
  });

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Yağmuş</h1>
          <span className="username">Merhaba, {user?.username}</span>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Çıkış
        </button>
      </header>

      <div className="dashboard-content">
        <div className="streak-card">
          <div className="streak-number">{streak.currentStreak}</div>
          <div className="streak-label">Gün Serisi</div>
          {streak.bestStreak > 0 && (
            <div className="best-streak">🏆 En iyi seri: {streak.bestStreak} gün</div>
          )}
          <div className="streak-subtitle">
            {hasSubmittedToday 
              ? '✅ Bugün notunu gönderdin!' 
              : '📝 Seriyi devam ettirmek için bir not gönder'}
          </div>
          <button onClick={handleFixStreak} disabled={fixing} className="fix-streak-button">
            {fixing ? 'Güncelleniyor...' : '🔥 Seriyi Düzelt'}
          </button>
        </div>

        <div className="note-form-card">
          <h2>Bir Not Bırak</h2>
          <form onSubmit={handleSubmitNote}>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Tatlı bir şeyler yaz..."
              disabled={submitting || hasSubmittedToday}
              rows={4}
            />
            {hasSubmittedToday && (
              <div className="info-message">
                ✅ Bugün zaten notunu gönderdin!
              </div>
            )}
            <button 
              type="submit" 
              disabled={submitting || !newNote.trim() || hasSubmittedToday}
              className="submit-note-button"
            >
              {submitting ? 'Gönderiliyor...' : 'Notu Gönder'}
            </button>
          </form>
        </div>

        <div className="notes-section">
          <h2 className="section-title">Son Notlar</h2>
          <div className="notes-list">
            {notes.length === 0 ? (
              <div className="empty-state">
                <p>Henüz not yok. İlk sen başlat! 🔥</p>
              </div>
            ) : (
              notes.map(note => (
                <div key={note.id} className="note-card">
                  <div className="note-header">
                    <span className="note-author">{note.username} tarafından</span>
                    <span className="note-date">{formatDateTime(note.createdAt)}</span>
                  </div>
                  <p className="note-content">{note.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

