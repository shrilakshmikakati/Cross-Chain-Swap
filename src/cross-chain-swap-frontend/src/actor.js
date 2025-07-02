import { Actor, HttpAgent } from '@dfinity/agent';

// Import the generated declarations
const idlFactory = ({ IDL }) => {
  const SwapStatus = IDL.Variant({
    'Pending': IDL.Null,
    'Locked': IDL.Null,
    'Completed': IDL.Null,
    'Refunded': IDL.Null,
    'Expired': IDL.Null,
    'Failed': IDL.Null,
  });

  const SwapRequest = IDL.Record({
    'id': IDL.Text,
    'from_chain': IDL.Text,
    'to_chain': IDL.Text,
    'from_token': IDL.Text,
    'to_token': IDL.Text,
    'from_amount': IDL.Nat64,
    'to_amount': IDL.Nat64,
    'sender': IDL.Text,
    'recipient': IDL.Text,
    'hash_lock': IDL.Text,
    'time_lock': IDL.Nat64,
    'status': SwapStatus,
    'created_at': IDL.Nat64,
    'expires_at': IDL.Nat64,
  });

  const SwapResponse = IDL.Variant({
    'Ok': SwapRequest,
    'Err': IDL.Text,
  });

  const SwapListResponse = IDL.Variant({
    'Ok': IDL.Vec(SwapRequest),
    'Err': IDL.Text,
  });

  const InitiateSwapArgs = IDL.Record({
    'from_chain': IDL.Text,
    'to_chain': IDL.Text,
    'from_token': IDL.Text,
    'to_token': IDL.Text,
    'from_amount': IDL.Nat64,
    'to_amount': IDL.Nat64,
    'recipient': IDL.Text,
    'time_lock_duration': IDL.Nat64,
  });

  const CompleteSwapArgs = IDL.Record({
    'swap_id': IDL.Text,
    'secret': IDL.Text,
  });

  const RefundSwapArgs = IDL.Record({
    'swap_id': IDL.Text,
  });

  return IDL.Service({
    'initiate_swap': IDL.Func([InitiateSwapArgs], [SwapResponse], []),
    'complete_swap': IDL.Func([CompleteSwapArgs], [SwapResponse], []),
    'refund_swap': IDL.Func([RefundSwapArgs], [SwapResponse], []),
    'get_swap': IDL.Func([IDL.Text], [SwapResponse], ['query']),
    'get_user_swaps': IDL.Func([IDL.Text], [SwapListResponse], ['query']),
    'get_all_swaps': IDL.Func([], [SwapListResponse], ['query']),
    'get_swap_status': IDL.Func([IDL.Text], [IDL.Variant({ 'Ok': SwapStatus, 'Err': IDL.Text })], ['query']),
    'generate_hash_lock': IDL.Func([IDL.Text], [IDL.Text], []),
    'verify_secret': IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], ['query']),
    'get_current_time': IDL.Func([], [IDL.Nat64], ['query']),
    'verify_bitcoin_transaction': IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], []),
    'verify_ethereum_transaction': IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], []),
    'calculate_swap_fee': IDL.Func([IDL.Text, IDL.Text, IDL.Nat64], [IDL.Nat64], ['query']),
    'get_supported_chains': IDL.Func([], [IDL.Vec(IDL.Text)], ['query']),
    'get_supported_tokens': IDL.Func([IDL.Text], [IDL.Vec(IDL.Text)], ['query']),
  });
};

// Canister ID - replace with your actual canister ID
const canisterId = process.env.REACT_APP_CANISTER_ID || 'rdmx6-jaaaa-aaaah-qdrqq-cai';

// Create agent
const agent = new HttpAgent({
  host: process.env.NODE_ENV === 'production' 
    ? 'https://ic0.app' 
    : 'http://localhost:4943'
});

// Create actor
export const crossChainSwapActor = Actor.createActor(idlFactory, {
  agent,
  canisterId,
});

