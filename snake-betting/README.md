# snake-betting (Anchor)

Programa Anchor que mantém o escrow das partidas/apostas do Snake. Inclui código Rust do programa, clientes TS/JS para testes e scripts de migração/deploy.

## Estrutura
- `programs/snake_betting` — código do programa on-chain em Rust.
- `src` — bindings TS/IDL gerados (consumidos pelo backend).
- `app` / `client` — exemplos/utilitários para interagir via TS.
- `tests` — testes TS (ts-mocha) de integração Anchor.
- `migrations` — scripts Anchor de migração/deploy.

## Pré-requisitos
- Rust + Solana CLI
- Anchor CLI (`anchor --version`)
- Node/Yarn (package manager configurado no `Anchor.toml`)

## Comandos úteis
```bash
cd snake-betting
yarn install               # ou npm install, conforme seu setup
anchor build               # compila o programa
anchor test                # roda testes (usa ts-mocha)
anchor deploy              # deploy no cluster configurado
```

## Configuração
- `Anchor.toml` define `snake_betting = HBHeroLarYj7jgzWHfmzbwbVG2dUGgzM5CbTP7pJg3K1` em `localnet` e `devnet`.
- `provider.cluster` padrão é `localnet`; troque para `devnet/mainnet` conforme necessário.
- `provider.wallet` aponta para `~/.config/solana/id.json`; ajuste para a chave que vai assinar deploys.

Após deploy, use o `PROGRAM_ID` resultante no backend (`PROGRAM_ID`) e garanta que o IDL em `backend/src/idl` corresponda à versão do programa publicada.
