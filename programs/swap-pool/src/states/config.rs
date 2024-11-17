use anchor_lang::prelude::*;

#[account]
pub struct ConfigAccount {
    pub bump: u8,
    pub is_initialized: bool,
    pub owner: Pubkey,
}

impl Space for ConfigAccount {
    const INIT_SPACE: usize = 8 // Account discriminator added by Anchor for each account
        + 1 // bump
        + 1 // is_initialized
        + 32; // owner
}
