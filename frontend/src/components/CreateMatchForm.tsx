// src/components/CreateMatchForm.tsx
import { type FormEvent, useState } from "react";
import { api } from "../api";

type CreateResponse = {
  ok: boolean;
  txSig: string;
  matchPda: string;
};

type Props = {
  onMatchCreated: (pda: string) => void;
};

export function CreateMatchForm({ onMatchCreated }: Props) {
  const [id, setId] = useState<number>(1);
  const [stakeSol, setStakeSol] = useState("0.1"); // em SOL, convertendo depois
  const [deadlineUnix, setDeadlineUnix] = useState("1765000000");
  const [playerA, setPlayerA] = useState(
    "3nF4iy5JGGAQ4NX9LWweUWcrF15MnDHBfjtWc4y7bFkD",
  );
  const [playerB, setPlayerB] = useState(
    "AERXYCimkmAWYsYWxeG5uSVD2f58wJcGAjHwPw43RQfY",
  );
  const [loading, setLoading] = useState(false);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTxSig(null);

    try {
      const stakeLamports = Math.round(parseFloat(stakeSol || "0") * 1_000_000_000);

      const res = await api.post<CreateResponse>("/match/create", {
        id,
        stakeLamports: String(stakeLamports),
        deadline: Number(deadlineUnix),
        playerA,
        playerB,
      });

      if (res.data.ok) {
        setTxSig(res.data.txSig);
        onMatchCreated(res.data.matchPda);
      } else {
        setError("Falha ao criar partida");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Erro inesperado ao criar partida");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "rgba(15, 23, 42, 0.9)",
        borderRadius: "0.75rem",
        border: "1px solid rgba(148, 163, 184, 0.4)",
        padding: "1.25rem",
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.8)",
      }}
    >
      <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
        1. Criar nova partida
      </h2>

      <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginBottom: "0.75rem" }}>
        Defina os dois jogadores principais, o valor do stake e o deadline mínimo
        para o árbitro declarar o vencedor.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: "0.75rem", fontSize: "0.85rem" }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>ID da partida</span>
            <input
              type="number"
              value={id}
              onChange={(e) => setId(Number(e.target.value))}
              style={inputStyle}
              min={1}
            />
          </label>

          <label style={{ display: "grid", gap: "0.25rem" }}>
            <span>Stake por player (SOL)</span>
            <input
              type="number"
              step="0.01"
              value={stakeSol}
              onChange={(e) => setStakeSol(e.target.value)}
              style={inputStyle}
              min={0}
            />
          </label>
        </div>

        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Deadline (Unix timestamp)</span>
          <input
            type="number"
            value={deadlineUnix}
            onChange={(e) => setDeadlineUnix(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Player A (pubkey)</span>
          <input
            type="text"
            value={playerA}
            onChange={(e) => setPlayerA(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Player B (pubkey)</span>
          <input
            type="text"
            value={playerB}
            onChange={(e) => setPlayerB(e.target.value)}
            style={inputStyle}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "0.5rem",
            padding: "0.5rem 0.75rem",
            borderRadius: "999px",
            border: "none",
            fontSize: "0.9rem",
            fontWeight: 600,
            background:
              "linear-gradient(135deg, rgba(129, 230, 217, 1), rgba(56, 189, 248, 1))",
            color: "#020617",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Criando..." : "Criar partida na Devnet"}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: "0.75rem", color: "#f97373", fontSize: "0.8rem" }}>
          {error}
        </div>
      )}

      {txSig && (
        <div
          style={{
            marginTop: "0.75rem",
            fontSize: "0.8rem",
            color: "#bbf7d0",
            wordBreak: "break-all",
          }}
        >
          <div>✅ Partida criada!</div>
          <div>
            Tx:
            <a
              href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#38bdf8", marginLeft: "0.25rem" }}
            >
              ver no Explorer
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.9)",
  borderRadius: "0.5rem",
  border: "1px solid rgba(148, 163, 184, 0.5)",
  padding: "0.4rem 0.55rem",
  color: "#e5e7eb",
  fontSize: "0.85rem",
  outline: "none",
};
