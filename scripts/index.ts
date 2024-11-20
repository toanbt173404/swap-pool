import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";
import * as idl from "../target/idl/swap_pool.json";

import { tokens } from "./token";
import { swapAmm } from "./swap-pool/swapAmm";
import { SwapPoolProgram } from "../sdk/swap-pool-program";
import { SwapPool } from "../target/types/swap_pool";
import { payer } from "./wallet";

const amountIn = 0.1 * LAMPORTS_PER_SOL;
const minAmountOut = 0;

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  const swapPoolProgram = new SwapPoolProgram(idl as SwapPool, connection);

//   const txPromise = Promise.all([
//     swapAmm(tokens.slice(0, 4), NATIVE_MINT, amountIn, minAmountOut),
//     swapAmm(tokens.slice(4, 8), NATIVE_MINT, amountIn, minAmountOut),
//     swapAmm(tokens.slice(8, 12), NATIVE_MINT, amountIn, minAmountOut),
//     swapAmm(tokens.slice(12, 16), NATIVE_MINT, amountIn, minAmountOut),
//   ]);
//   await txPromise;

  const userData = await swapPoolProgram.getUserData(payer.publicKey);

  let withdrawAssetTx = new Transaction();

  for(let assetInfo of userData.assetsInfo) {
    let instruction = await swapPoolProgram.withdrawAsset(payer.publicKey, assetInfo.mint, assetInfo.amount);
    withdrawAssetTx.instructions.push(instruction)
    
  }

  const txHash = await sendAndConfirmTransaction(connection, withdrawAssetTx, [payer]);
  console.log(`Withdraw asset at tx: https://explorer.solana.com/tx/${txHash}?cluster=devnet`)
}

main();
