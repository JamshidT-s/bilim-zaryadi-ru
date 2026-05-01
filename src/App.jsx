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

// ─── 1. TILNI TANLASH (Rus tili: "ru", Ingliz tili: "en") ───────────────
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
    reset: "🔄 Сбросить голоса",
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
    reset: "🔄 Reset votes",
    docId: "seminar-en",
  }
};

const text = DICTIONARY[LANG];

// ─── 2. DINAMIK BATAREYA KOMPONENTI (Zaryad effekti bilan) ───────────────
function BatteryIcon({ color, percent }) {
  const isLow = percent > 0;
  const isMid = percent > 33;
  const isHigh = percent > 66;

  return (
    <svg viewBox="0 0 160 200" width="220" height="260" style={{ transition: 'all 0.5s' }}>
      <ellipse cx="80" cy="187" rx="52" ry="11" fill="rgba(0,0,0,0.15)" />
      <rect x="50" y="158" width="18" height="28" rx="9" fill="#333" />
      <rect x="92" y="158" width="18" height="28" rx="9" fill="#333" />
      <rect x="28" y="42" width="104" height="120" rx="28" fill={color} />
      <rect x="55" y="26" width="50" height="22" rx="10" fill="#333" />
      
      {/* Ko'zlar */}
      <circle cx="62" cy="68" r="10" fill="white" />
      <circle cx="98" cy="68" r="10" fill="white" />
      <circle cx="64" cy="70" r="5" fill="#1a1a1a" />
      <circle cx="100" cy="70" r="5" fill="#1a1a1a" />
      
      {/* Og'iz (foizga qarab o'zgaradi) */}
      <path d={percent > 0 ? "M60 85 Q80 105 100 85" : "M65 95 Q80 95 95 95"} 
            stroke="#1a1a1a" strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* ⚡ ZARYAD SEGMENTLARI ⚡ */}
      <g>
        <rect x="48" y="126" width="64" height="13" rx="5" 
              fill={isLow ? "#fff" : "rgba(0,0,0,0.2)"} 
              style={{ transition: '0.5s', opacity: isLow ? 1 : 0.2 }} />
        <rect x="48" y="110" width="64" height="13" rx="5" 
              fill={isMid ? "#fff" : "rgba(0,0,0,0.2)"} 
              style={{ transition: '0.5s', opacity: isMid ? 1 : 0.2 }} />
        <rect x="48" y="94" width="64" height="13" rx="5" 
              fill={isHigh ? "#fff" : "rgba(0,0,0,0.2)"} 
              style={{ transition: '0.5s', opacity: isHigh ? 1 : 0.2 }} />
      </g>
      
      {/* Foiz matni */}
      <text x="80" y="152" textAnchor="middle" fill="#1a1a1a" style={{ fontSize: '14px', fontWeight: '900' }}>
        {percent}%
      </text>
    </svg>
  );
}

// ─── 3. ASOSIY ILOVA ───────────────────────────────────────────────────────
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
    setIsVoting(true);
    const ref = doc(db, "sessions", text.docId);
    await updateDoc(ref, { [id]: increment(1) });
    setTimeout(() => setIsVoting(false), 2000);
  };

  const total = votes.green + votes.red + votes.yellow;
  const pct = (v) => (total > 0 ? Math.round((v / total) * 100) : 0);

  const BATTERIES = [
    { id: "green", label: text.greenTitle, sub: text.greenSub, color: "#4ce04c" },
    { id: "red", label: text.redTitle, sub: text.redSub, color: "#e03030" },
    { id: "yellow", label: text.yellowTitle, sub: text.yellowSub, color: "#e0a800" },
  ];

  return (
    <div style={s.page}>
      <style>{`
        body { margin: 0; background: #1a1a2e; font-family: sans-serif; color: white; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 100; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); }
        .thanks { background: #4ce04c; color: #1a1a2e; padding: 40px 80px; border-radius: 40px; font-size: 45px; font-weight: 900; box-shadow: 0 0 50px #4ce04c; }
      `}</style>

      {isVoting && <div className="overlay"><div className="thanks">{text.thanks}</div></div>}

      <div style={s.header}>
        <h1 style={s.title}>{text.title}</h1>
        <p style={s.subtitle}>{text.subtitle}</p>
      </div>

      <div style={s.grid}>
        {BATTERIES.map((b) => (
          <div key={b.id} onClick={() => handleVote(b.id)} style={s.card}>
            <BatteryIcon color={b.color} percent={pct(votes[b.id])} />
            <h2 style={s.cardTitle}>{b.label}</h2>
            <p style={s.cardSub}>{b.sub}</p>
            <div style={s.count}>{votes[b.id]} votes</div>
          </div>
        ))}
      </div>

      <button style={s.statsToggle} onClick={() => setShowStats(!showStats)}>
        {showStats ? text.hideStats : text.showStats}
      </button>

      {showStats && (
        <div style={s.statsBox}>
          <h3>{text.total} {total}</h3>
          {/* Bu yerda qo'shimcha statistik chiziqlar bo'lishi mumkin */}
        </div>
      )}
    </div>
  );
}

// ─── 4. STYLES ─────────────────────────────────────────────────────────────
const s = {
  page: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px" },
  header: { marginBottom: "60px", textAlign: "center" },
  title: { fontSize: "50px", marginBottom: "10px", color: "#ffbd39" },
  subtitle: { fontSize: "24px", opacity: 0.7 },
  grid: { display: "flex", gap: "60px", flexWrap: "wrap", justifyContent: "center" },
  card: { cursor: "pointer", transition: "0.3s", textAlign: "center" },
  cardTitle: { fontSize: "32px", marginTop: "20px" },
  cardSub: { fontSize: "18px", opacity: 0.6, marginBottom: "10px" },
  count: { background: "rgba(255,255,255,0.1)", padding: "5px 15px", borderRadius: "20px", display: "inline-block" },
  statsToggle: { marginTop: "60px", background: "none", border: "1px solid #555", color: "#888", padding: "10px 20px", borderRadius: "30px", cursor: "pointer" },
  statsBox: { marginTop: "20px", padding: "20px", background: "rgba(0,0,0,0.3)", borderRadius: "20px", width: "300px", textAlign: "center" }
};