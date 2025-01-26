"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { formatEther } from "viem";
import { format } from "date-fns";

type TransfersProps = {
  tokenId?: string;
};

const Transfers: NextPage<TransfersProps> = ({ tokenId }) => {
  const { data: purchaseEvents, isLoading, error } = useScaffoldEventHistory({
    contractName: "YourCollectible",
    eventName: "NftPurchased",
    fromBlock: 0n,
    filters: {
      tokenId: BigInt(tokenId + ""),
    },
    blockData: true,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  if (isLoading)
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-xl">正在加载中...</span>
      </div>
    );

  if (error) {
    console.error("Error fetching events:", error);
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="text-red-500">出错了</span>
      </div>
    );
  }

  // 分页逻辑
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEvents = purchaseEvents?.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = purchaseEvents ? Math.ceil(purchaseEvents.length / itemsPerPage) : 1;

  return (
    <div className="flex flex-col pt-10 px-5">
      <div className="mb-6">
        <h1 className="text-center text-4xl font-bold text-white">
          交易历史记录
        </h1>
      </div>
      <div className="space-y-4">
        {!purchaseEvents || purchaseEvents.length === 0 ? (
          <div className="text-center text-gray-300">
            没有找到交易记录
          </div>
        ) : (
          paginatedEvents?.map((event, index) => {
            const tokenId = event.args.tokenId?.toString() ?? "N/A";
            const buyer = event.args.buyer ?? "N/A";
            const seller = event.args.seller ?? "N/A";
            const priceInWei = event.args.price ?? 0n;
            const priceInEth = formatEther(priceInWei);
            const blockTimestamp = event.block?.timestamp;
            const timestamp = blockTimestamp
              ? format(new Date(Number(blockTimestamp) * 1000), "yyyy-MM-dd HH:mm:ss")
              : "N/A";

            return (
              <div
                key={index}
                className="flex flex-col md:flex-row items-center md:justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-700 via-blue-700 to-gray-800 shadow-lg"
              >
                <div className="text-sm text-white font-semibold">
                  <span className="block text-xs text-gray-300">Token ID</span>
                  {tokenId}
                </div>
                <div className="text-sm text-white">
                  <span className="block text-xs text-gray-300">买家</span>
                  <Address address={buyer as `0x${string}` | undefined} />
                </div>
                <div className="text-sm text-white">
                  <span className="block text-xs text-gray-300">卖家</span>
                  <Address address={seller as `0x${string}` | undefined} />
                </div>
                <div className="text-sm text-green-400 font-bold">
                  <span className="block text-xs text-gray-300">价格</span>
                  {priceInEth} ETH
                </div>
                <div className="text-sm text-white">
                  <span className="block text-xs text-gray-300">时间</span>
                  {timestamp}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 分页导航 */}
      <div className="flex justify-center mt-6 space-x-4">
        <button
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg shadow"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          上一页
        </button>
        <span className="text-white">
          第 {currentPage} 页 / 共 {totalPages} 页
        </span>
        <button
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg shadow"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          下一页
        </button>
      </div>
    </div>
  );
};

export default Transfers;
