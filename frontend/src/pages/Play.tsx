import { useState } from 'react';
import { Header } from '@/components/Header';
import { SnakeGame } from '@/components/game/SnakeGame';
import { GameControls } from '@/components/game/GameControls';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Play = () => {
  const location = useLocation();
  const betContext = (location.state as { matchPda?: string; side?: 'PlayerA' | 'PlayerB'; betSol?: string }) || {};
  const [gameKey, setGameKey] = useState(0);
  const [scores, setScores] = useState({ playerA: 0, playerB: 0 });

  const handleGameEnd = (winner: 'PlayerA' | 'PlayerB') => {
    setScores((prev) => ({
      ...prev,
      [winner === 'PlayerA' ? 'playerA' : 'playerB']: prev[winner === 'PlayerA' ? 'playerA' : 'playerB'] + 1,
    }));
  };

  const resetGame = () => {
    setGameKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">Modo Treino</h1>
            {betContext.matchPda && (
              <p className="text-sm text-muted-foreground">
                Aposta em {betContext.side === 'PlayerA' ? 'Verde (A)' : 'Roxo (B)'} | Match: {betContext.matchPda.slice(0, 4)}...{betContext.matchPda.slice(-4)}
                {betContext.betSol ? ` | Valor: ${betContext.betSol} SOL` : ''}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <div className="space-y-4">
            <div className="flex justify-center">
              <SnakeGame key={gameKey} onGameEnd={handleGameEnd} />
            </div>
            
            <div className="flex justify-center">
              <Button onClick={resetGame} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Nova Partida
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Placar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="w-8 h-8 rounded bg-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold">{scores.playerA}</p>
                    <p className="text-sm text-muted-foreground">Player A</p>
                  </div>
                  <div>
                    <div className="w-8 h-8 rounded bg-secondary mx-auto mb-2" />
                    <p className="text-2xl font-bold">{scores.playerB}</p>
                    <p className="text-sm text-muted-foreground">Player B</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <GameControls />

            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Regras</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• Bater a cabeça no corpo do oponente = Derrota</p>
                <p>• Bater na parede = Derrota</p>
                <p>• Comer a comida amarela faz crescer</p>
                <p>• Colisão de cabeças = Empate (sorteio)</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Play;
