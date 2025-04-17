use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

declare_id!("your_program_id");

#[program]
pub mod share_token {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, name: String, symbol: String) -> Result<()> {
        let share_state = &mut ctx.accounts.share_state;
        share_state.authority = ctx.accounts.authority.key();
        share_state.name = name;
        share_state.symbol = symbol;
        share_state.vault = Pubkey::default();
        Ok(())
    }

    pub fn mint(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        // Check if caller is authority
        require!(
            ctx.accounts.authority.key() == ctx.accounts.share_state.authority,
            ShareError::Unauthorized
        );

        // Mint tokens to recipient
        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.recipient.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )?;

        Ok(())
    }

    pub fn set_vault(ctx: Context<SetVault>, vault: Pubkey) -> Result<()> {
        require!(
            ctx.accounts.authority.key() == ctx.accounts.share_state.authority,
            ShareError::Unauthorized
        );
        ctx.accounts.share_state.vault = vault;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 32 + 32
    )]
    pub share_state: Account<'info, ShareState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub share_state: Account<'info, ShareState>,
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub recipient: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SetVault<'info> {
    #[account(mut)]
    pub share_state: Account<'info, ShareState>,
    pub authority: Signer<'info>,
}

#[account]
pub struct ShareState {
    pub authority: Pubkey,
    pub name: String,
    pub symbol: String,
    pub vault: Pubkey,
}

#[error_code]
pub enum ShareError {
    #[msg("Unauthorized access")]
    Unauthorized,
} 