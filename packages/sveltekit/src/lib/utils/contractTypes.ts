import type { Abi, Address } from 'viem';

// Export types only - no module-level code execution
// This file can be safely imported by deployedContracts.ts and externalContracts.ts

export type InheritedFunctions = { readonly [key: string]: string };

export type GenericContract = {
	address: Address;
	abi: Abi;
	inheritedFunctions?: InheritedFunctions;
	external?: true;
	deployedOnBlock?: number;
};

export type GenericContractsDeclaration = {
	[chainId: number]: {
		[contractName: string]: GenericContract;
	};
};

