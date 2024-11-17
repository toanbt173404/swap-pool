import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

export const payer = Keypair.fromSecretKey(
  bs58.decode(
    "57zzdnamQCwNscgZfERGLLnpMDDmPkFNfcASzZfGMiZq8X2U1G5RSFW7jNiQKwwYZFqvFbv6LeGh8FWxG189qtAr"
  )
);
