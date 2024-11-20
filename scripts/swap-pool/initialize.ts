import {
  clusterApiUrl,
  Connection,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { SwapPoolProgram } from "../../sdk/swap-pool-program";
import { SwapPool } from "../../target/types/swap_pool";
import * as idl from "../../target/idl/swap_pool.json";
import { payer } from "../wallet";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

export async function initialize() {
  const swapPoolProgram = new SwapPoolProgram(idl as SwapPool, connection);
  const tx = await swapPoolProgram.initialize(payer.publicKey);

  const txHash = await sendAndConfirmTransaction(connection, tx, [payer]);
  console.log(
    `Initialize at tx: ${`https://explorer.solana.com/tx/${txHash}?cluster=devnet`}`
  );
}

initialize();
