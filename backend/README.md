# Snake Bet Backend (NestJS)

Gateway HTTP que conecta o frontend ao programa Anchor `snake_betting` em Solana. Assina transações com a chave do servidor (árbitro) e expõe endpoints REST para criar partidas, registrar jogadores/apostas, declarar vencedor e sacar.

## Pré-requisitos
- Node.js 18+
- Solana CLI configurada (para gerar/armazenar keypair)

## Variáveis de ambiente (.env)
- `RPC_URL` — endpoint RPC (ex.: https://api.devnet.solana.com)
- `PROGRAM_ID` — endereço do programa `snake_betting`
- `SERVER_KEYPAIR_PATH` — caminho do keypair JSON usado como árbitro
- `PORT` — porta HTTP (padrão 3000)
- `CORS_ORIGINS` — origens permitidas, separadas por vírgula (padrão: `http://localhost:5173,http://localhost:8080`)

## Rodando
```bash
cd backend
npm install
npm run start:dev   # ou PORT=4000 npm run start:dev
```

## Endpoints principais
- `POST /match/create` — cria a partida (usa árbitro/server)
- `POST /match/join` — entra como player
- `POST /match/bet` — faz aposta
- `POST /match/declare-winner` — árbitro declara vencedor (após deadline)
- `POST /match/withdraw-stake` — vencedor saca depósito
- `POST /match/claim-payout` — saque de aposta
- `GET /match/info` — dados do programa/servidor

Obs.: O programa atual deriva PDAs de match/participant usando o árbitro; isso limita a uma match e um participant por árbitro. Para múltiplas partidas ou bettors, é necessário alterar o programa/seeds e redeployar.
