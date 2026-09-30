# ⚡ Taskflow Lite — Ultra-Lightweight Smart Todo App

A fast, beautifully designed, and ultra-lightweight Todo application with all the advanced features of Taskflow — built with **vanilla HTML5, CSS3, and JavaScript** with **zero external dependencies**.

Weighs **under 30 KB total**, requires **zero backend servers or databases**, and can be deployed anywhere in 1 click!

---

## ✨ Features Included

- **✅ Full Task Management**:
  - Add, edit, check off, and delete tasks.
  - Custom notes/descriptions.
  - 6 Categories: *General, Work, Personal, Study, Health, Finance* with color-coded tags.
  - 3 Priority Levels: *Low (Emerald), Medium (Amber), High (Crimson)*.
- **🔄 Drag & Drop Reordering**:
  - Grab any task by the `⠿` handle to rearrange items smoothly.
  - Custom ranking algorithm automatically persists order to LocalStorage.
- **🔁 Auto-Recurrence**:
  - Set tasks to repeat **Daily**, **Weekly**, or **Monthly**.
  - Checking off a recurring task automatically schedules and spawns the next occurrence!
- **⏰ Scheduled Reminders & Dual Notifications**:
  - Set specific date and time for reminders.
  - Real-time background checking every 4 seconds.
  - In-app animated sliding Toast notifications.
  - Native Web Notification API desktop alerts.
  - Gentle dual-tone Web Audio API sound chime (no external audio assets).
  - Overdue task badges with subtle pulsating warning effect.
- **🔍 Instant Search & Multi-Facet Filtering**:
  - Real-time text search across titles and notes.
  - Status filters: *All, Active, Completed, Scheduled*.
  - Category filter chips with dynamic visual active states.
- **📊 Real-time Progress Bar & Stats Hero**:
  - Live completion percentage and ratio counter (*e.g., 2 of 3 tasks done*).
  - Stat counters for Total, Active, Completed, and Scheduled items.
- **💾 100% Offline-First & Data Backup**:
  - LocalStorage persistence saves tasks across sessions and browser restarts.
  - **Backup & Restore**: Export all tasks to JSON or restore from file with one click.
- **✏️ Glassmorphic Edit Modal**:
  - Adjust title, description, category, priority, reminder, or recurrence at any time.

---

## 🚀 How to Deploy in 30 Seconds

### Deploy to Vercel (Recommended)

1. Push this folder to a GitHub repository (or deploy via Vercel CLI).
2. Go to [vercel.com/new](https://vercel.com/new) and select the repository.
3. Click **Deploy**!
   *(Vercel automatically detects pure static HTML/CSS/JS and serves it across their global Edge CDN with zero build steps).*

### Deploy to Netlify
- Drag and drop the `taskflow-lite` folder directly into [app.netlify.com/drop](https://app.netlify.com/drop)!

### Deploy to GitHub Pages
1. Push to your repository.
2. In GitHub, go to **Settings > Pages**.
3. Under **Branch**, select `main` and root `/` folder, then click **Save**.

---

## 💻 Running Locally

Simply double-click `index.html` to open it directly in any web browser!

Or serve with Python / Node if you prefer:
```bash
# Python
python -m http.server 3000

# Or Node npx serve
npx serve .
```
Visit `http://localhost:3000` in your browser.

---

## 📁 File Structure

```
taskflow-lite/
├── index.html   # Semantic HTML5 layout & accessible components (~10 KB)
├── style.css    # Modern glassmorphism, responsive dark theme & animations (~14 KB)
├── app.js       # Modular vanilla state manager, DND, recurrence & reminders (~12 KB)
├── vercel.json  # Zero-config static CDN routing for Vercel (<1 KB)
└── README.md    # Documentation
```
**Total footprint**: ~36 KB (uncompressed) / ~9 KB (gzipped)!
Zero npm packages, zero pip installs, zero cold starts.
