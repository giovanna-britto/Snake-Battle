use anchor_lang::prelude::*;

declare_id!("HBHeroLarYj7jgzWHfmzbwbVG2dUGgzM5CbTP7pJg3K1");

#[program]
pub mod snake_betting {
    use super::*;

    /// Inicialização dummy só pra manter compatibilidade.
    /// Não faz nada por enquanto.
    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    /// Cria uma nova partida (Match) de aposta da cobrinha.
    ///
    /// - `id`: identificador da partida (pode ser qualquer número, você decide off-chain)
    /// - `stake_lamports`: quanto cada jogador precisa depositar
    /// - `deadline`: timestamp mínimo (Unix) para poder declarar o vencedor
    /// - `player_a`, `player_b`: wallets dos dois jogadores principais
    pub fn create_match(
        ctx: Context<CreateMatch>,
        id: u64,
        stake_lamports: u64,
        deadline: i64,
        player_a: Pubkey,
        player_b: Pubkey,
    ) -> Result<()> {
        let clock = Clock::get()?;

        // deadline tem que estar no futuro
        require!(
            deadline > clock.unix_timestamp,
            CustomError::InvalidDeadline
        );

        // stake tem que ser > 0
        require!(stake_lamports > 0, CustomError::InvalidStake);

        let m = &mut ctx.accounts.match_account;

        m.arbiter = ctx.accounts.arbiter.key();
        m.player_a = player_a;
        m.player_b = player_b;

        m.stake_lamports = stake_lamports;
        m.total_side_a = 0;
        m.total_side_b = 0;

        m.deadline = deadline;
        m.status = MatchStatus::Created;
        m.winner = None;

        // bump do PDA da match
        let match_bump = ctx.bumps.match_account;
        m.bump = match_bump;

        m.id = id;
        m.player_a_deposited = false;
        m.player_b_deposited = false;
        m.stakes_withdrawn = false;

        Ok(())

    }

    /// Jogador A ou B deposita o stake na partida.
    ///
    /// - Só aceita `player_a` ou `player_b`.
    /// - Não deixa o mesmo jogador depositar duas vezes.
    /// - Quando os dois depositarem, muda status para `Funded`.
    /// Jogador A ou B deposita o stake na partida.
    ///
    /// - Só aceita `player_a` ou `player_b`.
    /// - Não deixa o mesmo jogador depositar duas vezes.
    /// - Quando os dois depositarem, muda status para `Funded`.
    pub fn join_as_player(ctx: Context<JoinAsPlayer>) -> Result<()> {
        let player_key = ctx.accounts.player.key();

        // Lemos os dados da Match de forma imutável primeiro
        let m_immut = &ctx.accounts.match_account;

        // Status tem que permitir depósito
        require!(
            m_immut.status == MatchStatus::Created || m_immut.status == MatchStatus::Funded,
            CustomError::InvalidStatus
        );

        // Verifica se é player A ou B e se já não depositou
        let mut is_player_a = false;
        let mut is_player_b = false;

        if player_key == m_immut.player_a {
            require!(!m_immut.player_a_deposited, CustomError::AlreadyDeposited);
            is_player_a = true;
        } else if player_key == m_immut.player_b {
            require!(!m_immut.player_b_deposited, CustomError::AlreadyDeposited);
            is_player_b = true;
        } else {
            return err!(CustomError::NotAPlayer);
        }

        // Transferência de SOL: player → conta Match (escrow)
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &player_key,
            &m_immut.key(),
            m_immut.stake_lamports,
        );

        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.player.to_account_info(),
                ctx.accounts.match_account.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        // Agora pegamos a match como mutável pra atualizar flags e status
        let m = &mut ctx.accounts.match_account;

        if is_player_a {
            m.player_a_deposited = true;
        }
        if is_player_b {
            m.player_b_deposited = true;
        }

        // Se os dois depositaram, muda status para Funded
        if m.player_a_deposited && m.player_b_deposited {
            m.status = MatchStatus::Funded;
        }

