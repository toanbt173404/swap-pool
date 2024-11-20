import * as anchor from "@coral-xyz/anchor";
import * as idl from "../../target/idl/swap_pool.json";
import SwapPoolIDL from "../../target/idl/swap_pool.json";

import { SwapPool } from "../../target/types/swap_pool";
import {
  AddressLookupTableAccount,
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import { initSdk } from "../config";
import { payer } from "../wallet";
import { BN } from "bn.js";
import { addAddressesToTable, createLookupTable } from "../lookupTable";
import { finalizeTransaction, wrappedSOLInstruction } from "../utils";
import { TokenInfo } from "../type";
import { SwapPoolProgram } from "../../sdk/swap-pool-program";
import { tokens } from "../token";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const swapPoolProgram = new SwapPoolProgram(idl as SwapPool, connection);

export async function swapAmm(
  tokensInfo: TokenInfo[],
  inputMint: PublicKey,
  amountIn: number,
  minimumAmountOut: number
) {
  const raydium = await initSdk();
  const tx = new Transaction();
  const lookupTables: AddressLookupTableAccount[] = [];

  const lookupTableAddress = new PublicKey(
    "FFnNLnvHcUxuYCvBAjtj33Yt9xmMAsHZgwnRB6WwJhqS"
  );
  const lookupTable = (
    await connection.getAddressLookupTable(lookupTableAddress)
  ).value;

  for (const tokenInfo of tokensInfo) {
    const { instructions, lookupTable } = await processTokenSwap(
      connection,
      raydium,
      swapPoolProgram,
      payer,
      tokenInfo,
      inputMint,
      amountIn,
      minimumAmountOut
    );

    tx.instructions.push(...instructions);

    // if (lookupTable) {
    //   const lut = (await connection.getAddressLookupTable(lookupTable)).value;
    //   if (lut) {
    //     lookupTables.push(lut);
    //   }
    // }
  }

  //   if (lookupTables.length === 0) {
  //     throw new Error("No valid lookup tables found for transaction.");
  //   }
  await finalizeTransaction(connection, payer, tx, [lookupTable]);
}

async function processTokenSwap(
  connection: Connection,
  raydium: any,
  swapPoolProgram: SwapPoolProgram,
  payer: any,
  tokenInfo: TokenInfo,
  inputMint: PublicKey,
  amountIn: number,
  minimumAmountOut: number
): Promise<{ instructions: any[]; lookupTable: PublicKey | null }> {
  const txInstructions: any[] = [];
  let lookupTable: PublicKey | null = null;

  try {
    const data = await raydium.liquidity.getPoolInfoFromRpc({
      poolId: tokenInfo.ammId,
    });
    if (!data || !data.poolKeys) {
      return;
    }

    const poolKeys = data.poolKeys;
    const baseIn = inputMint.toString() === poolKeys.mintA.address;

    const [mintIn, mintOut] = baseIn
      ? [poolKeys.mintA.address, poolKeys.mintB.address]
      : [poolKeys.mintB.address, poolKeys.mintA.address];

    const inputTokenAccount = getAssociatedTokenAddressSync(
      new PublicKey(mintIn),
      payer.publicKey,
      false
    );

    const outputTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      new PublicKey(mintOut),
      swapPoolProgram.configPDA,
      true
    );

    if (inputMint.equals(NATIVE_MINT)) {
      const wrappedSolIx = await wrappedSOLInstruction(
        payer.publicKey,
        amountIn
      );
      txInstructions.push(...wrappedSolIx);
    }

    const swapAmmIx = await swapPoolProgram.program.methods
      .swapAmm(new BN(amountIn), new BN(minimumAmountOut))
      .accountsPartial({
        userSourceOwner: payer.publicKey,
        amm: new PublicKey(tokenInfo.ammId),
        ammAuthority: new PublicKey(poolKeys.authority),
        ammOpenOrders: new PublicKey(poolKeys.openOrders),
        ammCoinVault: new PublicKey(poolKeys.vault.A),
        ammPcVault: new PublicKey(poolKeys.vault.B),
        marketProgram: new PublicKey(poolKeys.marketProgramId),
        market: new PublicKey(poolKeys.marketId),
        marketBids: new PublicKey(poolKeys.marketBids),
        marketAsks: new PublicKey(poolKeys.marketAsks),
        marketEventQueue: new PublicKey(poolKeys.marketEventQueue),
        marketCoinVault: new PublicKey(poolKeys.marketBaseVault),
        marketPcVault: new PublicKey(poolKeys.marketQuoteVault),
        marketVaultSigner: new PublicKey(poolKeys.marketAuthority),
        ammProgram: new PublicKey(poolKeys.programId),
        userTokenSource: inputTokenAccount,
        vaultTokenAccount: outputTokenAccount.address,
      })
      .instruction();

    const accountKeys = [
      new PublicKey(tokenInfo.ammId),
      new PublicKey(poolKeys.authority),
      new PublicKey(poolKeys.openOrders),
      new PublicKey(poolKeys.vault.A),
      new PublicKey(poolKeys.vault.B),
      new PublicKey(poolKeys.marketProgramId),
      new PublicKey(poolKeys.marketId),
      new PublicKey(poolKeys.marketBids),
      new PublicKey(poolKeys.marketAsks),
      new PublicKey(poolKeys.marketEventQueue),
      new PublicKey(poolKeys.marketBaseVault),
      new PublicKey(poolKeys.marketQuoteVault),
      new PublicKey(poolKeys.marketAuthority),
      new PublicKey(poolKeys.programId),
      SystemProgram.programId,
      swapPoolProgram.program.programId,
      TOKEN_PROGRAM_ID,
    ];

    if (tokenInfo.lut) {
      lookupTable = tokenInfo.lut;
    } else {
      lookupTable = await createLookupTable(connection, payer);
      await addAddressesToTable(connection, payer, lookupTable, accountKeys);
      console.log(`Lookup Table Address: ${lookupTable}`);
    }

    txInstructions.push(swapAmmIx);
  } catch (error) {
    console.error(
      `Error processing token swap for AMM ID: ${tokenInfo.ammId}`,
      error
    );
  }

  return { instructions: txInstructions, lookupTable };
}


const amountIn = 0.1 * LAMPORTS_PER_SOL;
const minAmountOut = 0;

swapAmm(tokens.slice(0, 4), NATIVE_MINT, amountIn, minAmountOut);