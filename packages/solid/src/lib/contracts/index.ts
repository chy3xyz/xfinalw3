import type { GenericContractsDeclaration } from "./contractTypes.js"
import deployedContractsData from "./deployedContracts.js"
import externalContractsData from "./externalContracts.js"

type AddExternalFlag<T> = {
  [ChainId in keyof T]: {
    [ContractName in keyof T[ChainId]]: T[ChainId][ContractName] & {
      external?: true
    }
  }
}

function deepMergeContracts<
  L extends Record<PropertyKey, unknown>,
  E extends Record<PropertyKey, unknown>
>(local: L, external: E) {
  const result: Record<PropertyKey, unknown> = {}
  const allKeys = Array.from(
    new Set([...Object.keys(external), ...Object.keys(local)])
  )
  for (const key of allKeys) {
    if (!external[key]) {
      result[key] = local[key]
      continue
    }
    const amendedExternal = Object.fromEntries(
      Object.entries(
        external[key] as Record<string, Record<string, unknown>>
      ).map(([contractName, declaration]) => [
        contractName,
        { ...declaration, external: true }
      ])
    )
    result[key] = {
      ...(local[key] as object),
      ...amendedExternal
    }
  }
  return result as AddExternalFlag<L> & AddExternalFlag<E>
}

export const contractsData = deepMergeContracts(
  deployedContractsData,
  externalContractsData
) as GenericContractsDeclaration

export type ContractName = {
  [K in keyof typeof contractsData]: keyof (typeof contractsData)[K]
}[keyof typeof contractsData]

export function getDeployedContract(opts: {
  contractName: string
  chainId: number
}) {
  const chainContracts = (
    contractsData as Record<number, Record<string, { address: string; abi: unknown }>>
  )[opts.chainId]
  return chainContracts?.[opts.contractName] ?? null
}

export type { GenericContractsDeclaration } from "./contractTypes.js"
export { default as deployedContracts } from "./deployedContracts.js"
export { default as externalContracts } from "./externalContracts.js"
