import { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";

const safeUser = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw || raw === "undefined" || raw === "null") return null;
    return JSON.parse(raw);
  } catch { return null; }
};

const toYMD = (d) => new Date(d).toISOString().slice(0, 10);

export default function Dashboard() {
  const [user] = useState(safeUser());
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [streak, setStreak] = useState({
    currentStreak: 0,
    bestStreak: 0,
    lastNoteDate: null,
  });
  const [error, setError] = useState("");

  const normalize = (data) =>
    Array.isArray(data) ? data : Array.isArray(data?.notes) ? data.notes : [];

  const recalcStreak = (list, uid) => {
    const mine = (list || []).filter((n) => n.userId === uid);
    const days = [...new Set(mine.map((n) => toYMD(n.createdAt)))].sort();
    if (days.length === 0) return setStreak({ currentStreak: 0, bestStreak: 0, lastNoteDate: null });

    const last = days[days.length - 1];
    const today = toYMD(new Date());

    // devam eden seri
    let cur = 0;
    let d = new Date(today);
    const has = new Set(days);
    while (has.has(toYMD(d))) {
      cur++;
      d.setDate(d.getDate() - 1);
    }

    // en iyi seri
    let best = 1, run = 1;
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i - 1]);
      prev.setDate(prev.getDate() + 1);
      if (toYMD(prev) === days[i]) run++; else run = 1;
      if (run > best) best = run;
    }

    setStreak({ currentStreak: cur, bestStreak: best, lastNoteDate: last });
  };

  useEffect(() => {
    (async () => {
      try {
        const r = await axios.get("/api/notes");
        const list = normalize(r.data);
        setNotes(list);
        if (user) recalcStreak(list, user.id);
      } catch (e) {
        setError(e.response?.data?.message || e.message);
        setNotes([]);
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !newNote.trim()) return;
    try {
      const r = await axios.post("/api/notes", {
        userId: user.id,
        content: newNote.trim(),
      });
      const created = r.data; // {id,userId,username,content,createdAt}
      setNotes((prev) => [created, ...(prev || [])]);
      setNewNote("");
      recalcStreak([created, ...(notes || [])], user.id);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    }
  };

  const list = Array.isArray(notes) ? notes : [];
  const todaySent = !!list.find(
    (n) => n.userId === user?.id && toYMD(n.createdAt) === toYMD(new Date())
  );

  return (
    <div className="dashboard">
      {/* Streak kutusu */}
      <section className="streak-card">
        <h2>Gün Serisi</h2>
        {todaySent ? (
          <p>🔥 Bugün not gönderildi</p>
        ) : (
          <>
            <p>📄 Seriyi devam ettirmek için bir not gönder</p>
            <button onClick={() => setNewNote("Bugün de buradayım!")} className="fix-btn">
              🔥 Seriyi Düzelt
            </button>
          </>
        )}
        <div className="streak-stats">
          <span>Mevcut: {streak.currentStreak}</span>
          <span>En iyi: {streak.bestStreak}</span>
          <span>Son gün: {streak.lastNoteDate || "-"}</span>
        </div>
      </section>

      {/* Not gönder */}
      <section className="note-form">
        <h2>Bir Not Bırak</h2>
        <form onSubmit={handleSubmit}>
          <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} />
          <button type="submit">Notu Gönder</button>
        </form>
        {error && <div className="error">{error}</div>}
      </section>

      {/* Son notlar */}
      <section className="notes-list">
        <h2>Son Notlar</h2>
        {list.length === 0 ? (
          <p>Henüz not yok. İlk sen başlat! 🔥</p>
        ) : (
          list.map((note) => (
            <div key={note.id} className="note-card">
              <div className="note-header">
                <span className="note-author">{note.username || "Bilinmiyor"} tarafından</span>
                <span className="note-date">{new Date(note.createdAt).toLocaleString()}</span>
              </div>
              <p className="note-content">{note.content}</p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
