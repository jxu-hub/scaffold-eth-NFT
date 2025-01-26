"use client";

import { MyHoldings } from "./_components";
import type { NextPage } from "next";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { Modal, Input, Form, Select, message } from "antd"; // 引入 antd 组件
import { useRouter } from "next/navigation";

const { Option } = Select;

const MyNFTs: NextPage = () => {
  const router = useRouter();
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();
  const [isContractOwner, setIsContractOwner] = useState(false); // 判断是否为合约发布者
  const [tokenUri, setTokenUri] = useState(""); // tokenUri 输入框
  const [mintQuantity, setMintQuantity] = useState(1); // 输入铸造数量
  const [category, setCategory] = useState("collectibles"); // 分类选择
  const [isMintModalOpen, setIsMintModalOpen] = useState(false); // 铸造模态框是否打开
  const [isAirdropModalOpen, setIsAirdropModalOpen] = useState(false); // 空投模态框是否打开
  const [isBlindBoxModalOpen, setIsBlindBoxModalOpen] = useState(false); // 创建盲盒模态框状态
  const [isBatchMintModalOpen, setIsBatchMintModalOpen] = useState(false); // 盲盒批量铸造模态框状态
  const [blindBoxPrice, setBlindBoxPrice] = useState<number>(0); // 新建盲盒的价格
  const [blindBoxId, setBlindBoxId] = useState<number | null>(null); // 盲盒ID
  const [mintUris, setMintUris] = useState<string[]>([]); // 批量铸造的URIs

  // 状态用于存储空投结果
  const [isAirdropSuccess, setIsAirdropSuccess] = useState<boolean | null>(null); // 记录是否验证成功
  const [airdropMessage, setAirdropMessage] = useState<string>(""); // 空投提示信息
  const [claimableTokenId, setClaimableTokenId] = useState<number | null>(null); // 可领取的 Token ID
  const [merkleProof, setMerkleProof] = useState<string[]>([]); // Merkle 证明

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");
  const { data: contractOwner } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "owner",
  });

  useEffect(() => {
    if (connectedAddress && contractOwner) {
      setIsContractOwner(connectedAddress.toLowerCase() === contractOwner.toLowerCase());
    }
  }, [connectedAddress, contractOwner]);

  // 打开模态框
  const openMintModal = () => setIsMintModalOpen(true);
  const closeMintModal = () => setIsMintModalOpen(false);

  const closeAirdropModal = () => setIsAirdropModalOpen(false);

  // 表单提交处理函数
  const handleMintItem = async () => {
    const notificationId = notification.loading("Uploading to IPFS");
    try {
      if (!tokenUri || !category) {
        notification.error("Token URI and category are required");
        return;
      }
      await writeContractAsync({
        functionName: "mintBatch",
        args: [tokenUri, category, BigInt(mintQuantity)],
      });

      notification.remove(notificationId);
      notification.success("Batch NFT minted successfully");
      setIsMintModalOpen(false);
    } catch (error) {
      notification.remove(notificationId);
      notification.error("Failed to mint NFT. Please try again.");
    }
  };

  // 获取空投数据并打开模态框
  const handleOpenAirdropModal = async () => {
    if (!connectedAddress) {
      message.error("未连接钱包，请先连接钱包后再试！");
      return;
    }

    const notificationId = notification.loading("正在获取空投数据...");
    try {
      const response = await fetch("http://localhost:3001/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: connectedAddress, // 当前用户地址
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setClaimableTokenId(data.tokenId || null); // 确保 tokenId 有效
        setMerkleProof(data.proof || []); // 确保 proof 是数组
        setIsAirdropSuccess(true); // 验证成功
        setAirdropMessage(
          `🎉 恭喜！您符合空投要求！\nToken ID: ${data.tokenId}\n您已成功验证空投资格，请点击 "领取" 按钮以领取您的空投。`
        );
        notification.remove(notificationId);
        // notification.success("空投数据获取成功！");
      } else {
        const errorData = await response.json();
        setIsAirdropSuccess(false); // 验证失败
        setAirdropMessage(
          `❌ 很抱歉，您不符合空投要求。\n原因：${errorData.message || "未找到匹配的记录或空投已被领取！"}\n\n建议：请确保您提供的地址正确，并查看最新的空投条件。`
        );
        notification.remove(notificationId);
        // notification.error("获取空投数据失败！");
      }
      setIsAirdropModalOpen(true); // 打开模态框
    } catch (error) {
      console.error("获取空投数据时发生错误：", error);
      setIsAirdropSuccess(false); // 验证失败
      setAirdropMessage(
        `❌ 很抱歉，您不符合空投要求。\n原因：网络问题或服务器暂时不可用，请稍后再试。\n\n建议：检查网络连接并重试，或联系支持团队获取帮助。`
      );
      notification.remove(notificationId);
      // notification.error("获取空投数据失败！");
      setIsAirdropModalOpen(true); // 打开模态框
    }
  };

  // 领取空投
  const handleClaimAirdrop = async () => {
    const notificationId = notification.loading("领取空投中...");
    try {
      const formattedMerkleProof = merkleProof.map((proof) =>
        `0x${proof.replace(/^0x/, "")}`
      ) as `0x${string}`[];
      await writeContractAsync({
        functionName: "claimedNFT",
        args: [formattedMerkleProof, BigInt(claimableTokenId + "")],
      });

      const response = await fetch('http://localhost:3001/api/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenId: claimableTokenId,
          address: connectedAddress,
        }),
      })
      if (response.ok) {
        message.success(
          `🎉 恭喜！您已领取到空投！\nToken ID: ${claimableTokenId}\n请前往您的 NFT 库中查看您的空投 NFT。`
        );
      } else {
        message.error(
          `❌ 很抱歉，您的空投 NFT 领取失败。\n请检查您的 NFT 库是否有足够的 NFT 并检查您的空投条件是否符合要求。`
        );
      }

      notification.remove(notificationId);
      notification.success("空投领取成功！");
      setIsAirdropSuccess(true);

      setIsAirdropModalOpen(false);
    } catch (error) {
      notification.remove(notificationId);
      notification.error("Failed to claim airdrop. Please try again.");
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-900 text-white">
        <div className="container mx-auto pt-10">
          <h1 className="text-5xl font-bold text-center mb-10 drop-shadow-lg">
            My NFTs
          </h1>
          <div className="flex justify-center mb-10 space-x-4">
            {!isConnected || isConnecting ? (
              <RainbowKitCustomConnectButton />
            ) : (
              <>
                {isContractOwner && ( // 只有合约发布者才能看到空投批量铸造按钮
                  <button
                    className="px-6 py-3 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg shadow-lg transform hover:scale-105 transition duration-300"
                    onClick={openMintModal}
                  >
                    空投批量铸造
                  </button>
                )}
                {isContractOwner && (
                  <button
                    className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg shadow-lg transform hover:scale-105 transition duration-300"
                    onClick={() => router.push("/airdrop")}
                  >
                    发布空投
                  </button>
                )}
                {isContractOwner && (
                  <>
                    <button
                      className="px-6 py-3 bg-gradient-to-r from-blue-400 to-indigo-500 text-white rounded-lg shadow-lg transform hover:scale-105 transition duration-300"
                      onClick={() => setIsBlindBoxModalOpen(true)}
                    >
                      创建盲盒
                    </button>
                    <button
                      className="px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-500 text-white rounded-lg shadow-lg transform hover:scale-105 transition duration-300"
                      onClick={() => setIsBatchMintModalOpen(true)}
                    >
                      盲盒批量铸造
                    </button>
                  </>
                )}
                {!isContractOwner && (
                  <button
                  className="px-6 py-3 bg-gradient-to-r from-pink-400 to-purple-500 text-white rounded-lg shadow-lg transform hover:scale-105 transition duration-300"
                  onClick={handleOpenAirdropModal}
                >
                  领取空投
                </button>
                )}
              </>
            )}
          </div>
          {/* 显示用户的 NFT 持有信息 */}
          <MyHoldings />
        </div>
      </div>

      {/* 铸造模态框 */}
      <Modal
        title="Mint Batch NFT"
        open={isMintModalOpen}
        onCancel={closeMintModal}
        onOk={handleMintItem}
        okText="Mint"
        cancelText="Cancel"
      >
        <Form layout="vertical">
          <Form.Item label="Token URI">
            <Input
              value={tokenUri}
              onChange={(e) => setTokenUri(e.target.value)}
              placeholder="Enter Token URI"
            />
          </Form.Item>
          <Form.Item label="Mint Quantity">
            <Input
              type="number"
              value={mintQuantity}
              onChange={(e) => setMintQuantity(Number(e.target.value))}
              min={1}
              placeholder="Enter Quantity"
            />
          </Form.Item>
          <Form.Item label="Category">
            <Select
              value={category}
              onChange={(value: string) => setCategory(value)}
              placeholder="Select NFT Category"
            >
              <Option value="collectibles">收藏品</Option>
              <Option value="music">音乐</Option>
              <Option value="art">艺术品</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 领取空投模态框 */}
      <Modal
        title="领取空投"
        open={isAirdropModalOpen}
        onCancel={closeAirdropModal}
        onOk={handleClaimAirdrop}
        okText="领取"
        cancelText="取消"
        okButtonProps={{
          disabled: !isAirdropSuccess, // 根据验证状态禁用按钮
        }}
      >
        <p
          className={`whitespace-pre-line text-lg ${isAirdropSuccess ? "text-green-600" : "text-red-600"
            }`}
        >
          {airdropMessage}
        </p>
      </Modal>
      <Modal
        title="创建盲盒"
        open={isBlindBoxModalOpen}
        onCancel={() => setIsBlindBoxModalOpen(false)}
        onOk={async () => {
          const notificationId = notification.loading("Creating blind box...");
          try {
            await writeContractAsync({
              functionName: "createBlindBox",
              args: [BigInt(blindBoxPrice) * BigInt(10 ** 18)],
            });
            notification.remove(notificationId);
            notification.success("盲盒创建成功！");
            setIsBlindBoxModalOpen(false);
          } catch (error) {
            notification.remove(notificationId);
            notification.error("盲盒创建失败，请重试！");
          }
        }}
        okText="创建"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item label="盲盒价格 (ETH)">
            <Input
              type="number"
              value={blindBoxPrice}
              onChange={(e) => setBlindBoxPrice(Number(e.target.value))}
              placeholder="输入盲盒价格"
              min={0.01}
            />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="盲盒批量铸造"
        open={isBatchMintModalOpen}
        onCancel={() => setIsBatchMintModalOpen(false)}
        onOk={async () => {
          const notificationId = notification.loading("Batch minting NFTs...");
          try {
            await writeContractAsync({
              functionName: "batchMintToBlindBox",
              args: [BigInt(blindBoxId || 0), mintUris.length, category, mintUris],
            });

            notification.remove(notificationId);
            notification.success("NFT批量铸造成功！");
            setIsBatchMintModalOpen(false);
          } catch (error) {
            notification.remove(notificationId);
            notification.error("NFT批量铸造失败，请重试！");
          }
        }}
        okText="铸造"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item label="盲盒 ID">
            <Input
              type="number"
              value={blindBoxId || ""}
              onChange={(e) => setBlindBoxId(Number(e.target.value))}
              placeholder="输入盲盒 ID"
              min={1}
            />
          </Form.Item>
          <Form.Item label="NFT Cid">
            <Input.TextArea
              value={mintUris}
              onChange={(e) => setMintUris(JSON.parse(e.target.value))}
              placeholder="输入 NFT 的 Cid"
            />
          </Form.Item>
          <Form.Item label="Category">
            <Select
              value={category}
              onChange={(value: string) => setCategory(value)}
              placeholder="Select NFT Category"
            >
              <Option value="collectibles">收藏品</Option>
              <Option value="music">音乐</Option>
              <Option value="art">艺术品</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default MyNFTs;
