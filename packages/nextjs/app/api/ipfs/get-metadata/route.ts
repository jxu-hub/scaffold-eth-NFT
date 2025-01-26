import { getNFTMetadataFromIPFS } from "~~/utils/simpleNFT/ipfs";

export async function POST(request: Request) {
  try {
    const { ipfsHash } = await request.json();
    console.log("ipfsHash ==================== ",ipfsHash);
    const res = await getNFTMetadataFromIPFS(ipfsHash);
    console.log("res ==================== ",res);
    return Response.json(res);
  } catch (error) {
    console.log("Error getting metadata from ipfs", error);
    return Response.json({ error: "Error getting metadata from ipfs" });
  }
}
