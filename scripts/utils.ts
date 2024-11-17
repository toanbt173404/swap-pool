import {
  createSyncNativeInstruction,
  getAssociatedTokenAddress,
  NATIVE_MINT,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

export async function finalizeTransaction(
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

export async function wrappedSOLInstruction(
  recipient: PublicKey,
  amount: number
) {
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
