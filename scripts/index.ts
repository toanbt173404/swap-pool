import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";

import { tokens } from "./token";
import { swapAmm } from "./swapAmm";

const amountIn = 0.1 * LAMPORTS_PER_SOL;
const minAmountOut = 0;

swapAmm(tokens.slice(0, 4), NATIVE_MINT, amountIn, minAmountOut);
