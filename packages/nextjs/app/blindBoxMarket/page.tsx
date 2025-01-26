"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract, useScaffoldContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { getMetadataFromIPFS } from "~~/utils/simpleNFT/ipfs-fetch";

const BlindBoxMarketplace = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [blindBoxes, setBlindBoxes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpening, setIsOpening] = useState(false); // 控制开盲盒动画状态
  const [openedNFT, setOpenedNFT] = useState<any>(null); // 存储开盲盒后获得的NFT信息
  const [showAnimation, setShowAnimation] = useState(false); // 控制动画状态

  const { data: allBlindBoxes } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "getAllBlindBoxes",
    watch: true,
  });

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");
  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  useEffect(() => {
    if (!allBlindBoxes) return;

    setIsLoading(true);

    try {
      const boxes = allBlindBoxes.map((box: any, index: number) => ({
        id: index + 1,
        price: box.price, // 转换为 ETH
        remainingNFTs: parseInt(box.nftPool.length.toString()),
        isActive: box.isActive,
      }));

      setBlindBoxes(boxes);
    } catch (error) {
      console.error("Error processing blind boxes:", error);
      notification.error("加载盲盒信息失败，请重试！");
    }

    setIsLoading(false);
  }, [allBlindBoxes]);

  const rarityColors = {
    Legendary: { text: "传说", color: "bg-yellow-500 text-black" },
    Epic: { text: "史诗", color: "bg-purple-500 text-white" },
    Rare: { text: "稀有", color: "bg-blue-500 text-white" },
    Common: { text: "普通", color: "bg-gray-500 text-white" },
  };

  const handlePurchase = async (boxId: number, price: string) => {
    try {
      setIsOpening(true); // 开启动画
      await writeContractAsync({
        functionName: "purchaseBlindBox",
        args: [BigInt(boxId.toString())],
        value: BigInt(price),
      });
      const tokenId = await yourCollectibleContract?.read.getTokenId();
      notification.success("盲盒购买交易发送成功，等待区块确认... 🎉");
      // 获取 NFT 信息
      const tokenURI = await yourCollectibleContract?.read.tokenURI([BigInt(tokenId + "")]);
      const NftItem = await yourCollectibleContract?.read.getNftItem([BigInt(tokenId + "")]);
      const nftMetadata = await getMetadataFromIPFS(tokenURI as string);

      setTimeout(() => {
        setOpenedNFT({
          id: parseInt(tokenId + ""),
          uri: tokenURI,
          owner: connectedAddress,
          ...NftItem,
          ...nftMetadata,
        });
        setShowAnimation(true); // 触发动画
        setTimeout(() => setShowAnimation(false), 3000); // 动画结束后移除状态
        setIsOpening(false); // 关闭动画
      }, 3000); // 模拟动画持续时间 3 秒
    } catch (error) {
      console.error(error);
      setIsOpening(false);
      notification.error("盲盒购买失败，请重试！");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white relative">
      {/* 背景蒙尘效果 */}
      {isOpening && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="text-center animate-pulse">
            <div className="w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-inner">
              <span className="text-6xl font-bold text-white">🎁</span>
            </div>
            <p className="mt-4 text-2xl font-bold text-white">盲盒开启中...</p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
            盲盒市场 🎁
          </h1>
          <p className="mt-2 text-lg text-gray-300">
            探索神秘的NFT盲盒，解锁独一无二的NFT！快来试试你的运气吧~
          </p>
          {!isConnected && <RainbowKitCustomConnectButton />}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center mt-10">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {blindBoxes.map((box) => (
              <div
                key={box.id}
                className={`relative bg-gradient-to-br from-purple-700 to-purple-900 p-6 rounded-lg shadow-lg transform hover:scale-105 transition-transform ${box.isActive ? "" : "opacity-50"
                  }`}
              >
                <div className="absolute top-0 right-0 m-2 bg-black bg-opacity-40 px-3 py-1 rounded-lg text-sm font-semibold">
                  盲盒 #{box.id}
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-inner">
                    <span className="text-5xl font-bold text-white">🎁</span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white">价格: {Number(box.price) / 10 ** 18 + ""} ETH</h3>
                  <p className="text-sm text-gray-300">剩余NFT: {box.remainingNFTs}</p>
                </div>
                {box.isActive ? (
                  <button
                    className="w-full mt-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-lg shadow-lg hover:scale-105 transition-transform"
                    onClick={() => handlePurchase(box.id, box.price)}
                  >
                    购买盲盒
                  </button>
                ) : (
                  <p className="mt-4 text-center text-gray-400">已下架</p>
                )}
              </div>
            ))}
          </div>
        )}
        {/* 展示开盲盒的 NFT */}
        {openedNFT && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50">
            <div className="text-center">
              <div
                className={`relative w-64 h-64 mx-auto bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-lg flex items-center justify-center ${showAnimation ? "animate-fast-spin" : "animate-glow"
                  }`}
              >
                <div
                  className={`absolute inset-0 rounded-full ${showAnimation ? "" : "animate-light-glow"
                    }`}
                  style={{
                    background: "radial-gradient(circle, rgba(255,255,255,0.2), rgba(255,255,255,0))",
                  }}
                ></div>
                <img
                  src={openedNFT.image || "https://via.placeholder.com/300"}
                  alt={openedNFT.name || "NFT"}
                  className="relative w-full h-full object-cover rounded-lg"
                />
              </div>
              <h3 className="mt-4 text-3xl font-bold text-white">{openedNFT.name || `NFT #${openedNFT.id}`}</h3>
              <p
                className={`px-4 py-2 rounded-full text-sm font-semibold ${rarityColors[openedNFT.rarity]?.color || "bg-gray-500 text-white"
                  }`}
              >
                {rarityColors[openedNFT.rarity]?.text || "未知"}
              </p>
              <button
                className="mt-4 px-6 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold rounded-lg shadow-lg hover:scale-105 transition-transform"
                onClick={() => setOpenedNFT(null)}
              >
                确认
              </button>
            </div>
          </div>
        )}
      </div>
{/* 动画样式 */}
<style jsx>{`
  @keyframes fastSpin {
    0% {
      transform: scale(0.5) rotateY(0deg);
    }
    50% {
      transform: scale(1.2) rotateY(360deg);
    }
    100% {
      transform: scale(1) rotateY(360deg);
    }
  }

  @keyframes glow {
    0% {
      box-shadow: 0 0 40px rgba(255, 255, 255, 0.4), 0 0 80px rgba(255, 0, 255, 0.6),
        0 0 100px rgba(0, 0, 255, 0.8), 0 0 120px rgba(0, 255, 0, 0.7),
        0 0 140px rgba(255, 255, 0, 0.6);
    }
    50% {
      box-shadow: 0 0 80px rgba(255, 255, 255, 0.6), 0 0 160px rgba(255, 0, 255, 0.8),
        0 0 200px rgba(0, 0, 255, 1), 0 0 240px rgba(0, 255, 0, 0.9),
        0 0 280px rgba(255, 255, 0, 0.8);
    }
    100% {
      box-shadow: 0 0 40px rgba(255, 255, 255, 0.4), 0 0 80px rgba(255, 0, 255, 0.6),
        0 0 100px rgba(0, 0, 255, 0.8), 0 0 120px rgba(0, 255, 0, 0.7),
        0 0 140px rgba(255, 255, 0, 0.6);
    }
  }

  @keyframes lightGlow {
    0% {
      transform: scale(1);
      opacity: 0.8;
      filter: blur(6px);
    }
    50% {
      transform: scale(1.5);
      opacity: 1;
      filter: blur(12px);
    }
    100% {
      transform: scale(1);
      opacity: 0.8;
      filter: blur(6px);
    }
  }

  .animate-fast-spin {
    animation: fastSpin 3s ease-in-out forwards; /* 加快旋转速度 */
  }

  .animate-glow {
    animation: glow 1s infinite ease-in-out; /* 光芒动画立即开始 */
  }

  .animate-light-glow {
    animation: lightGlow 1s infinite ease-in-out; /* 光芒扩散动画立即开始 */
  }
`}</style>


    </div>
  );
};

export default BlindBoxMarketplace;
