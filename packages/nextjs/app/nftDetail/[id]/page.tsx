"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Address } from "~~/components/scaffold-eth";
import { Collectible } from "../../nftMarketplace/_components/NFTCard";
import { useScaffoldContract, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { getMetadataFromIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import Transfers from "../../transfers/page";
import { useRouter } from "next/navigation";
import { message } from "antd";

const NFTDetailPage = () => {
  const { id } = useParams();
  const [nftData, setNftData] = useState<Collectible | null>(null);
  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");
  const router = useRouter();

  const { data: listedItemsCount } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "getListedItemsCount",
    watch: true,
  });

  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  // 分类映射表，用于将分类英文转换为中文
  const categoryMap: Record<string, string> = {
    collectibles: "收藏品",
    music: "音乐",
    art: "艺术品",
  };

  // 稀有度映射表，将稀有度英文转换为中文
  const rarityMap: Record<string, string> = {
    Common: "普通",
    Rare: "稀有",
    Epic: "史诗",
    Legendary: "传说",
  };

  useEffect(() => {
    const fetchNFTData = async () => {
      try {
        const tokenId = BigInt(id.toString());
        const tokenURI = await yourCollectibleContract?.read.tokenURI([tokenId]);
        const nftMetadata = await getMetadataFromIPFS(tokenURI as string);
        const listNft = await yourCollectibleContract?.read.getNftItem([tokenId]);
        setNftData({
          id: Number(id),
          uri: tokenURI,
          ...nftMetadata,
          ...listNft,
        });
      } catch (error) {
        console.error("Error fetching NFT data:", error);
      }
    };

    fetchNFTData();
  }, [id, listedItemsCount]);

  if (!nftData) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-900 via-blue-800 to-gray-900 min-h-screen text-white">
      <div className="container mx-auto p-8">
        <div className="flex flex-col lg:flex-row gap-10 items-center lg:items-start">
          {/* 左侧图片展示 */}
          <div className="lg:w-1/2 w-full h-[500px] flex justify-center items-center bg-gray-800 rounded-2xl">
            <img
              src={nftData.image}
              alt={nftData.name}
              className="rounded-2xl shadow-lg max-h-full max-w-full object-contain"
            />
            <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-1 rounded-full text-sm uppercase tracking-wider shadow-lg">
              {categoryMap[nftData.category] || "未知分类"}
            </div>
          </div>

          {/* 右侧 NFT 信息展示 */}
          <div className="lg:w-1/2 w-full h-[500px] bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-xl p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h1 className="text-5xl font-extrabold tracking-tight">{nftData.name}</h1>
                {/* 稀有度显示 */}
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    nftData.rarity === "Legendary"
                      ? "bg-yellow-500 text-black"
                      : nftData.rarity === "Epic"
                      ? "bg-purple-500 text-white"
                      : nftData.rarity === "Rare"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-500 text-white"
                  }`}
                >
                  {rarityMap[nftData.rarity] || "未知"}
                </span>
              </div>
              <p className="text-lg text-gray-300 mt-4">描述：{nftData.description}</p>

              <div className="mt-6 space-y-4 text-lg">
                <div className="flex items-center">
                  <span className="font-semibold">当前拥有者：</span>
                  <Address address={nftData.seller} />
                </div>
                <div className="flex items-center">
                  <span className="font-semibold">创建者：</span>
                  <Address address={nftData.creator} />
                </div>
                <div className="flex items-center">
                  <span className="font-semibold">价格：</span>
                  <span className="ml-2 text-green-400 text-xl font-bold">
                    {BigInt(nftData.price) / BigInt(10 ** 18) + ""} ETH
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold">发布时间：</span>
                  <span className="ml-2">
                    {new Date(Number(nftData.listingTime) * 1000).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 购买按钮 */}
            <div className="flex justify-end">
              <button
                className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-lg transform hover:scale-105 transition duration-300"
                onClick={async () => {
                  try {
                    await writeContractAsync({
                      functionName: "purchaseNft",
                      args: [BigInt(nftData.id.toString())],
                      value: BigInt(nftData.price),
                    });
                    message.success("购买成功！");
                    router.push("/myNFTs");
                  } catch (err) {
                    message.error("Error calling purchaseNft function" + err);
                    console.error("Error calling purchaseNft function", err);
                  }
                }}
              >
                购买
              </button>
            </div>
          </div>
        </div>

        {/* 转账历史 */}
        <div className="mt-12 p-8 bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-xl">
          <Transfers tokenId={nftData.id + ""} />
        </div>
      </div>
    </div>
  );
};

export default NFTDetailPage;
