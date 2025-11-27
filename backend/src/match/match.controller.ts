import { Body, Controller, Get, Post } from "@nestjs/common";
import {
  MatchService,
  CreateMatchDto,
  JoinMatchDto,
  PlaceBetDto,
  DeclareWinnerDto,
  WithdrawStakeDto,
  ClaimPayoutDto,
} from "./match.service";
import { SolanaService } from "../solana/solana.service";

@Controller("match")
export class MatchController {
  constructor(
    private readonly matchService: MatchService,
    private readonly solana: SolanaService,
  ) {}

  @Get("info")
  getInfo() {
    return {
      programId: this.solana.programId.toBase58(),
      serverWallet: this.solana.serverKeypair.publicKey.toBase58(),
    };
  }

  @Post("create")
  create(@Body() dto: CreateMatchDto) {
    return this.matchService.createMatch(dto);
  }

  @Post("join")
  join(@Body() dto: JoinMatchDto) {
    return this.matchService.joinAsPlayer(dto);
  }

  @Post("bet")
  bet(@Body() dto: PlaceBetDto) {
    return this.matchService.placeBet(dto);
  }

  @Post("declare-winner")
  declareWinner(@Body() dto: DeclareWinnerDto) {
    return this.matchService.declareWinner(dto);
  }

  @Post("withdraw-stake")
  withdrawStake(@Body() dto: WithdrawStakeDto) {
    return this.matchService.withdrawWinnerStake(dto);
  }

  @Post("claim-payout")
  claimPayout(@Body() dto: ClaimPayoutDto) {
    return this.matchService.claimBetPayout(dto);
  }
}
