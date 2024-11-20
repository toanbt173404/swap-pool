import { BN, IdlAccounts, IdlTypes, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey, Transaction, Keypair } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { SwapPool } from "../target/types/swap_pool";

export class SwapPoolProgram {
  constructor(
    public readonly idl: SwapPool,
    public readonly connection: Connection
  ) {}

  get program() {
    return new Program(this.idl, { connection: this.connection });
  }

  get configPDA(): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      this.program.programId
    )[0];
  }

  async initialize(admin: PublicKey): Promise<Transaction> {
    const tx = await this.program.methods
      .initialize()
      .accountsPartial({
        admin: admin,
        configAccount: this.configPDA,
      })
      .transaction();
    return tx;
  }
}
