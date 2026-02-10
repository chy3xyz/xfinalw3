<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { get } from 'svelte/store';
  import { readContract } from '@wagmi/core';
  import { createDeployedContractStore } from '$lib/stores/deployedContract.js';
  import { createScaffoldWriteContractStore } from '$lib/stores/scaffoldWriteContract.js';
  import { createScaffoldReadContractStore } from '$lib/stores/scaffoldReadContract.js';
  import { useTargetNetwork } from '$lib/stores/targetNetwork.js';
  import { wagmiConfig } from '$lib/config/wagmi.js';
  import { parseEther, formatEther } from 'viem';
  import type { ExtractAbiFunctionNames } from 'abitype';
  import type { ContractName, ContractAbi } from '$lib/utils/contract.js';
  import { notification } from '$lib/utils/notification.js';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
  import { Label } from '$lib/components/ui/label';

  // Debug logging disabled
  const debugLog = (_location: string, _message: string, _data: any, _hypothesisId?: string) => {};
  
  // Type definitions for ABI
  type AbiFunction = {
    type: 'function';
    name: string;
    inputs: AbiParameter[];
    outputs?: any[];
    stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
  };
  
  type AbiParameter = {
    name?: string;
    type: string;
    indexed?: boolean;
  };

  export let contractName: ContractName;

  let deployedContractStore: ReturnType<typeof createDeployedContractStore> | null = null;
  let writeContractStore: ReturnType<typeof createScaffoldWriteContractStore> | null = null;
  let targetNetworkStore: ReturnType<typeof useTargetNetwork> | null = null;
  let targetNetworkValue: any = null;
  let mountError: string | null = null;
  let loadError: string | null = null;

  // Public state variables (no-arg view/pure functions)
  type PublicStateVariable = {
    functionName: string;
    value: any;
    isLoading: boolean;
    error: any;
  };

  // Function states for read functions (with inputs)
  type ReadFunctionState = {
    functionName: string;
    args: (string | undefined)[];
    result: any;
    isLoading: boolean;
  };

  // Function states for write functions
  type WriteFunctionState = {
    functionName: string;
    args: (string | undefined)[];
    value: string;
    isLoading: boolean;
  };

  let publicStateVariables: PublicStateVariable[] = [];
  let readFunctions: ReadFunctionState[] = [];
  let writeFunctions: WriteFunctionState[] = [];

  // Function to load public state variable values
  async function loadPublicStateVariable(stateVar: PublicStateVariable, contractAddress: string, abi: any, chainId: number) {
    if (!browser || !contractAddress || !abi) {
      // #region agent log
      debugLog('ContractUI.svelte:85', 'loadPublicStateVariable skipped', {
        browser,
        hasContractAddress: !!contractAddress,
        hasAbi: !!abi,
        functionName: stateVar.functionName
      }, 'H5');
      // #endregion
      return;
    }
    
    try {
      stateVar.isLoading = true;
      stateVar.error = null;
      
      // #region agent log
      debugLog('ContractUI.svelte:95', 'Loading public state variable', {
        functionName: stateVar.functionName,
        contractAddress,
        chainId
      }, 'H5');
      // #endregion
      
      const result = await readContract(wagmiConfig, {
        address: contractAddress as `0x${string}`,
        abi: abi,
        functionName: stateVar.functionName as any,
        args: [],
        chainId: chainId,
      });
      
      stateVar.value = result;
      stateVar.isLoading = false;
      
      // #region agent log
      debugLog('ContractUI.svelte:110', 'Public state variable loaded', {
        functionName: stateVar.functionName,
        value: String(result),
        valueType: typeof result
      }, 'H5');
      // #endregion
      
      // Trigger reactivity
      publicStateVariables = [...publicStateVariables];
    } catch (err: any) {
      console.error(`[ContractUI] Error loading ${stateVar.functionName}:`, err);
      stateVar.error = err;
      stateVar.isLoading = false;
      
      // #region agent log
      debugLog('ContractUI.svelte:120', 'Error loading public state variable', {
        functionName: stateVar.functionName,
        error: String(err),
        errorMessage: err?.message
      }, 'H5');
      // #endregion
      
      // Trigger reactivity
      publicStateVariables = [...publicStateVariables];
    }
  }
  
  // Load all public state variables when contract data is available
  async function loadAllPublicStateVariables() {
    // #region agent log
    debugLog('ContractUI.svelte:130', 'loadAllPublicStateVariables called', {
      browser,
      hasDeployedContractStore: !!deployedContractStore,
      hasTargetNetworkStore: !!targetNetworkStore,
      publicStateVarsCount: publicStateVariables.length
    }, 'H5');
    // #endregion
    
    if (!browser || !deployedContractStore || !targetNetworkStore) return;
    
    const storeData = get(deployedContractStore) as any;
    if (!storeData?.data) {
      // #region agent log
      debugLog('ContractUI.svelte:140', 'No contract data available', {}, 'H5');
      // #endregion
      return;
    }
    
    const $targetNetwork = get(targetNetworkStore.targetNetwork);
    
    // #region agent log
    debugLog('ContractUI.svelte:145', 'Starting to load public state variables', {
      publicStateVarsCount: publicStateVariables.length,
      contractAddress: storeData.data.address,
      chainId: $targetNetwork.id,
      functionNames: publicStateVariables.map(v => v.functionName)
    }, 'H5');
    // #endregion
    
    for (const stateVar of publicStateVariables) {
      await loadPublicStateVariable(
        stateVar,
        storeData.data.address,
        storeData.data.abi,
        $targetNetwork.id
      );
    }
    
    // #region agent log
    debugLog('ContractUI.svelte:160', 'Finished loading all public state variables', {
      loadedCount: publicStateVariables.filter(v => v.value !== undefined).length,
      errorCount: publicStateVariables.filter(v => v.error).length
    }, 'H5');
    // #endregion
  }

  // Initialize stores only in browser to avoid SSR issues with wagmi hooks
  onMount(() => {
    if (browser) {
      try {
        console.log(`[ContractUI] onMount: Initializing for contract ${String(contractName)}`);
        deployedContractStore = createDeployedContractStore({ contractName });
        console.log('[ContractUI] Deployed contract store created');
        writeContractStore = createScaffoldWriteContractStore({ contractName });
        console.log('[ContractUI] Write contract store created');
        targetNetworkStore = useTargetNetwork();
        console.log('[ContractUI] Target network store created');
        
        // Subscribe to target network
        if (targetNetworkStore) {
          targetNetworkStore.targetNetwork.subscribe((value) => {
            console.log('[ContractUI] Target network updated:', value);
            targetNetworkValue = value;
          });
        }

        // Initialize function states when contract data is available
        if (deployedContractStore) {
          deployedContractStore.subscribe((storeData: any) => {
            try {
              loadError = null;
              console.log('[ContractUI] Contract store updated:', storeData);
              debugLog('ContractUI.svelte:118', 'Contract store updated', {
                hasData: !!storeData?.data,
                isLoading: storeData?.isLoading,
                hasAbi: !!storeData?.data?.abi,
                abiLength: storeData?.data?.abi?.length || 0
              }, 'H4');

              if (storeData?.data) {
                console.log('[ContractUI] Initializing functions with ABI');
                debugLog('ContractUI.svelte:127', 'Before initializeFunctions', {
                  readFunctionsBefore: readFunctions.length,
                  publicStateVarsBefore: publicStateVariables.length
                }, 'H4');

                const newPublicStateVars: PublicStateVariable[] = [];
                const newReadFunctions: ReadFunctionState[] = [];
                const newWriteFunctions: WriteFunctionState[] = [];

                try {
                  initializeFunctions(storeData.data.abi, newPublicStateVars, newReadFunctions, newWriteFunctions);
                } catch (err: any) {
                  console.error('[ContractUI] initializeFunctions error:', err);
                  loadError = err?.message ?? String(err);
                  publicStateVariables = [];
                  readFunctions = [];
                  writeFunctions = [];
                  return;
                }

                publicStateVariables = newPublicStateVars;
                readFunctions = newReadFunctions;
                writeFunctions = newWriteFunctions;

                (async () => {
                  if (!browser || !deployedContractStore || !targetNetworkStore) return;
                  const storeData = get(deployedContractStore) as any;
                  if (!storeData?.data) return;
                  const $targetNetwork = get(targetNetworkStore.targetNetwork);
                  for (const stateVar of publicStateVariables) {
                    await loadPublicStateVariable(
                      stateVar,
                      storeData.data.address,
                      storeData.data.abi,
                      $targetNetwork.id
                    );
                  }
                })();

                debugLog('ContractUI.svelte:138', 'After initializeFunctions and array reassignment', {
                  readFunctionsAfter: readFunctions.length,
                  publicStateVarsAfter: publicStateVariables.length,
                  readFunctionNames: readFunctions.map(f => f.functionName)
                }, 'H2');
                console.log('[ContractUI] Functions initialized - public vars:', publicStateVariables.length, 'read:', readFunctions.length, 'write:', writeFunctions.length);
              }
            } catch (err: any) {
              console.error('[ContractUI] Store subscription error:', err);
              loadError = err?.message ?? String(err);
              publicStateVariables = [];
              readFunctions = [];
              writeFunctions = [];
            }
          });
        }
        console.log('[ContractUI] onMount: Initialization complete');
      } catch (err: any) {
        console.error('[ContractUI] onMount error:', err);
        mountError = err?.message ?? String(err);
      }
    }
  });

  function initializeFunctions(
    abi: ContractAbi<ContractName>,
    publicStateVars: PublicStateVariable[],
    readFuncs: ReadFunctionState[],
    writeFuncs: WriteFunctionState[]
  ) {
    try {
      // #region agent log
      debugLog('ContractUI.svelte:120', 'initializeFunctions called', { abiType: typeof abi, isArray: Array.isArray(abi) }, 'H1');
      // #endregion
      
      const abiArray = Array.isArray(abi) ? abi : [];
      console.log('[ContractUI] initializeFunctions: Starting, ABI length:', abiArray.length);
      
      // #region agent log
      debugLog('ContractUI.svelte:125', 'ABI array prepared', { abiLength: abiArray.length, abiArray: abiArray.slice(0, 5) }, 'H1');
      // #endregion
      
      if (!abiArray || abiArray.length === 0) {
        console.warn('[ContractUI] initializeFunctions: No ABI provided');
        // #region agent log
        debugLog('ContractUI.svelte:129', 'ABI empty, returning early', {}, 'H1');
        // #endregion
        return;
      }

      // Clear arrays
      publicStateVars.length = 0;
      readFuncs.length = 0;
      writeFuncs.length = 0;

      // #region agent log
      debugLog('ContractUI.svelte:135', 'Arrays reset', { publicStateVars: publicStateVars.length, readFuncs: readFuncs.length, writeFuncs: writeFuncs.length }, 'H1');
      // #endregion

      let functionCount = 0;
      let readWithInputsCount = 0;
      let readWithoutInputsCount = 0;
      let writeCount = 0;

      for (const item of abiArray) {
        if (item.type === 'function') {
          functionCount++;
          const func = item as AbiFunction;
          const hasInputs = func.inputs && func.inputs.length > 0;

          // #region agent log
          debugLog('ContractUI.svelte:148', 'Processing function', {
            name: func.name,
            stateMutability: func.stateMutability,
            hasInputs,
            inputsLength: func.inputs?.length || 0
          }, 'H1');
          // #endregion

          if (func.stateMutability === 'view' || func.stateMutability === 'pure') {
            // Public state variables (no inputs) - display on left side
            if (!hasInputs) {
              readWithoutInputsCount++;
              publicStateVars.push({
                functionName: func.name,
                value: undefined,
                isLoading: false,
                error: null,
              });
              console.log(`[ContractUI] Added public state variable: ${func.name}`);
              // #region agent log
              debugLog('ContractUI.svelte:165', 'Added public state variable', { name: func.name, publicStateVarsLength: publicStateVars.length }, 'H1');
              // #endregion
            } else {
              // Read function with inputs - display on right side
              readWithInputsCount++;
              readFuncs.push({
                functionName: func.name,
                args: (func.inputs || []).map(() => undefined),
                result: undefined,
                isLoading: false,
              });
              console.log(`[ContractUI] Added read function with inputs: ${func.name}, inputs:`, func.inputs.length);
              // #region agent log
              debugLog('ContractUI.svelte:180', 'Added read function with inputs', { name: func.name, inputsLength: func.inputs.length, readFunctionsLength: readFuncs.length }, 'H2');
              // #endregion
            }
          } else if (func.stateMutability === 'nonpayable' || func.stateMutability === 'payable') {
            // Write function
            writeCount++;
            writeFuncs.push({
              functionName: func.name,
              args: (func.inputs || []).map(() => undefined),
              value: '',
              isLoading: false,
            });
            console.log(`[ContractUI] Added write function: ${func.name}`);
            // #region agent log
            debugLog('ContractUI.svelte:193', 'Added write function', { name: func.name, writeFunctionsLength: writeFuncs.length }, 'H1');
            // #endregion
          }
        }
      }
      
      // #region agent log
      debugLog('ContractUI.svelte:199', 'initializeFunctions complete', {
        functionCount,
        readWithInputsCount,
        readWithoutInputsCount,
        writeCount,
        publicStateVars: publicStateVars.length,
        readFuncs: readFuncs.length,
        writeFuncs: writeFuncs.length,
        readFunctionNames: readFuncs.map(f => f.functionName)
      }, 'H1');
      // #endregion
      
      console.log(`[ContractUI] initializeFunctions: Complete - ${publicStateVariables.length} public vars, ${readFunctions.length} read, ${writeFunctions.length} write`);
    } catch (err) {
      console.error('[ContractUI] initializeFunctions error:', err);
      debugLog('ContractUI.svelte:210', 'initializeFunctions error', { error: String(err), stack: err instanceof Error ? err.stack : '' }, 'H1');
      throw err;
    }
  }

  function getFunctionInputs(abi: ContractAbi<ContractName>, functionName: string): AbiParameter[] {
    const abiArray = Array.isArray(abi) ? abi : [];
    if (!abiArray || abiArray.length === 0) return [];
    for (const item of abiArray) {
      if (item.type === 'function' && item.name === functionName) {
        return item.inputs || [];
      }
    }
    return [];
  }

  function extractErrorMessage(error: any): string {
    // Try to extract the most user-friendly error message
    if (error?.reason) {
      return error.reason;
    }
    if (error?.shortMessage) {
      return error.shortMessage;
    }
    if (error?.message) {
      // Extract the revert reason from error message if present
      const revertMatch = error.message.match(/reverted with the following reason:\s*(.+?)(?:\n|$)/i);
      if (revertMatch) {
        return revertMatch[1].trim();
      }
      // Check for common error patterns
      if (error.message.includes('reverted')) {
        const reasonMatch = error.message.match(/reason:\s*(.+?)(?:\n|$)/i);
        if (reasonMatch) {
          return reasonMatch[1].trim();
        }
      }
      return error.message;
    }
    return 'Transaction failed. Please check the console for details.';
  }

  async function callReadFunction(funcState: ReadFunctionState) {
    console.log('[ContractUI] callReadFunction called for:', funcState.functionName);
    
    if (!browser) {
      console.warn('[ContractUI] Not in browser');
      notification.error('This function can only be called in the browser');
      return;
    }
    
    if (!deployedContractStore) {
      console.warn('[ContractUI] Contract store not initialized');
      notification.error('Contract store not initialized');
      return;
    }

    const storeData = get(deployedContractStore) as any;
    if (!storeData?.data) {
      console.warn('[ContractUI] Contract data not available');
      notification.error('Contract data not available');
      return;
    }

    try {
      funcState.isLoading = true;
      console.log('[ContractUI] Starting read function call');
      
      // Parse args
      const inputs = getFunctionInputs(storeData.data.abi, funcState.functionName);
      const parsedArgs = funcState.args.map((arg, i) => {
        if (arg === undefined || arg === '') return undefined;
        const inputType = inputs[i]?.type || '';
        // Basic type parsing - can be enhanced
        if (inputType.includes('int')) {
          return BigInt(arg);
        } else if (inputType.includes('bool')) {
          return arg === 'true';
        } else if (inputType.includes('address')) {
          return arg as `0x${string}`;
        }
        return arg;
      });

      // Use @wagmi/core API directly instead of store
      if (!targetNetworkStore) {
        notification.error('Network not initialized');
        funcState.isLoading = false;
        return;
      }
      
      const $targetNetwork = get(targetNetworkStore.targetNetwork);
      console.log('[ContractUI] Calling readContract with:', {
        address: storeData.data.address,
        functionName: funcState.functionName,
        args: parsedArgs.filter((arg) => arg !== undefined),
        chainId: $targetNetwork.id,
      });
      
      const result = await readContract(wagmiConfig, {
        address: storeData.data.address,
        abi: storeData.data.abi,
        functionName: funcState.functionName as any,
        args: parsedArgs.filter((arg) => arg !== undefined) as any,
        chainId: $targetNetwork.id,
      });

      console.log('[ContractUI] Read function result:', result);
      funcState.result = result;
      funcState.isLoading = false;
      // Trigger reactivity by reassigning the array
      readFunctions = readFunctions;
    } catch (error: any) {
      console.error('[ContractUI] Error calling read function:', error);
      const errorMessage = extractErrorMessage(error);
      notification.error(errorMessage);
      funcState.isLoading = false;
      // Trigger reactivity
      readFunctions = readFunctions;
    }
  }

  async function callWriteFunction(funcState: WriteFunctionState) {
    if (!writeContractStore || !deployedContractStore) {
      notification.error('Contract store not initialized');
      return;
    }

    const storeData = get(deployedContractStore) as any;
    if (!storeData?.data) {
      notification.error('Contract not deployed');
      return;
    }

    try {
      funcState.isLoading = true;
      console.log('[ContractUI] Starting write function call:', funcState.functionName);

      // Parse args
      const inputs = getFunctionInputs(storeData.data.abi, funcState.functionName);
      const parsedArgs = funcState.args.map((arg, i) => {
        if (arg === undefined || arg === '') return undefined;
        const inputType = inputs[i]?.type || '';
        // Basic type parsing
        if (inputType.includes('int')) {
          return BigInt(arg);
        } else if (inputType.includes('bool')) {
          return arg === 'true';
        } else if (inputType.includes('address')) {
          return arg as `0x${string}`;
        }
        return arg;
      });

      // Parse value if payable
      const func = (storeData.data.abi as any[]).find(
        (item: any) => item.type === 'function' && item.name === funcState.functionName
      ) as AbiFunction | undefined;
      const isPayable = func?.stateMutability === 'payable';
      const value = isPayable && funcState.value ? parseEther(funcState.value) : undefined;

      console.log('[ContractUI] Calling writeContractAsync with:', {
        functionName: funcState.functionName,
        args: parsedArgs.filter((arg) => arg !== undefined),
        value: value?.toString(),
      });

      // Call write function
      const writeStore = writeContractStore;
      await writeStore.writeContractAsync({
        functionName: funcState.functionName as any,
        args: parsedArgs.filter((arg) => arg !== undefined) as any,
        value,
      } as any);

      notification.success('Transaction sent successfully');
      funcState.isLoading = false;
      
      // Reset form
      funcState.args = funcState.args.map(() => undefined);
      funcState.value = '';
    } catch (error: any) {
      console.error('[ContractUI] Error calling write function:', error);
      const errorMessage = extractErrorMessage(error);
      notification.error(errorMessage);
      funcState.isLoading = false;
    }
  }


  function formatResult(result: any): string {
    if (result === null || result === undefined) return 'null';
    if (typeof result === 'bigint') return result.toString();
    if (Array.isArray(result)) {
      return `[${result.map(formatResult).join(', ')}]`;
    }
    if (typeof result === 'object') {
      return JSON.stringify(result, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2);
    }
    return String(result);
  }

  function formatValue(value: any): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'bigint') {
      // Format large numbers nicely
      const str = value.toString();
      if (str.length > 18) {
        // Likely a wei amount, try to format as ether
        try {
          return formatEther(value);
        } catch {
          return str;
        }
      }
      return str;
    }
    if (Array.isArray(value)) {
      return `[${value.map(formatValue).join(', ')}]`;
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2);
    }
    return String(value);
  }
