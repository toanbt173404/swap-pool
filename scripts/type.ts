import { PublicKey } from "@solana/web3.js";

export interface TokenInfo {
    name: string;
    mint: string;
    ammId?: string;
    lut?: PublicKey;
  }