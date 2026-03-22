# 🤝 Contributing to Snippet Bubble Manager

We welcome contributions to the Snippet Bubble Manager! Before you get started, please take a moment to review these guidelines.

## 🛠️ Prerequisites

Ensure you have the following installed on your development machine:

| Requirement       | Purpose                                       |
|:------------------|:----------------------------------------------|
| Node.js (LTS)     | JavaScript runtime environment                |
| npm (or Yarn)     | Package manager                               |
| Git               | Version control                               |

## 🚀 Development Setup

Follow these steps to get your development environment ready:

```bash
# 1. Clone this repository
git clone https://github.com/CassieMarie0728/snippet-bubble-manager.git
cd snippet-bubble-manager

# 2. Install dependencies
npm install

# 3. Configure environment variables
# Create a .env.local file in the root directory
# and add your Google GenAI API key:
cp .env.example .env.local
# Open .env.local and replace 'your_google_genai_api_key_here' with your actual key

# 4. Run the development server
npm run dev
```

Open your browser to `http://localhost:3000` (or the port specified by Vite) to see the application running.

## 🧪 Running Tests

This project uses TypeScript for type checking, which serves as a form of static analysis and linting.

```bash
# Run type checking / linting
npm run lint
```

Currently, there are no unit or integration tests configured. Contributions to add a testing framework and tests are highly welcome!

## 📂 Project Structure

```
snippet-bubble-manager/
├── public/           # Static assets
├── src/              # Main application source code
│   ├── App.tsx       # Main React component and application logic
│   ├── firebase.ts   # Firebase initialization and configuration
│   ├── types.ts      # TypeScript type definitions
│   ├── templates.ts  # Pre-defined snippet templates
│   ├── main.tsx      # React entry point
│   └── index.css     # Global styles
├── docs/             # Documentation and images
├── firebase-applet-config.json # Firebase project configuration
├── firebase-blueprint.json     # Firebase data model blueprint
├── firestore.rules             # Firestore security rules
├── index.html                  # Main HTML file
├── metadata.json               # Application metadata
├── package.json                # Project dependencies and scripts
├── package-lock.json           # Locked dependency versions
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite build configuration
└── .env.example                # Example environment variables
```

## 🎨 Code Style

-   **Language:** TypeScript
-   **Styling:** Tailwind CSS is used for styling. Utility classes should be preferred.
-   **Linting:** TypeScript compiler (`tsc --noEmit`) is used to ensure type correctness and basic code quality.

## 📥 Pull Request Process

1.  **Fork** the repository and **clone** it to your local machine.
2.  Create a new **branch** for your feature or bug fix: `git checkout -b feature/your-feature-name`.
3.  Make your changes, ensuring they adhere to the existing code style.
4.  **Commit** your changes with a clear and descriptive commit message.
5.  **Push** your branch to your forked repository.
6.  Open a **Pull Request** to the `main` branch of the original repository.
7.  Provide a detailed description of your changes in the PR, including any relevant screenshots or steps to reproduce.
8.  Be responsive to feedback during the review process.

## 🔗 Related Integrations

This project integrates with:

-   **Firebase:** For backend services (Firestore, Authentication). Changes to data models or security rules should be reflected in `firestore.rules` and `src/types.ts`.
-   **Google GenAI:** For AI code completion. Ensure any changes related to AI functionality are compatible with the GenAI API usage.

## ❓ Getting Help

If you have questions or need assistance, please open an issue on the GitHub repository.
