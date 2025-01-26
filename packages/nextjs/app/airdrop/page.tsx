"use client";
import { useState } from "react";
import { MerkleTree } from "merkletreejs";
import { isAddress } from "viem";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { soliditySha3 } from "web3-utils";

const MerkleTreePage = () => {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [newAddress, setNewAddress] = useState<string>("");
  const [startTokenId, setStartTokenId] = useState<number | null>(null);
  const [merkleRoot, setMerkleRoot] = useState<string | null>(null);
  const [proofs, setProofs] = useState<Record<string, string[]> | null>(null);
  const [leaves, setLeaves] = useState<string[]>([]);
  const [step, setStep] = useState<number>(1);

  const { writeContractAsync } = useScaffoldWriteContract("YourCollectible");

  const addAddress = () => {
    if (isAddress(newAddress)) {
      setAddresses([...addresses, newAddress]);
      setNewAddress("");
    } else {
      alert("请输入有效的以太坊地址");
    }
  };

  const generateMerkleTree = async () => {
    if (addresses.length === 0) {
      alert("地址列表为空，无法生成 Merkle Tree");
      return;
    }
    if (startTokenId === null) {
      alert("请指定开始的 Token ID");
      return;
    }

    const generatedLeaves = addresses.map((addr, index) => {
      const tokenId = startTokenId + index;
      const leaf = soliditySha3(
        { type: "address", value: addr },
        { type: "uint256", value: tokenId }
      );
      return leaf;
    });
    setLeaves(generatedLeaves.filter((leaf): leaf is string => leaf !== null));

    const tree = new MerkleTree(generatedLeaves, soliditySha3, { sortPairs: true });
    const root = tree.getHexRoot();
    setMerkleRoot(root);

    await writeContractAsync({
      functionName: "setMerkleRoot",
      args: [root as `0x${string}`],
    });

    const generatedProofs: Record<string, string[]> = {};
    addresses.forEach((addr, index) => {
      const tokenId = startTokenId + index;
      const leaf = soliditySha3(
        { type: "address", value: addr },
        { type: "uint256", value: tokenId }
      ) as string;
      const proof = tree.getHexProof(leaf);
      generatedProofs[`${addr}-${tokenId}`] = proof;
    });
    setProofs(generatedProofs);

    // 向后端发送请求，存储 Merkle Tree 数据
    try {
      const response = await fetch("http://localhost:3001/api/merkleTree", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          merkleRoot: root,
          proofs: generatedProofs,
          leaves: generatedLeaves,
          addresses,
          startTokenId,
        }),
      });

      if (response.ok) {
        console.log("Merkle Tree 数据已成功发送到后端！");
      } else {
        console.error("发送 Merkle Tree 数据失败：", response.statusText);
      }
    } catch (error) {
      console.error("发送请求时发生错误：", error);
    }

    setStep(4);
  };

  const reset = () => {
    setAddresses([]);
    setNewAddress("");
    setStartTokenId(null);
    setMerkleRoot(null);
    setProofs(null);
    setLeaves([]);
    setStep(1);
  };

  return (
    <div
      style={{
        fontFamily: "'Poppins', sans-serif",
        background: "linear-gradient(to bottom, #091236, #1E215D)",
        color: "#fff",
        minHeight: "100vh",
        textAlign: "center",
        padding: "40px 20px",
      }}
    >
      <h1
        style={{
          fontSize: "3rem",
          fontWeight: "bold",
          marginBottom: "20px",
          textShadow: "0 0 20px rgba(255, 255, 255, 0.7), 0 0 30px rgba(0, 153, 255, 0.5)",
        }}
      >
        NFT 空投 - Merkle Tree 生成器
      </h1>

      <div
        style={{
          margin: "20px auto",
          padding: "20px",
          background: "rgba(255, 255, 255, 0.08)",
          borderRadius: "15px",
          boxShadow: "0 0 15px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 153, 255, 0.3)",
          maxWidth: "800px",
        }}
      >
        {/* Progress Bar */}
        <div
          style={{
            marginBottom: "20px",
            position: "relative",
            height: "10px",
            backgroundColor: "#444",
            borderRadius: "5px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${((step - 1) / 3) * 100}%`,
              height: "100%",
              background: "linear-gradient(90deg, #FF5F6D, #FFC371)",
              boxShadow: "0 0 10px rgba(255, 95, 109, 0.5)",
              borderRadius: "5px",
              transition: "width 0.3s ease",
            }}
          ></div>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <>
            <h3 style={{ fontSize: "1.5rem", marginBottom: "20px" }}>
              步骤 1: 添加您的地址到空投列表
            </h3>
            <div style={{ marginBottom: "20px", textAlign: "center" }}>
              <input
                type="text"
                value={newAddress}
                placeholder="请输入以太坊地址"
                onChange={(e) => setNewAddress(e.target.value)}
                style={{
                  padding: "15px",
                  fontSize: "1rem",
                  borderRadius: "30px",
                  border: "1px solid #aaa",
                  width: "60%",
                  marginBottom: "20px",
                  outline: "none",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                  textAlign: "center",
                }}
              />
              <button
                onClick={addAddress}
                style={{
                  padding: "10px 20px",
                  fontSize: "1rem",
                  background:
                    "linear-gradient(90deg, rgba(255, 0, 150, 1) 0%, rgba(0, 119, 255, 1) 100%)",
                  color: "#fff",
                  borderRadius: "30px",
                  border: "none",
                  cursor: "pointer",
                  transition: "transform 0.2s ease",
                  marginLeft: "10px",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.transform = "scale(1)";
                }}
              >
                添加地址
              </button>
            </div>
            <div style={{ textAlign: "left", marginBottom: "20px" }}>
              <h4>空投地址列表</h4>
              {addresses.length === 0 ? (
                <p style={{ color: "#aaa" }}>当前空投地址列表为空，请添加至少一个地址。</p>
              ) : (
                <ul style={{ listStyleType: "none", padding: "0" }}>
                  {addresses.map((addr, index) => (
                    <li
                      key={index}
                      style={{
                        padding: "10px",
                        background: "rgba(255, 255, 255, 0.2)",
                        borderRadius: "5px",
                        marginBottom: "5px",
                        color: "#fff",
                      }}
                    >
                      {addr}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={() => setStep(2)}
              style={{
                padding: "10px 20px",
                fontSize: "1rem",
                background:
                  "linear-gradient(90deg, rgba(0, 255, 255, 1) 0%, rgba(0, 119, 255, 1) 100%)",
                color: "#fff",
                borderRadius: "30px",
                border: "none",
                cursor: "pointer",
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.transform = "scale(1)";
              }}
            >
              下一步
            </button>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <h3 style={{ fontSize: "1.5rem", marginBottom: "20px" }}>步骤 2: 输入起始 Token ID</h3>
            <input
              type="number"
              value={startTokenId ?? ""}
              placeholder="请输入开始的 Token ID"
              onChange={(e) => setStartTokenId(Number(e.target.value))}
              style={{
                padding: "15px",
                fontSize: "1rem",
                borderRadius: "30px",
                border: "1px solid #aaa",
                width: "60%",
                marginBottom: "20px",
                outline: "none",
                background: "rgba(255, 255, 255, 0.1)",
                color: "#fff",
                textAlign: "center",
              }}
            />
            <button
              onClick={() => setStep(1)}
              style={{
                padding: "10px 20px",
                fontSize: "1rem",
                background: "#ccc",
                color: "#333",
                borderRadius: "30px",
                border: "none",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              上一步
            </button>
            <button
              onClick={() => setStep(3)}
              style={{
                padding: "10px 20px",
                fontSize: "1rem",
                background:
                  "linear-gradient(90deg, rgba(0, 255, 255, 1) 0%, rgba(0, 119, 255, 1) 100%)",
                color: "#fff",
                borderRadius: "30px",
                border: "none",
                cursor: "pointer",
              }}
            >
              下一步
            </button>
          </>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <>
            <h3 style={{ fontSize: "1.5rem", marginBottom: "20px" }}>步骤 3: 生成 Merkle Tree</h3>
            <button
              onClick={generateMerkleTree}
              style={{
                padding: "10px 20px",
                fontSize: "1rem",
                background: "#1e90ff",
                color: "#fff",
                borderRadius: "5px",
                border: "none",
                cursor: "pointer",
              }}
            >
              生成 Merkle Tree
            </button>
          </>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <>
            <h3 style={{ fontSize: "1.5rem", marginBottom: "20px" }}>生成的 Merkle Tree</h3>
            <div
              style={{
                padding: "10px",
                background: "#f1f1f1",
                borderRadius: "5px",
                wordBreak: "break-word",
                marginBottom: "20px",
                color: "#333",
              }}
            >
              <p>Merkle Root: {merkleRoot}</p>
            </div>
            {/* <table
              style={{
                width: "100%",
                marginBottom: "20px",
                borderCollapse: "collapse",
                color: "#fff",
              }}
            >
              <thead>
                <tr>
                  <th style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
                    地址和 Token ID
                  </th>
                  <th style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>哈希值</th>
                  <th style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>Proof</th>
                </tr>
              </thead>
              <tbody>
                {addresses.map((addr, index) => {
                  const tokenId = startTokenId! + index;
                  const key = `${addr}-${tokenId}`;
                  return (
                    <tr key={key}>
                      <td style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>{key}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
                        {leaves[index]}
                      </td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
                        <ul style={{ listStyleType: "none", padding: "0", margin: "0" }}>
                          {proofs?.[key]?.map((proof, i) => (
                            <li key={i}>{proof}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table> */}
            <button
              onClick={reset}
              style={{
                padding: "10px 20px",
                fontSize: "1rem",
                background: "#dc3545",
                color: "#fff",
                borderRadius: "5px",
                border: "none",
                cursor: "pointer",
              }}
            >
              重置
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MerkleTreePage;