        Ok(())
    }

    /// Apostador entra apostando em PlayerA ou PlayerB.
    ///
    /// - `side`: em quem ele está apostando (PlayerA ou PlayerB)
    /// - `amount`: quanto ele está apostando (em lamports)
    ///
    /// A conta `Participant` é criada (se não existir) ou atualizada (se já existir),
    /// e o valor apostado é transferido para a conta Match (escrow).
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        side: Side,
        amount: u64,
    ) -> Result<()> {
        let bettor_key = ctx.accounts.bettor.key();
        let m_immut = &ctx.accounts.match_account;

        // Valor precisa ser > 0
        require!(amount > 0, CustomError::InvalidAmount);

        // Status da partida tem que permitir apostas
        require!(
            m_immut.status == MatchStatus::Created
                || m_immut.status == MatchStatus::Funded,
            CustomError::InvalidStatus
        );

        // Apostas só são aceitas antes do deadline
        let clock = Clock::get()?;
        require!(clock.unix_timestamp < m_immut.deadline, CustomError::BetsClosed);

        // Transferência de SOL: bettor -> Match (escrow)
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &bettor_key,
            &m_immut.key(),
            amount,
        );

        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.bettor.to_account_info(),
                ctx.accounts.match_account.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        // Agora atualizamos os dados on-chain
        let m = &mut ctx.accounts.match_account;
        let p = &mut ctx.accounts.participant;

        // Como a conta é sempre nova (init), é só preencher os campos:
        p.match_pubkey = m.key();
        p.bettor = bettor_key;
        p.side = side.clone();
        p.amount = amount;
        p.claimed = false;

        // Atualiza os totais da partida
        match side {
            Side::PlayerA => {
                m.total_side_a = m
                    .total_side_a
                    .checked_add(amount)
                    .ok_or(CustomError::MathOverflow)?;
            }
            Side::PlayerB => {
                m.total_side_b = m
                    .total_side_b
                    .checked_add(amount)
                    .ok_or(CustomError::MathOverflow)?;
            }
        }

        Ok(())
    }

        /// Árbitro declara o vencedor (PlayerA ou PlayerB) após o deadline.
    pub fn declare_winner(
        ctx: Context<DeclareWinner>,
        winner: Side,
    ) -> Result<()> {
        let m = &mut ctx.accounts.match_account;

        // Só o árbitro pode declarar
        require!(ctx.accounts.arbiter.key() == m.arbiter, CustomError::NotArbiter);

        // Precisa estar em estado válido
        require!(
            m.status == MatchStatus::Created
                || m.status == MatchStatus::Funded
                || m.status == MatchStatus::InProgress,
            CustomError::InvalidStatus
        );

        // Já resolvida?
        require!(m.winner.is_none(), CustomError::AlreadyResolved);

        // Verificar deadline
        let clock = Clock::get()?;
        require!(clock.unix_timestamp >= m.deadline, CustomError::TooEarly);

        m.winner = Some(winner);
        m.status = MatchStatus::Resolved;

        Ok(())
    }

    /// Jogador vencedor saca os dois stakes (2 x stake_lamports).
    pub fn withdraw_winner_stake(ctx: Context<WithdrawWinnerStake>) -> Result<()> {
        let winner_key = ctx.accounts.winner.key();

        // Vamos calcular tudo usando uma referência imutável primeiro
        let stakes_total: u64;
        {
            let m = &ctx.accounts.match_account;

            // A partida precisa estar resolvida
            require!(m.status == MatchStatus::Resolved, CustomError::InvalidStatus);
            let winner_side = m.winner.ok_or(CustomError::NoWinner)?;

            // Checar se o signer é o player vencedor
            let is_player_a_winner =
                winner_side == Side::PlayerA && winner_key == m.player_a;
            let is_player_b_winner =
                winner_side == Side::PlayerB && winner_key == m.player_b;

            require!(
                is_player_a_winner || is_player_b_winner,
                CustomError::NotWinnerPlayer
            );

            // Só pode sacar uma vez
            require!(!m.stakes_withdrawn, CustomError::StakesAlreadyWithdrawn);

            // Valor total de stakes (2x)
            stakes_total = m
                .stake_lamports
                .checked_mul(2)
                .ok_or(CustomError::MathOverflow)?;
        }

        // Transferência manual de lamports: Match -> winner
        {
            let match_info = ctx.accounts.match_account.to_account_info();
            let winner_info = ctx.accounts.winner.to_account_info();

            **match_info.try_borrow_mut_lamports()? = match_info
                .lamports()
                .checked_sub(stakes_total)
                .ok_or(CustomError::MathOverflow)?;
            **winner_info.try_borrow_mut_lamports()? = winner_info
                .lamports()
                .checked_add(stakes_total)
                .ok_or(CustomError::MathOverflow)?;
        }

        // Agora pegamos a match como mutável só pra atualizar o flag
        let m = &mut ctx.accounts.match_account;
        m.stakes_withdrawn = true;

        Ok(())
    }

    /// Apostador do lado vencedor saca sua parte do pool de apostas.
    ///
    /// Aqui só distribuímos o pool de apostas (total_side_a + total_side_b).
    /// Os stakes dos jogadores são tratados na `withdraw_winner_stake`.
    pub fn claim_bet_payout(ctx: Context<ClaimBetPayout>) -> Result<()> {
        let bettor_key = ctx.accounts.bettor.key();

        // Vamos calcular o payout usando refs imutáveis primeiro
        let payout_u64: u64;
        {
            let m = &ctx.accounts.match_account;
            let p = &ctx.accounts.participant;

            // Partida precisa estar resolvida
            require!(m.status == MatchStatus::Resolved, CustomError::InvalidStatus);
            let winner_side = m.winner.ok_or(CustomError::NoWinner)?;

            // Apostador precisa estar do lado vencedor
            require!(p.side == winner_side, CustomError::WrongSide);

            // Precisa ser o mesmo bettor
            require!(p.bettor == bettor_key, CustomError::NotBettor);

            // Só pode sacar uma vez
            require!(!p.claimed, CustomError::AlreadyClaimed);

            // Pool de apostas (não inclui stakes)
            let pool_bets = m
                .total_side_a
                .checked_add(m.total_side_b)
                .ok_or(CustomError::MathOverflow)?;

            // Total apostado no lado vencedor
            let winner_bets_total = match winner_side {
                Side::PlayerA => m.total_side_a,
                Side::PlayerB => m.total_side_b,
            };

            // Não pode dividir por zero: precisa existir apostas no lado vencedor
            require!(winner_bets_total > 0, CustomError::NoBetsOnWinnerSide);

            // payout = amount * pool_bets / winner_bets_total
            let payout = (p.amount as u128)
                .checked_mul(pool_bets as u128)
                .ok_or(CustomError::MathOverflow)?
                / (winner_bets_total as u128);

            payout_u64 = u64::try_from(payout).map_err(|_| CustomError::MathOverflow)?;
        }

        // Transferência manual de lamports: Match -> bettor
        {
            let match_info = ctx.accounts.match_account.to_account_info();
            let bettor_info = ctx.accounts.bettor.to_account_info();

            **match_info.try_borrow_mut_lamports()? = match_info
                .lamports()
                .checked_sub(payout_u64)
                .ok_or(CustomError::MathOverflow)?;
            **bettor_info.try_borrow_mut_lamports()? = bettor_info
                .lamports()
                .checked_add(payout_u64)
                .ok_or(CustomError::MathOverflow)?;
        }

        // Agora atualizamos a conta de participação para marcar como já sacada
        let p = &mut ctx.accounts.participant;
        p.claimed = true;

        Ok(())
    }

}

