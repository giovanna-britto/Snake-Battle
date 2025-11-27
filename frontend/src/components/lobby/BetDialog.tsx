import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePlaceBet } from '@/hooks/useMatchApi';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface BetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchPda: string;
  side: 'PlayerA' | 'PlayerB';
  onBetPlaced: () => void;
}

export const BetDialog = ({ open, onOpenChange, matchPda, side, onBetPlaced }: BetDialogProps) => {
  const { publicKey } = useWallet();
  const [betSol, setBetSol] = useState('0.05');
  const placeBet = usePlaceBet();
  const navigate = useNavigate();

  const handleBet = async () => {
    if (!publicKey) {
      toast.error('Conecte sua wallet primeiro');
      return;
    }

    try {
      const amountLamports = (parseFloat(betSol) * 1e9).toString();

      const result = await placeBet.mutateAsync({
        matchPda,
        side,
        amountLamports,
      });

      if (result.ok) {
        toast.success(`Aposta de ${betSol} SOL em ${side === 'PlayerA' ? 'Verde' : 'Roxo'} realizada!`);
        onBetPlaced();
        onOpenChange(false);
        navigate('/play', {
          state: {
            matchPda,
            side,
            betSol,
          },
        });
      }
    } catch (error) {
      toast.error('Erro ao realizar aposta');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Apostar em
            <span className={side === 'PlayerA' ? 'text-primary' : 'text-secondary'}>
              {side === 'PlayerA' ? 'Verde (A)' : 'Roxo (B)'}
            </span>
          </DialogTitle>
          <DialogDescription>Informe o valor em SOL para apostar neste jogador.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="betAmount">Valor da Aposta (SOL)</Label>
            <Input
              id="betAmount"
              type="number"
              step="0.01"
              min="0.01"
              value={betSol}
              onChange={(e) => setBetSol(e.target.value)}
              className="bg-input"
            />
          </div>
          <Button 
            onClick={handleBet} 
            className="w-full"
            disabled={placeBet.isPending}
          >
            {placeBet.isPending ? 'Processando...' : `Apostar ${betSol} SOL`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
