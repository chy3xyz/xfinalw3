<script lang="ts">
  import { browser } from '$app/environment';
  import { get } from 'svelte/store';
  import { getAccount } from '@wagmi/core';
  import { wagmiContextStore } from '$lib/contexts/wagmi.js';
  import { notification } from '$lib/utils/notification.js';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  
  let inviteLink = '';
  let copied = false;
  
  let account: ReturnType<typeof getAccount> | null = null;
  let isConnected = false;
  
  if (browser) {
    try {
      const { config } = get(wagmiContextStore);
      if (config) {
        account = getAccount(config);
        isConnected = account?.isConnected ?? false;
      }
    } catch {
      account = null;
      isConnected = false;
    }
  }
  
  function generateInviteLink() {
    if (!isConnected || !account?.address) {
      notification.warning('请先连接钱包');
      return;
    }
    
    // 示例：生成邀请链接
    const baseUrl = browser ? window.location.origin : '';
    inviteLink = `${baseUrl}/?ref=${account.address.slice(0, 10)}...${account.address.slice(-8)}`;
  }
  
  async function copyInviteLink() {
    if (!inviteLink) {
      notification.warning('请先生成邀请链接');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      copied = true;
      notification.success('邀请链接已复制！');
      setTimeout(() => {
        copied = false;
      }, 2000);
    } catch (error) {
      notification.error('复制失败');
    }
  }
  
  function shareInviteLink() {
    if (!inviteLink) {
      notification.warning('请先生成邀请链接');
      return;
    }
    
    if (navigator.share) {
      navigator.share({
        title: '邀请您使用 xfinalw3',
        text: '快来体验 xfinalw3 Web3 开发框架！',
        url: inviteLink,
      }).catch(() => {
        // 用户取消分享
      });
    } else {
      copyInviteLink();
    }
  }
  
  // 自动生成邀请链接
  if (browser && isConnected && account?.address) {
    generateInviteLink();
  }
</script>

<Card class="bg-card/50 border-[var(--luke-primary)]/20">
  <CardHeader>
    <CardTitle class="text-lg flex items-center gap-2">
      <svg class="w-5 h-5 text-[var(--luke-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      邀请好友
    </CardTitle>
  </CardHeader>
  <CardContent class="space-y-4">
    {#if !isConnected}
      <p class="text-sm text-muted-foreground text-center py-4">
        连接钱包后即可生成邀请链接
      </p>
    {:else}
      <div class="space-y-3">
        <div>
          <label for="invite-link-input" class="text-sm font-medium mb-2 block">邀请链接</label>
          <div class="flex gap-2">
            <Input
              id="invite-link-input"
              type="text"
              value={inviteLink}
              readonly
              class="flex-1 font-mono text-xs bg-muted"
              placeholder="连接钱包后自动生成"
            />
            <Button
              on:click={copyInviteLink}
              variant="outline"
              size="icon"
              class="shrink-0"
            >
              {#if copied}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              {:else}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              {/if}
            </Button>
          </div>
        </div>
        
        <div class="flex gap-2">
          <Button
            on:click={shareInviteLink}
            class="flex-1 bg-[var(--luke-primary)] text-black hover:bg-[var(--luke-primary)]/90"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            分享
          </Button>
          <Button
            on:click={generateInviteLink}
            variant="outline"
            class="flex-1"
          >
            重新生成
          </Button>
        </div>
        
        <p class="text-xs text-muted-foreground text-center">
          分享邀请链接给好友，一起体验 xfinalw3 框架
        </p>
      </div>
    {/if}
  </CardContent>
</Card>
