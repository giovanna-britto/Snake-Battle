const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const MOCK_API =
  import.meta.env.VITE_MOCK_API === 'true' || import.meta.env.VITE_MOCK_API === '1';

export interface MatchInfo {
  programId: string;
  serverWallet: string;
}

export interface CreateMatchDto {
  id: number;
  stakeLamports: string;
  deadline: number;
  playerA: string;
  playerB: string;
}

export interface JoinMatchDto {
  matchPda: string;
}

export interface PlaceBetDto {
  matchPda: string;
  side: 'PlayerA' | 'PlayerB';
  amountLamports: string;
}

export interface DeclareWinnerDto {
  matchPda: string;
  winner: 'PlayerA' | 'PlayerB';
}

export interface WithdrawStakeDto {
  matchPda: string;
}

export interface ClaimPayoutDto {
  matchPda: string;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  txSig?: string;
  matchPda?: string;
  participantPda?: string;
  data?: T;
}

class MatchApi {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async getInfo(): Promise<MatchInfo> {
    return this.request<MatchInfo>('/match/info');
  }

  async createMatch(dto: CreateMatchDto): Promise<ApiResponse> {
    if (MOCK_API) {
      return {
        ok: true,
        txSig: 'mock-tx-' + Date.now(),
        matchPda: 'mock-match-' + Date.now(),
      };
    }
    return this.request<ApiResponse>('/match/create', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async joinMatch(dto: JoinMatchDto): Promise<ApiResponse> {
    if (MOCK_API) {
      return {
        ok: true,
        txSig: 'mock-tx-' + Date.now(),
        participantPda: 'mock-participant-' + Date.now(),
      };
    }
    return this.request<ApiResponse>('/match/join', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async placeBet(dto: PlaceBetDto): Promise<ApiResponse> {
    if (MOCK_API) {
      return {
        ok: true,
        txSig: 'mock-tx-' + Date.now(),
        participantPda: 'mock-participant-' + Date.now(),
      };
    }
    return this.request<ApiResponse>('/match/bet', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async declareWinner(dto: DeclareWinnerDto): Promise<ApiResponse> {
    if (MOCK_API) {
      return {
        ok: true,
        txSig: 'mock-tx-' + Date.now(),
      };
    }
    return this.request<ApiResponse>('/match/declare-winner', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async withdrawStake(dto: WithdrawStakeDto): Promise<ApiResponse> {
    if (MOCK_API) {
      return {
        ok: true,
        txSig: 'mock-tx-' + Date.now(),
      };
    }
    return this.request<ApiResponse>('/match/withdraw-stake', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async claimPayout(dto: ClaimPayoutDto): Promise<ApiResponse> {
    if (MOCK_API) {
      return {
        ok: true,
        txSig: 'mock-tx-' + Date.now(),
        participantPda: dto.matchPda,
      };
    }
    return this.request<ApiResponse>('/match/claim-payout', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }
}

export const matchApi = new MatchApi();
