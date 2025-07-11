import React, { useState, useEffect } from "react";
import { useWallet } from "./WalletConnector";
import { AIAgent } from "./types";
import {
  AI_AGENTS,
  getRiskLevelColor,
  getStrategyDescription,
} from "./ai-agents";
import toast from "react-hot-toast";
import { ethers } from "ethers";

interface AIAgentSelectionProps {
  onAgentSelected: (agent: AIAgent) => void;
  selectedAgent: AIAgent | null;
}

const AIAgentSelection: React.FC<AIAgentSelectionProps> = ({
  onAgentSelected,
  selectedAgent,
}) => {
  const { account, signer, chainId, isCorrectNetwork } = useWallet();
  const [purchasingAgent, setPurchasingAgent] = useState<string | null>(null);
  const [purchasedAgents, setPurchasedAgents] = useState<string[]>([]);
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(true);

  // Check for existing purchases when account changes
  useEffect(() => {
    const checkExistingPurchases = async () => {
      if (!account) {
        setIsLoadingPurchases(false);
        return;
      }

      try {
        setIsLoadingPurchases(true);
        const response = await fetch(`/api/get-purchased-agents?walletAddress=${account}`);
        
        if (response.ok) {
          const data = await response.json();
          setPurchasedAgents(data.purchasedAgents || []);
          
          // If user has a purchased agent and no agent is selected, auto-select the first one
          if (data.purchasedAgents && data.purchasedAgents.length > 0 && !selectedAgent) {
            const purchasedAgent = AI_AGENTS.find(agent => data.purchasedAgents.includes(agent.id));
            if (purchasedAgent) {
              onAgentSelected(purchasedAgent);
            }
          }
        } else {
          console.warn('Failed to fetch purchased agents:', await response.text());
        }
      } catch (error) {
        console.error('Error checking existing purchases:', error);
      } finally {
        setIsLoadingPurchases(false);
      }
    };

    checkExistingPurchases();
  }, [account, onAgentSelected, selectedAgent]);

  // Store purchase in database
  const storePurchaseInDatabase = async (agentId: string, txHash: string) => {
    try {
      const response = await fetch('/api/store-agent-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: account,
          agentId,
          transactionHash: txHash,
          chainId,
          purchaseDate: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        console.warn('Failed to store purchase in database:', await response.text());
      } else {
        const result = await response.json();
        console.log('Purchase stored successfully:', result);
        // Update local state
        setPurchasedAgents(prev => [...prev, agentId]);
      }
    } catch (error) {
      console.error('Error storing purchase:', error);
    }
  };

  const handlePurchaseAgent = async (agent: AIAgent) => {
    if (!account || !signer) {
      toast.error("Please connect your wallet to purchase an AI Agent");
      return;
    }

    if (!isCorrectNetwork) {
      toast.error("Please switch to Arbitrum One network to purchase agents");
      return;
    }

    if (!agent.available) {
      toast.error("This agent is not available yet. Coming soon!");
      return;
    }

    if (!agent.walletAddress || agent.walletAddress === "") {
      toast.error("Agent wallet address not configured");
      return;
    }

    // Check if user already purchased this agent
    if (purchasedAgents.includes(agent.id)) {
      toast.success("You already own this agent!");
      onAgentSelected(agent);
      return;
    }

    try {
      setPurchasingAgent(agent.id);

      // Show initial loading message
      toast.loading(`Preparing to purchase ${agent.name}...`, { id: "purchasing" });

      // Check if user has enough ETH
      const balance = await signer.provider?.getBalance(account);
      const priceInWei = ethers.parseEther(agent.price.toString());
      
      if (!balance || balance < priceInWei) {
        toast.error("Insufficient ETH balance to purchase this agent", { id: "purchasing" });
        return;
      }

      // Create transaction to send ETH to agent's wallet
      toast.loading(`Sending ${agent.price} ETH to agent wallet...`, { id: "purchasing" });

      const transaction = {
        to: agent.walletAddress,
        value: priceInWei,
      };

      const tx = await signer.sendTransaction(transaction);
      
      toast.loading("Transaction submitted. Waiting for confirmation...", { id: "purchasing" });

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        toast.success(`${agent.name} purchased successfully!`, {
          id: "purchasing",
        });
        
        // Store purchase in database
        await storePurchaseInDatabase(agent.id, tx.hash);
        
        // Auto-select the purchased agent
        onAgentSelected(agent);
      } else {
        throw new Error("Transaction failed");
      }

    } catch (error: any) {
      console.error("Error purchasing agent:", error);
      
      let errorMessage = "Failed to purchase AI Agent";
      
      if (error.code === "INSUFFICIENT_FUNDS") {
        errorMessage = "Insufficient funds for transaction";
      } else if (error.code === "USER_REJECTED") {
        errorMessage = "Transaction cancelled by user";
      } else if (error.code === "NETWORK_ERROR") {
        errorMessage = "Network error. Please try again";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: "purchasing" });
    } finally {
      setPurchasingAgent(null);
    }
  };

  const handleContinueWithSelectedAgent = () => {
    if (selectedAgent) {
      onAgentSelected(selectedAgent);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-[#E4EFFF] mb-4">
          Choose Your AI Trading Agent
        </h2>
        <p className="text-lg text-[#8ba1bc] max-w-3xl mx-auto">
          Select an AI-powered trading strategy to manage your vault. Each agent
          employs different algorithms and risk management techniques to
          optimize your investment performance.
        </p>
        
        {/* Network Warning */}
        {account && !isCorrectNetwork && (
          <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Wrong Network
            </div>
            <p className="text-red-300 text-sm">
              You're connected to {chainId ? `Chain ID ${chainId}` : 'an unsupported network'}. This application only works on Arbitrum One.
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoadingPurchases && account && (
          <div className="mt-6 text-[#8ba1bc] text-sm flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-transparent border-t-blue-400 rounded-full animate-spin" />
            Checking your purchased agents...
          </div>
        )}
      </div>

      {/* AI Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AI_AGENTS.map((agent) => (
          <div
            key={agent.id}
            className={`
              bg-[#0D1321] border-2 rounded-2xl p-6 transition-all duration-300 relative group
              ${
                !agent.available
                  ? "opacity-60 border-gray-600"
                  : selectedAgent?.id === agent.id
                  ? "border-blue-500 bg-blue-500/5 hover:scale-[1.02] hover:shadow-2xl"
                  : "border-[#253040] hover:border-[#353940] hover:scale-[1.02] hover:shadow-2xl"
              }
            `}
          >
            {/* Coming Soon Tooltip for disabled agents */}
            {!agent.available && (
              <div className="absolute -top-2 -right-2 z-10">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-full px-3 py-1 text-xs font-medium text-yellow-400">
                  Coming Soon
                </div>
              </div>
            )}
            
            {/* Hover tooltip for disabled agents */}
            {!agent.available && (
              <div className="absolute inset-0 bg-black/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-sm text-white shadow-lg">
                  🚧 Coming Soon - Stay Tuned!
                </div>
              </div>
            )}
            {/* Agent Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{agent.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-[#E4EFFF]">
                    {agent.name}
                  </h3>
                  <div className="text-sm text-[#AAC9FA]">
                    {getStrategyDescription(agent.strategy)}
                  </div>
                </div>
              </div>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskLevelColor(
                  agent.riskLevel
                )}`}
              >
                {agent.riskLevel} Risk
              </div>
            </div>

            {/* Description */}
            <p className="text-[#8ba1bc] text-sm mb-4 leading-relaxed">
              {agent.description}
            </p>

            {/* Performance Stats */}
            <div className="bg-[#0A0F1A] border border-[#253040] rounded-lg p-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#8ba1bc]">Avg. Returns</span>
                <span className="text-sm font-semibold text-green-400">
                  {agent.avgReturns}
                </span>
              </div>
            </div>

            {/* Features */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-[#AAC9FA] mb-2">
                Key Features:
              </h4>
              <ul className="space-y-1">
                {agent.features.slice(0, 3).map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 text-xs text-[#8ba1bc]"
                  >
                    <div className="w-1 h-1 bg-cyan-400 rounded-full" />
                    {feature}
                  </li>
                ))}
                {agent.features.length > 3 && (
                  <li className="text-xs text-[#6b7280] italic">
                    +{agent.features.length - 3} more features
                  </li>
                )}
              </ul>
            </div>

            {/* Price and Action */}
            <div className="border-t border-[#253040] pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-lg font-bold text-[#E4EFFF]">
                    {agent.price} ETH
                  </div>
                  <div className="text-xs text-[#8ba1bc]">
                    One-time purchase
                  </div>
                </div>
              </div>

              {purchasedAgents.includes(agent.id) ? (
                <div className="space-y-3">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                    <div className="text-green-400 text-sm font-medium mb-1">
                      ✓ Agent Owned
                    </div>
                    <div className="text-green-300 text-xs">
                      {selectedAgent?.id === agent.id ? "Currently selected" : "Click to select"}
                    </div>
                  </div>
                  <button
                    onClick={() => onAgentSelected(agent)}
                    className={`w-full font-medium py-2 px-4 rounded-lg transition-all duration-200 
                             flex items-center justify-center gap-2 text-sm ${
                               selectedAgent?.id === agent.id
                                 ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                                 : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                             }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                    {selectedAgent?.id === agent.id ? "Continue with This Agent" : "Select This Agent"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handlePurchaseAgent(agent)}
                  disabled={purchasingAgent === agent.id || !account || !agent.available || !isCorrectNetwork}
                  className={`
                    w-full font-medium py-2 px-4 rounded-lg transition-all duration-200 
                    flex items-center justify-center gap-2 text-sm
                    ${!agent.available 
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed border border-gray-500'
                      : !isCorrectNetwork
                      ? 'bg-orange-600 text-orange-200 cursor-not-allowed border border-orange-500'
                      : purchasingAgent === agent.id || !account
                      ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
                    }
                  `}
                  title={
                    !agent.available 
                      ? "Coming Soon - This agent is not available yet" 
                      : !isCorrectNetwork
                      ? "Please switch to Arbitrum One network"
                      : ""
                  }
                >
                  {!agent.available ? (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      Coming Soon
                    </>
                  ) : !isCorrectNetwork ? (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Wrong Network
                    </>
                  ) : purchasingAgent === agent.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-transparent border-t-white rounded-full animate-spin" />
                      Purchasing...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Purchase Agent
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Continue Button - Enhanced for better UX */}
      {selectedAgent && (
        <div className="mt-12 text-center">
          <div className="bg-[#0D1321] border border-[#253040] rounded-2xl p-6 max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">{selectedAgent.icon}</div>
              <div>
                <div className="text-lg font-semibold text-[#E4EFFF]">
                  {selectedAgent.name}
                </div>
                <div className="text-sm text-[#AAC9FA]">Currently Selected</div>
              </div>
            </div>
            <p className="text-[#8ba1bc] text-sm mb-4">
              Your vault will use the {selectedAgent.name} strategy with wallet
              address{" "}
              <span className="text-cyan-400 font-mono text-xs">
                {selectedAgent.walletAddress.slice(0, 6)}...
                {selectedAgent.walletAddress.slice(-4)}
              </span>
            </p>
            <button
              onClick={handleContinueWithSelectedAgent}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 
                       text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 
                       flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
              Proceed to Vault Configuration
            </button>
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="mt-12 bg-[#0D1321] border border-[#253040] rounded-2xl p-6">
        <h3 className="text-xl font-bold text-[#E4EFFF] mb-4 text-center">
          How AI Agents Work
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[#8ba1bc] text-sm">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h4 className="font-semibold text-[#AAC9FA] mb-2">
              Automated Trading
            </h4>
            <p>
              AI agents execute trades automatically based on their programmed
              strategies, removing emotion from trading decisions.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h4 className="font-semibold text-[#AAC9FA] mb-2">
              Risk Management
            </h4>
            <p>
              Each agent includes built-in risk management features like
              stop-losses and position sizing to protect your investments.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h4 className="font-semibold text-[#AAC9FA] mb-2">
              24/7 Monitoring
            </h4>
            <p>
              AI agents monitor markets continuously, executing trades even when
              you're not actively watching the markets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAgentSelection;
