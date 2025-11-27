import { Injectable } from "@nestjs/common";
import { SolanaService } from "../solana/solana.service";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export class CreateMatchDto {
  id: number; // ex: 1
  stakeLamports: string; // string pra caber no BN
  deadline: number; // unix timestamp (segundos)
  playerA: string; // pubkey base58
  playerB: string; // pubkey base58
}

export class JoinMatchDto {
  matchPda: string; // PDA da match
}

export class PlaceBetDto {
  matchPda: string;
  side: "PlayerA" | "PlayerB";
  amountLamports: string;
}

export class DeclareWinnerDto {
  matchPda: string;
  winner: "PlayerA" | "PlayerB";
}

export class WithdrawStakeDto {
  matchPda: string;
}

export class ClaimPayoutDto {
  matchPda: string;
}

@Injectable()
export class MatchService {
  constructor(private readonly solana: SolanaService) {}

  // POST /match/create
  async createMatch(dto: CreateMatchDto) {
    const program: any = this.solana.program;

    const [matchPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("match"), this.solana.serverKeypair.publicKey.toBuffer()],
      this.solana.programId,
    );

    const txSig = await program.methods
      .createMatch(
        new anchor.BN(dto.id),
        new anchor.BN(dto.stakeLamports),
        new anchor.BN(dto.deadline),
        new PublicKey(dto.playerA),
        new PublicKey(dto.playerB),
      )
      .accounts({
        arbiter: this.solana.serverKeypair.publicKey,
        matchAccount: matchPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    return {
      ok: true,
      txSig,
      matchPda: matchPda.toBase58(),
    };
  }

  // POST /match/join
  async joinAsPlayer(dto: JoinMatchDto) {
    const program: any = this.solana.program;
    const matchPubkey = new PublicKey(dto.matchPda);

    const txSig = await program.methods
      .joinAsPlayer()
      .accounts({
        // ⚠️ Aqui o jogador é o próprio serverKeypair
        player: this.solana.serverKeypair.publicKey,
        matchAccount: matchPubkey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    return { ok: true, txSig };
  }

  // POST /match/bet
  async placeBet(dto: PlaceBetDto) {
    const program: any = this.solana.program;
    const matchPubkey = new PublicKey(dto.matchPda);

    const sideArg =
      dto.side === "PlayerA" ? { playerA: {} } : { playerB: {} };

    const [participantPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("participant"),
        matchPubkey.toBuffer(),
        this.solana.serverKeypair.publicKey.toBuffer(),
      ],
      this.solana.programId,
    );

    const txSig = await program.methods
      .placeBet(sideArg, new anchor.BN(dto.amountLamports))
      .accounts({
        bettor: this.solana.serverKeypair.publicKey,
        matchAccount: matchPubkey,
        participant: participantPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    return {
      ok: true,
      txSig,
      participantPda: participantPda.toBase58(),
    };
  }

  // POST /match/declare-winner
  async declareWinner(dto: DeclareWinnerDto) {
    const program: any = this.solana.program;
    const matchPubkey = new PublicKey(dto.matchPda);

    const winnerArg =
      dto.winner === "PlayerA" ? { playerA: {} } : { playerB: {} };

    const txSig = await program.methods
      .declareWinner(winnerArg)
      .accounts({
        arbiter: this.solana.serverKeypair.publicKey,
        matchAccount: matchPubkey,
      })
      .rpc();

    return { ok: true, txSig };
  }

  // POST /match/withdraw-stake
  async withdrawWinnerStake(dto: WithdrawStakeDto) {
    const program: any = this.solana.program;
    const matchPubkey = new PublicKey(dto.matchPda);

    const txSig = await program.methods
      .withdrawWinnerStake()
      .accounts({
        winner: this.solana.serverKeypair.publicKey,
        matchAccount: matchPubkey,
      })
      .rpc();

    return { ok: true, txSig };
  }

  // POST /match/claim-payout
  async claimBetPayout(dto: ClaimPayoutDto) {
    const program: any = this.solana.program;
    const matchPubkey = new PublicKey(dto.matchPda);

    const [participantPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("participant"),
        matchPubkey.toBuffer(),
        this.solana.serverKeypair.publicKey.toBuffer(),
      ],
      this.solana.programId,
    );

    const txSig = await program.methods
      .claimBetPayout()
      .accounts({
        bettor: this.solana.serverKeypair.publicKey,
        matchAccount: matchPubkey,
        participant: participantPda,
      })
      .rpc();

    return {
      ok: true,
      txSig,
      participantPda: participantPda.toBase58(),
    };
  }
}
