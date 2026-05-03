import { useState, useEffect, useRef } from "react";
import { db } from "./firebase.js";
import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from "firebase/firestore";

const LANG = "ru";

const DICTIONARY = {
  ru: {
    title: "⚡ Заряд Знаний",
    subtitle: "Оцени свои знания на уроке 👇",
    options: [
      { id: "green",  label: "Понял!",    sub: "Всё ясно",     color: "#4ce04c", emoji: "😊" },
      { id: "yellow", label: "Частично",  sub: "Есть вопросы", color: "#ffbd39", emoji: "😐" },
      { id: "red",    label: "Не понял",  sub: "Было сложно",  color: "#ff4747", emoji: "😟" },
    ],
    thanks: "✅ Ваш голос принят!",
    resetText: "🔄 Сбросить",
    confirmReset: "Вы уверены, что хотите начать заново?",
    promptStudents: "Введите количество учеников в классе:",
    resultTitle: "📊 Результаты урока",
    resultClose: "✖ Закрыть",
    showResult: "📊 Итоги",
    docId: "seminar-ru",
  },
  en: {
    title: "⚡ Knowledge Charge",
    subtitle: "Rate your understanding 👇",
    options: [
      { id: "green",  label: "Got it!",  sub: "Clear",     color: "#4ce04c", emoji: "😊" },
      { id: "yellow", label: "Partial",  sub: "Questions", color: "#ffbd39", emoji: "😐" },
      { id: "red",    label: "Hard",     sub: "Difficult", color: "#ff4747", emoji: "😟" },
    ],
    thanks: "✅ Vote Accepted!",
    resetText: "🔄 Reset",
    confirmReset: "Reset all votes?",
    promptStudents: "Enter number of students:",
    resultTitle: "📊 Lesson Results",
    resultClose: "✖ Close",
    showResult: "📊 Results",
    docId: "seminar-en",
  },
};

const text = DICTIONARY[LANG];

// ─── Web Audio sound helpers ──────────────────────────────────────────────────
function playVoteSound(color) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const freqMap = { green: 660, yellow: 520, red: 380 };
    osc.type = "sine";
    osc.frequency.setValueAtTime(freqMap[color] || 500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freqMap[color] * 1.3, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (_) {}
}

function playResultSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.13;
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  } catch (_) {}
}

function playResetSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch (_) {}
}

// ─── Confetti component ───────────────────────────────────────────────────────
function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: ["#4ce04c","#ffbd39","#ff4747","#60a5fa","#f472b6","#a78bfa"][i % 6],
    delay: Math.random() * 1.5,
    dur: 2.5 + Math.random() * 2,
    size: 8 + Math.random() * 10,
    rotate: Math.random() * 360,
  }));
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50, overflow: "hidden" }}>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-40px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: "absolute",
          left: `${p.left}%`,
          top: 0,
          width: p.size,
          height: p.size * 0.5,
          background: p.color,
          borderRadius: 2,
          animation: `confettiFall ${p.dur}s ${p.delay}s ease-in forwards`,
          transform: `rotate(${p.rotate}deg)`,
        }} />
      ))}
    </div>
  );
}

