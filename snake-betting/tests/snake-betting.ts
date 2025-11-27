import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { SnakeBetting } from "../target/types/snake_betting";

describe("snake-betting end-to-end", () => {
  // Usa o provider da env (configurado pelo Anchor)
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .SnakeBetting as Program<SnakeBetting>;

  const connection = provider.connection;

  const arbiter = provider.wallet.publicKey;

  // Players e apostadores
  const playerA = Keypair.generate();
  const playerB = Keypair.generate();
  const bettorA = Keypair.generate(); // apostador que aposta no PlayerA
  const bettorB = Keypair.generate(); // apostador que aposta no PlayerB (só pra exemplo, pode perder rs)

  // PDA da partida
  let matchPda: PublicKey;

  it("fluxo completo: cria partida, players depositam, apostas, vencedor, saques", async () => {
    // 1) Airdrop pra galera (devnet)
    console.log("Airdroppando SOL para players e bettors...");

    for (const kp of [playerA, playerB, bettorA, bettorB]) {
      const sig = await connection.requestAirdrop(
        kp.publicKey,
        1 * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(sig, "confirmed");
    }

    // 2) Derivar PDA da partida
    [matchPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("match"), arbiter.toBuffer()],
      program.programId
    );

    console.log("Match PDA:", matchPda.toBase58());

    // 3) Criar partida
    const id = new anchor.BN(1);
    const stakeLamports = new anchor.BN(0.1 * LAMPORTS_PER_SOL); // 0.1 SOL de stake pra cada
    const now = Math.floor(Date.now() / 1000);
    const deadline = new anchor.BN(now + 60); // 60s no futuro

    console.log("Criando partida...");
    await program.methods
      .createMatch(
        id,
        stakeLamports,
        deadline,
        playerA.publicKey,
        playerB.publicKey
      )
      .accounts({
        arbiter,
        matchAccount: matchPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    let matchAccount = await program.account.match.fetch(matchPda);
    console.log("Match criada. Status:", matchAccount.status);

    // 4) Players depositam stake
    console.log("Player A depositando stake...");
    await program.methods
      .joinAsPlayer()
      .accounts({
        player: playerA.publicKey,
        matchAccount: matchPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([playerA])
      .rpc();

    console.log("Player B depositando stake...");
    await program.methods
      .joinAsPlayer()
      .accounts({
        player: playerB.publicKey,
        matchAccount: matchPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([playerB])
      .rpc();

    matchAccount = await program.account.match.fetch(matchPda);
    console.log("Status após stakes:", matchAccount.status); // esperado: Funded

    // 5) Apostas da torcida
    const betAmountA = new anchor.BN(0.2 * LAMPORTS_PER_SOL);
    const betAmountB = new anchor.BN(0.1 * LAMPORTS_PER_SOL);

    const [participantPdaA] = PublicKey.findProgramAddressSync(
      [Buffer.from("participant"), matchPda.toBuffer(), bettorA.publicKey.toBuffer()],
      program.programId
    );
    const [participantPdaB] = PublicKey.findProgramAddressSync(
      [Buffer.from("participant"), matchPda.toBuffer(), bettorB.publicKey.toBuffer()],
      program.programId
    );

    console.log("Bettor A apostando no Player A...");
    await program.methods
      .placeBet({ playerA: {} }, betAmountA) // Side::PlayerA
      .accounts({
        bettor: bettorA.publicKey,
        matchAccount: matchPda,
        participant: participantPdaA,
        systemProgram: SystemProgram.programId,
      })
      .signers([bettorA])
      .rpc();

    console.log("Bettor B apostando no Player B...");
    await program.methods
      .placeBet({ playerB: {} }, betAmountB) // Side::PlayerB
      .accounts({
        bettor: bettorB.publicKey,
        matchAccount: matchPda,
        participant: participantPdaB,
        systemProgram: SystemProgram.programId,
      })
      .signers([bettorB])
      .rpc();

    matchAccount = await program.account.match.fetch(matchPda);
    console.log("Total apostado lado A:", matchAccount.totalSideA.toString());
    console.log("Total apostado lado B:", matchAccount.totalSideB.toString());

    // 6) Esperar passar o deadline (pra devnet talvez não precise, mas garantimos)
    console.log("Esperando passar o deadline...");
    await new Promise((resolve) => setTimeout(resolve, 65_000));

    // 7) Árbitro declara vencedor (vamos supor que Player A ganhou)
    console.log("Árbitro declarando Player A como vencedor...");
    await program.methods
      .declareWinner({ playerA: {} }) // Side::PlayerA
      .accounts({
        arbiter,
        matchAccount: matchPda,
      })
      .rpc();

    matchAccount = await program.account.match.fetch(matchPda);
    console.log("Status após declare_winner:", matchAccount.status, "Winner:", matchAccount.winner);

    // 8) Player A (vencedor) saca os stakes dos dois
    console.log("Player A sacando stakes...");
    const balanceBeforeWinner = await connection.getBalance(playerA.publicKey);

    await program.methods
      .withdrawWinnerStake()
      .accounts({
        winner: playerA.publicKey,
        matchAccount: matchPda,
      })
      .signers([playerA])
      .rpc();

    const balanceAfterWinner = await connection.getBalance(playerA.publicKey);
    console.log(
      "Saldo Player A antes/after winner stakes:",
      balanceBeforeWinner,
      balanceAfterWinner
    );

    // 9) Bettor A (que apostou no Player A) saca a parte dele do pool de apostas
    console.log("Bettor A sacando payout de aposta...");
    const balanceBeforeBettorA = await connection.getBalance(bettorA.publicKey);

    await program.methods
      .claimBetPayout()
      .accounts({
        bettor: bettorA.publicKey,
        matchAccount: matchPda,
        participant: participantPdaA,
      })
      .signers([bettorA])
      .rpc();

    const balanceAfterBettorA = await connection.getBalance(bettorA.publicKey);
    console.log(
      "Saldo Bettor A antes/depois payout:",
      balanceBeforeBettorA,
      balanceAfterBettorA
    );

    // Bettor B (lado perdedor) não deve conseguir sacar (se chamar, vai dar erro)
    console.log("Fluxo completo executado ✅");
  });
});