// Utility functions for cross-chain interactions
export const chainUtils = {
  // Ethereum utilities
  ethereum: {
    async getProvider() {
      if (typeof window !== 'undefined' && window.ethereum) {
        const { ethers } = await import('ethers');
        return new ethers.BrowserProvider(window.ethereum);
      }
      throw new Error('MetaMask not found');
    },

    async connectWallet() {
      try {
        const provider = await this.getProvider();
        await provider.send('eth_requestAccounts', []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        return { address, signer, provider };
      } catch (error) {
        console.error('Failed to connect Ethereum wallet:', error);
        throw error;
      }
    },

    async getBalance(address, tokenAddress = null) {
      try {
        const provider = await this.getProvider();
        if (tokenAddress) {
          // ERC-20 token balance
          const { ethers } = await import('ethers');
          const tokenContract = new ethers.Contract(
            tokenAddress,
            ['function balanceOf(address) view returns (uint256)'],
            provider
          );
          return await tokenContract.balanceOf(address);
        } else {
          // ETH balance
          return await provider.getBalance(address);
        }
      } catch (error) {
        console.error('Failed to get balance:', error);
        throw error;
      }
    },

    async sendTransaction(to, value, data = '0x') {
      try {
        const provider = await this.getProvider();
        const signer = await provider.getSigner();
        return await signer.sendTransaction({ to, value, data });
      } catch (error) {
        console.error('Failed to send transaction:', error);
        throw error;
      }
    }
  },

  // Bitcoin utilities
  bitcoin: {
    async connectWallet() {
      // Implement Bitcoin wallet connection (e.g., Hiro Wallet)
      if (typeof window !== 'undefined' && window.HiroWalletProvider) {
        try {
          const wallet = window.HiroWalletProvider;
          const response = await wallet.request('getAddresses');
          return response.result;
        } catch (error) {
          console.error('Failed to connect Bitcoin wallet:', error);
          throw error;
        }
      }
      throw new Error('Bitcoin wallet not found');
    },

    async getBalance(address) {
      // Implement Bitcoin balance check
      // This would typically use a Bitcoin API service
      try {
        const response = await fetch(`https://blockstream.info/api/address/${address}`);
        const data = await response.json();
        return data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
      } catch (error) {
        console.error('Failed to get Bitcoin balance:', error);
        throw error;
      }
    }
  },

  // ICP utilities
  icp: {
    async connectWallet() {
      // Implement ICP wallet connection (e.g., Plug Wallet)
      if (typeof window !== 'undefined' && window.ic?.plug) {
        try {
          const connected = await window.ic.plug.requestConnect({
            whitelist: [canisterId],
          });
          if (connected) {
            const principal = await window.ic.plug.agent.getPrincipal();
            return { principal: principal.toString() };
          }
        } catch (error) {
          console.error('Failed to connect ICP wallet:', error);
          throw error;
        }
      }
      throw new Error('Plug wallet not found');
    },

    async getBalance(principal) {
      try {
        if (window.ic?.plug) {
          const balance = await window.ic.plug.requestBalance();
          return balance[0]?.amount || 0;
        }
      } catch (error) {
        console.error('Failed to get ICP balance:', error);
        throw error;
      }
    }
  }
};

// Swap utility functions
export const swapUtils = {
  async initiateSwap(swapData) {
    try {
      const result = await crossChainSwapActor.initiate_swap(swapData);
      if ('Ok' in result) {
        return result.Ok;
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error('Failed to initiate swap:', error);
      throw error;
    }
  },

  async completeSwap(swapId, secret) {
    try {
      const result = await crossChainSwapActor.complete_swap({
        swap_id: swapId,
        secret: secret
      });
      if ('Ok' in result) {
        return result.Ok;
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error('Failed to complete swap:', error);
      throw error;
    }
  },

  async refundSwap(swapId) {
    try {
      const result = await crossChainSwapActor.refund_swap({
        swap_id: swapId
      });
      if ('Ok' in result) {
        return result.Ok;
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error('Failed to refund swap:', error);
      throw error;
    }
  },

  async getSwap(swapId) {
    try {
      const result = await crossChainSwapActor.get_swap(swapId);
      if ('Ok' in result) {
        return result.Ok;
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error('Failed to get swap:', error);
      throw error;
    }
  },

  async getUserSwaps(userAddress) {
    try {
      const result = await crossChainSwapActor.get_user_swaps(userAddress);
      if ('Ok' in result) {
        return result.Ok;
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error('Failed to get user swaps:', error);
      throw error;
    }
  },

  async calculateFee(fromChain, toChain, amount) {
    try {
      return await crossChainSwapActor.calculate_swap_fee(fromChain, toChain, amount);
    } catch (error) {
      console.error('Failed to calculate fee:', error);
      throw error;
    }
  },

  async getSupportedChains() {
    try {
      return await crossChainSwapActor.get_supported_chains();
    } catch (error) {
      console.error('Failed to get supported chains:', error);
      throw error;
    }
  },

  async getSupportedTokens(chain) {
    try {
      return await crossChainSwapActor.get_supported_tokens(chain);
    } catch (error) {
      console.error('Failed to get supported tokens:', error);
      throw error;
    }
  }
};

export default crossChainSwapActor;