"use client";

import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { NFTCard, Collectible } from "./_components/NFTCard";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { getMetadataFromIPFS } from "~~/utils/simpleNFT/ipfs-fetch";

const AuctionMarketplace: NextPage = () => {
  const { address: connectedAccount, isConnected } = useAccount();
  const [allAuctionedNfts, setAllAuctionedNfts] = useState<Collectible[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<Collectible[]>([]);
  const [auctionLoading, setAuctionLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { data: auctionedItemsCount } = useScaffoldReadContract({
    contractName: "YourCollectible",
    functionName: "getAllAuctionedNfts",
    watch: true,
  });
  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  useEffect(() => {
    if (auctionedItemsCount === undefined || yourCollectibleContract === undefined || connectedAccount === undefined)
      return;

    setAuctionLoading(true);
    const updateAllAuctionedCollectibles = async (): Promise<void> => {
      const getAllAuctionedItems = await yourCollectibleContract.read.getAllAuctionedNfts();
      const auctionedUpdate: Collectible[] = [];

      for (let tokenIndex = 0; tokenIndex < getAllAuctionedItems.length; tokenIndex++) {
        try {
          const tokenId = getAllAuctionedItems[tokenIndex].tokenId;
          const tokenURI = await yourCollectibleContract.read.tokenURI([tokenId]);
          const nftMetadata = await getMetadataFromIPFS(tokenURI as string);

          auctionedUpdate.push({
            id: parseInt(tokenId.toString()),
            uri: tokenURI as string,
            owner: getAllAuctionedItems[tokenIndex].owner,
            ...nftMetadata,
            ...getAllAuctionedItems[tokenIndex],
          });
        } catch (e) {
          notification.error("Error fetching auctioned collectibles");
          console.log(e);
        }
      }

      auctionedUpdate.sort((a, b) => a.id - b.id);
      setAllAuctionedNfts(auctionedUpdate);
      setFilteredNfts(auctionedUpdate);
      setAuctionLoading(false);
    };

    updateAllAuctionedCollectibles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedAccount, auctionedItemsCount]);

  // Apply filters
  const applyFilters = () => {
    let filtered = allAuctionedNfts;
    if (categoryFilter) {
      filtered = filtered.filter(nft => nft.category === categoryFilter);
    }
    if (priceFilter !== null) {
      const maxPriceInWei = BigInt(priceFilter * 10 ** 18);
      filtered = filtered.filter(nft => BigInt(nft.startingPrice) <= maxPriceInWei);
    }
    setFilteredNfts(filtered);
    setCurrentPage(1);
  };

  // Reset filters
  const resetFilters = () => {
    setCategoryFilter("");
    setPriceFilter(null);
    setFilteredNfts(allAuctionedNfts);
    setCurrentPage(1);
  };

  // Pagination
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

  if (auctionLoading) {
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-800 text-white">
      <div className="container mx-auto">
        <div className="flex flex-wrap justify-center gap-6 my-4">
          <select
            className="select select-bordered bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 text-white font-bold rounded-lg shadow-lg focus:ring-4 focus:ring-blue-300"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              color: "white",
              backgroundColor: "rgba(0,0,0,0.6)",
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
            <div className="text-2xl text-primary-content">No NFTs found for auction</div>
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
            className={`btn text-lg font-bold ${
              currentPage === 1
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
              className={`btn text-lg font-bold rounded-lg shadow-lg ${
                currentPage === i + 1
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                  : "bg-gray-700 text-white hover:scale-105"
              }`}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className={`btn text-lg font-bold ${
              currentPage === Math.ceil(filteredNfts.length / itemsPerPage)
                ? "opacity-50 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-400 to-blue-500 hover:scale-105"
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

export default AuctionMarketplace;
