import { ipfsClient } from "~~/utils/simpleNFT/ipfs";

// export async function POST(request: Request) {
//   try {
//     const body = await request.json();
//     const res = await ipfsClient.add(JSON.stringify(body));
//     return Response.json(res);
//   } catch (error) {
//     console.log("Error adding to ipfs", error);
//     return Response.json({ error: "Error adding to ipfs" });
//   }
// }

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = JSON.stringify(body);
    const pinataJWT = process.env.PINATA_JWT;

    if (!pinataJWT) {
      throw new Error("Pinata JWT not found");
    }

    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pinataJWT}`,
      },
      body: data,
    });

    if (!response.ok) {
      throw new Error(`HTTP 错误! status : ${response.status}`);
    }

    const result = await response.json();
    console.log("result.IpfsHash ============================= ", result.IpfsHash);
    
    // return Response.json({IpfsHash: result.IpfsHash})

    return new Response(JSON.stringify({ IpfsHash: result.IpfsHash }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log("Error adding to ipfs", error);
    // return Response.json({ error: "Error adding to ipfs" });
    return new Response("错");
  }
}
