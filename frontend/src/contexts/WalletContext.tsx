import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletConnectWalletAdapter } from '@solana/wallet-adapter-walletconnect';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletContextProviderProps {
  children: ReactNode;
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({ children }) => {
  const network = (import.meta.env.VITE_SOLANA_NETWORK as WalletAdapterNetwork) || WalletAdapterNetwork.Devnet;

  const endpoint = useMemo(
    () => import.meta.env.VITE_RPC_URL || clusterApiUrl(network),
    [network]
  );

  const walletConnectProjectId =
    import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'e899c82be21d4acca2c8aec45e893598';

  const walletConnectAdapter = useMemo(
    () =>
      new WalletConnectWalletAdapter({
        network,
        options: {
          relayUrl: 'wss://relay.walletconnect.com',
          projectId: walletConnectProjectId,
          metadata: {
            name: 'Snake Battle',
            description: 'Arena de apostas Snake Battle',
            url: typeof window !== 'undefined' ? window.location.origin : 'https://snake-battle',
            icons: ['https://avatars.githubusercontent.com/u/35608259?s=200'],
          },
        },
      }),
    [network, walletConnectProjectId]
  );

  const wallets = useMemo(() => {
    const availableWallets = [
      new PhantomWalletAdapter({ network }),
      new SolflareWalletAdapter({ network }),
      walletConnectAdapter,
    ];

    return availableWallets;
  }, [network, walletConnectAdapter]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
