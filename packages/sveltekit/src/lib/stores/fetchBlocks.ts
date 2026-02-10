import { writable, get } from 'svelte/store';
import { createTestClient, publicActions, walletActions, webSocket, type Block, type TransactionReceipt, type Transaction } from 'viem';
import { hardhat } from 'viem/chains';
import { browser } from '$app/environment';

const BLOCKS_PER_PAGE = 20;

// Only create client in browser to avoid SSR errors
let testClient: ReturnType<typeof createTestClient> | null = null;

export function getTestClient() {
  if (!browser) {
    throw new Error('testClient can only be used in browser');
  }
  if (!testClient) {
    testClient = createTestClient({
      chain: hardhat,
      mode: 'hardhat',
      transport: webSocket('ws://127.0.0.1:8545'),
    })
      .extend(publicActions)
      .extend(walletActions);
  }
  return testClient;
}

export function createFetchBlocksStore() {
  const blocks = writable<Block[]>([]);
  const transactionReceipts = writable<{ [key: string]: TransactionReceipt }>({});
  const currentPage = writable(0);
  const totalBlocks = writable(0n);
  const error = writable<Error | null>(null);

  const fetchBlocks = async () => {
    if (!browser) return;
    error.set(null);

    try {
      const client = getTestClient();
      const blockNumber = await client.getBlockNumber();
      totalBlocks.set(blockNumber);

      const $currentPage = get(currentPage);
      const startingBlock = blockNumber - BigInt($currentPage * BLOCKS_PER_PAGE);
      const blockNumbersToFetch = Array.from(
        { length: Number(BLOCKS_PER_PAGE < startingBlock + 1n ? BLOCKS_PER_PAGE : startingBlock + 1n) },
        (_, i) => startingBlock - BigInt(i),
      );

      const blocksWithTransactions = blockNumbersToFetch.map(async (blockNum) => {
        try {
          return client.getBlock({ blockNumber: blockNum, includeTransactions: true });
        } catch (err) {
          error.set(err instanceof Error ? err : new Error('An error occurred.'));
          throw err;
        }
      });
      const fetchedBlocks = await Promise.all(blocksWithTransactions);

      const txReceipts = await Promise.all(
        fetchedBlocks.flatMap((block) =>
          block.transactions.map(async (tx) => {
            try {
              const receipt = await client.getTransactionReceipt({ hash: (tx as Transaction).hash });
              return { [(tx as Transaction).hash]: receipt };
            } catch (err) {
              error.set(err instanceof Error ? err : new Error('An error occurred.'));
              throw err;
            }
          }),
        ),
      );

      blocks.set(fetchedBlocks);
      transactionReceipts.update((prevReceipts) => ({ ...prevReceipts, ...Object.assign({}, ...txReceipts) }));
    } catch (err) {
      error.set(err instanceof Error ? err : new Error('An error occurred.'));
    }
  };

  // Watch for new blocks (only in browser)
  let unwatch: (() => void) | undefined = undefined;
  
  if (browser) {
    const client = getTestClient();
    unwatch = client.watchBlocks({
      onBlock: async (newBlock: any) => {
        try {
          const $currentPage = get(currentPage);
          if ($currentPage === 0) {
            // Check if transactions are already objects (viem behavior with includeTransactions: true)
            if (newBlock.transactions.length > 0 && typeof newBlock.transactions[0] === 'string') {
              const transactionsDetails = await Promise.all(
                newBlock.transactions.map((txHash: string) => client.getTransaction({ hash: txHash as `0x${string}` })),
              );
              newBlock.transactions = transactionsDetails;
            }

            const receipts = await Promise.all(
              newBlock.transactions.map(async (tx: Transaction) => {
                try {
                  const receipt = await client.getTransactionReceipt({ hash: tx.hash });
                  return { [tx.hash]: receipt };
                } catch (err) {
                  error.set(err instanceof Error ? err : new Error('An error occurred fetching receipt.'));
                  throw err;
                }
              }),
            );

            blocks.update((prevBlocks) => [newBlock, ...prevBlocks.slice(0, BLOCKS_PER_PAGE - 1)]);
            transactionReceipts.update((prevReceipts) => ({ ...prevReceipts, ...Object.assign({}, ...receipts) }));
          }
          if (newBlock.number) {
            totalBlocks.set(newBlock.number);
          }
        } catch (err) {
          error.set(err instanceof Error ? err : new Error('An error occurred.'));
        }
      },
      includeTransactions: true,
    });
  }

  return {
    blocks: { subscribe: blocks.subscribe },
    transactionReceipts: { subscribe: transactionReceipts.subscribe },
    currentPage: { subscribe: currentPage.subscribe, set: currentPage.set },
    totalBlocks: { subscribe: totalBlocks.subscribe },
    error: { subscribe: error.subscribe },
    fetchBlocks,
    unwatch,
  };
}
