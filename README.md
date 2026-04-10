# 🫧 Snippet Bubble Manager

### ⚡ Your code. One click away. Always within reach.

<!-- BADGES -->
![Status](https://img.shields.io/badge/status-active-success?style=for-the-badge)
![Version](https://img.shields.io/badge/version-0.1.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-black?style=for-the-badge)
![Built With](https://img.shields.io/badge/built%20with-React%20%7C%20Firebase%20%7C%20Vite%20%7C%20Google%20GenAI-red?style=for-the-badge)

<br/>

<!-- OPTIONAL BANNER -->
<img src="./docs/images/banner.png" alt="Snippet Bubble Manager Banner" width="100%" />

## 💀 What This Is

Snippet Bubble Manager is a **floating, always-on-top snippet tool** that lives in your workflow like a silent little assassin.

It doesn’t ask permission.  
It doesn’t get in your way.  
It just sits there—ready to drop code into your clipboard faster than your brain can say *“where the hell did I put that?”*

## 🎯 Why You Built This (aka The Problem)

- You copy the same snippets 1000 times
- You forget where you saved half your useful code
- Your “organization system” is vibes and chaos
- Clipboard history apps aren’t built for developers

So yeah—this fixes that.

## 🔥 Features That Actually Matter

### 🫧 Floating Bubble UI
- Always on top
- Expand / collapse instantly
- Minimal footprint, maximum damage

### ⚡ One-Click Copy
- Copy snippets instantly
- Track last copied
- Zero friction

### 🧠 Smart Snippet Storage
- Titles, descriptions, tags
- Labels + metadata (platform, framework, complexity)
- Language-aware organization
- Favorites & pinned snippets
- Smart folders (rule-based)
- Presets for fast snippet creation
- Export/import includes smart folders and presets

### 📁 Folder Organization
- Keep your chaos contained
- Group by project, language, or whatever your brain needs

### ☁️ Firebase-Powered Backend
- Real-time updates
- Auth-secured ownership
- Sync-ready foundation

### 🤖 AI-Powered Code Completion
- Integrated with Google GenAI for intelligent code suggestions.
- Monaco Editor integration for a rich coding experience.

## 🖼 UI Preview

<p align="center">
  <img src="./docs/images/screenshot-1.png" width="30%" />
  <img src="./docs/images/screenshot-2.png" width="30%" />
  <img src="./docs/images/screenshot-3.png" width="30%" />
</p>

## 🧱 Tech Stack

| Layer        | Tech                                  |
|:-------------|:--------------------------------------|
| Frontend     | React + TypeScript + Vite             |
| Styling      | Tailwind CSS                          |
| Backend      | Firebase (Firestore, Authentication)  |
| AI           | Google GenAI                          |
| Editor       | Monaco Editor                         |

## 📂 Project Structure

```
snippet-bubble-manager/
├── public/
├── src/
│   ├── App.tsx
│   ├── firebase.ts
│   ├── types.ts
│   ├── templates.ts
│   ├── main.tsx
│   └── index.css
├── docs/
│   ├── images/
│   │   ├── banner.png
│   │   ├── icon.png
│   │   ├── screenshot-1.png
│   │   ├── screenshot-2.png
│   │   └── screenshot-3.png
├── firebase-applet-config.json
├── firebase-blueprint.json
├── firestore.rules
├── index.html
├── metadata.json
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/CassieMarie0728/snippet-bubble-manager.git
cd snippet-bubble-manager
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Setup

This project uses Firebase for backend services (Firestore and Authentication). The Firebase configuration is loaded from `firebase-applet-config.json`. Ensure this file is correctly configured with your Firebase project details.

For AI code completion, you will need a Google GenAI API key. Create a `.env.local` file in the root directory and add your API key:

```env
GEMINI_API_KEY=your_google_genai_api_key_here
```

### 4. Run the Development Server

```bash
npm run dev
```

Open your browser to `http://localhost:3000` (or the port specified by Vite).

## 🔐 Firestore Rules

Firestore security rules ensure that users can only access and manage their own snippets and folders. The rules enforce `ownerId === request.auth.uid` for all read/write operations on user-specific data. An admin override is available for the email `cmcrossno@gmail.com`.

## 🧠 Data Model

### Snippet

| Field        | Type      | Description                                                               |
|:-------------|:----------|:--------------------------------------------------------------------------|
| `id`         | `string`  | Unique identifier for the snippet (optional for creation)                 |
| `title`      | `string`  | Title of the snippet                                                      |
| `code`       | `string`  | The actual code snippet content                                           |
| `language`   | `string`  | Programming language of the snippet (e.g., `javascript`, `python`)        |
| `description`| `string`  | Optional description of the snippet                                       |
| `tags`       | `string[]`| Optional array of tags for categorization                                 |
| `labels`     | `string[]`| Optional array of labels for multi-collection organization                 |
| `platform`   | `string`  | Optional platform label (e.g., `web`, `mobile`)                            |
| `framework`  | `string`  | Optional framework label (e.g., `react`, `express`)                        |
| `complexity` | `string`  | Optional complexity flag (`S`, `M`, `L`)                                   |
| `isFavorite` | `boolean` | Flag indicating if the snippet is marked as a favorite                    |
| `isPinned`   | `boolean` | Flag indicating if the snippet is pinned for quick access                 |
| `ownerId`    | `string`  | User ID of the snippet's owner                                            |
| `lastCopiedAt`| `string` | Timestamp of when the snippet was last copied                             |
| `createdAt`  | `string`  | Timestamp of when the snippet was created                                 |
| `updatedAt`  | `string`  | Timestamp of when the snippet was last updated                            |
| `folderId`   | `string`  | Optional ID of the folder the snippet belongs to                          |
| `customOrder`| `number`  | Optional custom sort order                                                 |

### Folder

| Field        | Type      | Description                                                               |
|:-------------|:----------|:--------------------------------------------------------------------------|
| `id`         | `string`  | Unique identifier for the folder (optional for creation)                  |
| `name`       | `string`  | Name of the folder                                                        |
| `color`      | `string`  | Optional folder color                                                     |
| `icon`       | `string`  | Optional folder icon id                                                   |
| `ownerId`    | `string`  | User ID of the folder's owner                                             |
| `createdAt`  | `string`  | Timestamp of when the folder was created                                  |
| `updatedAt`  | `string`  | Timestamp of when the folder was last updated                             |

### Smart Folders

`smartFolders` are rule-based collections saved per user. Each smart folder stores a `rules` object with fields like `tagsAll`, `tagsAny`, `labelsAll`, `labelsAny`, `languages`, `frameworks`, `platforms`, `complexities`, plus `favoritesOnly` and `pinnedOnly` flags.

### Presets

`presets` are saved snippet creation templates. They can define title, language, tags, labels, platform, framework, complexity, and optional default folder.

## 🧨 Roadmap

- 🧲 Global hotkeys (summon the bubble instantly)
- 🖥 Desktop app (Electron or Tauri)
- 🔍 Fuzzy search that doesn’t suck
- 🧠 AI snippet suggestions
- ☁️ Multi-device sync dashboard
- 🎯 Context-aware snippets (language detection, auto-suggest)

## ⚠️ Known Limitations

- No offline mode (yet)
- UI still evolving
- Firebase required (don’t argue with reality)

## 🧪 Dev Notes

- Built fast, iterated faster
- Designed to stay lightweight
- Structured for future expansion into a full dev tool ecosystem

## 🖤 Philosophy

You didn’t build this to be cute.

You built this because:
- Time matters
- Repetition is stupid
- And your brain has better things to do than remember where a snippet lives

## 📜 License

MIT — do whatever you want, just don’t be an idiot about it.

## 🧠 Final Thought

Stop digging.  
Stop rewriting.  
Stop wasting time.

Let the bubble handle it.
