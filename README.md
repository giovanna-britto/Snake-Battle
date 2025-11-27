# Snake Betting Protocol (Solana Devnet) – Documentação Completa

Aplicação completa (programa Anchor + backend NestJS + frontend React/Vite) para apostas 1v1 com árbitro, construída para o desafio **Solana Hacker Hotel DevCon 2025 – Protocolo de Apostas Solana**.

**Vídeo Demo:** [https://youtu.be/DUS9qbJ-Dx0](https://youtu.be/DUS9qbJ-Dx0)

## Visão geral e objetivo
- **O que é:** protocolo de apostas entre duas partes com árbitro. Usuários A/B depositam o mesmo valor em SOL; um árbitro (Conta C) decide o vencedor após o deadline. O vencedor saca o total em escrow.
- **Objetivo:** entregar rapidamente um MVP funcional on-chain + cliente, cumprindo os requisitos do desafio (escrow, árbitro, tempo, saque seguro) e oferecendo uma UI amigável com WalletConnect e um mini-game de Snake após a aposta.
- **Fluxo principal:** criar partida → depositar/apostar → aguardar deadline → árbitro declara vencedor → vencedor saqueia o prêmio. O frontend guia o usuário e o backend assina as transações com a chave do árbitro.

## Estrutura do repositório
- `snake-betting/` — Programa on-chain Anchor em Rust (`snake_betting`). IDL, código Rust, scripts de build/test/deploy.
- `backend/` — Gateway REST NestJS que assina e envia transações para o programa usando o keypair do árbitro.
- `frontend/` — SPA React/Vite que conecta via WalletConnect/Phantom/Solflare, cria/participa de partidas/apostas e redireciona para o jogo Snake.

## Como a aplicação funciona (visão de alto nível)
1) **Frontend (carteira do usuário):**
   - Conecta via WalletConnect/Phantom/Solflare.
   - Permite criar ou selecionar uma match e fazer aposta (chamadas ao backend).
   - Após apostar, redireciona para `/play` com contexto da aposta (match, lado, valor) e mostra o jogo Snake.
2) **Backend (árbitro):**
   - Recebe as requisições REST do frontend.
   - Usa `SERVER_KEYPAIR_PATH` como árbitro para assinar e enviar as instruções Anchor (`create_match`, `place_bet`, `declare_winner`, etc.).
   - Exposição de CORS configurável.
3) **Programa Anchor (on-chain):**
   - Mantém o escrow da partida e das apostas.
   - Valida assinaturas (árbitro) e PDAs.
   - Controla deadline para declarar vencedor e previne double-spend nos saques.

## Programa on-chain (Anchor)
- **Framework:** Anchor.
- **Cluster:** Devnet.
- **Program ID (Anchor.toml):** `HBHeroLarYj7jgzWHfmzbwbVG2dUGgzM5CbTP7pJg3K1`.
- **Seeds/estado (versão atual):**
  - Match PDA: `["match", arbiter]` → 1 partida por árbitro (limitação).
  - Participant PDA: `["participant", match, arbiter]` → 1 apostador (o árbitro) por partida (limitação).
- **Instruções (IDL):**
  - `create_match(id, stake_lamports, deadline, player_a, player_b)`
  - `join_as_player()`
  - `place_bet(side, amount_lamports)`
  - `declare_winner(winner)`
  - `withdraw_winner_stake()`
  - `claim_bet_payout()`
- **Segurança:** assinante correto para árbitro; PDAs para escrow; movimentação de SOL controlada; deadline aplicado na declaração de vencedor.

## Backend (NestJS)
- **Papel:** gateway HTTP/REST que fala com o programa Anchor usando o keypair do árbitro.
- **Endpoints:** `/match/create`, `/match/join`, `/match/bet`, `/match/declare-winner`, `/match/withdraw-stake`, `/match/claim-payout`, `/match/info`.
- **Env obrigatórios:** `RPC_URL`, `PROGRAM_ID`, `SERVER_KEYPAIR_PATH`; opcionais `PORT`, `CORS_ORIGINS`.
- **Observação de limitação:** PDAs usam o árbitro, logo existe 1 match e 1 participant por árbitro; múltiplas partidas/apostadores exigem mudança de seeds + redeploy.

## Frontend (React/Vite)
- **Carteiras:** WalletConnect + Phantom + Solflare (Solana Wallet Adapter).
- **Fluxo de UI:** criar/selecionar match → apostar → redirecionar para `/play` com informações da aposta → jogo Snake exibido.
- **Env:** `VITE_API_URL`, `VITE_RPC_URL`, `VITE_SOLANA_NETWORK`, `VITE_WALLETCONNECT_PROJECT_ID`, `VITE_MOCK_API` (mock para testar UI sem backend/on-chain).
- **Modo mock:** com `VITE_MOCK_API=true`, as chamadas de API retornam respostas fake, útil para demo sem rede.

## Como rodar localmente
1) **Programa/Anchor (opcional para UI):**
   ```bash
   cd snake-betting
   yarn install
   anchor build
   anchor deploy  # requer wallet/RPC configurados
   ```
2) **Backend:**
   ```bash
   cd backend
   cp .env.example .env    # preencha RPC_URL, PROGRAM_ID, SERVER_KEYPAIR_PATH
   npm install
   npm run start:dev       # PORT default 3000 (ajuste CORS_ORIGINS se precisar)
   ```
3) **Frontend:**
   ```bash
   cd frontend
   cp .env.example .env    # ajuste VITE_API_URL e WalletConnect projectId
   npm install
   npm run dev             # default http://localhost:5173
   ```
4) **Mock UI:** defina `VITE_MOCK_API=true` no `.env` do frontend para evitar chamadas on-chain/backend.

## Checklist de requisitos do desafio (MVP)
- **Sistema de Apostas entre Duas Partes:** players A/B em `create_match`; ambos depositam stake igual; SOL em escrow no PDA da match.
- **Mecanismo de Árbitro:** keypair do servidor é o árbitro; só ele chama `declare_winner`; deadline controlado pelo parâmetro `deadline`.
- **Sistema de Pagamento:** vencedor saca os depósitos via `withdraw_winner_stake`/`claim_bet_payout`; PDAs evitam double-spend.
- **Aplicação Cliente:** frontend web com WalletConnect; funções de criar match, apostar/join, declarar vencedor, sacar; status/deadline disponíveis na IDL/back.

## Funcionalidades bônus (status)
- **Apostas em Grupo / N participantes:** não implementado nesta versão — precisaria mudar seeds e lógica para múltiplos apostadores e rateio proporcional.
- **Extras criativos:** UI leva ao jogo Snake após apostar; modo mock para demos rápidas; WalletConnect para variedade de carteiras.

## Limitações conhecidas
- 1 match por árbitro; 1 participant (árbitro) por partida devido aos seeds. Para múltiplas partidas/apostadores, alterar seeds para incluir ID/usuário e redeploy.
- Front não exibe leitura on-chain (deadline/status) em tempo real; requer endpoint de leitura de conta no backend.
- Apostas reais deveriam ser assinadas pelo usuário; hoje o backend assina com a chave do árbitro (modelo simplificado para MVP).

## Próximos passos sugeridos
- Redesenhar seeds para suportar múltiplas partidas e múltiplos apostadores (bônus “Apostas em Grupo”) e assinar com a carteira do usuário.
- Expor leitura on-chain no backend e renderizar status/deadline no frontend.
- Endurecer validações e mensagens de erro; publicar o front em hosting estático para demo pública.