</script>

{#if mountError}
  <div class="rounded-xl border border-border bg-card p-6 text-white">
    <p class="font-semibold text-destructive">Failed to load contract UI</p>
    <p class="text-sm mt-2 opacity-90">{mountError}</p>
    <p class="text-xs mt-3 text-muted-foreground">Try switching to another contract tab.</p>
  </div>
{:else if loadError}
  <div class="rounded-xl border border-border bg-card p-6 text-white">
    <p class="font-semibold text-destructive">Error loading {contractName}</p>
    <p class="text-sm mt-2 opacity-90">{loadError}</p>
    <p class="text-xs mt-3 text-muted-foreground">Try switching to another contract tab.</p>
  </div>
{:else if browser && deployedContractStore && targetNetworkValue}
  {@const storeData = deployedContractStore ? ($deployedContractStore as any) : null}
  {#if storeData?.isLoading}
    <div class="mt-14">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  {:else if !storeData?.data}
    <p class="text-3xl mt-14">
      No contract found by the name of {contractName} on chain {targetNetworkValue.name}!
    </p>
  {:else if storeData?.data}
      {@const contractData = storeData.data}
      {#if contractData}
        {@const abi = contractData.abi as any}
        
        <div class="w-full mx-auto px-4 sm:px-6 lg:px-8" >
          <!-- Contract Header -->
          <Card class="mb-6 text-white">
            <CardHeader>
              <CardTitle class="text-2xl mb-4">{contractName}</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-sm text-white break-all">
                <strong>Address:</strong> {contractData.address}
              </p>
              <p class="text-sm text-white">
                <strong>Network:</strong> {targetNetworkValue.name}
              </p>
            </CardContent>
          </Card>

          <!-- Two Column Layout -->
          <style>
            .contract-ui-grid {
              display: grid !important;
              grid-template-columns: 1fr;
              gap: 1.5rem;
            }
            @media (min-width: 768px) {
              .contract-ui-grid {
                grid-template-columns: 30% 70% !important;
              }
            }
            /* Enhanced input border visibility */
            .contract-ui-input {
              border: 2px solid var(--color-border) !important;
              border-color: var(--color-border) !important;
            }
            .contract-ui-input:focus {
              border-color: var(--color-ring) !important;
              border-width: 2px !important;
              box-shadow: 0 0 0 2px rgba(var(--color-ring-rgb, 112, 112, 112), 0.2) !important;
            }
            [data-theme="dark"] .contract-ui-input {
              border-color: rgba(255, 255, 255, 0.3) !important;
            }
            [data-theme="dark"] .contract-ui-input:focus {
              border-color: rgba(255, 255, 255, 0.6) !important;
              box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1) !important;
            }
          </style>
          <div class="contract-ui-grid">
            <!-- #region agent log -->
            {(() => {
              const isWide = typeof window !== 'undefined' && window.innerWidth >= 768;
              debugLog('ContractUI.svelte:555', 'Rendering two-column layout', {
                readFunctionsLength: readFunctions.length,
                publicStateVarsLength: publicStateVariables.length,
                windowWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
                isMdBreakpoint: isWide,
                layoutType: 'grid'
              }, 'H3');
              return '';
            })()}
            <!-- #endregion -->
            <!-- Left Column: Public State Variables -->
            <div class="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle class="text-xl mb-4">Public State Variables</CardTitle>
                </CardHeader>
                <CardContent>
                  {#if publicStateVariables.length > 0}
                    <div class="space-y-4">
                      {#each publicStateVariables as stateVar, i (stateVar.functionName + '-' + i)}
                        <div class="p-4 bg-muted rounded-lg border border-border">
                          <div class="flex items-center justify-between mb-2">
                            <h4 class="font-bold text-lg">{stateVar.functionName}</h4>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              class="rounded-full"
                              onclick={() => {
                                const storeData = get(deployedContractStore!) as any;
                                const $targetNetwork = get(targetNetworkStore!.targetNetwork);
                                loadPublicStateVariable(
                                  stateVar,
                                  storeData.data.address,
                                  storeData.data.abi,
                                  $targetNetwork.id
                                );
                              }}
                              disabled={stateVar.isLoading}
                              title="Refresh"
                            >
                              {#if stateVar.isLoading}
                                <span class="loading loading-spinner loading-xs"></span>
                              {:else}
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              {/if}
                            </Button>
                          </div>
                          {#if stateVar.isLoading}
                            <div class="flex items-center gap-2 text-sm text-muted-foreground">
                              <span class="loading loading-spinner loading-xs"></span>
                              <span>Loading...</span>
                            </div>
                          {:else if stateVar.error}
                            <div class="text-sm text-error">
                              Error: {stateVar.error?.message || 'Unknown error'}
                            </div>
                          {:else if stateVar.value !== undefined}
                            <div class="mt-2 p-3 bg-background rounded-md border border-border/50">
                              <pre class="text-xs sm:text-sm font-mono text-foreground whitespace-pre-wrap break-words m-0 leading-relaxed">{formatValue(stateVar.value)}</pre>
                            </div>
                          {:else}
                            <div class="text-sm text-muted-foreground">No data</div>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <div class="text-center py-8 text-white">
                      <p class="text-sm">No public state variables found.</p>
                      <p class="text-xs mt-2">Public state variables are view/pure functions with no parameters.</p>
                    </div>
                  {/if}
                </CardContent>
              </Card>
            </div>

            <!-- Right Column: Read and Write Functions -->
            <div class="space-y-6">
              <!-- Read Functions -->
              <!-- #region agent log -->
              {(() => {
                debugLog('ContractUI.svelte:614', 'Checking readFunctions condition', {
                  readFunctionsExists: !!readFunctions,
                  readFunctionsLength: readFunctions?.length || 0,
                  conditionResult: readFunctions && readFunctions.length > 0,
                  readFunctionNames: readFunctions?.map(f => f.functionName) || []
                }, 'H3');
                return '';
              })()}
              <!-- #endregion -->
              {#if readFunctions && readFunctions.length > 0}
                <!-- #region agent log -->
                {(() => {
                  debugLog('ContractUI.svelte:625', 'Rendering read functions section', {
                    readFunctionsLength: readFunctions.length,
                    readFunctionNames: readFunctions.map(f => f.functionName),
                    windowWidth: typeof window !== 'undefined' ? window.innerWidth : 0
                  }, 'H3');
                  return '';
                })()}
                <!-- #endregion -->
                <Card>
                  <CardHeader>
                    <CardTitle class="text-xl mb-4">Read Functions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div class="space-y-4">
                      {#each readFunctions as funcState, i (funcState.functionName + '-' + i)}
                        {@const inputs = getFunctionInputs(abi, funcState.functionName)}
                        <div class="p-4 bg-muted rounded-lg border border-border">
                          <h4 class="font-bold text-lg mb-3">{funcState.functionName}</h4>
                          
                          {#if inputs.length > 0}
                            <div class="grid grid-cols-1 gap-3 mb-3">
                              {#each inputs as input, i}
                                {@const inputId = `read-${funcState.functionName}-${i}`}
                                <div>
                                  <Label for={inputId} class="mb-1">
                                    {input.name || `arg${i}`} ({input.type})
                                  </Label>
                                  <Input
                                    id={inputId}
                                    type="text"
                                    class="w-full contract-ui-input"
                                    placeholder={input.type}
                                    bind:value={funcState.args[i]}
                                  />
                                </div>
                              {/each}
                            </div>
                          {/if}

                          <Button
                            type="button"
                            size="sm"
                            disabled={funcState.isLoading}
                            onclick={() => callReadFunction(funcState)}
                          >
                            {#if funcState.isLoading}
                              <span class="loading loading-spinner loading-xs"></span>
                              Loading...
                            {:else}
                              Read
                            {/if}
                          </Button>

                          {#if funcState.isLoading}
                            <div class="mt-4 p-3 bg-background rounded-lg border border-border">
                              <div class="flex items-center gap-2">
                                <span class="loading loading-spinner loading-xs"></span>
                                <span class="text-sm text-muted-foreground">Loading result...</span>
                              </div>
                            </div>
                          {:else if funcState.result !== undefined}
                            <div class="mt-4 p-3 bg-background rounded-lg border border-border shadow-sm">
                              <div class="flex items-center gap-2 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <strong class="text-sm font-semibold text-foreground">Result:</strong>
                              </div>
                              <div class="bg-muted rounded-md p-3 overflow-x-auto max-h-64 border border-border/50">
                                <pre class="text-xs font-mono text-foreground whitespace-pre-wrap break-words m-0 leading-relaxed">{formatResult(funcState.result)}</pre>
                              </div>
                            </div>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  </CardContent>
                </Card>
              {/if}

              <!-- Write Functions -->
              {#if writeFunctions.length > 0}
                <Card>
                  <CardHeader>
                    <CardTitle class="text-xl mb-4">Write Functions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div class="space-y-4">
                      {#each writeFunctions as funcState, i (funcState.functionName + '-' + i)}
                        {@const inputs = getFunctionInputs(abi, funcState.functionName)}
                        {@const func = (abi as any[]).find((item: any) => item.type === 'function' && item.name === funcState.functionName) as AbiFunction | undefined}
                        {@const isPayable = func?.stateMutability === 'payable'}
                        
                        <div class="p-4 bg-muted rounded-lg border border-border">
                          <h4 class="font-bold text-lg mb-3">{funcState.functionName}</h4>
                          
                          {#if inputs.length > 0}
                            <div class="grid grid-cols-1 gap-3 mb-3">
                              {#each inputs as input, i}
                                {@const inputId = `write-${funcState.functionName}-${i}`}
                                <div>
                                  <Label for={inputId} class="mb-1">
                                    {input.name || `arg${i}`} ({input.type})
                                  </Label>
                                  <Input
                                    id={inputId}
                                    type="text"
                                    class="w-full contract-ui-input"
                                    placeholder={input.type}
                                    bind:value={funcState.args[i]}
                                  />
                                </div>
                              {/each}
                            </div>
                          {/if}

                          {#if isPayable}
                            <div class="mb-3">
                              <Label for="value-{funcState.functionName}" class="mb-1">
                                Value (ETH)
                              </Label>
                              <Input
                                id="value-{funcState.functionName}"
                                type="text"
                                class="w-full"
                                placeholder="0.0"
                                bind:value={funcState.value}
                              />
                            </div>
                          {/if}

                          <Button
                            type="button"
                            size="sm"
                            disabled={funcState.isLoading}
                            onclick={() => callWriteFunction(funcState)}
                          >
                            {#if funcState.isLoading}
                              <span class="loading loading-spinner loading-xs"></span>
                              Sending...
                            {:else}
                              Write
                            {/if}
                          </Button>
                        </div>
                      {/each}
                    </div>
                  </CardContent>
                </Card>
              {/if}
            </div>
          </div>
        </div>
      {/if}
  {/if}
{:else}
  <div class="mt-14">
    <span class="loading loading-spinner loading-lg"></span>
  </div>
{/if}
