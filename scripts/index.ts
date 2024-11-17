import * as anchor from "@coral-xyz/anchor";
import SwapPoolIDL from "../target/idl/swap_pool.json";

import { SwapPool } from "../target/types/swap_pool";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  getAssociatedTokenAddress,
  createSyncNativeInstruction,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

import { initSdk } from "./config";
import { payer } from "./wallet";
import { BN } from "bn.js";
import { addAddressesToTable, createLookupTable } from "./lookupTable";
import {
  AmmRpcData,
  AmmV4Keys,
  ApiV3PoolInfoStandardItem,
  sleep,
} from "@raydium-io/raydium-sdk-v2";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const swapPoolProgram = new anchor.Program(SwapPoolIDL as SwapPool, {
  connection: connection,
});

const raydiumDevnet = {
  cpmmAddress: new PublicKey("CPMDWBwJDtYax9qW7AyRuVC19Cc4L4Vcy4n2BHAbHkCW"),
  ammConfig: new PublicKey("9zSzfkYy6awexsHvmggeH36pfVUdDGyCcwmjT3AQPBj6"),
  authority: new PublicKey("7rQ1QFNosMkUCuh7Z7fPbTHvh73b68sQYdirycEzJVuw"),
};

async function swapAmm(inputMint: PublicKey, amountIn: number, minimumAmountOut: number) {
  const raydium = await initSdk();
  const ammId = "AkudHW16bjPc1bB7N5L6GHQGKt9Z3oG9iHJj48tLWS5g";

  let poolKeys: AmmV4Keys | undefined;

  const data = await raydium.liquidity.getPoolInfoFromRpc({ poolId: ammId });
  poolKeys = data.poolKeys;

  const baseIn = inputMint.toString() === poolKeys.mintA.address;

  const [mintIn, mintOut] = baseIn ? [poolKeys.mintA.address, poolKeys.mintB.address] : [poolKeys.mintB.address, poolKeys.mintA.address]
  
  const inputTokenAccount = getAssociatedTokenAddressSync(
    new PublicKey(mintIn),
    payer.publicKey,
    false,
  );

  const outputTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    new PublicKey(mintOut),
    payer.publicKey,
    false
  );

  const tx = new Transaction();

  if (inputMint == NATIVE_MINT) {
    let wrappedSolIx = await wrappedSOLInstruction(payer.publicKey, amountIn);
    tx.instructions.push(...wrappedSolIx);
  }

  const swapAmmIx = await swapPoolProgram.methods
    .swapAmm(new BN(amountIn), new BN(minimumAmountOut))
    .accountsPartial({
      amm: new PublicKey(ammId),
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
      userTokenDestination: outputTokenAccount.address,
      userSourceOwner: payer.publicKey,
    }).instruction();

  const accountKeys = [
    new PublicKey(ammId),
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
    new PublicKey(poolKeys.programId)
  ];

  //const lookupTableAddress = await createLookupTable(connection, payer);
  const lookupTableAddress = new PublicKey('JCU9StPNEh3ojTMDZQYxM3SPG7ABTy4LBUecgpqhCzZn')
  // await addAddressesToTable(connection, payer, lookupTableAddress, accountKeys);
  console.log(`Lookup Table Address: ${lookupTableAddress}`);

  const lookupTables = [];
  const lut = (await connection.getAddressLookupTable(lookupTableAddress))
    .value;
  lookupTables.push(lut);

  tx.instructions.push(swapAmmIx);

  await finalizeTransaction(connection, payer, tx, lookupTables);
}

swapAmm(NATIVE_MINT, 0.1 * LAMPORTS_PER_SOL, 0);

