use anchor_lang::prelude::*;
use std::ops::DerefMut;

use crate::ConfigAccount;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        space = ConfigAccount::INIT_SPACE,
        seeds = [b"config".as_ref()],
        bump
    )]
    pub config_account: Account<'info, ConfigAccount>,
 
    pub system_program: Program<'info, System>,
}

pub fn initialize(ctx: Context<Initialize>,) -> Result<()> {
    let config_account = ctx.accounts.config_account.deref_mut();
    config_account.bump = ctx.bumps.config_account;

    config_account.admin = ctx.accounts.admin.key();

    Ok(())
}
