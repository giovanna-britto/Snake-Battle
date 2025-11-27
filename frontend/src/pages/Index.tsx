import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Header } from '@/components/Header';
import { MatchCard } from '@/components/lobby/MatchCard';
import { CreateMatchDialog } from '@/components/lobby/CreateMatchDialog';
import { BetDialog } from '@/components/lobby/BetDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Gamepad2, Users, Coins, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Index = () => {
  const { connected } = useWallet();
  const [matches, setMatches] = useState<any[]>([]);
  const [manualMatchPda, setManualMatchPda] = useState('');
  const [betDialog, setBetDialog] = useState<{
    open: boolean;
    matchPda: string;
    side: 'PlayerA' | 'PlayerB';
  }>({ open: false, matchPda: '', side: 'PlayerA' });

  const handleMatchCreated = (matchPda: string) => {
    console.log('Match created:', matchPda);
    // In real app, refetch matches
  };

  const handleBetPlayerA = (matchPda: string) => {
    setBetDialog({ open: true, matchPda, side: 'PlayerA' });
  };

  const handleBetPlayerB = (matchPda: string) => {
    setBetDialog({ open: true, matchPda, side: 'PlayerB' });
  };

  const handleAddExistingMatch = () => {
    if (!manualMatchPda) return;

    const entry = {
      id: Date.now(),
      matchPda: manualMatchPda.trim(),
      playerA: 'Player A',
      playerB: 'Player B',
      stakeLamports: '0',
      deadline: Math.floor(Date.now() / 1000) + 3600,
      status: 'active' as const,
      totalBetsA: '0',
      totalBetsB: '0',
    };

    setMatches([entry, ...matches]);
    setManualMatchPda('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Gamepad2 className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary">Powered by Solana</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Snake Battle <span className="text-primary">Arena</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Jogue ou aposte em batalhas épicas de Snake. Conecte sua wallet, 
            entre na arena e ganhe SOL!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {connected ? (
              <>
                <CreateMatchDialog onMatchCreated={handleMatchCreated} />
                <Link to="/play">
                  <Button variant="outline" size="lg" className="gap-2">
                    <Gamepad2 className="w-5 h-5" />
                    Modo Treino
                  </Button>
                </Link>
              </>
            ) : (
              <p className="text-muted-foreground">
                Conecte sua wallet para criar partidas e apostar
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Card className="bg-card border-border">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-lg bg-primary/10">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{matches.length}</p>
                <p className="text-sm text-muted-foreground">Partidas Ativas</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-lg bg-secondary/10">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">24</p>
                <p className="text-sm text-muted-foreground">Jogadores Online</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-lg bg-chart-3/10">
                <Coins className="w-6 h-6 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold">156.8 SOL</p>
                <p className="text-sm text-muted-foreground">Total em Apostas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Matches List */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Partidas Disponíveis</h2>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="matchPda">Adicionar partida existente (PDA)</Label>
              <Input
                id="matchPda"
                placeholder="Cole o match PDA já criado"
                value={manualMatchPda}
                onChange={(e) => setManualMatchPda(e.target.value)}
                className="bg-input"
              />
            </div>
            <Button onClick={handleAddExistingMatch} className="w-full">
              Adicionar partida
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onJoinAsPlayer={() => console.log('Join as player', match.matchPda)}
                onBetPlayerA={() => handleBetPlayerA(match.matchPda)}
                onBetPlayerB={() => handleBetPlayerB(match.matchPda)}
                onSpectate={() => console.log('Spectate', match.matchPda)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border py-12 bg-card/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Como Funciona</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2">Conecte sua Wallet</h3>
              <p className="text-sm text-muted-foreground">
                Escolha sua carteira via WalletConnect (Phantom, Solflare, mobile e mais)
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-secondary font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2">Jogue ou Aposte</h3>
              <p className="text-sm text-muted-foreground">
                Entre como jogador ou aposte em quem você acha que vai ganhar
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-chart-3/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-chart-3 font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2">Ganhe SOL</h3>
              <p className="text-sm text-muted-foreground">
                Vencedores recebem o prêmio direto na wallet
              </p>
            </div>
          </div>
        </div>
      </section>

      <BetDialog
        open={betDialog.open}
        onOpenChange={(open) => setBetDialog((prev) => ({ ...prev, open }))}
        matchPda={betDialog.matchPda}
        side={betDialog.side}
        onBetPlaced={() => console.log('Bet placed')}
      />
    </div>
  );
};

export default Index;
