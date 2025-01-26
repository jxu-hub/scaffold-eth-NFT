import { useState, useEffect } from "react";
import { Address } from "~~/components/scaffold-eth";
import { useRouter } from "next/navigation";
import { useScaffoldWriteContract, useScaffoldContract } from "~~/hooks/scaffold-eth";
import { NFTMetaData } from "~~/utils/simpleNFT/nftsMetadata";

import { useWalletClient } from "wagmi";

export interface Collectible extends Partial<NFTMetaData> {
  id: number;
  uri: string;
  owner: string;
  price: number;
  seller: string;
  auctionEnded: boolean;
  highestBid: number;
  highestBidder: string;
  startingPrice: number;
  auctionEndTime: number;
}

export const NFTCard = ({ nft, isSeller }: { nft: Collectible, isSeller: boolean }) => {
  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");
  const router = useRouter();
  const [bidAmount, setBidAmount] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isShow, setIsShow] = useState<boolean>(true);

  const { data: walletClient } = useWalletClient();
  console.log("walletClient = ", walletClient);
  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
    walletClient,
  });
  console.log("yourCollectibleContract = ", yourCollectibleContract);
  // Calculate time remaining for auction
  useEffect(() => {
    const endAuction = async () => {
      // await writeContractAsync({
      //   functionName: "endAuction",
      //   args: [BigInt(nft.id.toString())],
      // });
      await yourCollectibleContract?.write.endAuction([BigInt(nft.id.toString())]);
    }
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000); // current timestamp in seconds
      const remainingTime = Number(nft.auctionEndTime) - now;

      if (remainingTime < 0) {

        setIsShow(false);
        clearInterval(interval);
        // 结束拍卖
        endAuction();
        return;
      }

      const hours = String(Math.floor(remainingTime / 3600)).padStart(2, "0");
      const minutes = String(Math.floor((remainingTime % 3600) / 60)).padStart(2, "0");
      const seconds = String(remainingTime % 60).padStart(2, "0");
      setTimeLeft(`${hours} : ${minutes} : ${seconds}`);
    }, 1000); // Update every second

    return () => clearInterval(interval); // Cleanup on component unmount
  }, [nft.auctionEndTime, isShow]);

  // 处理竞标操作
  const handlePlaceBid = async () => {
    try {
      await writeContractAsync({
        functionName: "placeBid",
        args: [BigInt(nft.id.toString())],
        value: BigInt(bidAmount) * BigInt(10 ** 18),
      });
    } catch (err) {
      console.error("Error calling placeBid function", err);
    }
  };

  if (!isShow) return null;

  // 处理图片点击，跳转到详情页面
  const handleImageClick = async () => {
    router.push(`/nftDetail/${nft.id}`);
  };

  return (
    <div className="card card-compact bg-gradient-to-br from-purple-800 via-indigo-900 to-blue-800 shadow-lg rounded-xl overflow-hidden w-[320px] text-white">
      <figure className="relative">
        <img
          src={nft.image}
          alt="NFT Image"
          className="h-60 min-w-full cursor-pointer rounded-t-lg"
          onClick={handleImageClick}
        />
        <figcaption className="glass absolute bottom-4 left-4 p-2 rounded-xl bg-black bg-opacity-60">
          <span className="text-white font-bold"># {nft.id}</span>
        </figcaption>
      </figure>
      <div className="card-body p-4 space-y-3">
        <p className="text-lg font-semibold truncate">{nft.name}</p>
        {/* <div className="flex flex-col items-start">
          <div className="flex flex-wrap gap-2 mt-1">
            {nft.attributes?.map((attr: any, index: any) => (
              <span
                key={index}
                className="badge bg-gradient-to-r from-green-400 to-blue-500 text-white py-1 px-2 text-xs rounded-md"
              >
                {attr.value}
              </span>
            ))}
          </div>
        </div> */}
        <div className="flex flex-col mt-1">
          <p className="my-0 text-sm text-gray-300">描述：{nft.description}</p>
        </div>
        <div className="flex items-center mt-1 space-x-2">
          <span className="text-sm font-semibold text-gray-400">Owner:</span>
          <Address address={nft.seller} />
        </div>
        <div className="flex flex-col mt-1">
          <span className="text-sm font-semibold">起拍价: {BigInt(nft.startingPrice) / BigInt(10 ** 18)+""} ETH</span>
        </div>
        <div className="flex flex-col mt-1">
          <span className="text-sm font-semibold">最高出价: {BigInt(nft.highestBid) / BigInt(10 ** 18)+""} ETH</span>
        </div>
        <div className="flex items-center mt-1 space-x-2">
          <span className="text-sm font-semibold text-gray-400">最高价者:</span>
          <Address address={nft.highestBidder} />
        </div>
        <div className="flex flex-col mt-1">
          <span className="text-sm font-semibold text-yellow-400">截止倒计时: {timeLeft}</span>
        </div>
        <div className="card-actions mt-3 flex justify-between items-center">
          <input
            type="text"
            value={bidAmount}
            onChange={e => setBidAmount(e.target.value)}
            placeholder="输入价格"
            className="input input-bordered bg-gray-800 text-white placeholder-gray-400 w-40 rounded-md"
          />
          <button
            className="btn bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold rounded-md px-4 py-2 hover:scale-105 transition-transform"
            onClick={handlePlaceBid}
          >
            竞标
          </button>
        </div>
      </div>
    </div>
  );

};
