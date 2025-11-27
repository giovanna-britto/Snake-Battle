import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class SolanaService {
  public connection: Connection;
  public provider: anchor.AnchorProvider;
  public program: anchor.Program<anchor.Idl>;
  public serverKeypair: Keypair;
  public programId: PublicKey;

  constructor(private readonly config: ConfigService) {
    const rpcUrl = this.config.get<string>("RPC_URL") || "https://api.devnet.solana.com";
    const programIdStr = this.config.get<string>("PROGRAM_ID");
    const keypairPath = this.config.get<string>("SERVER_KEYPAIR_PATH");

    if (!programIdStr || !keypairPath) {
      throw new Error("PROGRAM_ID ou SERVER_KEYPAIR_PATH não definidos no .env");
    }

    // 1. Carrega Keypair
    const secret = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
    this.serverKeypair = Keypair.fromSecretKey(Uint8Array.from(secret));

    // 2. Configura Provider
    this.connection = new Connection(rpcUrl, "confirmed");
    const wallet = new anchor.Wallet(this.serverKeypair);
    
    this.provider = new anchor.AnchorProvider(this.connection, wallet, {
      preflightCommitment: "confirmed",
    });
    anchor.setProvider(this.provider);

    // 3. Carrega IDL de forma segura (Backend Style)
    // Ajuste o caminho '../idl/...' conforme a estrutura de pastas do seu build (dist)
    // Dica: Se rodando localmente sem build, pode ser necessário ajustar o path relative
    const idlAbsolutePath = path.resolve(process.cwd(), "src/idl/snake_betting.json");
    
    // Fallback caso o path acima não funcione (depende de onde você roda 'npm start')
    // Tente localizar onde o arquivo idl está realmente
    if (!fs.existsSync(idlAbsolutePath)) {
         console.error(`[SolanaService] IDL não encontrado em: ${idlAbsolutePath}`);
         // Tente um caminho relativo ao arquivo atual se necessário, ou mova o IDL para assets
    }
    
    const idlRaw = fs.readFileSync(idlAbsolutePath, "utf8");
    const idl = JSON.parse(idlRaw);

    // 4. Inicializa o Programa
    // Passamos o programId explicitamente caso o IDL seja genérico
    this.programId = new PublicKey(programIdStr);
    
    // Sobrescrevemos o address no metadata do IDL para garantir consistência
    if (!idl.metadata) { idl.metadata = {}; }
    idl.metadata.address = this.programId.toBase58();

    this.program = new anchor.Program(idl as anchor.Idl, this.provider);

    console.log("[SolanaService] Program initialized:", this.program.programId.toBase58());
  }
}