/// Contexto vazio para a função initialize
#[derive(Accounts)]
pub struct Initialize {}

/// Accounts da instrução create_match
///
/// Aqui a gente cria a conta `Match` como PDA.
/// Ela mesma será o "vault" (escrow) que segura os SOL da partida.
#[derive(Accounts)]
pub struct CreateMatch<'info> {
    /// Árbitro da partida: quem pode declarar o vencedor
    #[account(mut)]
    pub arbiter: Signer<'info>,

    /// Conta principal da partida (Match), criada como PDA
    #[account(
        init,
        payer = arbiter,
        space = Match::LEN,
        // Cada árbitro, com essas seeds, tem uma match associada.
        seeds = [b"match", arbiter.key().as_ref()],
        bump
    )]
    pub match_account: Account<'info, Match>,

    /// Programa do sistema (obrigatório pra criar contas)
    pub system_program: Program<'info, System>,
}

/// Accounts da instrução join_as_player
///
/// - `player`: precisa ser igual a `player_a` ou `player_b` salvos na Match.
/// - `match_account`: mesma PDA da CreateMatch.
/// - `system_program`: pra fazer o transfer de SOL.
#[derive(Accounts)]
pub struct JoinAsPlayer<'info> {
    /// Jogador A ou B
    #[account(mut)]
    pub player: Signer<'info>,

    /// Conta da partida (escrow), que vai receber o SOL
    #[account(
        mut,
        seeds = [b"match", match_account.arbiter.as_ref()],
        bump = match_account.bump
    )]
    pub match_account: Account<'info, Match>,

    /// Programa do sistema (obrigatório pro transfer)
    pub system_program: Program<'info, System>,
}

