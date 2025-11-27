// src/components/MatchActions.tsx
import { type FormEvent, useState } from "react";
import { api } from "../api";

type Props = {
  currentMatchPda: string;
  onMatchPdaChange: (pda: string) => void;
};

type SimpleTxResponse = {
  ok: boolean;
  txSig: string;
};

export function MatchActions({ currentMatchPda, onMatchPdaChange }: Props) {
  const [matchPdaInput, setMatchPdaInput] = useState(currentMatchPda);
  const [joinSide, setJoinSide] = useState<"A" | "B">("A");
  const [betSide, setBetSide] = useState<"PlayerA" | "PlayerB">("PlayerA");
  const [betAmountSol, setBetAmountSol] = useState("0.05");
  const [winnerSide, setWinnerSide] = useState<"PlayerA" | "PlayerB">("PlayerA");

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const effectiveMatchPda = matchPdaInput || currentMatchPda;

  const handleSetMatchPda = (e: FormEvent) => {
    e.preventDefault();
    if (matchPdaInput.trim()) {
      onMatchPdaChange(matchPdaInput.trim());
      setLastMessage("Partida atual atualizada.");
    }
  };

  const runAction = async (
    label: string,
    fn: () => Promise<SimpleTxResponse>,
  ) => {
    setLoadingAction(label);
    setLastMessage(null);
    try {
      const res = await fn();
      if (res.ok) {
        setLastMessage(
          `✅ ${label} enviado. Tx: ${res.txSig}`,
        );
      } else {
        setLastMessage(`❌ ${label} falhou.`);
      }
    } catch (err: any) {
      console.error(err);
      setLastMessage(
        `❌ ${label} falhou: ${
          err?.response?.data?.message || err.message || "erro inesperado"
        }`,
      );
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div
      style={{
        background: "rgba(15, 23, 42, 0.9)",
        borderRadius: "0.75rem",
        border: "1px solid rgba(148, 163, 184, 0.4)",
        padding: "1.25rem",
        display: "grid",
        gap: "1rem",
      }}
    >
      <div>
        <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>
          2. Operar partida existente
        </h2>
        <p style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
          Use o PDA da partida para players entrarem, apostarem, declarar
          vencedor e sacar.
        </p>
      </div>

      <form
        onSubmit={handleSetMatchPda}
        style={{
          display: "grid",
          gap: "0.5rem",
          fontSize: "0.85rem",
        }}
      >
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Match PDA</span>
          <input
            type="text"
            value={matchPdaInput}
            onChange={(e) => setMatchPdaInput(e.target.value)}
            placeholder="CbvTN1rPzDAvLwz2zEuANs52VJLDpTGwUDLX3VM4QqwM"
            style={inputStyle}
          />
        </label>
        <button
          type="submit"
          style={{
            alignSelf: "start",
            padding: "0.35rem 0.6rem",
            borderRadius: "999px",
            border: "1px solid rgba(148, 163, 184, 0.8)",
            background: "transparent",
            color: "#e5e7eb",
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
        >
          Usar este PDA
        </button>
        {currentMatchPda && (
          <div
            style={{
              fontSize: "0.75rem",
              color: "#9ca3af",
              wordBreak: "break-all",
            }}
          >
            Atual: <span style={{ fontFamily: "monospace" }}>{currentMatchPda}</span>
          </div>
        )}
      </form>

      <div
        style={{
          borderTop: "1px solid rgba(55, 65, 81, 0.9)",
          margin: "0.25rem 0",
        }}
      />

      {/* JOIN AS PLAYER */}
      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <span style={{ fontWeight: 600 }}>Entrar como player</span>
          <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
            join_as_player
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            fontSize: "0.8rem",
            alignItems: "center",
          }}
        >
          <span>Side:</span>
          <select
            value={joinSide}
            onChange={(e) => setJoinSide(e.target.value as "A" | "B")}
            style={selectStyle}
          >
            <option value="A">Player A</option>
            <option value="B">Player B</option>
          </select>

          <button
            type="button"
            disabled={!effectiveMatchPda || loadingAction === "join"}
            onClick={() =>
              runAction("join", async () => {
                const res = await api.post<SimpleTxResponse>("/match/join", {
                  matchPda: effectiveMatchPda,
                  playerSide: joinSide,
                });
                return res.data;
              })
            }
            style={buttonGhost(loadingAction === "join")}
          >
            {loadingAction === "join" ? "Enviando..." : "Depositar stake"}
          </button>
        </div>
      </section>

      {/* PLACE BET */}
      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <span style={{ fontWeight: 600 }}>Apostar em um player</span>
          <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
            place_bet
          </span>
        </div>

        <div style={{ display: "grid", gap: "0.5rem", fontSize: "0.8rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span>Side:</span>
            <select
              value={betSide}
              onChange={(e) =>
                setBetSide(e.target.value as "PlayerA" | "PlayerB")
              }
              style={selectStyle}
            >
              <option value="PlayerA">Player A</option>
              <option value="PlayerB">Player B</option>
            </select>

            <span>Valor (SOL):</span>
            <input
              type="number"
              step="0.01"
              value={betAmountSol}
              onChange={(e) => setBetAmountSol(e.target.value)}
              style={{
                ...inputStyle,
                width: "80px",
                paddingInline: "0.4rem",
              }}
            />
          </div>

          <button
            type="button"
            disabled={!effectiveMatchPda || loadingAction === "bet"}
            onClick={() =>
              runAction("bet", async () => {
                const amountLamports = Math.round(
                  parseFloat(betAmountSol || "0") * 1_000_000_000,
                );

                const res = await api.post<SimpleTxResponse>("/match/bet", {
                  matchPda: effectiveMatchPda,
                  side: betSide,
                  amountLamports: String(amountLamports),
                });

                return res.data;
              })
            }
            style={buttonGhost(loadingAction === "bet")}
          >
            {loadingAction === "bet" ? "Enviando..." : "Enviar aposta"}
          </button>
        </div>
      </section>

      {/* DECLARE WINNER */}
      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <span style={{ fontWeight: 600 }}>Declarar vencedor</span>
          <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
            declare_winner
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            fontSize: "0.8rem",
          }}
        >
          <span>Vencedor:</span>
          <select
            value={winnerSide}
            onChange={(e) =>
              setWinnerSide(e.target.value as "PlayerA" | "PlayerB")
            }
            style={selectStyle}
          >
            <option value="PlayerA">Player A</option>
            <option value="PlayerB">Player B</option>
          </select>

          <button
            type="button"
            disabled={!effectiveMatchPda || loadingAction === "winner"}
            onClick={() =>
              runAction("winner", async () => {
                const res = await api.post<SimpleTxResponse>(
                  "/match/declare-winner",
                  {
                    matchPda: effectiveMatchPda,
                    winner: winnerSide,
                  },
                );
                return res.data;
              })
            }
            style={buttonGhost(loadingAction === "winner")}
          >
            {loadingAction === "winner" ? "Enviando..." : "Declarar vencedor"}
          </button>
        </div>
      </section>

      {/* WITHDRAW STAKE */}
      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <span style={{ fontWeight: 600 }}>Sacar stake do vencedor</span>
          <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
            withdraw_winner_stake
          </span>
        </div>

        <button
          type="button"
          disabled={!effectiveMatchPda || loadingAction === "withdrawStake"}
          onClick={() =>
            runAction("withdrawStake", async () => {
              const res = await api.post<SimpleTxResponse>(
                "/match/withdraw-stake",
                {
                  matchPda: effectiveMatchPda,
                },
              );
              return res.data;
            })
          }
          style={buttonGhost(loadingAction === "withdrawStake")}
        >
          {loadingAction === "withdrawStake"
            ? "Enviando..."
            : "Sacar stake do vencedor"}
        </button>
      </section>

      {/* CLAIM PAYOUT */}
      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <span style={{ fontWeight: 600 }}>Claim de aposta vencedora</span>
          <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
            claim_bet_payout
          </span>
        </div>

        <button
          type="button"
          disabled={!effectiveMatchPda || loadingAction === "claim"}
          onClick={() =>
            runAction("claim", async () => {
              const res = await api.post<SimpleTxResponse>(
                "/match/claim-payout",
                {
                  matchPda: effectiveMatchPda,
                },
              );
              return res.data;
            })
          }
          style={buttonGhost(loadingAction === "claim")}
        >
          {loadingAction === "claim" ? "Enviando..." : "Claim payout"}
        </button>
      </section>

      {lastMessage && (
        <div
          style={{
            marginTop: "0.25rem",
            fontSize: "0.8rem",
            color: lastMessage.startsWith("✅") ? "#bbf7d0" : "#fecaca",
            wordBreak: "break-all",
          }}
        >
          {lastMessage}
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

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  paddingInline: "0.4rem",
};

const sectionStyle: React.CSSProperties = {
  borderRadius: "0.75rem",
  border: "1px solid rgba(55, 65, 81, 0.9)",
  padding: "0.75rem",
  display: "grid",
  gap: "0.5rem",
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: "0.5rem",
  fontSize: "0.8rem",
};

function buttonGhost(loading: boolean): React.CSSProperties {
  return {
    padding: "0.4rem 0.7rem",
    borderRadius: "999px",
    border: "1px solid rgba(148, 163, 184, 0.9)",
    background: loading ? "rgba(15, 23, 42, 0.7)" : "rgba(15, 23, 42, 1)",
    color: "#e5e7eb",
    fontSize: "0.8rem",
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.7 : 1,
  };
}