// ─── Result Modal ─────────────────────────────────────────────────────────────
function ResultModal({ votes, max, onClose }) {
  const opts = text.options;
  const total = opts.reduce((s, o) => s + (votes[o.id] || 0), 0);
  const dominant = [...opts].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0))[0];

  const advice = {
    green:  { msg: "Отлично! Класс хорошо усвоил материал. 🎉", bg: "#14532d" },
    yellow: { msg: "Неплохо! Стоит повторить ключевые моменты. 📚", bg: "#713f12" },
    red:    { msg: "Нужно объяснить тему заново. Не торопитесь! 🔄", bg: "#7f1d1d" },
  };
  const tip = advice[dominant.id];

  return (
    <div style={rs.backdrop} onClick={onClose}>
      <div style={rs.modal} onClick={e => e.stopPropagation()}>
        <h2 style={rs.title}>{text.resultTitle}</h2>

        {/* Bars */}
        <div style={{ width: "100%", marginBottom: 24 }}>
          <style>{`
            @keyframes barGrow { from { width: 0 } }
          `}</style>
          {opts.map(opt => {
            const v = votes[opt.id] || 0;
            const pct = max > 0 ? Math.min(100, Math.round((v / max) * 100)) : 0;
            return (
              <div key={opt.id} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 20 }}>{opt.emoji} {opt.label}</span>
                  <span style={{ fontWeight: 900, fontSize: 20 }}>{v} чел. ({pct}%)</span>
                </div>
                <div style={rs.barBg}>
                  <div style={{
                    ...rs.barFill,
                    width: `${pct}%`,
                    background: opt.color,
                    animation: "barGrow 0.8s ease-out",
                    boxShadow: `0 0 12px ${opt.color}`,
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div style={{ textAlign: "center", fontSize: 16, opacity: 0.6, marginBottom: 20 }}>
          Проголосовало: {total} / {max}
        </div>

        {/* Advice */}
        <div style={{ ...rs.advice, background: tip.bg }}>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.5 }}>{tip.msg}</p>
        </div>

        <button style={rs.closeBtn} onClick={onClose}>{text.resultClose}</button>
      </div>
    </div>
  );
}

const rs = {
  backdrop: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.85)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 40,
    backdropFilter: "blur(6px)",
    animation: "fadeIn .3s ease",
  },
  modal: {
    background: "#1e293b",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 24,
    padding: "36px 40px",
    width: "min(90vw, 540px)",
    color: "white",
    fontFamily: "Nunito, sans-serif",
    animation: "fadeInUp .35s ease",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  title: { textAlign: "center", fontSize: 28, marginBottom: 28, color: "#fbbf24" },
  barBg: { background: "rgba(255,255,255,0.1)", borderRadius: 20, height: 18, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 20, transition: "width 0.8s ease" },
  advice: { borderRadius: 16, padding: "16px 20px", marginBottom: 24 },
  closeBtn: {
    display: "block", margin: "0 auto",
    background: "rgba(255,255,255,0.1)",
    border: "1.5px solid rgba(255,255,255,0.2)",
    color: "white", fontFamily: "Nunito, sans-serif",
    fontWeight: 800, fontSize: 16,
    padding: "12px 36px", borderRadius: 50,
    cursor: "pointer",
  },
};

