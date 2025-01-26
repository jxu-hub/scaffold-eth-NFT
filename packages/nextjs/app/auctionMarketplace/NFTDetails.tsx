// pages/nft/[id].tsx
"use client";
// import { useRouter } from "next/navigation";
import { useRouter } from "next/router";
import Transfers from "../transfers/page";

const NFTDetails = () => {
  const router = useRouter();
  const { id: tokenId } = router.query; // 从 URL 参数获取 tokenId

  if (!tokenId) {
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="text-red-500">Invalid Token ID</span>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center flex-col">
      <h1 className="text-4xl font-bold my-4">NFT Details for Token ID: {tokenId}</h1>
      <Transfers tokenId={tokenId as string} /> {/* 传递 tokenId 到 Transfers 组件 */}
    </div>
  );
};

export default NFTDetails;
