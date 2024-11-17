use anchor_lang::prelude::*;

mod instructions;
mod states;

use instructions::*;

declare_id!("pbDFgxCSkTkiK4JLpCuCcpEkrmXQbzDvjboWgUFfvBo");

#[program]
pub mod swap_pool {

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }

    pub fn swap(ctx: Context<SwapCtx>, amount_in: u64, minimum_amount_out: u64) -> Result<()> {
        instructions::swap(ctx, amount_in, minimum_amount_out)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
