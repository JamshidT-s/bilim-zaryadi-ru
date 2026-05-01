import { useState, useEffect } from "react";
import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  onSnapshot,
} from "firebase/firestore";

// ─── TILNI TANLASH (Shu yerni o'zgartirasiz) ─────────────────────────
// Rus tili uchun "ru" deb yozing. Ingliz tili uchun "en" deb yozing.
const LANG = "ru"; 
// ─────────────────────────────────────────────────────────────────────

const DICTIONARY = {
  ru: {
    title: "⚡ Заряд Знаний — Рефлексия",
    subtitle: "Оцени свои знания на сегодняшнем уроке 👇",
    greenTitle: "Понял!", greenSub: "Всё было ясно",
    redTitle: "Не понял", redSub: "Было сложно",
    yellowTitle: "Сомневаюсь", yellowSub: "Понял частично",
    thanks: "✅ Ваш голос принят!",
    total: "Всего голосов:",
    showStats: "📊 Показать статистику",
    hideStats: "📊 Скрыть",
    reset: "🔄 Новый урок — сбросить голоса",
    docId: "seminar-ru",
  },
  en: {
    title: "⚡ Knowledge Charge — Reflection",
    subtitle: "Rate your understanding of today's lesson 👇",
    greenTitle: "Understood!", greenSub: "Everything was clear",
    redTitle: "Didn't get it", redSub: "It was difficult",
    yellowTitle: "Thinking", yellowSub: "Partially understood",
    thanks: "✅ Your vote is accepted!",
    total: "Total votes:",
    showStats: "📊 Show Statistics",
    hideStats: "📊 Close",
    reset: "🔄 New lesson — Reset votes",
    docId: "seminar-en",
  }
};

