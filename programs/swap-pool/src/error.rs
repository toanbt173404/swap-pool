use anchor_lang::prelude::*;

#[error_code]
pub enum SwapPoolError {
    #[msg("Only authority can call this function")]
    Unauthorized,

    #[msg("Max assets exceeded.")]
    MaxAssetsExceeded,
}
