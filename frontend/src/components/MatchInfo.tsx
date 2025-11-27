// src/components/MatchInfo.tsx
import { useEffect, useState } from "react";
import { api } from "../api";

type InfoResponse = {
  programId: string;
  serverWallet: string;
};

export function MatchInfo() {
  const [info, setInfo] = useState<InfoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<InfoResponse>("/match/info");
        setInfo(res.data);
      } catch (e) {
        console.error(e);
        setError("Erro ao carregar info do programa");
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, []);

  return (
    <div
      style={{
        background: "rgba(15, 23, 42, 0.9)",
        border: "1px solid rgba(148, 163, 184, 0.4)",
        borderRadius: "0.75rem",
        padding: "0.75rem 1rem",
        fontSize: "0.75rem",
        maxWidth: "480px",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Devnet status</div>
      {loading && <div>Carregando...</div>}
      {error && <div style={{ color: "#f97373" }}>{error}</div>}
      {info && (
        <div style={{ display: "grid", gap: "0.25rem" }}>
          <div>
            <span style={{ color: "#9ca3af" }}>Program ID: </span>
            <span style={{ fontFamily: "monospace" }}>{info.programId}</span>
          </div>
          <div>
            <span style={{ color: "#9ca3af" }}>Árbitro (server): </span>
            <span style={{ fontFamily: "monospace" }}>{info.serverWallet}</span>
          </div>
        </div>
      )}
    </div>
  );
}
