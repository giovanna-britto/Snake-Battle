import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const GameControls = () => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="bg-card border-primary/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-primary text-lg flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary" />
            Player A (Verde)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-1 w-24 mx-auto">
            <div />
            <kbd className="px-2 py-1 bg-muted rounded text-center text-sm font-mono">W</kbd>
            <div />
            <kbd className="px-2 py-1 bg-muted rounded text-center text-sm font-mono">A</kbd>
            <kbd className="px-2 py-1 bg-muted rounded text-center text-sm font-mono">S</kbd>
            <kbd className="px-2 py-1 bg-muted rounded text-center text-sm font-mono">D</kbd>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-secondary/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-secondary text-lg flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-secondary" />
            Player B (Roxo)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-1 w-24 mx-auto">
            <div />
            <kbd className="px-2 py-1 bg-muted rounded text-center text-sm font-mono">↑</kbd>
            <div />
            <kbd className="px-2 py-1 bg-muted rounded text-center text-sm font-mono">←</kbd>
            <kbd className="px-2 py-1 bg-muted rounded text-center text-sm font-mono">↓</kbd>
            <kbd className="px-2 py-1 bg-muted rounded text-center text-sm font-mono">→</kbd>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
