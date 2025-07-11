Deposit into an Enzyme vault
Depositing into an Enzyme vault is a two step process:

Approve the ComptrollerProxy of the vault to spend a certain amount of denomination asset tokens
Send a deposit transaction to the ComptrollerProxy.
1. Approve spending
import { Asset } from "@enzymefinance/sdk";
import { parseUnits } from "viem";
 
const approve = Asset.approve({ 
    asset: denominationAsset, 
    amount: parseUnits("1", 18), 
    spender: comptrollerProxy
});
 
await walletClient.sendTransaction(approve.params);
2. Deposit
Depositing the approved amount into the vault.

import { Depositor } from "@enzymefinance/sdk";
import { parseUnits } from "viem";
 
const deposit = Depositor.deposit({
    comptrollerProxy,
    amount: parseUnits("1", 18),
    depositor,
    minSharesvQuantity: 1n,
})
 
await walletClient.sendTransaction(deposit.params);
Expected Number of Shares
For simplicity, we have set minSharesQuantity to 1 wei shares above. In real life, you should set it to a more realistic amount.

The expected number of shares for a given deposit can be obtained with the getExpectedSharesForDeposit function, and then allowing for some slippage (e.g. 1%).

import { Depositor } from "@enzymefinance/sdk";
 
const expectedNumberOfShares = Depositor.getExpectedSharesForDeposit(
    publicClient, 
    {
        comptrollerProxy,
        amount: parseUnits("1", 18),
        depositor,
    }
);
 
const minSharesQuantity = expectedNumberOfShares * 99 / 100;