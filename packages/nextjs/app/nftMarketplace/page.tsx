"use client";
import React, { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { NFTCard, Collectible } from "./_components/NFTCard";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { getMetadataFromIPFS } from "~~/utils/simpleNFT/ipfs-fetch";

const NFTMarketplace: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [allListedNfts, setAllListedNfts] = useState<Collectible[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<Collectible[]>([]);
  const [allCollectiblesLoading, setAllCollectiblesLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const { data: listedItemsCount } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "getListedItemsCount",
    watch: true,
  });
  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  useEffect(() => {
    if (!listedItemsCount || !yourCollectibleContract || !connectedAddress) return;

    setAllCollectiblesLoading(true);
    const updateAllCollectibles = async (): Promise<void> => {
      const getAllListedNfts = await yourCollectibleContract.read.getAllListedNfts();
      const collectibleUpdate: Collectible[] = [];

      for (let tokenIndex = 0; tokenIndex < getAllListedNfts.length; tokenIndex++) {
        try {
          const tokenId = getAllListedNfts[tokenIndex].tokenId;
          const tokenURI = await yourCollectibleContract.read.tokenURI([tokenId]);
          const nftMetadata = await getMetadataFromIPFS(tokenURI as string);

          collectibleUpdate.push({
            id: parseInt(tokenId.toString()),
            uri: tokenURI as string,
            owner: connectedAddress,
            ...nftMetadata,
            ...getAllListedNfts[tokenIndex],
          });
        } catch (e) {
          notification.error("Error fetching all collectibles");
          console.log(e);
        }
      }

      collectibleUpdate.sort((a, b) => a.id - b.id);
      setAllListedNfts(collectibleUpdate);
      setFilteredNfts(collectibleUpdate);
      setAllCollectiblesLoading(false);
    };

    updateAllCollectibles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedAddress, listedItemsCount]);

  const applyFilters = () => {
    let filtered = allListedNfts;
    if (categoryFilter) {
      filtered = filtered.filter((nft) => nft.category === categoryFilter);
    }
    if (priceFilter !== null) {
      // Convert ETH to wei for comparison
      const maxPriceInWei = BigInt(priceFilter * 10 ** 18);
      filtered = filtered.filter((nft) => BigInt(nft.price) <= maxPriceInWei);
    }
    setFilteredNfts(filtered);
    setCurrentPage(1); // Reset to the first page
  };

  const resetFilters = () => {
    setCategoryFilter("");
    setPriceFilter(null);
    setFilteredNfts(allListedNfts);
    setCurrentPage(1); // Reset to the first page
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    const totalPages = Math.ceil(filteredNfts.length / itemsPerPage);
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const paginatedNfts = filteredNfts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (allCollectiblesLoading) {
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-800 text-white">
      <div className="container mx-auto">
        <div className="flex justify-center">
          {!isConnected && <RainbowKitCustomConnectButton />}
        </div>
        <div className="flex flex-wrap justify-center gap-6 my-4">
          <select
            className="select select-bordered bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 text-white font-bold rounded-lg shadow-lg focus:ring-4 focus:ring-blue-300"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              color: "white", // 选项文字颜色
              backgroundColor: "rgba(0,0,0,0.6)", // 背景色透明
            }}
          >
            <option value="" style={{ backgroundColor: "#2E2E3E", color: "#fff" }}>
              所有分类
            </option>
            <option value="music" style={{ backgroundColor: "#2E2E3E", color: "#fff" }}>
              音乐
            </option>
            <option value="collectibles" style={{ backgroundColor: "#2E2E3E", color: "#fff" }}>
              收藏品
            </option>
            <option value="art" style={{ backgroundColor: "#2E2E3E", color: "#fff" }}>
              艺术品
            </option>
          </select>

          <input
            type="number"
            placeholder="Max Price (ETH)"
            className="input input-bordered bg-gray-900 text-white placeholder-gray-500 rounded-lg shadow-lg focus:ring-4 focus:ring-blue-300"
            value={priceFilter || ""}
            onChange={(e) => setPriceFilter(Number(e.target.value))}
          />
          <button
            className="btn bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-lg shadow-lg hover:scale-105 transition-transform focus:ring-4 focus:ring-indigo-400"
            onClick={applyFilters}
          >
            筛选
          </button>
          <button
            className="btn bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-lg shadow-lg hover:scale-105 transition-transform focus:ring-4 focus:ring-pink-400"
            onClick={resetFilters}
          >
            重置
          </button>
        </div>

        {filteredNfts.length === 0 ? (
          <div className="flex justify-center items-center mt-10">
            <div className="text-2xl text-white">No NFTs found</div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 my-8 px-5 justify-center">
            {paginatedNfts.map((item) => (
              <NFTCard nft={item} isSeller={item.owner === item.seller} key={item.id} />
            ))}
          </div>
        )}

        <div className="flex justify-center items-center gap-4 my-4">
          <button
            className={`btn text-lg font-bold ${currentPage === 1
                ? "opacity-50 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-blue-700 text-white hover:scale-105"
              }`}
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            上一页
          </button>
          {Array.from({ length: Math.ceil(filteredNfts.length / itemsPerPage) }, (_, i) => (
            <button
              key={i}
              className={`btn text-lg font-bold rounded-lg shadow-lg ${currentPage === i + 1
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                  : "bg-gray-700 text-white hover:scale-105"
                }`}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className={`btn text-lg font-bold ${currentPage === Math.ceil(filteredNfts.length / itemsPerPage)
                ? "opacity-50 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-blue-700 text-white hover:scale-105"
              }`}
            onClick={handleNextPage}
            disabled={currentPage === Math.ceil(filteredNfts.length / itemsPerPage)}
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );


};

export default NFTMarketplace;
