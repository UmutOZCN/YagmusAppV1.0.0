import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./Dashboard.css";

/** Güvenli user okuma (login/register sonrası localStorage'a yazıyoruz) */
function safeUser() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw || raw === "undefined" || raw === "null") return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Tarihi YYYY-MM-DD’e indirger */
const toYMD = (d) => new Date(d).toISOString().slice(0, 10);

export default function Dashboard() {
  const [user] = useState(safeUser()); // user: { userId, username, createdAt }
  const [notes, setNotes] = useState([]); // {id,userId,username,content,createdAt}[]
  const [newNote, setNewNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /** Notları getir */
  const fetchNotes = async () => {
    try {
      setLoading(true);
      const r = await axios.get("/api/notes");
      const list = Array.isArray(r.data) ? r.data : Array.isArray(r.data?.notes) ? r.data.notes : [];
      setNotes(list);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Beklenmeyen hata");
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  /** Bugünkü notu göndermek */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return setError("Önce giriş yapmalısın.");
    if (!newNote.trim()) return;

    try {
      setLoading(true);
      // DİKKAT: backend şu anda body'de userId bekliyor.
      const { data: created } = await axios.post("/api/notes", {
        userId: user.userId, // <- server.js 'userId' alanıyla uyumlu (repoda 'id' değil) 
        content: newNote.trim(),
      });
      setNotes((prev) => [created, ...(prev || [])]);
      setNewNote("");
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Not gönderilemedi");
    } finally {
      setLoading(false);
    }
  };

  /** Partner kim? (toplam iki kullanıcı olduğunu biliyoruz) */
  const partner = useMemo(() => {
    if (!user) return null;
    // notlar üzerinden farklı userId'yi bul
    const other = (notes || []).find((n) => n.userId !== user.userId);
    return other ? { userId: other.userId, username: other.username || "Partner" } : null;
  }, [notes, user]);

  /** “Streak” mantığı:
   *  Bir gün “sayılır” olması için O GÜN en az 1 not SEN + 1 not PARTNER olmalı.
   *  currentStreak: bugünden geriye doğru kesintisiz gün sayısı
   *  bestStreak: geçmişteki en uzun seri
   */
  const { currentStreak, bestStreak, lastDayBoth } = useMemo(() => {
    if (!user) return { currentStreak: 0, bestStreak: 0, lastDayBoth: null };
    const byDay = new Map(); // "YYYY-MM-DD" -> Set<userId>
    for (const n of notes || []) {
      const d = toYMD(n.createdAt);
      if (!byDay.has(d)) byDay.set(d, new Set());
      byDay.get(d).add(n.userId);
    }
    // İki kullanıcıyı gün bazında bulmak için kimler var bak
    const allUserIds = new Set((notes || []).map((n) => n.userId));
    if (!allUserIds.has(user.userId) || allUserIds.size < 2) {
      // Partner henüz hiç not atmamışsa seri oluşmaz
      return { currentStreak: 0, bestStreak: 0, lastDayBoth: null };
    }
    const ids = [...allUserIds];
    const secondId = ids.find((id) => id !== user.userId);
    if (!secondId) return { currentStreak: 0, bestStreak: 0, lastDayBoth: null };

    const days = [...byDay.keys()].sort(); // artan
    const bothDays = days.filter((d) => {
      const set = byDay.get(d);
      return set.has(user.userId) && set.has(secondId);
    });

    if (bothDays.length === 0) return { currentStreak: 0, bestStreak: 0, lastDayBoth: null };

    // bestStreak hesapla
    let best = 1, run = 1;
    for (let i = 1; i < bothDays.length; i++) {
      const prev = new Date(bothDays[i - 1]);
      prev.setDate(prev.getDate() + 1);
      if (toYMD(prev) === bothDays[i]) run++;
      else run = 1;
      if (run > best) best = run;
    }

    // currentStreak (bugünden geriye)
    let cur = 0;
    let d = new Date(); // bugün
    while (bothDays.includes(toYMD(d))) {
      cur++;
      d.setDate(d.getDate() - 1);
    }

    return { currentStreak: cur, bestStreak: best, lastDayBoth: bothDays[bothDays.length - 1] };
  }, [notes, user]);

  const list = Array.isArray(notes) ? notes : [];
  const iSentToday = list.some((n) => n.userId === user?.userId && toYMD(n.createdAt) === toYMD(new Date()));
  const partnerSentToday = partner
    ? list.some((n) => n.userId === partner.userId && toYMD(n.createdAt) === toYMD(new Date()))
    : false;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/"; // App.js guard'ı login'e düşürecek
  };

  return (
    <div className="dashboard">
      {/* Üst bilgi */}
      <header className="dash-header">
        <div>
          <h1>Yağmuş</h1>
          <p>Hoş geldin, <strong>{user?.username}</strong> 💜</p>
          {partner && <p>Partner: <strong>{partner.username}</strong></p>}
        </div>
        <button className="logout" onClick={handleLogout}>Çıkış Yap</button>
      </header>

      {/* Streak kutusu */}
      <section className="streak-card">
        <h2>Gün Serisi</h2>

        {iSentToday && partnerSentToday ? (
          <div className="streak-ok">Bugün ikiniz de not gönderdiniz. Seri devam ediyor! 🔥</div>
        ) : (
          <div className="streak-warn">
            {iSentToday ? "Partnerin henüz not göndermedi." : "Bugün sen henüz not göndermedin."}
          </div>
        )}

        <div className="streak-stats">
          <span>Mevcut: <strong>{currentStreak}</strong></span>
          <span>En iyi: <strong>{bestStreak}</strong></span>
          <span>Son ikinizin günü: <strong>{lastDayBoth || "-"}</strong></span>
        </div>
      </section>

      {/* Not gönderme */}
      <section className="compose-card">
        <h2>Bir Not Bırak</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            placeholder="Bugün ne hissettin? 💌"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
            maxLength={500}
          />
          <button type="submit" disabled={loading || !newNote.trim()}>
            {loading ? "Gönderiliyor..." : "Notu Gönder"}
          </button>
        </form>
        {error && <div className="error">{error}</div>}
      </section>

      {/* Not listesi */}
      <section className="notes-list">
        <h2>Son Notlar</h2>
        {list.length === 0 ? (
          <p>Henüz not yok. İlk sen başlat! ✨</p>
        ) : (
          list.map((note) => (
            <div key={note.id} className={"note-card" + (note.userId === user?.userId ? " mine" : "")}>
              <div className="note-header">
                <span className="note-author">{note.username || "Bilinmiyor"}</span>
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
