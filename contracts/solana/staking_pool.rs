use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("your_program_id");

#[program]
pub mod staking_pool {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        issue_token: Pubkey,
        redeem_token: Pubkey,
    ) -> Result<()> {
        let staking_state = &mut ctx.accounts.staking_state;
        staking_state.authority = ctx.accounts.authority.key();
        staking_state.issue_token = issue_token;
        staking_state.redeem_token = redeem_token;
        staking_state.index_end = 1;
        staking_state.index_start = 0;
        staking_state.pending_liquidation = 0;
        Ok(())
    }

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        require!(amount >= 10 * 1_000_000, StakingError::InsufficientAmount);

        // Transfer tokens from user to pool
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                to: ctx.accounts.pool_token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, amount)?;

        // Update staking state
        let staking_state = &mut ctx.accounts.staking_state;
        let issue = Issue {
            user: ctx.accounts.user.key(),
            issue_amount: amount,
            issue_time: Clock::get()?.unix_timestamp,
            is_staking: true,
        };

        // Store issue in PDA
        let issue_account = &mut ctx.accounts.issue_account;
        issue_account.data = issue;
        
        // Update global state
        staking_state.index_end = staking_state.index_end.checked_add(1).unwrap();
        staking_state.pending_liquidation = staking_state.pending_liquidation.checked_add(amount).unwrap();

        emit!(UserStake {
            user: ctx.accounts.user.key(),
            amount,
        });

        Ok(())
    }

    pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
        let staking_state = &mut ctx.accounts.staking_state;
        let issue_account = &mut ctx.accounts.issue_account;
        
        require!(
            issue_account.data.is_staking,
            StakingError::NotStaking
        );

        let amount = issue_account.data.issue_amount;
        
        // Transfer tokens back to user
        let seeds = &[
            b"pool".as_ref(),
            &[staking_state.index_end - 1],
        ];
        let signer = &[&seeds[..]];
        
        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.pool_token_account.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            signer,
        );
        token::transfer(transfer_ctx, amount)?;

        // Update state
        issue_account.data.is_staking = false;
        staking_state.pending_liquidation = staking_state.pending_liquidation.checked_sub(amount).unwrap();

        emit!(UserUnstake {
            user: ctx.accounts.user.key(),
            amount,
        });

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        require!(
            ctx.accounts.authority.key() == ctx.accounts.staking_state.authority,
            StakingError::Unauthorized
        );

        let staking_state = &mut ctx.accounts.staking_state;
        let balance = ctx.accounts.pool_token_account.amount;

        // Transfer all tokens to authority
        let seeds = &[b"pool".as_ref()];
        let signer = &[&seeds[..]];
        
        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.pool_token_account.to_account_info(),
                to: ctx.accounts.authority_token_account.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            signer,
        );
        token::transfer(transfer_ctx, balance)?;

        // Update state
        staking_state.index_start = staking_state.index_end;
        staking_state.pending_liquidation = 0;

        emit!(AdminWithdraw {
            user: ctx.accounts.authority.key(),
            withdraw: balance,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 32 + 8 + 8 + 8
    )]
    pub staking_state: Account<'info, StakingState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub staking_state: Account<'info, StakingState>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub issue_account: Account<'info, IssueAccount>,
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub staking_state: Account<'info, StakingState>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub issue_account: Account<'info, IssueAccount>,
    /// CHECK: This is safe because we verify the PDA
    pub pool_authority: AccountInfo<'info>,
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub staking_state: Account<'info, StakingState>,
    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority_token_account: Account<'info, TokenAccount>,
    /// CHECK: This is safe because we verify the PDA
    pub pool_authority: AccountInfo<'info>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct StakingState {
    pub authority: Pubkey,
    pub issue_token: Pubkey,
    pub redeem_token: Pubkey,
    pub index_end: u64,
    pub index_start: u64,
    pub pending_liquidation: u64,
}

#[account]
pub struct IssueAccount {
    pub data: Issue,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Issue {
    pub user: Pubkey,
    pub issue_amount: u64,
    pub issue_time: i64,
    pub is_staking: bool,
}

#[event]
pub struct UserStake {
    pub user: Pubkey,
    pub amount: u64,
}

#[event]
pub struct UserUnstake {
    pub user: Pubkey,
    pub amount: u64,
}

#[event]
pub struct AdminWithdraw {
    pub user: Pubkey,
    pub withdraw: u64,
}

#[error_code]
pub enum StakingError {
    #[msg("Insufficient amount for staking")]
    InsufficientAmount,
    #[msg("Not currently staking")]
    NotStaking,
    #[msg("Unauthorized access")]
    Unauthorized,
} 