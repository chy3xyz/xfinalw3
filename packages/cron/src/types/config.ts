export interface ContractConfig {
  privateKey: `0x${string}`;
  rpcUrl: string;
  chainId: number;
}

export interface CronJobConfig {
  schedule: string; // cron 表达式
  enabled: boolean;
  name: string;
}