// ─── Battery SVG ──────────────────────────────────────────────────────────────
function Battery({ color, percent, label, sub, emoji, onVote, pulse }) {
  return (
    <div
      style={{
        ...s.card,
        transform: pulse ? "scale(1.08)" : "scale(1)",
        transition: "transform 0.25s",
      }}
      onClick={onVote}
    >
      <div style={s.emoji}>{emoji}</div>
      <svg viewBox="0 0 100 160" width="160" height="240" style={s.svg}>
        <rect x="5" y="20" width="90" height="130" rx="15" fill="none" stroke="#555" strokeWidth="6" />
        <rect x="35" y="5" width="30" height="15" rx="5" fill="#555" />
        <rect
          x="12"
          y={143 - (116 * percent / 100)}
          width="76"
          height={(116 * percent / 100)}
          rx="8"
          fill={color}
          style={{ transition: "all 0.8s ease-out" }}
        />
        {/* glow when high */}
        {percent > 50 && (
          <rect
            x="12" y={143 - (116 * percent / 100)}
            width="76" height={(116 * percent / 100)}
            rx="8"
            fill="none"
            stroke={color}
            strokeWidth="3"
            opacity="0.4"
          />
        )}
        <text
          x="50" y="95"
          textAnchor="middle"
          fill={percent > 50 ? "#000" : "#fff"}
          style={{ fontSize: "18px", fontWeight: "900", transition: "0.5s" }}
        >
          {percent}%
        </text>
      </svg>
      <h2 style={s.cardTitle}>{label}</h2>
      <p style={s.cardSub}>{sub}</p>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [votes, setVotes] = useState({ green: 0, red: 0, yellow: 0, maxStudents: 30 });
  const [voted, setVoted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [pulseId, setPulseId] = useState(null);
  const prevTotal = useRef(0);

  useEffect(() => {
    const ref = doc(db, "sessions", text.docId);
    getDoc(ref).then(s => !s.exists() && setDoc(ref, { green: 0, red: 0, yellow: 0, maxStudents: 30 }));
    return onSnapshot(ref, (s) => s.exists() && setVotes(s.data()));
  }, []);

  const handleVote = async (id) => {
    if (voted) return;
    setVoted(true);
    setPulseId(id);
    playVoteSound(id);
    setTimeout(() => setPulseId(null), 300);
    await updateDoc(doc(db, "sessions", text.docId), { [id]: increment(1) });
    setTimeout(() => setVoted(false), 1800);
  };

  const handleShowResult = () => {
    playResultSound();
    setShowConfetti(true);
    setShowResult(true);
    setTimeout(() => setShowConfetti(false), 4000);
  };

  const resetVotes = async () => {
    if (window.confirm(text.confirmReset)) {
      playResetSound();
      await updateDoc(doc(db, "sessions", text.docId), { green: 0, red: 0, yellow: 0 });
      setShowResult(false);
    }
  };

  const changeMaxStudents = async () => {
    const input = window.prompt(text.promptStudents, votes.maxStudents || 30);
    if (input !== null && !isNaN(input) && Number(input) > 0) {
      await updateDoc(doc(db, "sessions", text.docId), { maxStudents: Number(input) });
    }
  };

  const max = votes.maxStudents || 30;
  const total = text.options.reduce((s, o) => s + (votes[o.id] || 0), 0);
  const getPct = (v) => Math.min(100, Math.round(((v || 0) / max) * 100));

  return (
    <div style={s.container}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes toastIn { 0% { transform: scale(0.7); opacity: 0 } 60% { transform: scale(1.05) } 100% { transform: scale(1); opacity: 1 } }
      `}</style>

      {/* Confetti */}
      {showConfetti && <Confetti />}

      {/* Vote toast */}
      {voted && (
        <div style={s.overlay}>
          <div style={s.toast}>{text.thanks}</div>
        </div>
      )}

      {/* Result Modal */}
      {showResult && (
        <ResultModal
          votes={votes}
          max={max}
          onClose={() => setShowResult(false)}
        />
      )}

      <h1 style={s.mainTitle}>{text.title}</h1>
      <p style={s.mainSub}>{text.subtitle}</p>

      {/* Batteries */}
      <div style={s.grid}>
        {text.options.map(opt => (
          <Battery
            key={opt.id}
            {...opt}
            percent={getPct(votes[opt.id])}
            onVote={() => handleVote(opt.id)}
            pulse={pulseId === opt.id}
          />
        ))}
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <span
          style={{ marginRight: 28, cursor: "pointer", borderBottom: "1px dashed #94a3b8" }}
          onClick={changeMaxStudents}
          title="Нажмите, чтобы изменить"
        >
          Total: {total} / {max} ✏️
        </span>

        <button onClick={handleShowResult} style={{ ...s.btn, background: "#1d4ed8", marginRight: 12 }}>
          {text.showResult}
        </button>

        <button onClick={resetVotes} style={s.btn}>
          {text.resetText}
        </button>
      </div>
    </div>
  );
}

const s = {
  container: {
    minHeight: "100vh",
    background: "#0f172a",
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Nunito, sans-serif",
    padding: "20px 16px",
  },
  mainTitle: { fontSize: "clamp(32px,7vw,60px)", color: "#fbbf24", margin: 0, textAlign: "center" },
  mainSub: { fontSize: "clamp(16px,3vw,24px)", opacity: 0.7, marginBottom: 48, textAlign: "center" },
  grid: { display: "flex", gap: "clamp(24px,6vw,80px)", flexWrap: "wrap", justifyContent: "center" },
  card: { textAlign: "center", cursor: "pointer" },
  emoji: { fontSize: 52, marginBottom: 8 },
  svg: { filter: "drop-shadow(0 0 12px rgba(255,255,255,0.08))" },
  cardTitle: { fontSize: 26, margin: "12px 0 4px" },
  cardSub: { fontSize: 16, opacity: 0.5 },
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.75)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 20,
  },
  toast: {
    background: "#22c55e",
    padding: "28px 56px",
    borderRadius: 50,
    fontSize: "clamp(24px,5vw,40px)",
    fontWeight: 900,
    animation: "toastIn 0.4s ease",
    boxShadow: "0 0 40px #22c55e88",
  },
  footer: {
    marginTop: 44,
    fontSize: 18,
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  btn: {
    background: "#334155",
    color: "white",
    border: "none",
    padding: "10px 22px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 16,
    fontFamily: "Nunito, sans-serif",
    fontWeight: 700,
    transition: "0.2s",
  },
};
