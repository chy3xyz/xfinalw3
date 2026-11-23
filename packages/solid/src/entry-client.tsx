import { StartClient, mount } from "@solidjs/start/client"
import { setupWalletListeners } from "~/lib/web3/wallet"

mount(() => <StartClient />, document.getElementById("app")!)
setupWalletListeners()
