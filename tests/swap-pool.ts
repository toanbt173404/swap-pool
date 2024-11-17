import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SwapPool } from "../target/types/swap_pool";

describe("swap-pool", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SwapPool as Program<SwapPool>;

  it("Is initialized!", async () => {
    const tx = await program.methods.initialize().accountsPartial({}).rpc();
    console.log("Your transaction signature", tx);
  });
});
