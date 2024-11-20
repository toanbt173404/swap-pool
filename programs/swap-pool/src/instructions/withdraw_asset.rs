use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

use crate::{helper::transfer_from_pool_vault_to_user, ConfigAccount, UserAccount};

#[derive(Accounts)]
pub struct WithdrawAsset<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"config".as_ref()],
        bump
    )]
    pub config_account: Account<'info, ConfigAccount>,

    #[account(
        mut,
        seeds = [b"user".as_ref(), &user.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut,
        constraint = user_token_account.owner == user.key()
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    /// CHECK: Safe. user destination token Account. user Account to swap to.
    #[account(
        mut,
        constraint = vault_token_account.owner == user_account.key()
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    /// CHECK: Safe. The spl token program
    pub token_program: Program<'info, Token>,
}

pub fn withdraw_asset(ctx: Context<WithdrawAsset>, amount: u64) -> Result<()> {
    let user_key = ctx.accounts.user.key();

    let signer_seeds: &[&[u8]] = &[
        "user".as_ref(),
        user_key.as_ref(),
        &[ctx.accounts.user_account.bump],
    ];

    transfer_from_pool_vault_to_user(
        &ctx.accounts.vault_token_account.to_account_info(),
        &ctx.accounts.user_token_account.to_account_info(),
        &ctx.accounts.user_account.to_account_info(),
        &ctx.accounts.token_program.to_account_info(),
        amount,
        &[signer_seeds],
    )?;

    Ok(())
}
