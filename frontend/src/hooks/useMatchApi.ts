import { useMutation, useQuery } from '@tanstack/react-query';
import { matchApi, CreateMatchDto, JoinMatchDto, PlaceBetDto, DeclareWinnerDto, WithdrawStakeDto, ClaimPayoutDto } from '@/lib/api';

export const useMatchInfo = () => {
  return useQuery({
    queryKey: ['matchInfo'],
    queryFn: () => matchApi.getInfo(),
    staleTime: 60000,
  });
};

export const useCreateMatch = () => {
  return useMutation({
    mutationFn: (dto: CreateMatchDto) => matchApi.createMatch(dto),
  });
};

export const useJoinMatch = () => {
  return useMutation({
    mutationFn: (dto: JoinMatchDto) => matchApi.joinMatch(dto),
  });
};

export const usePlaceBet = () => {
  return useMutation({
    mutationFn: (dto: PlaceBetDto) => matchApi.placeBet(dto),
  });
};

export const useDeclareWinner = () => {
  return useMutation({
    mutationFn: (dto: DeclareWinnerDto) => matchApi.declareWinner(dto),
  });
};

export const useWithdrawStake = () => {
  return useMutation({
    mutationFn: (dto: WithdrawStakeDto) => matchApi.withdrawStake(dto),
  });
};

export const useClaimPayout = () => {
  return useMutation({
    mutationFn: (dto: ClaimPayoutDto) => matchApi.claimPayout(dto),
  });
};
