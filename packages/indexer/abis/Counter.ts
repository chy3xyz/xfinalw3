/** Minimal ABI for the scaffold Counter (packages/foundry/contracts/Counter.sol). */
export const CounterAbi = [
  {
    type: "event",
    name: "CountUpdated",
    inputs: [{ name: "newCount", type: "uint256", indexed: false }]
  },
  {
    type: "function",
    name: "getCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "increment",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  }
] as const
