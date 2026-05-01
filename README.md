# ⚡ Bilim Zaryadi — O'rnatish va ishga tushirish

## Texnologiyalar
- **React + Vite** — frontend
- **Firebase Firestore** — baza (ovozlarni saqlash)
- **Vercel** — bepul hosting

---

## 1️⃣ Firebase sozlash (baza)

1. **https://console.firebase.google.com** ga kiring
2. **"Add project"** → loyiha nomini kiriting (masalan: `bilim-zaryadi`)
3. Google Analytics → o'chirib qoying → **Create project**
4. Chap menyu → **Firestore Database** → **Create database**
   - Mode: **Production** → **Next** → region tanlang → **Enable**
5. Chap menyu → **Project Settings** (⚙️ belgisi)
6. **"Your apps"** → `</>` (Web) tugmasi → app nomini kiriting → **Register app**
7. Ko'rsatilgan `firebaseConfig` ni **nusxa oling**

### `src/firebase.js` faylini yangilang:
```js
const firebaseConfig = {
  apiKey: "...",         // ← o'zingiznikini yozing
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

### Firestore qoidalari (Rules):
Firebase Console → Firestore → **Rules** → quyidagini joylashtiring:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
→ **Publish**

---

## 2️⃣ Loyihani kompyuterda ishga tushirish

```bash
# 1. Papkaga kiring
cd bilim-zaryadi

# 2. Kerakli paketlarni o'rnating
npm install

# 3. Lokal serverda ishga tushiring
npm run dev
```
Browser: **http://localhost:5173**

---

## 3️⃣ Vercel'ga deploy qilish (bepul hosting)

### Variant A — GitHub orqali (tavsiya etiladi)
1. **GitHub.com** ga kiring → **New repository** → kodlarni yuklang
2. **Vercel.com** ga kiring → **"Add New Project"**
3. GitHub reponi tanlang → **Deploy**
4. ✅ Tayyor! Sizga `https://loyiha-nomi.vercel.app` beriladi

### Variant B — Vercel CLI orqali
```bash
npm install -g vercel
npm run build
vercel --prod
```

---

## 📁 Fayl tuzilmasi

```
bilim-zaryadi/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx       ← kirish nuqtasi
    ├── App.jsx        ← asosiy komponent
    └── firebase.js    ← Firebase sozlamalari ⚠️
```

---

## 🎯 Imkoniyatlar

- ✅ Yashil / Qizil / Sariq batareyaga bosish
- ✅ Ovozlar Firebase'da real vaqtda saqlanadi
- ✅ Statistika (foizlar, jadval)
- ✅ "Sifirga qaytarish" tugmasi
- ✅ Barcha qurilmalarda ishlaydi

---

## ❓ Muammo bo'lsa

- Firebase config noto'g'ri → konsolda xato ko'rinadi
- Firestore Rules yopiq → `allow read, write: if true` qo'shing
- Vercel deploy xatosi → `npm run build` muvaffaqiyatli o'tganini tekshiring
