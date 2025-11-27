import { Module } from "@nestjs/common";
import { MatchService } from "./match.service";
import { MatchController } from "./match.controller";
import { SolanaModule } from "../solana/solana.module";

@Module({
  imports: [SolanaModule],
  providers: [MatchService],
  controllers: [MatchController],
})
export class MatchModule {}
