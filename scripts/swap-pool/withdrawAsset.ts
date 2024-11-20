import {
  clusterApiUrl,
  Connection,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";
import { SwapPoolProgram } from "../../sdk/swap-pool-program";
import { SwapPool } from "../../target/types/swap_pool";
import * as idl from "../../target/idl/swap_pool.json";
import { payer } from "../wallet";
import BN from "bn.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

export async function withdrawAsset(
  userPubkey: PublicKey,
  mint: PublicKey,
  amount: BN
) {
  const swapPoolProgram = new SwapPoolProgram(idl as SwapPool, connection);
  const tx = new Transaction();
  const instruction = await swapPoolProgram.withdrawAsset(
    userPubkey,
    mint,
    amount
  );
  tx.instructions.push(instruction);

  const txHash = await sendAndConfirmTransaction(connection, tx, [payer]);
  console.log(
    `Withdraw asset at tx: ${`https://explorer.solana.com/tx/${txHash}?cluster=devnet`}`
  );
}
