import {
  AddressLookupTableProgram,
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { initSdk } from "./config";
import { TokenInfo } from "./type";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import SwapPoolIDL from "../target/idl/swap_pool.json";
import { SwapPool } from "../target/types/swap_pool";
import { tokens } from "./token";
import { payer } from "./wallet";
import { sleep } from "@raydium-io/raydium-sdk-v2";
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

export async function createAndSendV0Tx(
  connection: Connection,
  signer: Keypair,
  txInstructions: TransactionInstruction[]
) {
  let latestBlockhash = await connection.getLatestBlockhash("finalized");
  const messageV0 = new TransactionMessage({
    payerKey: signer.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: txInstructions,
  }).compileToV0Message([]);
  const transaction = new VersionedTransaction(messageV0);

  transaction.sign([signer]);
  const txid = await connection.sendTransaction(transaction, {
    maxRetries: 5,
  });
  const confirmation = await connection.confirmTransaction({
    signature: txid,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  });
  if (confirmation.value.err) {
    throw new Error("❌ - Transaction not confirmed.");
  }
}

export async function createLookupTable(
  connection: Connection,
  signer: Keypair
) {
  const [lookupTableInst, lookupTableAddress] =
    AddressLookupTableProgram.createLookupTable({
      authority: signer.publicKey,
      payer: signer.publicKey,
      recentSlot: (await connection.getSlot()) - 1,
    });
  await createAndSendV0Tx(connection, signer, [lookupTableInst]);

  return lookupTableAddress;
}

export async function addAddressesToTable(
  connection: Connection,
  signer: Keypair,
  lookupTableAddress: PublicKey,
  addresses: PublicKey[]
) {
  const addAddressesInstruction = AddressLookupTableProgram.extendLookupTable({
    payer: signer.publicKey,
    authority: signer.publicKey,
    lookupTable: lookupTableAddress,
    addresses: addresses,
  });
  await createAndSendV0Tx(connection, signer, [addAddressesInstruction]);
  console.log(
    `Add account to lookup table https://explorer.solana.com/address/${lookupTableAddress.toString()}?cluster=devnet`
  );
}

export async function findAddressesInTable(
  connection: Connection,
  signer: Keypair,
  lookupTableAddress: PublicKey
) {
  const lookupTableAccount = await connection.getAddressLookupTable(
    lookupTableAddress
  );
  console.log(
    `Successfully found lookup table: `,
    lookupTableAccount.value?.key.toString()
  );

  if (!lookupTableAccount.value) return;

  for (let i = 0; i < lookupTableAccount.value.state.addresses.length; i++) {
    const address = lookupTableAccount.value.state.addresses[i];
    console.log(`   Address ${i + 1}: ${address.toBase58()}`);
  }
}

export async function compareTxSize(
  connection: Connection,
  signer: Keypair,
  lookupTableAddress: PublicKey
) {
  const lookupTable = (
    await connection.getAddressLookupTable(lookupTableAddress)
  ).value;
  if (!lookupTable) return;
  console.log("   ✅ - Fetched Lookup Table:", lookupTable.key.toString());

  const txInstructions: TransactionInstruction[] = [];
  for (let i = 0; i < lookupTable.state.addresses.length; i++) {
    const address = lookupTable.state.addresses[i];
    txInstructions.push(
      SystemProgram.transfer({
        fromPubkey: signer.publicKey,
        toPubkey: address,
        lamports: 0.01 * LAMPORTS_PER_SOL,
      })
    );
  }

  let latestBlockhash = await connection.getLatestBlockhash("finalized");

  const messageWithLookupTable = new TransactionMessage({
    payerKey: signer.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: txInstructions,
  }).compileToV0Message([lookupTable]);

  const transactionWithLookupTable = new VersionedTransaction(
    messageWithLookupTable
  );
  transactionWithLookupTable.sign([signer]);

  const messageWithoutLookupTable = new TransactionMessage({
    payerKey: signer.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: txInstructions,
  }).compileToV0Message();
  const transactionWithoutLookupTable = new VersionedTransaction(
    messageWithoutLookupTable
  );
  transactionWithoutLookupTable.sign([signer]);
  console.log("   ✅ - Compiled Transactions");
}
const swapPoolProgram = new anchor.Program(SwapPoolIDL as SwapPool, {
  connection: connection,
});

async function main(tokensInfo: TokenInfo[]) {
  const raydium = await initSdk();
  const lookupTableAddress = new PublicKey(
    "FFnNLnvHcUxuYCvBAjtj33Yt9xmMAsHZgwnRB6WwJhqS"
  );

  for (let tokenInfo of tokensInfo) {
    console.log("Processing token: ", tokenInfo.name);
    const data = await raydium.liquidity.getPoolInfoFromRpc({
      poolId: tokenInfo.ammId,
    });

    const poolKeys = data.poolKeys;

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
      swapPoolProgram.programId,
      TOKEN_PROGRAM_ID,
    ];

    // Get current addresses in the lookup table
    const lookupTableAccount = await connection.getAddressLookupTable(
      lookupTableAddress
    );

    if (!lookupTableAccount.value) {
      console.error("Lookup table not found!");
      return;
    }

    for(let address of lookupTableAccount.value.state.addresses) {
        console.log('address: ', address.toString())
    }

    const currentAddresses = new Set(
      lookupTableAccount.value.state.addresses.map((address) =>
        address.toBase58()
      )
    );

    const missingAddresses = accountKeys.filter(
      (key) => !currentAddresses.has(key.toBase58())
    );

    // Add missing addresses to the lookup table
    if (missingAddresses.length > 0) {
      await addAddressesToTable(
        connection,
        payer,
        lookupTableAddress,
        missingAddresses
      );
      console.log(`Added missing addresses for ${tokenInfo.name}`);
    } else {
      console.log(`No missing addresses for ${tokenInfo.name}`);
    }

    // Optional: sleep between requests to avoid rate limits
    await sleep(1000);
  }
}

// main(tokens.slice(0,1));
