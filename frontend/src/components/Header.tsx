import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Gamepad2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Header = () => {
  const { connected, publicKey } = useWallet();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Gamepad2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Snake Battle</h1>
            <p className="text-xs text-muted-foreground">Arena de Apostas</p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {connected && publicKey && (
            <span className="text-sm text-muted-foreground font-mono hidden sm:block">
              {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
            </span>
          )}
          <WalletMultiButton className="!bg-primary hover:!bg-primary/90 !text-primary-foreground !rounded-lg !h-10 !px-4 !font-sans" />
        </div>
      </div>
    </header>
  );
};
