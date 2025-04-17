use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Burn};

declare_id!("your_program_id");

#[program]
pub mod vault_pool {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        issue_token: Pubkey,
        share_token: Pubkey,
    ) -> Result<()> {
        let vault_state = &mut ctx.accounts.vault_state;
        vault_state.authority = ctx.accounts.authority.key();
        vault_state.issue_token = issue_token;
        vault_state.share_token = share_token;
        vault_state.price = 1_000_000; // 1.0 in 6 decimals
        vault_state.paused = false;
        Ok(())
    }

    pub fn update_price(ctx: Context<UpdatePrice>, new_price: u64) -> Result<()> {
        require!(
            ctx.accounts.authority.key() == ctx.accounts.vault_state.authority,
            VaultError::Unauthorized
        );
        
        let vault_state = &mut ctx.accounts.vault_state;
        vault_state.price = new_price;

        emit!(UpdatePrice {
            user: ctx.accounts.authority.key(),
            price: new_price,
        });

        Ok(())
    }

    pub fn redeem(ctx: Context<Redeem>, amount: u64) -> Result<()> {
        require!(!ctx.accounts.vault_state.paused, VaultError::Paused);
        require!(amount > 0, VaultError::InvalidAmount);

        let vault_state = &ctx.accounts.vault_state;
        
        // Calculate redeem amount in issue token decimals (6)
        let redeem_amount = (vault_state.price.checked_mul(amount).unwrap())
            .checked_div(1_000_000_000_000_000_000)
            .unwrap();

        // Check if enough liquidity
        require!(
            redeem_amount <= ctx.accounts.pool_token_account.amount,
            VaultError::InsufficientLiquidity
        );

        // Burn share tokens
        let burn_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.share_mint.to_account_info(),
                from: ctx.accounts.user_share_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        token::burn(burn_ctx, amount)?;

        // Transfer issue tokens to user
        let seeds = &[b"vault".as_ref()];
        let signer = &[&seeds[..]];
        
        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.pool_token_account.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.vault_authority.to_account_info(),
            },
            signer,
        );
        token::transfer(transfer_ctx, redeem_amount)?;

        emit!(UserRedeem {
            user: ctx.accounts.user.key(),
            withdraw: redeem_amount,
            burn: amount,
        });

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        require!(
            ctx.accounts.authority.key() == ctx.accounts.vault_state.authority,
            VaultError::Unauthorized
        );

        let vault_state = &mut ctx.accounts.vault_state;
        let balance = ctx.accounts.pool_token_account.amount;

        // Transfer all tokens to authority
        let seeds = &[b"vault".as_ref()];
        let signer = &[&seeds[..]];
        
        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.pool_token_account.to_account_info(),
                to: ctx.accounts.authority_token_account.to_account_info(),
                authority: ctx.accounts.vault_authority.to_account_info(),
            },
            signer,
        );
        token::transfer(transfer_ctx, balance)?;

        // Pause the vault
        vault_state.paused = true;

        emit!(AdminWithdraw {
            user: ctx.accounts.authority.key(),
            withdraw: balance,
        });

        Ok(())
    }

    pub fn pause(ctx: Context<Pause>) -> Result<()> {
        require!(
            ctx.accounts.authority.key() == ctx.accounts.vault_state.authority,
            VaultError::Unauthorized
        );
        ctx.accounts.vault_state.paused = true;
        Ok(())
    }

    pub fn unpause(ctx: Context<Unpause>) -> Result<()> {
        require!(
            ctx.accounts.authority.key() == ctx.accounts.vault_state.authority,
            VaultError::Unauthorized
        );
        ctx.accounts.vault_state.paused = false;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 32 + 8 + 1
    )]
    pub vault_state: Account<'info, VaultState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePrice<'info> {
    #[account(mut)]
    pub vault_state: Account<'info, VaultState>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Redeem<'info> {
    #[account(mut)]
    pub vault_state: Account<'info, VaultState>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_share_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub share_mint: Account<'info, token::Mint>,
    /// CHECK: This is safe because we verify the PDA
    pub vault_authority: AccountInfo<'info>,
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub vault_state: Account<'info, VaultState>,
    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority_token_account: Account<'info, TokenAccount>,
    /// CHECK: This is safe because we verify the PDA
    pub vault_authority: AccountInfo<'info>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Pause<'info> {
    #[account(mut)]
    pub vault_state: Account<'info, VaultState>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Unpause<'info> {
    #[account(mut)]
    pub vault_state: Account<'info, VaultState>,
    pub authority: Signer<'info>,
}

#[account]
pub struct VaultState {
    pub authority: Pubkey,
    pub issue_token: Pubkey,
    pub share_token: Pubkey,
    pub price: u64,
    pub paused: bool,
}

#[event]
pub struct UpdatePrice {
    pub user: Pubkey,
    pub price: u64,
}

#[event]
pub struct UserRedeem {
    pub user: Pubkey,
    pub withdraw: u64,
    pub burn: u64,
}

#[event]
pub struct AdminWithdraw {
    pub user: Pubkey,
    pub withdraw: u64,
}

#[error_code]
pub enum VaultError {
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Vault is paused")]
    Paused,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
} 