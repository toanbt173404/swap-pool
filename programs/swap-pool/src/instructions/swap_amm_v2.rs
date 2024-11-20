use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

use raydium_amm_cpi::*;

use crate::ConfigAccount;

#[derive(Accounts)]
pub struct SwapAMMV2<'info> {
    /// CHECK: Safe. user owner Account
    #[account(mut)]
    pub user_source_owner: Signer<'info>,
    #[account(
        mut,
        seeds = [b"config".as_ref()],
        bump
    )]
    pub config_account: Account<'info, ConfigAccount>,
    /// CHECK: Safe. amm Account
    #[account(mut)]
    pub amm: AccountInfo<'info>,
    /// CHECK: Safe. Amm authority Account
    #[account(mut)]
    pub amm_authority: AccountInfo<'info>,
    /// CHECK: Safe. amm open_orders Account
    #[account(mut)]
    pub amm_open_orders: AccountInfo<'info>,
    /// CHECK: Safe. amm_coin_vault Amm Account to swap FROM or To,
    #[account(mut)]
    pub amm_coin_vault: AccountInfo<'info>,
    /// CHECK: Safe. amm_pc_vault Amm Account to swap FROM or To,
    #[account(mut)]
    pub amm_pc_vault: AccountInfo<'info>,
    /// CHECK: Safe.OpenBook program id
    pub market_program: AccountInfo<'info>,
    /// CHECK: Safe. OpenBook market Account. OpenBook program is the owner.
    #[account(mut)]
    pub market: AccountInfo<'info>,
    /// CHECK: Safe. bids Account
    #[account(mut)]
    pub market_bids: AccountInfo<'info>,
    /// CHECK: Safe. asks Account
    #[account(mut)]
    pub market_asks: AccountInfo<'info>,
    /// CHECK: Safe. event_q Account
    #[account(mut)]
    pub market_event_queue: AccountInfo<'info>,
    /// CHECK: Safe. coin_vault Account
    #[account(mut)]
    pub market_coin_vault: AccountInfo<'info>,
    /// CHECK: Safe. pc_vault Account
    #[account(mut)]
    pub market_pc_vault: AccountInfo<'info>,
    /// CHECK: Safe. vault_signer Account
    #[account(mut)]
    pub market_vault_signer: AccountInfo<'info>,
    /// CHECK: Safe. user source token Account. user Account to swap from.
    #[account(mut)]
    pub user_token_source: AccountInfo<'info>,
    /// CHECK: Safe. user destination token Account. user Account to swap to.
    #[account(
        mut,
        constraint = vault_token_account.owner == config_account.key()
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    /// CHECK: Safe. The spl token program
    pub token_program: Program<'info, Token>,
    /// CHECK: Safe. amm_program
    pub amm_program: AccountInfo<'info>,
}

pub fn swap_amm_v2(ctx: Context<SwapAMMV2>, amount_in: u64, minimum_amount_out: u64) -> Result<()> {
    let cpi_accounts = SwapBaseIn {
        amm: ctx.accounts.amm.clone(),
        amm_authority: ctx.accounts.amm_authority.clone(),
        amm_open_orders: ctx.accounts.amm_open_orders.clone(),
        amm_coin_vault: ctx.accounts.amm_coin_vault.clone(),
        amm_pc_vault: ctx.accounts.amm_pc_vault.clone(),
        market_program: ctx.accounts.market_program.clone(),
        market: ctx.accounts.market.clone(),
        market_bids: ctx.accounts.market_bids.clone(),
        market_asks: ctx.accounts.market_asks.clone(),
        market_event_queue: ctx.accounts.market_event_queue.clone(),
        market_coin_vault: ctx.accounts.market_coin_vault.clone(),
        market_pc_vault: ctx.accounts.market_pc_vault.clone(),
        market_vault_signer: ctx.accounts.market_vault_signer.clone(),
        user_token_source: ctx.accounts.user_token_source.clone(),
        user_token_destination: ctx.accounts.vault_token_account.to_account_info(),
        user_source_owner: ctx.accounts.user_source_owner.clone(),
        token_program: ctx.accounts.token_program.clone(),
    };

    let cpi_context = CpiContext::new(ctx.accounts.amm_program.to_account_info(), cpi_accounts);
    raydium_amm_cpi::instructions::swap_base_in(cpi_context, amount_in, minimum_amount_out)?;

    Ok(())
}