async function main() {
  const raydium = await initSdk();
  const poolState = "9LrM2MVA7FYYZQQayenMya9VzmG27XUEgLQq43eqqDCZ";

  const res = await raydium.cpmm.getRpcPoolInfos([poolState]);

  const poolInfo = res[poolState];

  const inputToken = NATIVE_MINT; //WSOL

  const outputToken = new PublicKey(
    "DfZ5GjSXWcYVWLTgk1QRD7kx3u8FmKMNErUPsa8JPPdo"
  ); //DONE

  const swapPoolProgram = new anchor.Program(SwapPoolIDL as SwapPool, {
    connection: connection,
  });
  const inputTokenProgram = TOKEN_PROGRAM_ID;
  const outputTokenProgram = TOKEN_PROGRAM_ID;

  const inputTokenAccount = getAssociatedTokenAddressSync(
    inputToken,
    payer.publicKey,
    false,
    inputTokenProgram
  );
  const outputTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    outputToken,
    payer.publicKey,
    false
  );

  const amountIn = 1 * LAMPORTS_PER_SOL; //0.1 SOL
  const minimumAmountOut = new anchor.BN(0);

  const tx = new Transaction();

  if (inputToken == NATIVE_MINT) {
    let wrappedSolIx = await wrappedSOLInstruction(payer.publicKey, amountIn);
    tx.instructions.push(...wrappedSolIx);
  }

  const swapIx = await swapPoolProgram.methods
    .swapCpmm(new BN(amountIn), minimumAmountOut)
    .accountsPartial({
      payer: payer.publicKey,
      authority: raydiumDevnet.authority,
      ammConfig: poolInfo.configId,
      poolState: new PublicKey(poolState),
      inputTokenAccount: inputTokenAccount,
      outputTokenAccount: outputTokenAccount.address,
      inputTokenProgram: inputTokenProgram,
      outputTokenProgram: outputTokenProgram,
      inputVault: poolInfo.vaultA,
      outputVault: poolInfo.vaultB,
      inputTokenMint: inputToken,
      outputTokenMint: outputToken,
      observationState: poolInfo.observationId,
    })
    .instruction();

  const accountKeys = [
    raydiumDevnet.authority,
    poolInfo.configId,
    new PublicKey(poolState),
    inputTokenAccount,
    outputTokenAccount.address,
    inputTokenProgram,
    outputTokenProgram,
    poolInfo.vaultA,
    inputToken,
    outputToken,
    poolInfo.observationId,
  ];

  // const lookupTableAddress = await createLookupTable(connection, payer);
  const lookupTableAddress = new PublicKey(
    "4iPUjdYf4v4JfpSPruj6aZfecCuqJiE6fjFwVLK3ZDcL"
  );
  await addAddressesToTable(connection, payer, lookupTableAddress, accountKeys);
  console.log(`Lookup Table created for at: ${lookupTableAddress}`);

  const lookupTables = [];
  const lut = (await connection.getAddressLookupTable(lookupTableAddress))
    .value;
  lookupTables.push(lut);

  tx.instructions.push(swapIx);

  await finalizeTransaction(connection, payer, tx, lookupTables);
}

async function finalizeTransaction(
  connection: Connection,
  keyPair: Keypair,
  transaction: Transaction,
  lookupTables: any
) {
  let latestBlockhash = await connection.getLatestBlockhash("finalized");
  const messageV0 = new TransactionMessage({
    payerKey: keyPair.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: transaction.instructions,
  }).compileToV0Message(lookupTables);

  const transactionV0 = new VersionedTransaction(messageV0);
  transactionV0.sign([keyPair]);

  const txid = await connection.sendTransaction(transactionV0, {
    maxRetries: 5,
    skipPreflight: true,
  });
  const confirmation = await connection.confirmTransaction({
    signature: txid,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  });

  if (confirmation.value.err) {
    console.log(
      `❌ Transaction Error at tx: https://explorer.solana.com/tx/${txid}?cluster=devnet`
    );
  } else {
    console.log(
      `🎉 Transaction Successfully Confirmed at tx: https://explorer.solana.com/tx/${txid}?cluster=devnet`
    );
  }
}

async function wrappedSOLInstruction(recipient: PublicKey, amount: number) {
  let instructions: TransactionInstruction[] = [];

  let ata = await getAssociatedTokenAddress(
    NATIVE_MINT, // mint
    recipient // owner
  );

  instructions.push(
    SystemProgram.transfer({
      fromPubkey: recipient,
      toPubkey: ata,
      lamports: amount,
    }),
    createSyncNativeInstruction(ata)
  );

  return instructions;
}

// main();
