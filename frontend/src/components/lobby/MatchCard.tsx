import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Coins } from 'lucide-react';

interface MatchCardProps {
  match: {
    id: number;
    matchPda: string;
    playerA: string;
    playerB: string;
    stakeLamports: string;
    deadline: number;
    status: 'waiting' | 'active' | 'finished';
    totalBetsA: string;
    totalBetsB: string;
  };
  onJoinAsPlayer: () => void;
  onBetPlayerA: () => void;
  onBetPlayerB: () => void;
  onSpectate: () => void;
}

export const MatchCard = ({
  match,
  onJoinAsPlayer,
  onBetPlayerA,
  onBetPlayerB,
  onSpectate,
}: MatchCardProps) => {
  const formatAddress = (address: string) => 
    `${address.slice(0, 4)}...${address.slice(-4)}`;

  const formatLamports = (lamports: string) => {
    const sol = Number(lamports) / 1e9;
    return `${sol.toFixed(3)} SOL`;
  };

  const statusColors = {
    waiting: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
    active: 'bg-primary/20 text-primary border-primary/30',
    finished: 'bg-muted text-muted-foreground border-muted',
  };

  return (
    <Card className="bg-card hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-mono">Match #{match.id}</CardTitle>
          <Badge variant="outline" className={statusColors[match.status]}>
            {match.status === 'waiting' ? 'Aguardando' : match.status === 'active' ? 'Ativo' : 'Finalizado'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <div className="w-3 h-3 rounded bg-primary" />
              <span className="text-sm font-medium">Player A</span>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              {formatAddress(match.playerA)}
            </p>
            <p className="text-xs text-muted-foreground">
              Apostas: {formatLamports(match.totalBetsA)}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-secondary">
              <div className="w-3 h-3 rounded bg-secondary" />
              <span className="text-sm font-medium">Player B</span>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              {formatAddress(match.playerB)}
            </p>
            <p className="text-xs text-muted-foreground">
              Apostas: {formatLamports(match.totalBetsB)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Coins className="w-4 h-4" />
            <span>Stake: {formatLamports(match.stakeLamports)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{new Date(match.deadline * 1000).toLocaleTimeString()}</span>
          </div>
        </div>

        {match.status === 'waiting' && (
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={onJoinAsPlayer} className="w-full">
              <Users className="w-4 h-4 mr-2" />
              Entrar como Jogador
            </Button>
            <Button variant="outline" onClick={onSpectate} className="w-full">
              Assistir
            </Button>
          </div>
        )}

        {match.status === 'active' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={onBetPlayerA} 
                variant="outline"
                className="w-full border-primary/50 hover:bg-primary/10 hover:border-primary"
              >
                Apostar em A
              </Button>
              <Button 
                onClick={onBetPlayerB}
                variant="outline"
                className="w-full border-secondary/50 hover:bg-secondary/10 hover:border-secondary"
              >
                Apostar em B
              </Button>
            </div>
            <Button variant="outline" onClick={onSpectate} className="w-full">
              Assistir Partida
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
