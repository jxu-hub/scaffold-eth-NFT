# NFT 项目基于 scaffold-eth

## 项目介绍

这是一个基于 [scaffold-eth](https://github.com/scaffold-eth/scaffold-eth) 构建的 NFT 项目，提供一系列 NFT 相关功能，包括但不限于：

- **铸造 NFT**：用户可以创建新的 NFT。
- **上架 NFT**：将 NFT 列入市场进行出售。
- **购买 NFT**：支持用户从市场购买 NFT。
- **NFT 限时拍卖**：允许用户对 NFT 进行限时拍卖。
- **空投功能**：支持向特定地址空投 NFT。
- **批量铸造 NFT**：一次性批量创建多个 NFT。
- **稀有度**：NFT 具有稀有度属性，影响其市场价值。
- **NFT 盲盒**：提供 NFT 盲盒开箱功能。

---

## 项目启动指南

### 1. 环境依赖

确保已经安装以下环境：

- Node.js (建议使用 v16+)
- Yarn (建议使用 v1.22+)
- Hardhat (项目已内置)
- 数据库（例如 MYSQL，需提前配置）

---

### 2. 启动项目

在本地运行该项目需要打开 **4 个命令行终端**，并分别执行以下命令：

#### **第一步：运行 Hardhat 本地测试链**

```bash
yarn chain
```

如果使用测试链（例如 Sepolia 等）进行部署，需要修改如下配置文件：

1. 修改 `packages/hardhat/hardhat.config.ts` 文件，将 `defaultNetwork` 从 `localhost` 更改为目标测试链，例如：

   ```ts
   defaultNetwork: "Sepolia",  // 或其他测试链
   ```

2. 修改 `packages/nextjs/scaffold.config.ts` 文件，将 `targetNetworks` 中的 `chain.hardhat` 从 `hardhat` 更改为对应测试链，例如：

   ```ts
   targetNetworks: [chain.Sepolia],  // 或其他测试链
   ```

> **注意**：如果使用测试链部署，则无需运行 `yarn chain`。

---

#### **第二步：部署智能合约**

```bash
yarn deploy
```

该命令会将合约部署到指定网络，并自动更新前端应用的 ABI 文件。

---

#### **第三步：启动数据库服务**

```bash
yarn server
```

此命令用于连接数据库，确保后端数据的存储与管理。

---

#### **第四步：运行前端项目**

```bash
yarn start
```

该命令会启动前端应用，默认在 `http://localhost:3000` 访问。

---

### 3. 目录结构

```
.
├── packages
│   ├── hardhat         # 智能合约开发与部署
│   ├── nextjs          # 前端应用 (React + Next.js)
│   └── server          # 后端数据库服务
├── README.md           # 项目说明文档
└── yarn.lock           # 依赖管理
```

---

### 4. 部署到测试链

如果希望将项目部署到测试链，执行以下步骤：


1. 在终端执行部署命令：

   ```bash
   yarn deploy --network goerli
   ```

2. 更新前端 `scaffold.config.ts` 文件，并重新启动前端应用：

   ```bash
   yarn start
   ```

---

### 5. 常见问题

#### 问题 1：无法连接到 Hardhat 本地链？

**解决方案**：

- 确保 `yarn chain` 已正确运行。

#### 问题 2：前端无法正常展示 NFT 数据？

**解决方案**：

- 确保合约已正确部署，并检查前端是否使用了最新的 ABI 文件。

#### 问题 3：遇到 `out of gas` 错误？

**解决方案**：

- 尝试增加部署时的 gas 限制，例如在 `yarn deploy` 时使用 `--gas-limit` 参数。


### 8. 许可证

本项目基于 MIT 许可证开源，详细内容请查阅 `LICENSE` 文件。

---

感谢您的关注和支持！🎉

