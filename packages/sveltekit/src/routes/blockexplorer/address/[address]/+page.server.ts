import type { PageServerLoad } from './$types';
import type { Address } from 'viem';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { foundry } from 'viem/chains';
import deployedContracts from '$lib/contracts/deployedContracts.js';
import type { GenericContractsDeclaration } from '$lib/utils/contractTypes.js';

async function fetchByteCodeAndAssembly(buildInfoDirectory: string, contractPath: string) {
  const buildInfoFiles = readdirSync(buildInfoDirectory);
  let bytecode = '';
  let assembly = '';

  for (let i = 0; i < buildInfoFiles.length; i++) {
    const filePath = join(buildInfoDirectory, buildInfoFiles[i]);
    const buildInfo = JSON.parse(readFileSync(filePath, 'utf8'));

    if (buildInfo.output?.contracts?.[contractPath]) {
      for (const contract in buildInfo.output.contracts[contractPath]) {
        bytecode = buildInfo.output.contracts[contractPath][contract].evm.bytecode.object;
        assembly = buildInfo.output.contracts[contractPath][contract].evm.bytecode.opcodes;
        break;
      }
    }

    if (bytecode && assembly) {
      break;
    }
  }

  return { bytecode, assembly };
}

async function getContractData(address: Address): Promise<{ bytecode: string; assembly: string } | null> {
  const contracts = deployedContracts as GenericContractsDeclaration | null;
  const chainId = foundry.id;

  if (!contracts || !contracts[chainId] || Object.keys(contracts[chainId]).length === 0) {
    return null;
  }

  let contractPath = '';

  // Path to foundry build-info directory
  const buildInfoDirectory = join(
    process.cwd(),
    'packages',
    'foundry',
    'out',
    'build-info',
  );

  if (!existsSync(buildInfoDirectory)) {
    console.warn(`Directory ${buildInfoDirectory} not found.`);
    return null;
  }

  const deployedContractsOnChain = contracts[chainId];
  for (const [contractName, contractInfo] of Object.entries(deployedContractsOnChain)) {
    if (contractInfo.address.toLowerCase() === address.toLowerCase()) {
      contractPath = `contracts/${contractName}.sol`;
      break;
    }
  }

  if (!contractPath) {
    return null;
  }

  const { bytecode, assembly } = await fetchByteCodeAndAssembly(buildInfoDirectory, contractPath);

  return { bytecode, assembly };
}

export const load: PageServerLoad = async ({ params }) => {
  const address = params.address as Address;
  
  // Fetch contract data on server side only
  const contractData = await getContractData(address);
  
  return {
    address,
    contractData,
  };
};

