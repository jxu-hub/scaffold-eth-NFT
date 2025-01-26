const nftsMetadata = [
  {
    description: "It's actually a bison?",
    //external_url: "https://austingriffith.com/portfolio/paintings/", // <-- this can link to a page for the specific file too
    image: "https://apricot-fantastic-ferret-743.mypinata.cloud/ipfs/bafkreiftflgmbgfhwoqbaqscd3rkycsxa7pmdda2ig4eur7lbibwkpcbr4",
    name: "Buffalo",
    attributes: [
      {
        trait_type: "BackgroundColor",
        value: "green",
      },
      {
        trait_type: "Eyes",
        value: "googly",
      },
      {
        trait_type: "Stamina",
        value: 42,
      },
    ],
  },
  {
    description: "What is it so worried about?",
    //external_url: "https://austingriffith.com/portfolio/paintings/", // <-- this can link to a page for the specific file too
    image: "https://apricot-fantastic-ferret-743.mypinata.cloud/ipfs/QmPYQBiFHHTHBZYhC8GCCFXAzbg4qHniwh9mrt7H5VReik",
    name: "Zebra",
    attributes: [
      {
        trait_type: "BackgroundColor",
        value: "blue",
      },
      {
        trait_type: "Eyes",
        value: "googly",
      },
      {
        trait_type: "Stamina",
        value: 38,
      },
    ],
  },
  {
    description: "What a horn!",
    //external_url: "https://austingriffith.com/portfolio/paintings/", // <-- this can link to a page for the specific file too
    image: "https://apricot-fantastic-ferret-743.mypinata.cloud/ipfs/bafybeid2hunk7tu2retglp2vo2thtsgcobe4cv5rpzxhy5vow4k3u6piri",
    name: "Rhino",
    attributes: [
      {
        trait_type: "BackgroundColor",
        value: "pink",
      },
      {
        trait_type: "Eyes",
        value: "googly",
      },
      {
        trait_type: "Stamina",
        value: 22,
      },
    ],
  },
  {
    description: "Is that an underbyte?",
   //external_url: "https://austingriffith.com/portfolio/paintings/", // <-- this can link to a page for the specific file too
    image: "https://apricot-fantastic-ferret-743.mypinata.cloud/ipfs/bafkreig3dy5mupxqb7vf6hwrxl6bnolroifcccl66qcxyw5vkmteynv2oe",
    name: "Fish",
    attributes: [
      {
        trait_type: "BackgroundColor",
        value: "blue",
      },
      {
        trait_type: "Eyes",
        value: "googly",
      },
      {
        trait_type: "Stamina",
        value: 15,
      },
    ],
  },
  {
    description: "So delicate.",
   // external_url: "https://austingriffith.com/portfolio/paintings/", // <-- this can link to a page for the specific file too
    image: "https://apricot-fantastic-ferret-743.mypinata.cloud/ipfs/bafybeigyukxzkrsavpsx6ig642v2gnv3uk5quh6ejzq62qgmrfkuuikkiu",
    name: "Flamingo",
    attributes: [
      {
        trait_type: "BackgroundColor",
        value: "black",
      },
      {
        trait_type: "Eyes",
        value: "googly",
      },
      {
        trait_type: "Stamina",
        value: 6,
      },
    ],
  },
  // {
  //   description: "Raaaar!",
  //  // external_url: "https://austingriffith.com/portfolio/paintings/", // <-- this can link to a page for the specific file too
  //   image: "https://austingriffith.com/images/paintings/godzilla.jpg",
  //   name: "Godzilla",
  //   attributes: [
  //     {
  //       trait_type: "BackgroundColor",
  //       value: "orange",
  //     },
  //     {
  //       trait_type: "Eyes",
  //       value: "googly",
  //     },
  //     {
  //       trait_type: "Stamina",
  //       value: 99,
  //     },
  //   ],
  // },
];

export type NFTMetaData = (typeof nftsMetadata)[number];

export default nftsMetadata;
