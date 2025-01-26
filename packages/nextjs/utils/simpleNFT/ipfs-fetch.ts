

const fetchFromApi = ({ path, method, body }: { path: string; method: string; body?: object }) =>
  fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
    .then(response => response.json())
    .catch(error => console.error("Error:", error));

export const addToIPFS = (yourJSON: object) => fetchFromApi({ path: "/api/ipfs/add", method: "Post", body: yourJSON });

// export const getMetadataFromIPFS = (ipfsHash: string) =>
//   fetchFromApi({ path: "/api/ipfs/get-metadata", method: "Post", body: { ipfsHash } });

export const getMetadataFromIPFS = async (tokenURI: string) => {
  try {
    console.log("tokenURI = ", tokenURI)
    const response = await fetch(tokenURI);
    if (!response.ok) {
      throw new Error(`HTTP error! status :,  ${response.status}`);
    }
    console.log('response = ', JSON.stringify(response));
    console.log('response = ', response);
    
    const data = await response.json();
    // console.log('data = ', data);
    
    return data
    // return response;
  } catch (error) {
    console.error("Error fetching data from pinata: ", error);
    throw error;
  }
}
