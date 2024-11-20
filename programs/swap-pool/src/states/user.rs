use anchor_lang::prelude::*;
pub const MAX_ASSETS: usize = 10;

#[account]
pub struct UserAccount {
    pub bump: u8,
    pub assets_info: Vec<AssetInfo>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AssetInfo {
    pub mint: Pubkey,
    pub amount: u64,
}

impl Space for UserAccount {
    // Assume a maximum of MAX_ASSETS assets in the vector
    const INIT_SPACE: usize = 8 // Account discriminator added by Anchor for each account
        + 1 // bump
        + 4 // Vector length prefix (Anchor uses a 4-byte prefix to store Vec length)
        + MAX_ASSETS * (32 + 8); // Space for each AssetInfo (Pubkey + u64)
}
