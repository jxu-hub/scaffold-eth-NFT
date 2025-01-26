import { useState, useEffect } from "react";
import { Collectible } from "./MyHoldings";
import { Address, AddressInput } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract, useScaffoldContract } from "~~/hooks/scaffold-eth";
import { Modal, Input, message } from "antd";
import { useAccount } from "wagmi";

export const NFTCard = ({ nft }: { nft: Collectible }) => {
  const { address: account } = useAccount();
  const [transferToAddress, setTransferToAddress] = useState("");
  const [isSaleModalVisible, setIsSaleModalVisible] = useState(false);
  const [isAuctionModalVisible, setIsAuctionModalVisible] = useState(false);
  const [price, setPrice] = useState(""); // 输入的价格 (单位为 ETH)
  const [royaltyAmount, setRoyaltyAmount] = useState<string | null>(null); // 版税金额
  const [startingPrice, setStartingPrice] = useState(""); // 起拍价
  const [auctionDurationHours, setAuctionDurationHours] = useState(""); // 拍卖持续时间（小时）
  const [isAuctionActive, setIsAuctionActive] = useState<boolean>(false); // 判断是否正在拍卖

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  useEffect(() => {
    // 判断该NFT是否在拍卖中
    const checkAuctionStatus = async () => {
      if (!yourCollectibleContract) return;
      try {
        const auctionItem = await yourCollectibleContract.read.getAuctionItem([BigInt(nft.id)]);
        setIsAuctionActive(auctionItem.isAuctionActive);
      } catch (err) {
        console.error("Error fetching auction status", err);
      }
    };
    checkAuctionStatus();
  }, [nft.id, yourCollectibleContract]);

  // 处理价格输入变化
  const handlePriceChange = async (value: string) => {
    setPrice(value);
    if (account !== nft.creator && value && parseFloat(value) > 0) {
      calculateRoyalty(value);
    } else {
      setRoyaltyAmount(null); // 清空版税金额
    }
  };

  // 计算版税
  const calculateRoyalty = async (value: string) => {
    const priceInWei = BigInt(value) * BigInt(10 ** 18);
    try {
      const [royaltyReceiver, royaltyAmountInWei] = await yourCollectibleContract.read.royaltyInfo([BigInt(nft.id), priceInWei]);
      console.log(royaltyReceiver, royaltyAmountInWei);
      setRoyaltyAmount((Number(royaltyAmountInWei) / 10 ** 18).toFixed(1)); // 转换为 ETH 格式
    } catch (error) {
      console.error("Failed to fetch royalty info:", error);
      message.error("获取版税信息失败，请重试");
    }
  };

  // 处理 NFT 上架
  const handlePlaceOnSale = async () => {
    try {
      const listingFee = calculateListingFee(BigInt(price) * BigInt(10 ** 18));
      await writeContractAsync({
        functionName: "placeNftOnSale",
        args: [BigInt(nft.id.toString()), BigInt(price) * BigInt(10 ** 18)],
        value: BigInt(listingFee),
      });

      const response = await fetch("http://localhost:3001/nft/listNft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenId: nft.id,
          price: price,
        }),
      });
      if (response.ok) {
        const jsonResponse = await response.json();
        console.log("NFT 上架成功，返回的 tokenId：", jsonResponse.tokenId);
        message.success("上架成功!");
        setIsSaleModalVisible(false);
      } else {
        message.error("上架失败，请重试");
      }
    } catch (err) {
      console.error("Error calling placeNftOnSale function", err);
    }
  };

  // 计算上架费用
  const calculateListingFee = (priceInWei: BigInt) => {
    const listingFeePercentage = 250; // 合约中的上架费率 (2.5%)
    return (parseInt(priceInWei.toString()) * listingFeePercentage) / 10000;
  };

  // 处理拍卖的发起
  const handleStartAuction = async () => {
    try {
      const durationInSeconds = BigInt(Number(auctionDurationHours) * 60 * 60);
      await writeContractAsync({
        functionName: "startAuction",
        args: [BigInt(nft.id.toString()), BigInt(startingPrice) * BigInt(10 ** 18), durationInSeconds],
      });
      setIsAuctionModalVisible(false);
      setIsAuctionActive(true); // 设置拍卖状态为激活
    } catch (err) {
      console.error("Error calling startAuction function", err);
    }
  };

  // 处理拍卖的结束
  const handleEndAuction = async () => {
    try {
      await writeContractAsync({
        functionName: "endAuction",
        args: [BigInt(nft.id.toString())],
      });
      setIsAuctionActive(false); // 拍卖结束后，将拍卖状态设置为非激活
    } catch (err) {
      console.error("Error calling endAuction function", err);
    }
  };

  return (
    <div
      className="card card-compact bg-base-100 shadow-lg w-[300px] shadow-secondary"
      style={{
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(0, 0, 0, 0.3))", // 半透明渐变背景
        borderRadius: "15px", // 圆角
        overflow: "hidden", // 防止内容超出
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.5)", // 添加阴影
        color: "#ffffff", // 文字颜色
      }}
    >
      <figure className="relative">
        {/* eslint-disable-next-line */}
        <img
          src={nft.image}
          alt="NFT Image"
          className="h-60 min-w-full"
          style={{
            objectFit: "cover", // 确保图片覆盖整个区域
            borderBottom: "2px solid rgba(255, 255, 255, 0.5)", // 分隔图片和内容
          }}
        />
        <figcaption
          className="glass absolute bottom-4 left-4 p-4 w-25 rounded-xl"
          style={{
            background: "rgba(0, 0, 0, 0.5)", // 半透明背景
            color: "#fff", // 白色文字
            fontWeight: "bold", // 加粗文字
          }}
        >
          <span># {nft.id}</span>
        </figcaption>
      </figure>
      <div className="card-body space-y-3">
        <div className="flex items-center justify-center">
          <p className="text-xl p-0 m-0 font-semibold">{nft.name}</p>
          <div className="flex flex-wrap space-x-2 mt-1">
            {nft.attributes?.map((attr, index) => (
              <span
                key={index}
                className="badge badge-primary py-3"
                style={{
                  background: "rgba(255, 255, 255, 0.1)", // 半透明背景
                  color: "#fff", // 白色文字
                  borderRadius: "8px", // 圆角
                }}
              >
                {attr.value}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-center mt-1">
          <p className="my-0 text-lg" style={{ color: "#fff" }}>
            {nft.description}
          </p>
        </div>
        <div className="flex space-x-3 mt-1 items-center">
          <span className="text-lg font-semibold" style={{ color: "#FFD700" }}>
            Owner :
          </span>
          <Address address={nft.owner} />
        </div>
        <div className="flex flex-col my-2 space-y-1">
          <span
            className="text-lg font-semibold mb-1"
            style={{ color: "#FFD700" }}
          >
            Transfer To:
          </span>
          <AddressInput
            value={transferToAddress}
            placeholder="receiver address"
            onChange={newValue => setTransferToAddress(newValue)}
          />
        </div>
        <div className="card-actions flex justify-between">
          <button
            className="btn btn-secondary btn-sm px-4 tracking-wide"
            onClick={async () => {
              try {
                await writeContractAsync({
                  functionName: "transferFrom",
                  args: [nft.owner, transferToAddress, BigInt(nft.id.toString())],
                });
              } catch (err) {
                console.error("Error calling transferFrom function", err);
              }
            }}
          >
            Send
          </button>
  
          <button
            className="btn btn-primary btn-sm px-4 tracking-wide"
            onClick={() => setIsSaleModalVisible(true)} // 显示上架模态框
          >
            上架
          </button>
  
          {!isAuctionActive ? (
            <button
              className="btn btn-warning btn-sm px-4 tracking-wide"
              onClick={() => setIsAuctionModalVisible(true)} // 显示拍卖模态框
            >
              发起拍卖
            </button>
          ) : (
            <button
              className="btn btn-danger btn-sm px-4 tracking-wide relative"
              onClick={handleEndAuction} // 结束拍卖
            >
              结束拍卖
            </button>
          )}
        </div>
      </div>
  
      {/* 上架模态框 */}
      <Modal
        title="上架NFT"
        visible={isSaleModalVisible}
        onCancel={() => setIsSaleModalVisible(false)}
        onOk={handlePlaceOnSale}
      >
        <div>
          <label style={{ color: "#333", fontWeight: "bold" }}>Price (ETH):</label>
          <Input
            placeholder="输入上架金额"
            value={price}
            onChange={(e: any) => handlePriceChange(e.target.value)}
          />
          {account !== nft.creator && (
            <>
              <p style={{ color: "red", marginTop: "10px" }}>
                * 提醒: 售出NFT将收取一定比例的版税
              </p>
              {royaltyAmount && (
                <p style={{ color: "blue" }}>
                  版税金额: {royaltyAmount} ETH
                </p>
              )}
            </>
          )}
        </div>
      </Modal>
  
      {/* 发起拍卖模态框 */}
      <Modal
        title="发起NFT拍卖"
        visible={isAuctionModalVisible}
        onCancel={() => setIsAuctionModalVisible(false)}
        onOk={handleStartAuction}
      >
        <div>
          <label style={{ color: "#333", fontWeight: "bold" }}>
            Starting Price (ETH):
          </label>
          <Input
            placeholder="输入起拍价"
            value={startingPrice}
            onChange={(e: any) => setStartingPrice(e.target.value)}
          />
          <label
            style={{
              marginTop: "10px",
              display: "block",
              color: "#333",
              fontWeight: "bold",
            }}
          >
            Duration (hours):
          </label>
          <Input
            placeholder="输入拍卖持续时间（小时）"
            value={auctionDurationHours}
            onChange={(e: any) => setAuctionDurationHours(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
  
};

