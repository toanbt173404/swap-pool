use anchor_lang::prelude::*;

mod error;
mod helper;
mod instructions;
mod states;

use instructions::*;
use states::*;

declare_id!("67RfxD4MsNr9qSVDVE8BtaqJfsGT91pBnCdVJFdTEyFr");

#[program]
pub mod swap_pool {

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize(ctx)?;
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

    pub fn swap_amm(ctx: Context<SwapAMM>, amount_in: u64, minimum_amount_out: u64) -> Result<()> {
        instructions::swap_amm(ctx, amount_in, minimum_amount_out)?;
        Ok(())
    }

    pub fn swap_amm_v2(
        ctx: Context<SwapAMMV2>,
        amount_in: u64,
        minimum_amount_out: u64,
    ) -> Result<()> {
        instructions::swap_amm_v2(ctx, amount_in, minimum_amount_out)?;
        Ok(())
    }

    pub fn withdraw_asset(ctx: Context<WithdrawAsset>, amount: u64) -> Result<()> {
        instructions::withdraw_asset(ctx, amount)?;
        Ok(())
    }

    pub fn swap_base_out(
        ctx: Context<SwapPoolBaseOut>,
        max_amount_in: u64,
        amount_out: u64,
    ) -> Result<()> {
        instructions::swap_base_out(ctx, max_amount_in, amount_out)?;
        Ok(())
    }
}
