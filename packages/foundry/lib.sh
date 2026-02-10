#!/bin/bash

# 安装 Foundry 依赖包的脚本
set -e

echo "🔍 正在安装forge依赖..."

forge install \
  foundry-rs/forge-std@v1.12.0 \
  OpenZeppelin/openzeppelin-contracts@v5.5.0 \
  GNSPS/solidity-bytes-utils@v0.8.4

echo "✅ forge依赖已全部安装完成"
