"use client";

import type { NextPage } from "next";
import { useState } from "react";
import { useAccount } from "wagmi";
import { Upload, Input, Button, message, Card, Spin, Select, Radio } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract, useScaffoldContract } from "~~/hooks/scaffold-eth";
import axios from "axios";
import { useRouter } from "next/navigation";
const { Dragger } = Upload;
const { Option } = Select;

const MyNFTs: NextPage = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();
  const [isMinting, setIsMinting] = useState(false); // 控制铸造状态
  const [imageUrl, setImageUrl] = useState<string | null>(null); // 图片预览的URL
  const [ipfsHash, setIpfsHash] = useState<string | null>(null); // IPFS hash
  const [inputURI, setInputURI] = useState(""); // 用户输入的URI
  const [name, setName] = useState(""); // NFT 名称
  const [category, setCategory] = useState<string>("");  // 添加 category 状态
  const [description, setDescription] = useState(""); // NFT 描述
  const [royalty, setRoyalty] = useState(""); // 版税
  const [uploading, setUploading] = useState(false); // 控制上传状态
  const router = useRouter(); // 用于跳转页面

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");
  const { data: yourCollectibleContract } = useScaffoldContract({
    contractName: "YourCollectible",
  });

  // 处理图片上传到Pinata
  const uploadToPinata = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const metadata = JSON.stringify({
      name: file.name,
    });
    formData.append("pinataMetadata", metadata);

    const options = JSON.stringify({
      cidVersion: 1,
    });
    formData.append("pinataOptions", options);

    try {
      const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT;

      const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${pinataJWT}`,
        },
      });

      const ipfsHash = response.data.IpfsHash;
      setImageUrl(URL.createObjectURL(file)); // 在前端回显图片
      // setIpfsHash(`https://apricot-fantastic-ferret-743.mypinata.cloud/ipfs/${ipfsHash}`); // 保存并显示IPFS hash
      setIpfsHash(ipfsHash); // 保存并显示IPFS hash
      setInputURI(ipfsHash); // 自动填充到URI输入框
      message.success("图片上传成功！");
    } catch (error) {
      console.error(error);
      message.error("图片上传失败，请重试");
    } finally {
      setUploading(false);
    }
  };

  // 上传 JSON 到 Pinata
  const uploadMetadataToPinata = async () => {
    const metadata = {
      description,
      image: `https://apricot-fantastic-ferret-743.mypinata.cloud/ipfs/${ipfsHash}`,
      name,
    };

    const formData = new FormData();
    formData.append("file", new Blob([JSON.stringify(metadata)], { type: "application/json" }));

    const metadataOptions = JSON.stringify({
      name: `${name}-metadata.json`,
    });

    formData.append("pinataMetadata", metadataOptions);

    try {
      const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT;

      const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${pinataJWT}`,
        },
      });

      const ipfsHash = response.data.IpfsHash;
      const ipfsUrl = `${ipfsHash}`;
      message.success("Metadata 上传成功！");
      return ipfsUrl;
    } catch (error) {
      console.error(error);
      message.error("Metadata 上传失败，请重试");
      throw new Error("上传 metadata 失败");
    }
  };

  // 将数据插入数据库
  const handleMintItem = async () => {
    try {
      await mintItem();
      const newTokenId = await yourCollectibleContract?.read.tokenIdCounter();
      console.log('newTokenId = ', newTokenId);
      if (newTokenId) {
        const nftDetails = { category, cid: inputURI, address: connectedAddress, tokenId: newTokenId };
        message.success("NFT铸造成功!");
        console.log("handleMintItem newTokenId = ", newTokenId);
        const response = await axios.post("http://localhost:3001/nft/mintNft", {
          tokenId: Number(newTokenId),
          category: category,
          address: nftDetails.address,
          cid: nftDetails.cid,
          is_listing: false,
          is_rented: false,
        });
        console.log("response.data = ", response.data);
      }
      message.success('NFT 信息已保存到数据库')
      router.push("/myNFTs"); // 铸造成功后跳转到 "My NFTs" 页面
    } catch (error) {
      console.error(error);
      message.error("NFT数据插入失败，请重试");
      return null;
    }
  };

  // 铸造NFT
  const mintItem = async () => {
    if (!ipfsHash || !name || !description) {
      message.error("请确保图片已上传，并输入名称和描述");
      return;
    }
    setIsMinting(true);
    try {
      const metadataURI = await uploadMetadataToPinata(); // 上传metadata并获得URI
      const royaltyValue = parseInt(royalty) * 100;  // 500表示5%
      await writeContractAsync({
        functionName: "mintItem",
        args: [connectedAddress, metadataURI, BigInt(royaltyValue), category], // 使用metadata的URI作为参数   
      });
    } catch (error) {
      message.error("铸造失败：" + error);
    } finally {
      setIsMinting(false);
    }
  };

  // Ant Design 图片上传配置
  const uploadProps = {
    name: "file",
    multiple: false,
    accept: "image/*",
    customRequest: ({ file }: any) => {
      uploadToPinata(file); // 上传图片到Pinata
    },
    showUploadList: false, // 不显示上传文件列表
  };

  // 选择类别时的回调
  const handleCategoryChange = (value: string) => {
    setCategory(value);
  };

  return (
    <div
      style={{
        background: "linear-gradient(145deg, #0d0e21, #1d1f3f)",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <Card
        title={
          <h2
            style={{
              color: "#FFDF00",
              textAlign: "center",
              fontSize: "2.5rem",
              fontWeight: "bold",
              textShadow: "0px 0px 8px rgba(255, 215, 0, 0.8)",
            }}
          >
            铸造您的专属NFT
          </h2>
        }
        bordered={false}
        style={{
          background: "linear-gradient(135deg, #240046, #6a0572, #c026d3)",
          borderRadius: "20px",
          boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.5)",
          width: "100%",
          maxWidth: 850,
          margin: "40px auto",
          padding: "30px",
          color: "white",
        }}
      >
        <div className="text-center mb-4">
          {!isConnected || isConnecting ? (
            <RainbowKitCustomConnectButton />
          ) : (
            <>
              <p
                style={{
                  color: "#ddd",
                  fontWeight: "bold",
                  marginBottom: "20px",
                }}
              >
                已连接账户：{connectedAddress}
              </p>

              <Dragger
                {...uploadProps}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "15px",
                  border: "2px dashed rgba(255, 255, 255, 0.7)",
                  padding: "20px",
                  transition: "all 0.3s",
                }}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ fontSize: "28px", color: "#fff" }} />
                </p>
                <p
                  style={{
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: "1.2rem",
                  }}
                >
                  点击或拖拽上传图片
                </p>
              </Dragger>

              {uploading && (
                <Spin
                  className="mt-4"
                  tip="图片上传中..."
                  style={{ color: "white" }}
                />
              )}

              {imageUrl && (
                <div className="mt-4">
                  <p style={{ color: "#fff", fontWeight: "bold" }}>图片已上传:</p>
                  <img
                    src={imageUrl}
                    alt="Uploaded NFT"
                    className="h-40 my-2"
                    style={{
                      borderRadius: "10px",
                      border: "2px solid rgba(255, 255, 255, 0.5)",
                    }}
                  />
                  <p style={{ color: "#FFD700" }}>
                    IPFS hash:{" "}
                    <a
                      href={`${ipfsHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#FFD700" }}
                    >
                      {ipfsHash}
                    </a>
                  </p>
                </div>
              )}

              <Input
                value={name}
                onChange={(e: any) => setName(e.target.value)}
                placeholder="输入NFT名称"
                style={{
                  marginTop: "16px",
                  borderRadius: "8px",
                  border: "2px solid rgba(255, 255, 255, 0.7)",
                  padding: "10px",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                }}
              />
              <Input
                value={description}
                onChange={(e: any) => setDescription(e.target.value)}
                placeholder="输入NFT描述"
                style={{
                  marginTop: "16px",
                  borderRadius: "8px",
                  border: "2px solid rgba(255, 255, 255, 0.7)",
                  padding: "10px",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                }}
              />
              <Input
                type="number"
                value={royalty ?? ""}
                onChange={(e: any) => {
                  const value = parseFloat(e.target.value);
                  if (value < 0 || value > 10) {
                    message.error("版税比例必须在 0% 到 10% 之间");
                  } else {
                    setRoyalty(value + "");
                  }
                }}
                placeholder="输入版税比例 (0% 到 10%)"
                style={{
                  marginTop: "16px",
                  borderRadius: "8px",
                  border: "2px solid rgba(255, 255, 255, 0.7)",
                  padding: "10px",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                }}
              />
              <Radio.Group
                onChange={(e) => setCategory(e.target.value)}
                value={category}
                style={{
                  marginTop: "16px",
                  display: "flex",
                  justifyContent: "space-between", // 等间距排列
                  gap: "10px", // 按钮之间的间距
                  padding: "10px",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.1)", // 整体背景
                  border: "2px solid rgba(255, 255, 255, 0.7)",
                }}
              >
                <Radio.Button
                  value="collectibles"
                  style={{
                    flex: 1, // 等宽按钮
                    textAlign: "center",
                    lineHeight: "40px", // 确保文字垂直居中
                    height: "40px", // 按钮高度
                    background: category === "collectibles" ? "#ff7e5f" : "rgba(255, 255, 255, 0.2)", // 选中和未选中背景
                    color: "#fff", // 文本颜色
                    border: "none",
                    borderRadius: "8px", // 按钮圆角
                    transition: "background 0.3s ease",
                    fontSize: "16px", // 文字大小
                    fontWeight: "bold", // 文字加粗
                  }}
                >
                  收藏品
                </Radio.Button>
                <Radio.Button
                  value="art"
                  style={{
                    flex: 1,
                    textAlign: "center",
                    lineHeight: "40px", // 确保文字垂直居中
                    height: "40px",
                    background: category === "art" ? "#ff7e5f" : "rgba(255, 255, 255, 0.2)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    transition: "background 0.3s ease",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  艺术品
                </Radio.Button>
                <Radio.Button
                  value="music"
                  style={{
                    flex: 1,
                    textAlign: "center",
                    lineHeight: "40px", // 确保文字垂直居中
                    height: "40px",
                    background: category === "music" ? "#ff7e5f" : "rgba(255, 255, 255, 0.2)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    transition: "background 0.3s ease",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  音乐
                </Radio.Button>
              </Radio.Group>

              <Input
                value={inputURI}
                onChange={(e: any) => setInputURI(e.target.value)}
                placeholder="输入NFT URI"
                style={{
                  marginTop: "16px",
                  borderRadius: "8px",
                  border: "2px solid rgba(255, 255, 255, 0.7)",
                  padding: "10px",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                }}
              />

              <Button
                type="primary"
                onClick={handleMintItem}
                loading={isMinting}
                style={{
                  marginTop: "20px",
                  background: "linear-gradient(90deg, #ff7e5f, #feb47b)",
                  color: "#fff",
                  fontWeight: "bold",
                  padding: "10px 20px",
                  borderRadius: "10px",
                  border: "none",
                  boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3)",
                  transition: "transform 0.2s",
                }}
                disabled={!ipfsHash || !name || !description}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.05)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1.0)")
                }
              >
                {isMinting ? "铸造中..." : "铸造NFT"}
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );



};

export default MyNFTs;
