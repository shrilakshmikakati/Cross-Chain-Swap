import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Wallet, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';

const CrossChainSwapDApp = () => {
  const [sourceChain, setSourceChain] = useState('ICP');
  const [targetChain, setTargetChain] = useState('Bitcoin');
  const [sourceAmount, setSourceAmount] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [swapState, setSwapState] = useState('idle');
  const [swapProgress, setSwapProgress] = useState(0);
  const [transactionHash, setTransactionHash] = useState('');
  const [swapHistory, setSwapHistory] = useState([]);

  const chains = ['ICP', 'Bitcoin', 'Ethereum', 'Polygon'];
  const exchangeRates = {
    'ICP-Bitcoin': 0.00001,
    'ICP-Ethereum': 0.0001,
    'ICP-Polygon': 0.5,
    'Bitcoin-ICP': 100000,
    'Bitcoin-Ethereum': 10,
    'Bitcoin-Polygon': 50000,
    'Ethereum-ICP': 10000,
    'Ethereum-Bitcoin': 0.1,
    'Ethereum-Polygon': 5000,
    'Polygon-ICP': 2,
    'Polygon-Bitcoin': 0.00002,
    'Polygon-Ethereum': 0.0002
  };

  const swapStates = [
    { key: 'validating', label: 'Validating Request', icon: RefreshCw },
    { key: 'locking', label: 'Locking Source Assets', icon: Clock },
    { key: 'verifying', label: 'Cross-Chain Verification', icon: AlertCircle },
    { key: 'releasing', label: 'Releasing Target Assets', icon: ArrowLeftRight },
    { key: 'completed', label: 'Swap Completed', icon: CheckCircle }
  ];

  useEffect(() => {
    if (sourceAmount && sourceChain !== targetChain) {
      const rate = exchangeRates[`${sourceChain}-${targetChain}`] || 0;
      setTargetAmount((parseFloat(sourceAmount) * rate).toFixed(6));
    }
  }, [sourceAmount, sourceChain, targetChain]);

  const connectWallet = () => {
    setWalletConnected(true);
    // Simulate wallet connection
    setTimeout(() => {
      alert(`Connected to ${sourceChain} wallet successfully!`);
    }, 500);
  };

  const executeSwap = async () => {
    if (!walletConnected || !sourceAmount || sourceChain === targetChain) return;

    setSwapState('processing');
    setSwapProgress(0);

    // Simulate swap process
    for (let i = 0; i < swapStates.length; i++) {
      setSwapProgress(i);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Generate mock transaction hash
    const mockHash = '0x' + Math.random().toString(16).substring(2, 66);
    setTransactionHash(mockHash);
    setSwapState('completed');
    setSwapProgress(swapStates.length);

    // Add to history
    const newSwap = {
      id: Date.now(),
      from: sourceChain,
      to: targetChain,
      fromAmount: sourceAmount,
      toAmount: targetAmount,
      timestamp: new Date().toLocaleString(),
      hash: mockHash,
      status: 'completed'
    };
    setSwapHistory(prev => [newSwap, ...prev]);

    // Reset form
    setTimeout(() => {
      setSwapState('idle');
      setSourceAmount('');
      setTargetAmount('');
      setTransactionHash('');
    }, 3000);
  };

  const swapChains = () => {
    const temp = sourceChain;
    setSourceChain(targetChain);
    setTargetChain(temp);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Cross-Chain Asset Swap Protocol
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Seamless, trustless swaps between ICP, Bitcoin, Ethereum, and other blockchains using Chain-Key cryptography
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Swap Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold mb-6">Asset Swap</h2>
              
              {/* Wallet Connection */}
              {!walletConnected && (
                <div className="mb-6 p-4 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-200">Connect your wallet to start swapping</span>
                    <button
                      onClick={connectWallet}
                      className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-lg text-black font-medium transition-colors"
                    >
                      <Wallet size={16} />
                      Connect Wallet
                    </button>
                  </div>
                </div>
              )}

              {/* Swap Form */}
              <div className="space-y-6">
                {/* Source Chain */}
                <div>
                  <label className="block text-sm font-medium mb-2">From</label>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex justify-between items-center mb-3">
                      <select
                        value={sourceChain}
                        onChange={(e) => setSourceChain(e.target.value)}
                        className="bg-transparent text-white text-lg font-medium focus:outline-none"
                      >
                        {chains.map(chain => (
                          <option key={chain} value={chain} className="bg-gray-800">
                            {chain}
                          </option>
                        ))}
                      </select>
                      <span className="text-sm text-gray-400">Balance: 1,000.00</span>
                    </div>
                    <input
                      type="number"
                      value={sourceAmount}
                      onChange={(e) => setSourceAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-transparent text-2xl font-bold focus:outline-none placeholder-gray-500"
                      disabled={!walletConnected}
                    />
                  </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                  <button
                    onClick={swapChains}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 transition-colors"
                  >
                    <ArrowLeftRight size={20} />
                  </button>
                </div>

                {/* Target Chain */}
                <div>
                  <label className="block text-sm font-medium mb-2">To</label>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex justify-between items-center mb-3">
                      <select
                        value={targetChain}
                        onChange={(e) => setTargetChain(e.target.value)}
                        className="bg-transparent text-white text-lg font-medium focus:outline-none"
                      >
                        {chains.map(chain => (
                          <option key={chain} value={chain} className="bg-gray-800">
                            {chain}
                          </option>
                        ))}
                      </select>
                      <span className="text-sm text-gray-400">Balance: 500.00</span>
                    </div>
                    <input
                      type="text"
                      value={targetAmount}
                      placeholder="0.00"
                      className="w-full bg-transparent text-2xl font-bold focus:outline-none placeholder-gray-500"
                      disabled
                    />
                  </div>
                </div>

                {/* Swap Details */}
                {sourceAmount && targetAmount && (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Exchange Rate</span>
                        <span>1 {sourceChain} = {exchangeRates[`${sourceChain}-${targetChain}`]} {targetChain}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Network Fee</span>
                        <span>~0.001 {sourceChain}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Estimated Time</span>
                        <span>2-5 minutes</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Execute Swap Button */}
                <button
                  onClick={executeSwap}
                  disabled={!walletConnected || !sourceAmount || sourceChain === targetChain || swapState === 'processing'}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed py-4 rounded-lg font-bold text-lg transition-all"
                >
                  {swapState === 'processing' ? 'Processing Swap...' : 'Execute Swap'}
                </button>
              </div>
            </div>
          </div>

          {/* Swap Progress & History */}
          <div className="space-y-6">
            {/* Swap Progress */}
            {swapState === 'processing' && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold mb-4">Swap Progress</h3>
                <div className="space-y-4">
                  {swapStates.map((state, index) => {
                    const Icon = state.icon;
                    const isActive = index === swapProgress;
                    const isCompleted = index < swapProgress;
                    
                    return (
                      <div key={state.key} className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          isCompleted ? 'bg-green-500' : 
                          isActive ? 'bg-blue-500 animate-pulse' : 
                          'bg-gray-600'
                        }`}>
                          <Icon size={16} />
                        </div>
                        <span className={`${
                          isCompleted ? 'text-green-400' : 
                          isActive ? 'text-blue-400' : 
                          'text-gray-400'
                        }`}>
                          {state.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Transaction Hash */}
            {transactionHash && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold mb-4">Transaction Details</h3>
                <div className="space-y-2">
                  <div className="text-sm text-gray-400">Transaction Hash:</div>
                  <div className="font-mono text-xs break-all bg-white/5 p-2 rounded">
                    {transactionHash}
                  </div>
                </div>
              </div>
            )}

            {/* Swap History */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-4">Recent Swaps</h3>
              {swapHistory.length > 0 ? (
                <div className="space-y-3">
                  {swapHistory.slice(0, 5).map((swap) => (
                    <div key={swap.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm">
                          <div className="font-medium">{swap.fromAmount} {swap.from} → {swap.toAmount} {swap.to}</div>
                          <div className="text-gray-400 text-xs">{swap.timestamp}</div>
                        </div>
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                          {swap.status}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-gray-400 truncate">
                        {swap.hash}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  No swap history yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Technical Architecture Info */}
        <div className="mt-12 bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold mb-6">Protocol Architecture</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="font-bold mb-2">Chain-Key Cryptography</h3>
              <p className="text-sm text-gray-300">
                ICP's native signing capabilities enable direct interaction with Bitcoin and Ethereum networks without bridges.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="font-bold mb-2">HTLCs (Hash Time Locked Contracts)</h3>
              <p className="text-sm text-gray-300">
                Atomic swaps using time-locked contracts ensure trustless execution without intermediaries.
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="font-bold mb-2">Smart Contract Canisters</h3>
              <p className="text-sm text-gray-300">
                Manage swap flow, validate requests, lock tokens in escrow, and optimize fees automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrossChainSwapDApp;