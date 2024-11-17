use anchor_lang::prelude::*;

mod instructions;

use instructions::*;

declare_id!("6J3GbvoEFVZwwXyJWTnHx4uDbUevc4sfF2wRGbb4MeFP");

#[program]
pub mod swap_pool {

    use super::*;

    pub fn swap_amm(ctx: Context<SwapAMM>, amount_in: u64, minimum_amount_out: u64) -> Result<()> {
        instructions::swap_amm(ctx, amount_in, minimum_amount_out)?;
        Ok(())
    }

    pub fn swap_cpmm(ctx: Context<SwapCPMM>, amount_in: u64, minimum_amount_out: u64) -> Result<()> {
        instructions::swap_cpmm(ctx, amount_in, minimum_amount_out)?;
        Ok(())
    }
}

