export interface VaultConfig {
  name: string;
  symbol: string;
  denominationAsset: string;
  sharesActionTimelock: string; // in hours
  managementFeeRate: string; // in percentage (e.g., "1" for 1%)
  performanceFeeRate: string; // in percentage (e.g., "10" for 10%)
  includeFees: boolean;
  includePolicies: boolean;
  allowedDepositorsOnly: boolean; // Restrict deposits to specific addresses
  allowedDepositors: string; // Comma-separated list of allowed depositor addresses
}

export interface CreatedVault {
  comptrollerProxy: string;
  vaultProxy: string;
  txHash: string;
}

export interface NetworkConfig {
  name: string;
  contracts: {
    FUND_DEPLOYER: string;
    COMPTROLLER_LIB: string;
    VAULT_LIB: string;
    FEE_MANAGER: string;
    POLICY_MANAGER: string;
    INTEGRATION_MANAGER: string;
    EXTERNAL_POSITION_MANAGER: string;
    VALUE_INTERPRETER: string;
    PRIMITIVE_PRICE_FEED: string;
    DERIVATIVE_PRICE_FEED: string;
    MANAGEMENT_FEE: string;
    PERFORMANCE_FEE: string;
    ALLOWED_DEPOSITORS_POLICY: string;
    ADDRESS_LIST_REGISTRY: string;
  };
  assets: {
    WETH: string;
    USDC: string;
    USDT: string;
    DAI: string;
    WBTC: string;
  };
  explorer: string;
  currency: string;
}

// New types for AI Agents and multi-step flow
export interface AIAgent {
  id: string;
  name: string;
  strategy: string;
  description: string;
  walletAddress: string;
  price: number; // Price in ETH
  parameters: Record<string, any>;
  features: string[];
  riskLevel: "Low" | "Medium" | "High";
  avgReturns: string;
  icon: string;
  available: boolean; // Whether the agent is available for purchase
}

export interface VaultCreationStep {
  step: number;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

export interface VaultCreationState {
  currentStep: number;
  selectedAgent: AIAgent | null;
  vaultConfig: VaultConfig;
  createdVault: CreatedVault | null;
  isProcessing: boolean;
}
