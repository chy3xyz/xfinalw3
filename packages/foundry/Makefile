.PHONY: build deploy generate-abis get-address account chain compile flatten fork format lint test verify

DEPLOY_SCRIPT ?= script/Deploy.s.sol

# setup wallet for anvil (PUBLIC test key — localhost only; see docs/DEPLOYER_KEYSTORE.md)
setup-anvil-wallet:
	rm -f ~/.foundry/keystores/scaffold-eth-default 2>/dev/null; rm -rf broadcast/Deploy.s.sol/31337
	@# Anvil default key is public; --private-key on argv is acceptable only for this local account.
	cast wallet import --private-key 0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6 --unsafe-password 'localhost' scaffold-eth-default

# Start local chain
chain: setup-anvil-wallet
	anvil

# Start a fork
fork: setup-anvil-wallet
	anvil --fork-url ${FORK_URL} --chain-id 31337

# Deploy the contracts
# Localhost keeps --skip-simulation (anvil). Live networks simulate by default.
# Escape hatch: SKIP_SIMULATION=1 make deploy RPC_URL=...
deploy:
	@if [ ! -f "$(DEPLOY_SCRIPT)" ]; then 		echo "Error: Deploy script '$(DEPLOY_SCRIPT)' not found"; 		exit 1; 	fi
	@echo "🔨 Compiling contracts..."
	@forge build
	@if [ "$(RPC_URL)" = "localhost" ]; then \
		if [ "$(ETH_KEYSTORE_ACCOUNT)" = "scaffold-eth-default" ]; then \
			forge script $(DEPLOY_SCRIPT) --rpc-url localhost --password localhost --broadcast --ffi --skip-simulation --slow; \
		else \
			forge script $(DEPLOY_SCRIPT) --rpc-url localhost --broadcast --ffi --skip-simulation --slow; \
		fi; \
	elif [ "$(SKIP_SIMULATION)" = "1" ]; then \
		forge script $(DEPLOY_SCRIPT) --rpc-url $(RPC_URL) --broadcast --ffi --skip-simulation --slow; \
	else \
		forge script $(DEPLOY_SCRIPT) --rpc-url $(RPC_URL) --broadcast --ffi --slow; \
	fi

# Deploy and generate ABIs
deploy-and-generate-abis: deploy generate-abis 

# Generate TypeScript ABIs
generate-abis:
	bun scripts-js/generateTsAbis.js

# List account
account:
	@bun scripts-js/checkAccountBalance.js

# Get address of a keystore
get-address:
	@cast wallet address --account $(ACCOUNT_NAME)

# Compile contracts
compile:
	forge compile

# Flatten contracts
flatten:
	forge flatten

# Format code (forge only — JS uses Biome at repo root; avoids prettier in node_modules)
format:
	forge fmt

# Lint code
lint:
	forge fmt --check

# Run tests
test:
	forge test

# Verify contracts
verify:
	forge script script/VerifyAll.s.sol --ffi --rpc-url $(RPC_URL)

