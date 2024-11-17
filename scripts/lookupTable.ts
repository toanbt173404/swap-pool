import {
  AddressLookupTableProgram,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

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