/// Accounts da instrução place_bet
///
/// - `bettor`: apostador (qualquer wallet pode apostar).
/// - `match_account`: partida onde ele está apostando.
/// - `participant`: conta que registra a aposta desse bettor nessa partida.
///   - se não existir, é criada (init_if_needed)
///   - se existir, é atualizada (a aposta acumula)
#[derive(Accounts)]
pub struct PlaceBet<'info> {
    /// Apostador (assinante da transação)
    #[account(mut)]
    pub bettor: Signer<'info>,

    /// Conta da partida (escrow), que vai receber o SOL apostado
    #[account(
        mut,
        seeds = [b"match", match_account.arbiter.as_ref()],
        bump = match_account.bump
    )]
    pub match_account: Account<'info, Match>,

    /// Conta de participação do apostador nessa partida.
    /// Aqui assumimos UMA aposta por bettor por partida.
    #[account(
        init,
        payer = bettor,
        space = Participant::LEN,
        seeds = [b"participant", match_account.key().as_ref(), bettor.key().as_ref()],
        bump
    )]
    pub participant: Account<'info, Participant>,

    /// Programa do sistema (para criar conta e transferir SOL)
    pub system_program: Program<'info, System>,
}

/// Accounts da instrução declare_winner
#[derive(Accounts)]
pub struct DeclareWinner<'info> {
    /// Árbitro que está declarando o resultado
    #[account(mut)]
    pub arbiter: Signer<'info>,

    /// Match a ser atualizada
    #[account(
        mut,
        seeds = [b"match", match_account.arbiter.as_ref()],
        bump = match_account.bump
    )]
    pub match_account: Account<'info, Match>,
}

/// Accounts da instrução withdraw_winner_stake
#[derive(Accounts)]
pub struct WithdrawWinnerStake<'info> {
    /// Jogador vencedor (PlayerA ou PlayerB)
    #[account(mut)]
    pub winner: Signer<'info>,

    /// Match que guarda o escrow
    #[account(
        mut,
        seeds = [b"match", match_account.arbiter.as_ref()],
        bump = match_account.bump
    )]
    pub match_account: Account<'info, Match>,
}

/// Accounts da instrução claim_bet_payout
#[derive(Accounts)]
pub struct ClaimBetPayout<'info> {
    /// Apostador que está sacando
    #[account(mut)]
    pub bettor: Signer<'info>,

    /// Match resolvida
    #[account(
        mut,
        seeds = [b"match", match_account.arbiter.as_ref()],
        bump = match_account.bump
    )]
    pub match_account: Account<'info, Match>,

    /// Conta de participação do apostador
    #[account(
        mut,
        seeds = [b"participant", match_account.key().as_ref(), bettor.key().as_ref()],
        bump
    )]
    pub participant: Account<'info, Participant>,
}



/// Status da partida (Match) no protocolo
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum MatchStatus {
    Created,    // criada, ainda esperando depósitos/jogadores
    Funded,     // os dois players já depositaram
    InProgress, // partida em andamento
    Resolved,   // vencedor definido
    Cancelled,  // match cancelada (pra reembolso)
}

