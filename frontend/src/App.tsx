// src/App.tsx
import { useState } from "react";
import { MatchInfo } from "./components/MatchInfo";
import { CreateMatchForm } from "./components/CreateMatchForm";
import { MatchActions } from "./components/MatchActions";

function App() {
  const [currentMatchPda, setCurrentMatchPda] = useState<string>("");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050816",
        color: "#f9fafb",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <header
        style={{
          borderBottom: "1px solid rgba(148, 163, 184, 0.4)",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
            🐍 Snake Betting Protocol
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
            Crie partidas, gerencie apostas e resolva resultados na Solana Devnet.
          </p>
        </div>
        <MatchInfo />
      </header>

      <main
        style={{
          padding: "1.5rem",
          maxWidth: "1100px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
          gap: "1.5rem",
        }}
      >
        <section>
          <CreateMatchForm onMatchCreated={setCurrentMatchPda} />
        </section>

        <section>
          <MatchActions
            currentMatchPda={currentMatchPda}
            onMatchPdaChange={setCurrentMatchPda}
          />
        </section>
      </main>

      <footer
        style={{
          padding: "1rem 2rem",
          borderTop: "1px solid rgba(148, 163, 184, 0.3)",
          fontSize: "0.75rem",
          color: "#6b7280",
          textAlign: "center",
        }}
      >
        Devnet · Backend: NestJS + Anchor · Frontend: React + Vite
      </footer>
    </div>
  );
}

export default App;
