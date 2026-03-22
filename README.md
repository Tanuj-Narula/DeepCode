# 🧠 DeepCode AI — Understand the Code You Ship

> **Every developer is using AI-generated code they don't understand.**  
> DeepCode turns any code snippet into a Socratic tutor that builds real expertise, one function at a time.

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)
![Groq](https://img.shields.io/badge/AI-Groq%20%2B%20Gemini-orange?style=flat-square)

---

## ⚡ What is DeepCode?

DeepCode AI is a **Socratic code learning platform** that takes any code snippet — from any language — and transforms it into an interactive session that forces you to _prove_ you understand it. Paste code, pick a function, and the AI interrogates your understanding through trivia, line-by-line explanations, walkthroughs, and what-if mutation analysis.

It's not a linter. It's not a chatbot. It's a **code comprehension gauntlet**.

---

## 🎮 Features

### ⚔️ Trivia Gauntlet Mode
- **AI-generated questions** — 3 difficulty-tiered questions per session: _Surface_, _Conceptual_, and _Edge Case_
- **Smart evaluation** — Answers are evaluated for conceptual accuracy, not keyword matching
- **Progressive hint system** — 3 levels: Directional Nudge → Analogy → Full Explanation
- **Skip question** — Skip any question (0 pts) and still receive the full explanation
- **Retry mechanics** — Up to 3 attempts per question with escalating hints
- **Live scoring** — Real-time score display with visual indicators (green/yellow/red)
- **Session results** — Post-session scorecard with concept-level breakdown

### 🔍 Understand Mode
- **Click any line** → Get a 3-part explanation:
  - `what_it_does` — Plain English description
  - `why_this_way` — Design decision analysis
  - `what_breaks_if_removed` — Concrete impact analysis
- **Function Walkthrough** — Step-by-step whiteboard-style breakdown (purpose → inputs → steps → output → edge cases)
- **Mutation Prediction** — Edit code and predict behavior changes before running
- **Line highlighting** — Active line and context range decorations in the editor

### 🌱 Seed Generation
- **Generate Learning Seeds** — Auto-generate pedagogical code snippets for any concept
- **Multi-language support** — JavaScript, TypeScript, Python, Java, C++, Go, Rust, C#
- **Auto-language detection** — AI picks the best language based on the concept (e.g., "goroutines" → Go)
- **Difficulty levels** — Beginner, Intermediate, Advanced

### 📊 Session History (Persistent)
- **LocalStorage persistence** — Sessions survive page refresh
- **History drawer** — Sliding panel with all-time stats (total points, overall %, questions answered)
- **Expandable scorecards** — Per-question breakdown (concept, difficulty, correct/wrong, hints used, points)
- **Clear history** — One-click purge

### 🎨 Design & UX
- **Dark/Light theme toggle** — Full theme system with CSS custom properties
- **Resizable split-pane** — Drag to resize editor vs. panel with saved preferences
- **Monaco Editor** — Full VS Code editing experience with syntax highlighting
- **Framer Motion animations** — Smooth transitions on every interaction
- **Toast notifications** — Floating auto-dismiss toasts for session events
- **Responsive layout** — Adaptive UI across screen sizes

---

## 🏗️ Architecture

```
src/
├── app/
│   ├── api/                          # Next.js API Routes (Server-side AI)
│   │   ├── generate-questions/       # Trivia question generation (3 per session)
│   │   ├── evaluate-answer/          # Answer evaluation with scoring
│   │   ├── generate-hint/            # Progressive 3-level hint system
│   │   ├── generate-seed/            # Multi-language code snippet generation
│   │   ├── explain-line/             # Line-by-line code explanation
│   │   ├── walkthrough/              # Full function walkthrough
│   │   └── mutate-predict/           # Behavior change prediction
│   ├── globals.css                   # Design system (CSS custom properties)
│   ├── layout.tsx                    # Root layout with fonts & metadata
│   └── page.tsx                      # Home page (editor + panel)
│
├── components/
│   ├── CodeEditor.tsx                # Monaco editor with scope extraction
│   ├── Header.tsx                    # Top bar (seed modal, language selector, history, theme)
│   ├── TriviaPanel.tsx               # Trivia Gauntlet UI (questions, hints, scoring, results)
│   ├── UnderstandPanel.tsx           # Understand mode UI (line explanations, walkthrough)
│   ├── HistoryPanel.tsx              # Session history drawer
│   ├── ResizableLayout.tsx           # Draggable split-pane layout
│   ├── ThemeToggle.tsx               # Dark/light mode switch
│   ├── Providers.tsx                 # Theme + React Query providers
│   └── ...                           # Supporting components
│
├── stores/                           # Zustand state management
│   ├── sessionStore.ts               # Trivia state (questions, answers, scores, mode)
│   ├── editorStore.ts                # Editor state (code, language, scoped function)
│   ├── historyStore.ts               # Persistent history (localStorage via zustand/persist)
│   └── uiStore.ts                    # UI preferences (panel sizes)
│
├── lib/                              # Utilities
│   ├── ai.ts                         # AI routing layer (Groq → Gemini fallback)
│   ├── scopeExtractor.ts             # Cursor-aware function boundary detection
│   └── heatmapDecorations.ts         # Monaco editor line decorations
│
├── types/
│   └── schemas.ts                    # Zod schemas + TypeScript types
│
└── data/
    └── roleReadiness.ts              # Role readiness assessment data
```

---

## 🤖 AI Layer

DeepCode uses a **dual-provider AI routing layer** with automatic failover:

| Provider | Model | Use Case |
|----------|-------|----------|
| **Groq** (Primary) | `llama-3.3-70b-versatile` | Question generation, answer evaluation, walkthroughs, full explanations |
| **Groq** (Primary) | `llama-3.1-8b-instant` | Quick hints (Level 1 & 2), what-if simulations |
| **Google Gemini** (Fallback) | `gemini-2.0-flash` | Automatic fallback on Groq rate limits |

All AI responses are validated through **Zod schemas** with automatic JSON extraction (handles markdown-wrapped responses, code fences, etc.) and retry logic.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **npm** or **yarn**
- **Groq API Key** (free tier: [console.groq.com](https://console.groq.com))
- **Gemini API Key** (optional fallback: [aistudio.google.com](https://aistudio.google.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/Tanuj-Narula/DeepCode.git
cd DeepCode/deepcode-app

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
```

Add your API keys to `.env.local`:

```env
GROQ_API_KEY=gsk_your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here   # Optional fallback
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

---

## 🧪 How to Use

1. **Paste Code** — Drop any code snippet into the Monaco editor (or use **Generate Learning Seed** to auto-generate one)
2. **Place Your Cursor** — Click inside the function you want to learn about
3. **Choose Your Mode:**
   - ⚔️ **Trivia Gauntlet** — Click "Test Me" to start a 3-question challenge
   - 🔍 **Deep Understand** — Click any line for instant explanation, or request a full walkthrough
4. **Review Your History** — Click the 🕐 History button to see all past sessions with detailed scorecards

---

## 🗣️ Supported Languages

| Language | Extension | Seed Generation | Trivia | Understand |
|----------|-----------|:-:|:-:|:-:|
| JavaScript | `.js` | ✅ | ✅ | ✅ |
| TypeScript | `.ts` | ✅ | ✅ | ✅ |
| Python | `.py` | ✅ | ✅ | ✅ |
| Java | `.java` | ✅ | ✅ | ✅ |
| C++ | `.cpp` | ✅ | ✅ | ✅ |
| Go | `.go` | ✅ | ✅ | ✅ |
| Rust | `.rs` | ✅ | ✅ | ✅ |
| C# | `.cs` | ✅ | ✅ | ✅ |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **UI** | React 19, Framer Motion, Lucide Icons |
| **Editor** | Monaco Editor (@monaco-editor/react) |
| **State** | Zustand (with localStorage persistence) |
| **Validation** | Zod 4 |
| **Styling** | Tailwind CSS + CSS Custom Properties |
| **AI** | Groq (Llama 3.3 70B, Llama 3.1 8B) + Google Gemini 2.0 Flash |
| **Notifications** | react-hot-toast |
| **Data Fetching** | TanStack React Query |

---

## 📁 Environment Variables

| Variable | Required | Description |
|----------|:--------:|-------------|
| `GROQ_API_KEY` | ✅ | Groq API key for primary AI inference |
| `GEMINI_API_KEY` | ❌ | Google Gemini API key (automatic fallback on rate limits) |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private and maintained by [Tanuj Narula](https://github.com/Tanuj-Narula).

---

<p align="center">
  <strong>Built with 🧠 by Tanuj Narula</strong><br/>
  <em>Stop shipping code you don't understand.</em>
</p>