/// Lado da aposta: Player A ou Player B
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum Side {
    PlayerA,
    PlayerB,
}

/// Conta principal da partida de aposta da cobrinha
#[account]
pub struct Match {
    /// Árbitro: única conta autorizada a declarar o vencedor
    pub arbiter: Pubkey,

    /// Jogadores principais da partida
    pub player_a: Pubkey,
    pub player_b: Pubkey,

    /// Quanto cada jogador precisa depositar (em lamports)
    pub stake_lamports: u64,

    /// Total de apostas extras em cada lado (torcida)
    pub total_side_a: u64,
    pub total_side_b: u64,

    /// Timestamp mínimo para poder declarar vencedor
    pub deadline: i64,

    /// Status da partida
    pub status: MatchStatus,

    /// Vencedor (Some) quando a partida for resolvida
    pub winner: Option<Side>,

    /// Bump do PDA da match
    pub bump: u8,

    /// ID da partida (pode ser incremental ou gerado off-chain)
    pub id: u64,

    /// Flags indicando se cada player já depositou o stake
    pub player_a_deposited: bool,
    pub player_b_deposited: bool,

    // Já sacou os stakes (2x stake_lamports)?
    pub stakes_withdrawn: bool,
}

impl Match {
    /// Tamanho em bytes da conta Match (inclui o discriminador de 8 bytes).
    /// Aqui eu superestimei um pouco pra garantir espaço sobrando.
    pub const LEN: usize =
        8 +         // discriminator
        32 * 3 +   // arbiter, player_a, player_b
        8 * 4 +    // stake_lamports, total_side_a, total_side_b, deadline
        1 +        // status
        2 +        // winner (Option<Side>) ~ 2 bytes é suficiente
        1 +        // bump
        8 +        // id
        1 +        // player_a_deposited
        1 +        // player_b_deposited
        1;         // stakes_withdrawn
}

/// Conta de participação/aposta de um usuário em uma Match
#[account]
pub struct Participant {
    /// Referência para a partida
    pub match_pubkey: Pubkey,

    /// Carteira do apostador (bettor)
    pub bettor: Pubkey,

    /// Lado em que apostou (PlayerA ou PlayerB)
    pub side: Side,

    /// Quantidade apostada em lamports
    pub amount: u64,

    /// Já sacou o prêmio/recebeu reembolso?
    pub claimed: bool,
}

impl Participant {
    /// Tamanho em bytes da conta Participant (inclui discriminador)
    pub const LEN: usize =
        8 +   // discriminator
        32 +  // match_pubkey
        32 +  // bettor
        1 +   // side
        8 +   // amount
        1;    // claimed
}

#[error_code]
pub enum CustomError {
    #[msg("Deadline must be in the future")]
    InvalidDeadline,

    #[msg("Stake must be greater than zero")]
    InvalidStake,

    #[msg("Match is not in a valid status for this operation")]
    InvalidStatus,

    #[msg("Signer is not a valid player for this match")]
    NotAPlayer,

    #[msg("This player has already deposited the stake")]
    AlreadyDeposited,

    #[msg("Bet amount must be greater than zero")]
    InvalidAmount,

    #[msg("Bets are closed for this match")]
    BetsClosed,

    #[msg("Cannot change side after already betting")]
    SideMismatch,

    #[msg("Math overflow")]
    MathOverflow,

    #[msg("Only the arbiter can perform this action")]
    NotArbiter,

    #[msg("Too early to declare a winner")]
    TooEarly,

    #[msg("Match already resolved")]
    AlreadyResolved,

    #[msg("Match has no winner yet")]
    NoWinner,

    #[msg("Signer is not the winning player")]
    NotWinnerPlayer,

    #[msg("Stakes have already been withdrawn")]
    StakesAlreadyWithdrawn,

    #[msg("This bettor is not the owner of the participant account")]
    NotBettor,

    #[msg("This participant is on the wrong side (loser side)")]
    WrongSide,

    #[msg("This participant has already claimed payout")]
    AlreadyClaimed,

    #[msg("There are no bets on the winner side")]
    NoBetsOnWinnerSide,
}

