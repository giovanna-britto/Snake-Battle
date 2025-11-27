import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface Position {
  x: number;
  y: number;
}

interface Snake {
  body: Position[];
  direction: Position;
  color: string;
  headColor: string;
}

interface SnakeGameProps {
  onGameEnd: (winner: 'PlayerA' | 'PlayerB') => void;
  isSpectator?: boolean;
  className?: string;
}

const GRID_SIZE = 30;
const CELL_SIZE = 16;
const GAME_SPEED = 100;

const INITIAL_SNAKE_A: Snake = {
  body: [
    { x: 5, y: 15 },
    { x: 4, y: 15 },
    { x: 3, y: 15 },
  ],
  direction: { x: 1, y: 0 },
  color: 'hsl(142, 76%, 46%)',
  headColor: 'hsl(142, 76%, 60%)',
};

const INITIAL_SNAKE_B: Snake = {
  body: [
    { x: 24, y: 15 },
    { x: 25, y: 15 },
    { x: 26, y: 15 },
  ],
  direction: { x: -1, y: 0 },
  color: 'hsl(280, 70%, 55%)',
  headColor: 'hsl(280, 70%, 70%)',
};

export const SnakeGame = ({ onGameEnd, isSpectator = false, className }: SnakeGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snakeA, setSnakeA] = useState<Snake>(INITIAL_SNAKE_A);
  const [snakeB, setSnakeB] = useState<Snake>(INITIAL_SNAKE_B);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [gameRunning, setGameRunning] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [winner, setWinner] = useState<'PlayerA' | 'PlayerB' | null>(null);
  
  const snakeARef = useRef(snakeA);
  const snakeBRef = useRef(snakeB);
  const foodRef = useRef(food);

  useEffect(() => {
    snakeARef.current = snakeA;
    snakeBRef.current = snakeB;
    foodRef.current = food;
  }, [snakeA, snakeB, food]);

  const generateFood = useCallback(() => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      snakeARef.current.body.some(s => s.x === newFood.x && s.y === newFood.y) ||
      snakeBRef.current.body.some(s => s.x === newFood.x && s.y === newFood.y)
    );
    return newFood;
  }, []);

  const checkCollision = useCallback((head: Position, otherSnake: Snake): boolean => {
    // Check collision with other snake's body (excluding head)
    return otherSnake.body.slice(1).some(segment => segment.x === head.x && segment.y === head.y);
  }, []);

  const checkSelfCollision = useCallback((snake: Snake): boolean => {
    const head = snake.body[0];
    return snake.body.slice(1).some(segment => segment.x === head.x && segment.y === head.y);
  }, []);

  const checkWallCollision = useCallback((head: Position): boolean => {
    return head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE;
  }, []);

  const moveSnake = useCallback((snake: Snake): Snake => {
    const newHead = {
      x: snake.body[0].x + snake.direction.x,
      y: snake.body[0].y + snake.direction.y,
    };

    const newBody = [newHead, ...snake.body];

    // Check if eating food
    if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
      setFood(generateFood());
    } else {
      newBody.pop();
    }

    return { ...snake, body: newBody };
  }, [generateFood]);

  // Game loop
  useEffect(() => {
    if (!gameRunning || winner) return;

    const gameLoop = setInterval(() => {
      const newSnakeA = moveSnake(snakeARef.current);
      const newSnakeB = moveSnake(snakeBRef.current);

      const headA = newSnakeA.body[0];
      const headB = newSnakeB.body[0];

      // Check collisions
      const aHitsB = checkCollision(headA, snakeBRef.current);
      const bHitsA = checkCollision(headB, snakeARef.current);
      const aHitsWall = checkWallCollision(headA);
      const bHitsWall = checkWallCollision(headB);
      const aHitsSelf = checkSelfCollision(newSnakeA);
      const bHitsSelf = checkSelfCollision(newSnakeB);
      const headsCollide = headA.x === headB.x && headA.y === headB.y;

      if (headsCollide || (aHitsB && bHitsA) || (aHitsWall && bHitsWall)) {
        // Draw - random winner
        const randomWinner = Math.random() > 0.5 ? 'PlayerA' : 'PlayerB';
        setWinner(randomWinner);
        onGameEnd(randomWinner);
        return;
      }

      if (aHitsB || aHitsWall || aHitsSelf) {
        setWinner('PlayerB');
        onGameEnd('PlayerB');
        return;
      }

      if (bHitsA || bHitsWall || bHitsSelf) {
        setWinner('PlayerA');
        onGameEnd('PlayerA');
        return;
      }

      setSnakeA(newSnakeA);
      setSnakeB(newSnakeB);
    }, GAME_SPEED);

    return () => clearInterval(gameLoop);
  }, [gameRunning, winner, moveSnake, checkCollision, checkWallCollision, checkSelfCollision, onGameEnd]);

  // Countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !gameRunning) {
      setGameRunning(true);
    }
  }, [countdown, gameRunning]);

  // Keyboard controls
  useEffect(() => {
    if (isSpectator) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Player A: WASD
      if (e.key === 'w' || e.key === 'W') {
        if (snakeARef.current.direction.y !== 1) {
          setSnakeA(prev => ({ ...prev, direction: { x: 0, y: -1 } }));
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (snakeARef.current.direction.y !== -1) {
          setSnakeA(prev => ({ ...prev, direction: { x: 0, y: 1 } }));
        }
      } else if (e.key === 'a' || e.key === 'A') {
        if (snakeARef.current.direction.x !== 1) {
          setSnakeA(prev => ({ ...prev, direction: { x: -1, y: 0 } }));
        }
      } else if (e.key === 'd' || e.key === 'D') {
        if (snakeARef.current.direction.x !== -1) {
          setSnakeA(prev => ({ ...prev, direction: { x: 1, y: 0 } }));
        }
      }

      // Player B: Arrow keys
      if (e.key === 'ArrowUp') {
        if (snakeBRef.current.direction.y !== 1) {
          setSnakeB(prev => ({ ...prev, direction: { x: 0, y: -1 } }));
        }
      } else if (e.key === 'ArrowDown') {
        if (snakeBRef.current.direction.y !== -1) {
          setSnakeB(prev => ({ ...prev, direction: { x: 0, y: 1 } }));
        }
      } else if (e.key === 'ArrowLeft') {
        if (snakeBRef.current.direction.x !== 1) {
          setSnakeB(prev => ({ ...prev, direction: { x: -1, y: 0 } }));
        }
      } else if (e.key === 'ArrowRight') {
        if (snakeBRef.current.direction.x !== -1) {
          setSnakeB(prev => ({ ...prev, direction: { x: 1, y: 0 } }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpectator]);

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = 'hsl(220, 20%, 8%)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'hsl(220, 15%, 15%)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw food
    ctx.fillStyle = 'hsl(45, 100%, 50%)';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'hsl(45, 100%, 50%)';
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Snake A (green)
    snakeA.body.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? snakeA.headColor : snakeA.color;
      if (index === 0) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = snakeA.color;
      }
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
      ctx.shadowBlur = 0;
    });

    // Draw Snake B (purple)
    snakeB.body.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? snakeB.headColor : snakeB.color;
      if (index === 0) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = snakeB.color;
      }
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
      ctx.shadowBlur = 0;
    });
  }, [snakeA, snakeB, food]);

  return (
    <div className={cn('relative', className)}>
      <canvas
        ref={canvasRef}
        width={GRID_SIZE * CELL_SIZE}
        height={GRID_SIZE * CELL_SIZE}
        className="rounded-lg border border-border"
      />
      
      {countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
          <span className="text-8xl font-bold text-primary animate-pulse">{countdown}</span>
        </div>
      )}

      {winner && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 rounded-lg">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-2">
              <span className={winner === 'PlayerA' ? 'text-primary' : 'text-secondary'}>
                {winner === 'PlayerA' ? 'Verde' : 'Roxo'}
              </span>{' '}
              Venceu!
            </h2>
            <p className="text-muted-foreground">
              {winner === 'PlayerA' ? 'Player A' : 'Player B'} ganhou a partida
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
