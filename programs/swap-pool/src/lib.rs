use anchor_lang::prelude::*;

mod instructions;
mod states;

use instructions::*;
use states::*;

declare_id!("EJrHGZZxpQY1vwBwqmmMfqPv15shTfMLA9XZJr18wg3u");

#[program]
pub mod swap_pool {

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize(ctx)?;
        Ok(())
    }

    pub fn swap_amm(ctx: Context<SwapAMM>, amount_in: u64, minimum_amount_out: u64) -> Result<()> {
        instructions::swap_amm(ctx, amount_in, minimum_amount_out)?;
        Ok(())
    }

    pub fn swap_cpmm(
        ctx: Context<SwapCPMM>,
        amount_in: u64,
        minimum_amount_out: u64,
    ) -> Result<()> {
        instructions::swap_cpmm(ctx, amount_in, minimum_amount_out)?;
        Ok(())
    }
}