const text = DICTIONARY[LANG];

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Nunito', sans-serif;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%);
    min-height: 100vh;
    overflow-x: hidden;
  }
  @keyframes shimmer {
    0% { background-position: 0% }
    100% { background-position: 200% }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes popIn {
    0%   { transform: scale(0.8); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes barFill {
    from { width: 0; }
  }
  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.8);
    display: flex; align-items: center; justify-content: center;
    z-index: 100; backdrop-filter: blur(8px);
  }
  .thanks-box {
    background: #4ce04c; color: #000; padding: 30px 60px;
    border-radius: 30px; font-size: 40px; font-weight: 900;
    animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    box-shadow: 0 20px 50px rgba(76, 224, 76, 0.4);
  }
`;

// ─── Battery SVG Characters (Televizor uchun kattalashtirilgan) ───────────────
function GreenBattery() { return <svg viewBox="0 0 160 200" width="200" height="240"><ellipse cx="80" cy="187" rx="52" ry="11" fill="rgba(0,200,0,.22)" /><rect x="50" y="158" width="18" height="28" rx="9" fill="#2d8a2d" /><rect x="92" y="158" width="18" height="28" rx="9" fill="#2d8a2d" /><ellipse cx="59" cy="186" rx="13" ry="7" fill="#eee" /><ellipse cx="101" cy="186" rx="13" ry="7" fill="#eee" /><rect x="28" y="42" width="104" height="120" rx="28" fill="#4ce04c" /><rect x="28" y="42" width="104" height="60" rx="28" fill="#5eff5e" /><rect x="55" y="26" width="50" height="22" rx="10" fill="#3ab03a" /><rect x="44" y="90" width="72" height="54" rx="12" fill="rgba(0,0,0,.15)" /><rect x="48" y="94" width="64" height="13" rx="5" fill="#fff" opacity=".9" /><rect x="48" y="110" width="64" height="13" rx="5" fill="#fff" opacity=".7" /><rect x="48" y="126" width="64" height="13" rx="5" fill="#fff" opacity=".5" /><line x1="28" y1="88" x2="12" y2="78" stroke="#2d8a2d" strokeWidth="8" strokeLinecap="round" /><ellipse cx="9" cy="74" rx="9" ry="7" fill="#4ce04c" /><line x1="132" y1="88" x2="148" y2="78" stroke="#2d8a2d" strokeWidth="8" strokeLinecap="round" /><ellipse cx="151" cy="74" rx="9" ry="7" fill="#4ce04c" /><ellipse cx="62" cy="64" rx="11" ry="12" fill="white" /><ellipse cx="98" cy="64" rx="11" ry="12" fill="white" /><ellipse cx="65" cy="66" rx="6" ry="7" fill="#1a1a1a" /><ellipse cx="101" cy="66" rx="6" ry="7" fill="#1a1a1a" /><path d="M55 80 Q80 100 105 80" stroke="#1a1a1a" strokeWidth="4" fill="none" strokeLinecap="round" /></svg>; }
function RedBattery() { return <svg viewBox="0 0 160 200" width="200" height="240"><ellipse cx="80" cy="187" rx="52" ry="11" fill="rgba(200,0,0,.2)" /><rect x="50" y="158" width="18" height="28" rx="9" fill="#8a1a1a" /><rect x="92" y="158" width="18" height="28" rx="9" fill="#8a1a1a" /><ellipse cx="59" cy="186" rx="13" ry="7" fill="#eee" /><ellipse cx="101" cy="186" rx="13" ry="7" fill="#eee" /><rect x="28" y="42" width="104" height="120" rx="28" fill="#e03030" /><rect x="28" y="42" width="104" height="60" rx="28" fill="#ff4444" /><rect x="55" y="26" width="50" height="22" rx="10" fill="#b02020" /><rect x="44" y="90" width="72" height="54" rx="12" fill="rgba(0,0,0,.15)" /><rect x="48" y="126" width="64" height="13" rx="5" fill="#fff" opacity=".5" /><line x1="28" y1="100" x2="10" y2="118" stroke="#b02020" strokeWidth="8" strokeLinecap="round" /><ellipse cx="8" cy="122" rx="9" ry="7" fill="#e03030" /><line x1="132" y1="100" x2="150" y2="118" stroke="#b02020" strokeWidth="8" strokeLinecap="round" /><ellipse cx="152" cy="122" rx="9" ry="7" fill="#e03030" /><rect x="60" y="112" width="40" height="28" rx="8" fill="#fff" opacity=".9" /><ellipse cx="62" cy="64" rx="11" ry="12" fill="white" /><ellipse cx="98" cy="64" rx="11" ry="12" fill="white" /><ellipse cx="65" cy="66" rx="6" ry="7" fill="#1a1a1a" /><ellipse cx="101" cy="66" rx="6" ry="7" fill="#1a1a1a" /><path d="M58 88 Q80 76 102 88" stroke="#1a1a1a" strokeWidth="4" fill="none" strokeLinecap="round" /><path d="M53 55 Q65 50 73 56" stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M87 56 Q95 50 107 55" stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>; }
function YellowBattery() { return <svg viewBox="0 0 160 200" width="200" height="240"><ellipse cx="80" cy="187" rx="52" ry="11" fill="rgba(200,160,0,.22)" /><rect x="50" y="158" width="18" height="28" rx="9" fill="#8a6a00" /><rect x="92" y="158" width="18" height="28" rx="9" fill="#8a6a00" /><ellipse cx="59" cy="186" rx="13" ry="7" fill="#eee" /><ellipse cx="101" cy="186" rx="13" ry="7" fill="#eee" /><rect x="28" y="42" width="104" height="120" rx="28" fill="#e0a800" /><rect x="28" y="42" width="104" height="60" rx="28" fill="#ffc107" /><rect x="55" y="26" width="50" height="22" rx="10" fill="#b08000" /><rect x="44" y="90" width="72" height="54" rx="12" fill="rgba(0,0,0,.15)" /><rect x="48" y="94" width="64" height="13" rx="5" fill="#fff" opacity=".9" /><rect x="48" y="110" width="64" height="13" rx="5" fill="#fff" opacity=".5" /><line x1="28" y1="95" x2="12" y2="90" stroke="#8a6a00" strokeWidth="8" strokeLinecap="round" /><ellipse cx="8" cy="88" rx="9" ry="7" fill="#e0a800" /><line x1="132" y1="95" x2="148" y2="108" stroke="#8a6a00" strokeWidth="8" strokeLinecap="round" /><ellipse cx="152" cy="111" rx="9" ry="7" fill="#e0a800" /><ellipse cx="62" cy="64" rx="11" ry="12" fill="white" /><ellipse cx="98" cy="64" rx="11" ry="12" fill="white" /><ellipse cx="65" cy="66" rx="6" ry="7" fill="#1a1a1a" /><ellipse cx="101" cy="66" rx="6" ry="7" fill="#1a1a1a" /><path d="M62 84 Q80 90 98 84" stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>; }

const BATTERIES = [
  { id: "green", label: text.greenTitle, sub: text.greenSub, color: "#4ce04c", Component: GreenBattery },
  { id: "red", label: text.redTitle, sub: text.redSub, color: "#e03030", Component: RedBattery },
  { id: "yellow", label: text.yellowTitle, sub: text.yellowSub, color: "#e0a800", Component: YellowBattery },
];

export default function App() {
  const [votes, setVotes] = useState({ green: 0, red: 0, yellow: 0 });
  const [showStats, setShowStats] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    const ref = doc(db, "sessions", text.docId);
    getDoc(ref).then((snap) => {
      if (!snap.exists()) setDoc(ref, { green: 0, red: 0, yellow: 0 });
    });
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setVotes(snap.data());
    });
    return () => unsub();
  }, []);

  const handleVote = async (id) => {
    if (isVoting) return;
    setIsVoting(true); // Ekranni to'sish (himoya)
    
    const ref = doc(db, "sessions", text.docId);
    await updateDoc(ref, { [id]: increment(1) });
    
    // 2 soniyadan keyin ekranni ochish
    setTimeout(() => {
      setIsVoting(false);
    }, 2000);
  };

  const handleReset = async () => {
    const ref = doc(db, "sessions", text.docId);
    await setDoc(ref, { green: 0, red: 0, yellow: 0 });
    setShowStats(false);
  };

  const total = votes.green + votes.red + votes.yellow;
  const pct = (v) => (total > 0 ? Math.round((v / total) * 100) : 0);

  return (
    <>
      <style>{styles}</style>

      {/* Rahmat ekrani (Bola bossa chiqadi) */}
      {isVoting && (
        <div className="overlay">
          <div className="thanks-box">{text.thanks}</div>
        </div>
      )}

      <div style={s.page}>
        <div style={s.titleBox}>
          <span style={s.titleText}>{text.title}</span>
        </div>
        <p style={s.subtitle}>{text.subtitle}</p>

        <div style={s.batteries}>
          {BATTERIES.map(({ id, label, sub, color, Component }) => (
            <div
              key={id}
              onClick={() => handleVote(id)}
              style={s.card}
            >
              <Component />
              <div style={s.cardLabel}>{label}</div>
              <div style={s.cardSub}>{sub}</div>
            </div>
          ))}
        </div>

        {/* O'qituvchi uchun yashirinroq statistika tugmasi */}
        <div style={{ marginTop: '50px' }}>
          <button style={s.statsBtn} onClick={() => setShowStats(!showStats)}>
            {showStats ? text.hideStats : text.showStats}
          </button>
        </div>

        {showStats && (
          <div style={s.statsPanel}>
            <p style={{ color: "white", fontSize: 20, marginBottom: 15 }}>
              {text.total} <strong>{total}</strong>
            </p>
            {BATTERIES.map(({ id, label, color }) => (
              <div key={id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "white", marginBottom: 6 }}>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>{label}</span>
                  <span style={{ fontSize: 18, fontWeight: 900 }}>{votes[id]} ({pct(votes[id])}%)</span>
                </div>
                <div style={s.barBg}>
                  <div style={{...s.barFill, width: `${pct(votes[id])}%`, background: color }} />
                </div>
              </div>
            ))}
            <button style={s.resetBtn} onClick={handleReset}>{text.reset}</button>
          </div>
        )}
      </div>
    </>
  );
}

const s = {
  page: { position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", textAlign: "center" },
  titleBox: { background: "linear-gradient(90deg,#ff6b35,#f7c59f,#ff6b35)", backgroundSize: "200%", animation: "shimmer 3s linear infinite", borderRadius: 50, padding: "20px 50px", marginBottom: 20 },
  titleText: { fontFamily: "'Baloo 2', cursive", fontSize: "clamp(26px, 5vw, 42px)", fontWeight: 800, color: "#1a1a2e" },
  subtitle: { color: "rgba(255,255,255,.8)", fontSize: 24, marginBottom: 50, fontWeight: 600 },
  batteries: { display: "flex", gap: 60, flexWrap: "wrap", justifyContent: "center" },
  card: { display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", transition: "transform 0.2s", ":hover": { transform: "scale(1.05)"} },
  cardLabel: { fontFamily: "'Baloo 2', cursive", fontSize: 28, fontWeight: 800, color: "white", marginTop: 15 },
  cardSub: { fontSize: 18, color: "rgba(255,255,255,.7)", marginTop: 5 },
  statsBtn: { background: "transparent", border: "1px solid rgba(255,255,255,.2)", color: "rgba(255,255,255,.5)", fontSize: 16, padding: "10px 20px", borderRadius: 50, cursor: "pointer" },
  statsPanel: { background: "rgba(0,0,0,.5)", backdropFilter: "blur(10px)", borderRadius: 20, padding: "30px", width: "100%", maxWidth: 600, marginTop: 20 },
  barBg: { background: "rgba(255,255,255,.1)", borderRadius: 20, height: 20, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 20, transition: "width .6s ease" },
  resetBtn: { marginTop: 20, background: "#ff4444", border: "none", color: "white", fontWeight: 700, padding: "12px 30px", borderRadius: 50, cursor: "pointer", fontSize: 16 },
};