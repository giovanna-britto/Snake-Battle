import { Buffer } from 'buffer';

// Polyfill Buffer for Solana web3.js compatibility in browser
window.Buffer = Buffer;
