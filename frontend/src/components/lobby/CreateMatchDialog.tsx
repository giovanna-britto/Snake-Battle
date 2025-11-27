import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { useCreateMatch } from '@/hooks/useMatchApi';
import { toast } from 'sonner';

interface CreateMatchDialogProps {
  onMatchCreated: (matchPda: string) => void;
}

export const CreateMatchDialog = ({ onMatchCreated }: CreateMatchDialogProps) => {
  const { publicKey } = useWallet();
  const [open, setOpen] = useState(false);
  const [stakeSol, setStakeSol] = useState('0.1');
  const [opponentAddress, setOpponentAddress] = useState('');
  const createMatch = useCreateMatch();

  const handleCreate = async () => {
    if (!publicKey) {
      toast.error('Conecte sua wallet primeiro');
      return;
    }

    if (!opponentAddress) {
      toast.error('Informe o endereço do oponente');
      return;
    }

    try {
      const stakeLamports = (parseFloat(stakeSol) * 1e9).toString();
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const matchId = Date.now();

      const result = await createMatch.mutateAsync({
        id: matchId,
        stakeLamports,
        deadline,
        playerA: publicKey.toBase58(),
        playerB: opponentAddress,
      });

      if (result.ok && result.matchPda) {
        toast.success('Partida criada com sucesso!');
        onMatchCreated(result.matchPda);
        setOpen(false);
      }
    } catch (error) {
      toast.error('Erro ao criar partida');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Criar Partida
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card">
        <DialogHeader>
          <DialogTitle>Criar Nova Partida</DialogTitle>
          <DialogDescription>Defina stake e oponente para abrir uma partida.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stake">Stake (SOL)</Label>
            <Input
              id="stake"
              type="number"
              step="0.01"
              min="0.01"
              value={stakeSol}
              onChange={(e) => setStakeSol(e.target.value)}
              className="bg-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="opponent">Endereço do Oponente</Label>
            <Input
              id="opponent"
              placeholder="Solana address..."
              value={opponentAddress}
              onChange={(e) => setOpponentAddress(e.target.value)}
              className="bg-input font-mono text-sm"
            />
          </div>
          <Button 
            onClick={handleCreate} 
            className="w-full"
            disabled={createMatch.isPending}
          >
            {createMatch.isPending ? 'Criando...' : 'Criar Partida'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
