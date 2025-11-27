import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type GameMode = 'lobby' | 'spectator' | 'player';
export type PlayerSide = 'PlayerA' | 'PlayerB';

interface Match {
  id: number;
  matchPda: string;
  playerA: string;
  playerB: string;
  stakeLamports: string;
  deadline: number;
  status: 'waiting' | 'active' | 'finished';
  winner?: PlayerSide;
  totalBetsA: string;
  totalBetsB: string;
}

interface GameContextType {
  currentMatch: Match | null;
  gameMode: GameMode;
  playerSide: PlayerSide | null;
  setCurrentMatch: (match: Match | null) => void;
  setGameMode: (mode: GameMode) => void;
  setPlayerSide: (side: PlayerSide | null) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('lobby');
  const [playerSide, setPlayerSide] = useState<PlayerSide | null>(null);

  const resetGame = useCallback(() => {
    setCurrentMatch(null);
    setGameMode('lobby');
    setPlayerSide(null);
  }, []);

  return (
    <GameContext.Provider
      value={{
        currentMatch,
        gameMode,
        playerSide,
        setCurrentMatch,
        setGameMode,
        setPlayerSide,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
