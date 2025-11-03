use anchor_lang::{prelude::*};

declare_id!("2BzTjKtWgMPJG292jzUhKVR4C66fikbuNnkCQtCXmFRX");

#[program]
pub mod vault_pda {
    use super::*;
    
    pub fn initalize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        ctx.accounts.vault.owner = ctx.accounts.user.key();
        ctx.accounts.vault.bump = ctx.bumps.vault;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, _amount: u64) -> Result<()> {
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let vault_lamports = **ctx.accounts.vault.to_account_info().lamports.borrow();
        require!(vault_lamports >= amount, CustomError::NotEnoughFunds);
        **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.user.to_account_info().try_borrow_mut_lamports()? += amount;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        seeds = [b"vault", user.key().as_ref()],
        bump,
        payer = user,
        space = 8 + VaultAccount::INIT_SPACE,
    )]
    pub vault: Account<'info, VaultAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", user.key().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, VaultAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", user.key().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, VaultAccount>,
}

#[account]
#[derive(InitSpace)]
pub struct VaultAccount {
    pub owner: Pubkey,
    pub bump: u8,
}

#[error_code]
pub enum CustomError {
    #[msg("not enough funds in vault")]
    NotEnoughFunds,
}