import { BN, IdlAccounts, Instruction, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey, Transaction, Keypair, TransactionInstruction } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { SwapPool } from "../target/types/swap_pool";

export type UserData = IdlAccounts<SwapPool>["userAccount"];

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

  userPDA(userPubkey: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("user"), userPubkey.toBuffer()],
      this.program.programId
    )[0];
  }

  async getUserData(userPubkey: PublicKey): Promise<UserData> {
    const userData = await this.program.account.userAccount.fetch(
      this.userPDA(userPubkey)
    );
    return userData;
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

  async withdrawAsset(
    userPubkey: PublicKey,
    mint: PublicKey,
    amount: BN
  ): Promise<TransactionInstruction> {
    const userAccount = this.userPDA(userPubkey);

    const userTokenAccount = getAssociatedTokenAddressSync(mint, userPubkey);

    const vaultTokenAccount = getAssociatedTokenAddressSync(
      mint,
      userAccount,
      true
    );

    const tx = await this.program.methods
      .withdrawAsset(amount)
      .accountsPartial({
        user: userPubkey,
        configAccount: this.configPDA,
        userAccount: userAccount,
        userTokenAccount: userTokenAccount,
        vaultTokenAccount: vaultTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        ammProgram: TOKEN_PROGRAM_ID
      })
      .instruction();
    return tx;
  }
}
