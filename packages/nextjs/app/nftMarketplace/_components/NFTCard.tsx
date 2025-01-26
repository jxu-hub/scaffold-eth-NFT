import { useState, useEffect } from "react";
import { Address } from "~~/components/scaffold-eth";
import { useRouter } from "next/navigation";
import { message, Tooltip } from "antd";
import { useAccount } from "wagmi";
import { HeartOutlined, HeartFilled, FlagOutlined } from "@ant-design/icons";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { NFTMetaData } from "~~/utils/simpleNFT/nftsMetadata";
import ReportModal from "./ReportModal";

export interface Collectible extends Partial<NFTMetaData> {
    id: number;
    uri: string;
    owner: string;
    price: number;
    seller: string;
}

export const NFTCard = ({ nft, isSeller }: { nft: Collectible; isSeller: boolean }) => {
    const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");
    const router = useRouter();
    const { address: userAddress } = useAccount();
    const [isFavorited, setIsFavorited] = useState(false);
    const [isReported, setIsReported] = useState(false);
    const [isReportModalVisible, setIsReportModalVisible] = useState(false);

    // 在页面加载时获取当前用户的收藏和举报状态
    useEffect(() => {
        const fetchFavoriteAndReportStatus = async () => {
            try {
                const response = await fetch(`http://localhost:3001/nft/status`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        tokenId: nft.id,
                        userAddress,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setIsFavorited(data.isFavorited || false);
                    setIsReported(data.isReported || false);
                } else {
                    console.error("Failed to fetch NFT status");
                }
            } catch (err) {
                console.error("Error fetching NFT status:", err);
            }
        };

        if (userAddress) {
            fetchFavoriteAndReportStatus();
        }
    }, [userAddress, nft.id]);

    // 处理 NFT 下架
    const handleUnlistNft = async () => {
        try {
            await writeContractAsync({
                functionName: "unlistNft",
                args: [BigInt(nft.id.toString())],
            });

            const response = await fetch("http://localhost:3001/nft/unlistNft", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ tokenId: nft.id }),
            });
            if (response.ok) {
                message.success("NFT 下架成功");
            } else {
                message.error("NFT 下架失败");
            }
        } catch (err) {
            console.error("Error calling unlistNft function", err);
        }
    };

    const handleImageClick = async () => {
        if (nft.id) {
            router.push(`/nftDetail/${nft.id}`);
        }
    };

    const handleReportClick = () => {
        setIsReportModalVisible(true);
    };

    const handleReportSubmit = async (reportData: any) => {
        console.log("举报数据：", reportData);
        try {
            const response = await fetch("http://localhost:3001/nft/reportNft", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    tokenId: nft.id,
                    report: reportData,
                    userAddress
                }),
            });
            if (response.ok) {
                message.success("举报已提交，感谢您的反馈！");
                setIsReported(true);
                setIsReportModalVisible(false);
            } else {
                message.error("NFT 举报失败");
            }
        } catch (err) {
            console.error("Error reporting NFT", err);
            message.error("NFT 举报失败");
        }
    };

    const handleFavoriteClick = async () => {
        if (isFavorited) {
            // 取消收藏
            try {
                const response = await fetch("http://localhost:3001/nft/unLikeNft", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        tokenId: nft.id,
                        userAddress,
                    }),
                });

                if (response.ok) {
                    setIsFavorited(false);
                    message.info("NFT 收藏已取消");
                } else {
                    const errorData = await response.json();
                    message.error(errorData.error || "取消收藏失败");
                }
            } catch (err) {
                console.error(err);
                message.error("取消收藏失败");
            }
        } else {
            // 添加收藏
            try {
                const response = await fetch("http://localhost:3001/nft/likeNft", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        tokenId: nft.id,
                        userAddress,
                    }),
                });

                if (response.ok) {
                    setIsFavorited(true);
                    message.success("NFT 已收藏");
                } else {
                    const errorData = await response.json();
                    message.error(errorData.error || "收藏失败");
                }
            } catch (err) {
                console.error(err);
                message.error("收藏失败");
            }
        }
    };

    return (
        <div className="card card-compact bg-gradient-to-br from-purple-800 via-indigo-900 to-blue-800 shadow-lg rounded-xl overflow-hidden w-[320px] text-white">
            <figure className="relative cursor-pointer" onClick={handleImageClick}>
                <img
                    src={nft.image}
                    alt="NFT Image"
                    className="h-60 w-full object-cover"
                />
                <figcaption className="absolute bottom-3 left-3 bg-black bg-opacity-60 text-white px-3 py-1 rounded-lg text-sm">
                    # {nft.id}
                </figcaption>
            </figure>
            <div className="card-body space-y-4 p-4">
                <div className="flex flex-col items-center text-center">
                    <p className="text-lg font-bold">{nft.name}</p>
                    {nft.attributes && (
                        <div className="flex flex-wrap justify-center gap-2 mt-2">
                            {nft.attributes.map((attr, index) => (
                                <span
                                    key={index}
                                    className="badge badge-outline bg-gradient-to-r from-green-400 to-blue-500 text-white py-1 px-2 rounded-full"
                                >
                                    {attr.value}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="text-sm">
                    <p className="truncate">描述：{nft.description}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Owner:</span>
                    <Address address={nft.seller} />
                </div>
                <div className="text-lg font-bold text-left">
                    Price: {BigInt(nft.price) / BigInt(10 ** 18)+""} ETH
                </div>
                <div className="flex justify-between items-center mt-4">
                    {/* 举报按钮 */}
                    <Tooltip title="举报">
                        <FlagOutlined
                            style={{
                                fontSize: "20px",
                                color: isReported ? "red" : "gray",
                                cursor: "pointer",
                            }}
                            onClick={handleReportClick}
                        />
                    </Tooltip>
    
                    {/* 收藏按钮 */}
                    <Tooltip title={isFavorited ? "取消收藏" : "收藏"}>
                        {isFavorited ? (
                            <HeartFilled
                                style={{ fontSize: "20px", color: "red", cursor: "pointer" }}
                                onClick={handleFavoriteClick}
                            />
                        ) : (
                            <HeartOutlined
                                style={{ fontSize: "20px", color: "gray", cursor: "pointer" }}
                                onClick={handleFavoriteClick}
                            />
                        )}
                    </Tooltip>
    
                    {/* 下架或购买按钮 */}
                    {isSeller ? (
                        <button
                            className="btn bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-2 rounded-lg shadow-md hover:scale-105 transition-transform"
                            onClick={handleUnlistNft}
                        >
                            下架
                        </button>
                    ) : (
                        <button
                            className="btn bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-2 rounded-lg shadow-md hover:scale-105 transition-transform"
                            onClick={async () => {
                                try {
                                    await writeContractAsync({
                                        functionName: "purchaseNft",
                                        args: [BigInt(nft.id.toString())],
                                        value: BigInt(nft.price),
                                    });
                                } catch (err) {
                                    console.error("Error calling purchaseNft function", err);
                                }
                            }}
                        >
                            购买
                        </button>
                    )}
                </div>
            </div>
            {/* 举报模态框 */}
            <ReportModal
                visible={isReportModalVisible}
                onClose={() => setIsReportModalVisible(false)}
                onSubmit={handleReportSubmit}
            />
        </div>
    );
    
};
