

# 📖 WordVault — Community Dictionary & Quiz App

A modern gradient-themed English dictionary where anyone can contribute words and test their knowledge through matching quizzes.

---

## 1. Design & Theme
- **Modern gradient** aesthetic with glassmorphism cards, gradient accent buttons, and soft blurred backgrounds
- Clean typography with a bold hero search bar on the homepage
- Smooth transitions and hover effects throughout

---

## 2. Home / Search Page
- Large centered search bar as the focal point
- Search words by name — shows definition, example sentence, and difficulty tag
- Recently added words displayed below the search bar
- Difficulty tags shown as colored badges (e.g., 🟢 Easy, 🟡 Medium, 🔴 Hard)

---

## 3. Word Database (Supabase)
- Each word entry includes: **word**, **definition**, **example sentence**, **difficulty tag** (easy/medium/hard), and **contributor info**
- Users can browse all words or filter by difficulty
- Full-text search support

---

## 4. Add Word (Any User)
- Simple form to submit a new word with definition, example, and difficulty level
- Basic validation to prevent duplicates
- Submitted words appear immediately in the dictionary

---

## 5. Matching Quiz
- Users select a difficulty level (or mix) to start a quiz
- **Matching format**: A set of words on one side, definitions on the other — drag or tap to match them
- Score displayed at the end with correct/incorrect highlights
- Option to retry or start a new quiz

---

## 6. User Authentication
- Sign up / log in so contributions are tracked per user
- Users can view their quiz history and contributed words on a simple profile page

---

## 7. Pages Summary
| Page | Purpose |
|------|---------|
| **Home** | Search bar + recent words |
| **Word Detail** | Full definition, example, tags |
| **Add Word** | Form to contribute a new word |
| **Browse** | All words with difficulty filter |
| **Quiz** | Matching quiz with difficulty selection |
| **Profile** | User's contributions & quiz scores |
| **Auth** | Login / Sign up |

