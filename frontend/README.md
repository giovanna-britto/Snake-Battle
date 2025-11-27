# Snake Bet Blitz – Frontend

SPA em React/Vite/TypeScript com shadcn-ui. Conecta via WalletConnect a carteiras Solana e fala com o backend Nest para criar/participar de partidas e apostas. Há um modo mock para testar UI sem blockchain/backend.

## Tech stack
- Vite + React 18 + TypeScript
- Tailwind + shadcn-ui
- Solana Wallet Adapter (Phantom, Solflare, WalletConnect)
- TanStack Query para chamadas ao backend

## Como rodar
```bash
cd frontend
npm install
npm run dev   # abre em http://localhost:5173 (ou porta do Vite)
```

## Variáveis de ambiente (.env)
Veja `.env.example`. Principais:
- `VITE_API_URL` — base URL do backend (ex.: http://localhost:3000)
- `VITE_RPC_URL` — RPC Solana (opcional, padrão devnet)
- `VITE_SOLANA_NETWORK` — `devnet`, `testnet` ou `mainnet-beta`
- `VITE_WALLETCONNECT_PROJECT_ID` — Project ID do WalletConnect Cloud
- `VITE_MOCK_API` — `true` para mockar respostas de API (sem backend/on-chain)

## Scripts úteis
- `npm run dev` — desenvolvimento
- `npm run build` — build de produção
- `npm run preview` — preview do build

## Notas de fluxo
- Ao apostar pelo modal, o app redireciona para `/play` e exibe o contexto da aposta (match, lado, valor).
- Se precisar testar sem backend ou programa on-chain, use `VITE_MOCK_API=true`.
