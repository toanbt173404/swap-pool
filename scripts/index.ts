
import {
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  NATIVE_MINT,
} from "@solana/spl-token";

import { tokens } from "./token";
import { swapAmm } from "./swapAmm";

swapAmm(tokens.slice(0,9), NATIVE_MINT, 0.1 * LAMPORTS_PER_SOL, 0);


