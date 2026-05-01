import { useState, useEffect } from "react";
import { db } from "./firebase.js";
import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from "firebase/firestore";

// TILNI TANLASH: Ruscha uchun "ru", Inglizcha uchun "en"
const LANG = "ru"; 

const DICTIONARY = {
  ru: {
    title: "⚡ Заряд Знаний",
    subtitle: "Оцени свои знания на уроке 👇",
    options: [
      { id: "green", label: "Понял!", sub: "Всё ясно", color: "#4ce04c", emoji: "😊" },
      { id: "yellow", label: "Частично", sub: "Есть вопросы", color: "#ffbd39", emoji: "😐" },
      { id: "red", label: "Не понял", sub: "Было сложно", color: "#ff4747", emoji: "😟" }
    ],
    thanks: "✅ Ваш голос принят!",
    resetText: "🔄 Сбросить (Reset)",
    confirmReset: "Вы уверены, что хотите начать заново?",
    promptStudents: "Введите количество учеников в классе:",
    docId: "seminar-ru"
  },
  en: {
    title: "⚡ Knowledge Charge",
    subtitle: "Rate your understanding 👇",
    options: [
      { id: "green", label: "Got it!", sub: "Clear", color: "#4ce04c", emoji: "😊" },
      { id: "yellow", label: "Partial", sub: "Questions", color: "#ffbd39", emoji: "😐" },
      { id: "red", label: "Hard", sub: "Difficult", color: "#ff4747", emoji: "😟" }
    ],
    thanks: "✅ Vote Accepted!",
    resetText: "🔄 Reset Votes",
    confirmReset: "Are you sure you want to reset all votes to zero?",
    promptStudents: "Enter the number of students in the class:",
    docId: "seminar-en"
  }
};

const text = DICTIONARY[LANG];

// 🔋 Animatsiyali Batareyka Komponenti
function Battery({ color, percent, label, sub, emoji, onVote }) {
  return (
    <div style={s.card} onClick={onVote}>
      <div style={s.emoji}>{emoji}</div>
      <svg viewBox="0 0 100 160" width="160" height="240" style={s.svg}>
        <rect x="5" y="20" width="90" height="130" rx="15" fill="none" stroke="#555" strokeWidth="6" />
        <rect x="35" y="5" width="30" height="15" rx="5" fill="#555" />
        
        {/* Zaryad to'lishi */}
        <rect 
          x="12" 
          y={143 - (116 * percent / 100)} 
          width="76" 
          height={(116 * percent / 100)} 
          rx="8" 
          fill={color} 
          style={{ transition: 'all 1s ease-out' }} 
        />
        
        <text x="50" y="95" textAnchor="middle" fill={percent > 50 ? "#000" : "#fff"} 
              style={{ fontSize: '18px', fontWeight: '900', transition: '0.5s' }}>
          {percent}%
        </text>
      </svg>
      <h2 style={s.cardTitle}>{label}</h2>
      <p style={s.cardSub}>{sub}</p>
    </div>
  );
}

export default function App() {
  // maxStudents ham endi bazadan keladi, default 30 ta.
  const [votes, setVotes] = useState({ green: 0, red: 0, yellow: 0, maxStudents: 30 });
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    const ref = doc(db, "sessions", text.docId);
    getDoc(ref).then(s => !s.exists() && setDoc(ref, { green: 0, red: 0, yellow: 0, maxStudents: 30 }));
    
    return onSnapshot(ref, (s) => s.exists() && setVotes(s.data()));
  }, []);

  const handleVote = async (id) => {
    if (voted) return;
    setVoted(true);
    await updateDoc(doc(db, "sessions", text.docId), { [id]: increment(1) });
    setTimeout(() => setVoted(false), 2000);
  };

  const resetVotes = async () => {
    if (window.confirm(text.confirmReset)) {
      // Faqat ovozlarni tozalaymiz, o'quvchilar soni (maxStudents) o'zgarishsiz qoladi
      await updateDoc(doc(db, "sessions", text.docId), { green: 0, red: 0, yellow: 0 });
    }
  };

  const changeMaxStudents = async () => {
    const currentMax = votes.maxStudents || 30;
    const input = window.prompt(text.promptStudents, currentMax);
    // Kiritilgan son to'g'ri ekanligini tekshiramiz
    if (input !== null && !isNaN(input) && Number(input) > 0) {
      await updateDoc(doc(db, "sessions", text.docId), { maxStudents: Number(input) });
    }
  };

  const max = votes.maxStudents || 30;
  const total = (votes.green || 0) + (votes.red || 0) + (votes.yellow || 0);
  const getPct = (v) => Math.min(100, Math.round((v / max) * 100));

  return (
    <div style={s.container}>
      {voted && <div style={s.overlay}><div style={s.toast}>{text.thanks}</div></div>}
      
      <h1 style={s.mainTitle}>{text.title}</h1>
      <p style={s.mainSub}>{text.subtitle}</p>

      <div style={s.grid}>
        {text.options.map(opt => (
          <Battery 
            key={opt.id}
            {...opt}
            percent={getPct(votes[opt.id] || 0)}
            onVote={() => handleVote(opt.id)}
          />
        ))}
      </div>
      
      <div style={s.footer}>
        {/* Qalamchali yozuv ustiga bosganda sonni o'zgartirish oynasi chiqadi */}
        <span 
          style={{ marginRight: '30px', cursor: 'pointer', borderBottom: '1px dashed #94a3b8' }} 
          onClick={changeMaxStudents}
          title="Нажмите, чтобы изменить количество учеников"
        >
          Total: {total} / {max} ✏️
        </span>
        <button onClick={resetVotes} style={s.resetBtn}>{text.resetText}</button>
      </div>
    </div>
  );
}

const s = {
  container: { minHeight: '100vh', background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif' },
  mainTitle: { fontSize: '60px', color: '#fbbf24', margin: '0', textAlign: 'center' },
  mainSub: { fontSize: '24px', opacity: 0.7, marginBottom: '50px', textAlign: 'center' },
  grid: { display: 'flex', gap: '80px', flexWrap: 'wrap', justifyContent: 'center' },
  card: { textAlign: 'center', cursor: 'pointer', transition: '0.3s' },
  emoji: { fontSize: '60px', marginBottom: '10px' },
  svg: { filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.1))' },
  cardTitle: { fontSize: '30px', margin: '15px 0 5px' },
  cardSub: { fontSize: '18px', opacity: 0.5 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  toast: { background: '#22c55e', padding: '30px 60px', borderRadius: '50px', fontSize: '40px', fontWeight: '900' },
  footer: { marginTop: '50px', fontSize: '20px', color: '#94a3b8', display: 'flex', alignItems: 'center' },
  resetBtn: { background: '#334155', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', transition: '0.3s' }
};