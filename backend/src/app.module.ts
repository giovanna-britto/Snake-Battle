import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SolanaModule } from "./solana/solana.module";
import { MatchModule } from "./match/match.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SolanaModule,
    MatchModule,
  ],
})
export class AppModule {}
