// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.2;
// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
// import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
// import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
// import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/utils/Counters.sol";
// import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// contract YourCollectible is
// 	ERC721,
// 	ERC721Enumerable,
// 	ERC721URIStorage,
// 	ERC721Royalty,
// 	Ownable,
// 	ReentrancyGuard
// {
// 	using Counters for Counters.Counter;

// 	Counters.Counter public tokenIdCounter;

// 	// 累计的上架费用
// 	uint256 public totalFeesCollected;

// 	struct NftItem {
// 		uint256 tokenId;
// 		uint256 price;
// 		address payable seller;
// 		address creator;
// 		bool isListed;
// 		string tokenUri;
// 		uint256 listingTime; // 新增字段，记录上架时间
// 		string category; // 新增字段，表示分类
// 		bool isRented; // 新增字段，表示是否被租赁
// 		string rarity;
// 	}
// 	// 拍卖
// 	struct AuctionItem {
// 		uint256 tokenId;
// 		uint256 startingPrice;
// 		uint256 highestBid;
// 		address payable highestBidder;
// 		uint256 auctionEndTime;
// 		address seller;
// 		bool isAuctionActive;
// 		bool auctionEnded;
// 	}
// 	// 枚举稀有度
// 	enum Rarity {
// 		Common,
// 		Rare,
// 		Epic,
// 		Legendary
// 	}

// 	// Token ID到NftItem的映射
// 	mapping(uint256 => NftItem) private _idToNftItem;
// 	mapping(uint256 => AuctionItem) private _auctionItems; // Token ID到AuctionItem的映射
// 	mapping(uint256 => mapping(address => uint256)) private _bids; // 独立的映射存储每个拍卖项目的竞标
// 	// 确保每个tokenURI唯一
// 	mapping(string => bool) private _usedTokenURIs;

// 	uint256 public constant LISTING_DURATION = 3 days; // 设置上架持续时间为3天

// 	// 维护所有上架的tokenId数组
// 	uint256[] private _listedTokenIds;
// 	// 维护所有拍卖的tokenId数组
// 	uint256[] private _auctionIds;
// 	// tokenId到_listedTokenIds数组索引的映射
// 	mapping(uint256 => uint256) private _tokenIdToListedIndex;
// 	// tokenId到_auctionIdToIndex数组索引的映射
// 	mapping(uint256 => uint256) private _auctionIdToIndex;

// 	// 上架费用比例（例如250代表2.5%）
// 	uint256 public listingFeePercentage = 250; // 2.5%
// 	uint256 public constant MAX_LISTING_FEE_PERCENTAGE = 1000; // 最多10%

// 	// Merkle Root 存储
// 	bytes32 public merkleRoot;
// 	// 记录每个地址是否已经领取了空投
// 	mapping(address => bool) public hasClaimed;

// 	// 允许管理员设置 Merkle Root，用于验证白名单或空投等功能
// 	function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
// 		merkleRoot = _merkleRoot;
// 	}

// 	// 事件
// 	event NftListed(
// 		uint256 indexed tokenId,
// 		address indexed seller,
// 		uint256 price
// 	);
// 	event NftUnlisted(uint256 indexed tokenId, address indexed seller);
// 	event NftPurchased(
// 		uint256 indexed tokenId,
// 		address indexed seller,
// 		address indexed buyer,
// 		uint256 price
// 	);
// 	event AuctionStarted(uint256 indexed tokenId, uint256 startingPrice);
// 	event BidPlaced(
// 		uint256 indexed tokenId,
// 		address indexed bidder,
// 		uint256 bidAmount
// 	);
// 	event AuctionEnded(
// 		uint256 indexed tokenId,
// 		address indexed winner,
// 		uint256 finalPrice
// 	);
// 	event RefundIssued(
// 		address indexed bidder,
// 		uint256 tokenId,
// 		uint256 refundAmount
// 	);
// 	event ListingFeePercentageUpdated(uint256 newListingFeePercentage);
// 	event FeesWithdrawn(address indexed owner, uint256 amount);
// 	event FeesReceived(address indexed sender, uint256 amount);
// 	event NftRented(uint256 indexed tokenId, address indexed renter);
// 	event NftReturned(uint256 indexed tokenId, address indexed renter);

// 	event MintBatch(address indexed owner, string uris, uint256 quantity);

// 	constructor() ERC721("YourCollectible", "YCB") {}

// 	function _baseURI() internal pure override returns (string memory) {
// 		return "https://apricot-fantastic-ferret-743.mypinata.cloud/ipfs/";
// 	}

// 	/**
// 	 * @dev 铸造新的NFT
// 	 * @param to 接收者地址
// 	 * @param uri NFT的元数据URI
// 	 * @return tokenId 新铸造的NFT的Token ID
// 	 */
// 	function mintItem(
// 		address to,
// 		string memory uri,
// 		uint96 royaltyFraction,
// 		string memory category
// 	) public returns (uint256) {
// 		require(
// 			royaltyFraction <= 1000,
// 			"royaltyFraction fee cannot exceed 10%"
// 		);

// 		tokenIdCounter.increment();
// 		uint256 tokenId = tokenIdCounter.current();
// 		_safeMint(to, tokenId);
// 		_setTokenURI(tokenId, uri);

// 		// 设置版税
// 		_setTokenRoyalty(tokenId, to, royaltyFraction);

// 		string memory completeTokenURI = string(
// 			abi.encodePacked(_baseURI(), uri)
// 		);

// 		//自动计算稀有度并存储
// 		string memory rarity = _calculateRarity(uri);

// 		_idToNftItem[tokenId] = NftItem({
// 			tokenId: tokenId,
// 			price: 0,
// 			seller: payable(address(0)),
// 			creator: to, // 设置创作者
// 			isListed: false,
// 			tokenUri: completeTokenURI,
// 			listingTime: 0,
// 			category: category, // 设置分类
// 			isRented: false, // 初始状态为未租赁
// 			rarity: rarity
// 		});

// 		emit NftUnlisted(tokenId, address(0));
// 		return tokenId;
// 	}

// 	/**
// 	 * @dev 查询NFT的稀有度
// 	 * @param tokenId NFT的Token ID
// 	 * @return 稀有度字符串
// 	 */
// 	function getRarity(uint256 tokenId) public view returns (string memory) {
// 		require(_exists(tokenId), "Token ID does not exist");
// 		return _idToNftItem[tokenId].rarity;
// 	}

// 	/**
// 	 * @dev 根据URI最后几个字符计算稀有度
// 	 * @param uri NFT元数据URI
// 	 * @return 稀有度字符串
// 	 */
// 	function _calculateRarity(
// 		string memory uri
// 	) internal pure returns (string memory) {
// 		require(bytes(uri).length >= 5, "URI too short for rarity calculation");

// 		// 提取URI最后5个字符
// 		bytes memory uriBytes = bytes(uri);
// 		uint256 seed = 0;

// 		for (uint256 i = uriBytes.length - 5; i < uriBytes.length; i++) {
// 			seed = seed * 256 + uint8(uriBytes[i]);
// 		}

// 		// 模运算将稀有度归一化到0-99范围
// 		uint256 rarityScore = seed % 100;

// 		// 根据分数划分稀有度等级
// 		if (rarityScore >= 85) {
// 			return "Legendary";
// 		} else if (rarityScore >= 60) {
// 			return "Epic";
// 		} else if (rarityScore >= 30) {
// 			return "Rare";
// 		} else {
// 			return "Common";
// 		}
// 	}

// 	/**
// 	 * @dev 批量铸造NFT
// 	 * to 接收者地址
// 	 * uris NFT的元数据URI数组
// 	 * categories NFT分类
// 	 * @param quantity 铸造数量
// 	 * @return mintedTokenIds 新铸造的NFT的Token ID数组
// 	 */
// 	function mintBatch(
// 		string memory uris,
// 		string memory categories,
// 		uint256 quantity
// 	) public returns (uint256[] memory) {
// 		require(quantity > 0, "Quantity must be greater than 0");
// 		require(quantity <= 20, "Exceeded max batch size of 20");

// 		uint256[] memory mintedTokenIds = new uint256[](quantity);

// 		string memory rarity = _calculateRarity(uris);

// 		for (uint256 i = 0; i < quantity; i++) {
// 			// require(!tokenURIExists(uris[i]), "One of the token URIs already exists");

// 			tokenIdCounter.increment();
// 			uint256 tokenId = tokenIdCounter.current();
// 			_mint(address(this), tokenId);
// 			_setTokenURI(tokenId, uris);

// 			_idToNftItem[tokenId] = NftItem({
// 				tokenId: tokenId,
// 				price: 0,
// 				seller: payable(address(0)),
// 				creator: msg.sender,
// 				isListed: false,
// 				tokenUri: uris,
// 				listingTime: 0,
// 				category: categories,
// 				isRented: false,
// 				rarity: rarity
// 			});
// 			mintedTokenIds[i] = tokenId;
// 		}
// 		emit MintBatch(address(this), uris, quantity);
// 		return mintedTokenIds;
// 	}
// 	/**
// 	 * @dev 领取空投
// 	 * @param merkleProof 默克尔凭证
// 	 * @param tokenId 领取的NFT 的tokenId
// 	 */
// 	function claimedNFT(
// 		bytes32[] calldata merkleProof,
// 		uint256 tokenId
// 	) external {
// 		require(!hasClaimed[msg.sender], "NFT aleady claimed");
// 		bytes32 leaf = keccak256(abi.encodePacked(msg.sender, tokenId));
// 		require(
// 			MerkleProof.verify(merkleProof, merkleRoot, leaf),
// 			"Invalid proof"
// 		);
// 		hasClaimed[msg.sender] = true;
// 		_safeTransfer(address(this), msg.sender, tokenId, "");
// 	}

// 	/**
// 	 * @dev 上架NFT
// 	 * @param tokenId 要上架的NFT的Token ID
// 	 * @param price 上架价格
// 	 */
// 	function placeNftOnSale(
// 		uint256 tokenId,
// 		uint256 price
// 	) external payable nonReentrant {
// 		require(price > 0, "Price must be at least 1 wei");
// 		require(
// 			ownerOf(tokenId) == msg.sender,
// 			"You are not the owner of this NFT"
// 		);
// 		require(!_idToNftItem[tokenId].isListed, "Item is already on sale");

// 		// _transfer(msg.sender, address(this), tokenId);
// 		transferFrom(msg.sender, address(this), tokenId);
// 		_idToNftItem[tokenId] = NftItem({
// 			tokenId: tokenId,
// 			price: price,
// 			seller: payable(msg.sender),
// 			creator: _idToNftItem[tokenId].creator, // 保留创作者
// 			isListed: true,
// 			tokenUri: tokenURI(tokenId),
// 			listingTime: block.timestamp,
// 			category: _idToNftItem[tokenId].category, // 保留分类
// 			isRented: false, // 上架时默认为租赁
// 			rarity: _idToNftItem[tokenId].rarity
// 		});
// 		totalFeesCollected += msg.value;

// 		_listedTokenIds.push(tokenId);
// 		_tokenIdToListedIndex[tokenId] = _listedTokenIds.length - 1;
// 		emit NftListed(tokenId, msg.sender, price);
// 	}

// 	/**
// 	 * @dev 将NFT下架
// 	 * @param tokenId 要下架的NFT的Token ID
// 	 */
// 	function unlistNft(uint256 tokenId) external nonReentrant {
// 		NftItem storage item = _idToNftItem[tokenId];
// 		require(item.isListed, "Item is not listed");
// 		require(item.seller == msg.sender, "You are not the seller");

// 		// 将NFT转回卖家
// 		_transfer(address(this), msg.sender, tokenId);

// 		// 重置NftItem信息
// 		item.isListed = false;
// 		item.price = 0;
// 		item.seller = payable(address(0));

// 		// 从listedTokenIds数组中移除tokenId
// 		_removeFromListed(tokenId);

// 		emit NftUnlisted(tokenId, msg.sender);
// 	}

// 	/**
// 	 * @dev 购买NFT
// 	 * @param tokenId 要购买的NFT的Token ID
// 	 */
// 	function purchaseNft(uint256 tokenId) external payable nonReentrant {
// 		NftItem storage item = _idToNftItem[tokenId];
// 		require(item.isListed, "Item is not listed for sale");
// 		require(msg.value >= item.price, "Payment must be exactly the price");

// 		item.isListed = false;
// 		address payable seller = item.seller;
// 		item.seller = payable(address(0));
// 		item.price = 0;

// 		_removeFromListed(tokenId);

// 		// 计算版税金额
// 		(address receiver, uint256 royaltyAmount) = royaltyInfo(
// 			tokenId,
// 			msg.value
// 		);

// 		// 将ETH分配给创作者和卖家
// 		if (royaltyAmount > 0) {
// 			(bool royaltySent, ) = payable(receiver).call{
// 				value: royaltyAmount
// 			}("");
// 			require(royaltySent, "Royalty transfer failed");
// 		}

// 		(bool sellerSent, ) = seller.call{ value: msg.value - royaltyAmount }(
// 			""
// 		);
// 		require(sellerSent, "Seller transfer failed");

// 		// _transfer(address(this), msg.sender, tokenId);
// 		this.transferFrom(address(this), msg.sender, tokenId);
// 		emit NftPurchased(tokenId, seller, msg.sender, msg.value);
// 	}

// 	// 开始拍卖
// 	function startAuction(
// 		uint256 tokenId,
// 		uint256 startingPrice,
// 		uint256 auctionDuration
// 	) external {
// 		NftItem storage item = _idToNftItem[tokenId];
// 		require(!item.isListed, "Item is listed for sale, unlist first");

// 		_auctionItems[tokenId] = AuctionItem({
// 			tokenId: tokenId,
// 			startingPrice: startingPrice,
// 			highestBid: startingPrice,
// 			highestBidder: payable(address(0)),
// 			auctionEndTime: block.timestamp + auctionDuration,
// 			seller: msg.sender,
// 			isAuctionActive: true,
// 			auctionEnded: false
// 		});
// 		_auctionIds.push(tokenId);
// 		emit AuctionStarted(tokenId, startingPrice);
// 	}

// 	// 出价
// 	function placeBid(uint256 tokenId) external payable nonReentrant {
// 		AuctionItem storage auction = _auctionItems[tokenId];
// 		require(auction.isAuctionActive, "Auction not active");
// 		require(auction.seller != msg.sender, "seller not cant bid");
// 		require(block.timestamp < auction.auctionEndTime, "Auction has ended");
// 		require(
// 			msg.value > auction.highestBid,
// 			"Bid must be higher than current highest bid"
// 		);

// 		// 退还先前竞标者的竞标金额
// 		uint256 previousBid = auction.highestBid;
// 		if (previousBid > 0 && auction.highestBidder != address(0)) {
// 			(bool refunded, ) = auction.highestBidder.call{
// 				value: previousBid
// 			}("");
// 			require(refunded, "Refund failed");
// 		}

// 		_bids[tokenId][msg.sender] = msg.value;
// 		auction.highestBid = msg.value;
// 		auction.highestBidder = payable(msg.sender);

// 		emit BidPlaced(tokenId, msg.sender, msg.value);
// 	}

// 	/**
// 	 * @dev 结束拍卖
// 	 * @param tokenId 要结束的拍卖的Token ID
// 	 */
// 	function endAuction(uint256 tokenId) external nonReentrant {
// 		AuctionItem storage auction = _auctionItems[tokenId];
// 		require(auction.isAuctionActive, "Auction is not active");
// 		require(
// 			msg.sender == auction.seller || msg.sender == owner(),
// 			"Only seller or owner can end the auction"
// 		);

// 		auction.isAuctionActive = false;
// 		auction.auctionEnded = true;

// 		// 如果有最高竞价者，将NFT转给最高竞价者，并支付给卖家
// 		if (auction.highestBidder != address(0)) {
// 			_transfer(auction.seller, auction.highestBidder, tokenId);
// 			(bool success, ) = auction.seller.call{ value: auction.highestBid }(
// 				""
// 			);
// 			require(success, "Transfer to seller failed");
// 		}

// 		// 从拍卖列表中移除tokenId
// 		_removeFromAuction(tokenId);

// 		emit AuctionEnded(tokenId, auction.highestBidder, auction.highestBid);
// 	}

// 	// 获取Auction结构体信息
// 	function getAuctionItem(
// 		uint256 tokenId
// 	) external view returns (AuctionItem memory) {
// 		require(
// 			_auctionItems[tokenId].isAuctionActive ||
// 				_auctionItems[tokenId].auctionEnded,
// 			"Auction does not exist"
// 		);
// 		return _auctionItems[tokenId];
// 	}

// 	// 获取所有正在拍卖的NFT
// 	function getAllAuctionedNfts() public view returns (AuctionItem[] memory) {
// 		uint256 totalAuctions = _auctionIds.length;
// 		uint256 auctionCount = 0;

// 		for (uint256 i = 0; i < totalAuctions; i++) {
// 			if (
// 				_auctionItems[_auctionIds[i]].isAuctionActive &&
// 				block.timestamp <= _auctionItems[_auctionIds[i]].auctionEndTime
// 			) {
// 				auctionCount++;
// 			}
// 		}

// 		AuctionItem[] memory auctionedItems = new AuctionItem[](auctionCount);
// 		uint256 currentIndex = 0;

// 		for (uint256 i = 0; i < totalAuctions; i++) {
// 			if (
// 				_auctionItems[_auctionIds[i]].isAuctionActive &&
// 				block.timestamp <= _auctionItems[_auctionIds[i]].auctionEndTime
// 			) {
// 				auctionedItems[currentIndex] = _auctionItems[_auctionIds[i]];
// 				currentIndex++;
// 			}
// 		}

// 		return auctionedItems;
// 	}

// 	/**
// 	 * @dev 从拍卖列表中移除tokenId
// 	 * @param tokenId 要移除的tokenId
// 	 */
// 	function _removeFromAuction(uint256 tokenId) internal {
// 		uint256 index = _auctionIdToIndex[tokenId];
// 		uint256 lastTokenId = _auctionIds[_auctionIds.length - 1];

// 		// 将要移除的tokenId与最后一个tokenId交换
// 		_auctionIds[index] = lastTokenId;
// 		_auctionIdToIndex[lastTokenId] = index;

// 		// 删除最后一个元素
// 		_auctionIds.pop();

// 		// 删除映射中的条目
// 		delete _auctionIdToIndex[tokenId];
// 	}
// 	/**
// 	 * @dev 获取NftItem信息
// 	 * @param tokenId 要查询的NFT的Token ID
// 	 * @return NftItem结构体
// 	 */
// 	function getNftItem(uint256 tokenId) public view returns (NftItem memory) {
// 		return _idToNftItem[tokenId];
// 	}

// 	/**
// 	 * @dev 设置新的上架费用比例（仅合约所有者可调用）
// 	 * @param _newListingFeePercentage 新的上架费用比例（例如250代表2.5%）
// 	 */
// 	function setListingFeePercentage(
// 		uint256 _newListingFeePercentage
// 	) external onlyOwner {
// 		require(
// 			_newListingFeePercentage <= MAX_LISTING_FEE_PERCENTAGE,
// 			"Listing fee cannot exceed 10%"
// 		);
// 		listingFeePercentage = _newListingFeePercentage;
// 		emit ListingFeePercentageUpdated(_newListingFeePercentage);
// 	}

// 	/**
// 	 * @dev 获取当前上架的NFT数量
// 	 */
// 	function getListedItemsCount() external view returns (uint256) {
// 		return _listedTokenIds.length;
// 	}

// 	/**
// 	 * @dev 从上架列表中移除tokenId
// 	 * @param tokenId 要移除的tokenId
// 	 */
// 	function _removeFromListed(uint256 tokenId) internal {
// 		uint256 index = _tokenIdToListedIndex[tokenId];
// 		uint256 lastTokenId = _listedTokenIds[_listedTokenIds.length - 1];

// 		// 将要移除的tokenId与最后一个tokenId交换
// 		_listedTokenIds[index] = lastTokenId;
// 		_tokenIdToListedIndex[lastTokenId] = index;

// 		// 删除最后一个元素
// 		_listedTokenIds.pop();

// 		// 删除映射中的条目
// 		delete _tokenIdToListedIndex[tokenId];
// 	}

// 	/**
// 	 * @dev 获取所有上架的NFT
// 	 * @return An array of NftItem structs
// 	 */
// 	function getAllListedNfts() external view returns (NftItem[] memory) {
// 		uint256 totalListed = _listedTokenIds.length;
// 		uint256 currentTime = block.timestamp;

// 		// 先统计有效的上架项数量
// 		uint256 validCount = 0;
// 		for (uint256 i = 0; i < totalListed; i++) {
// 			uint256 tokenId = _listedTokenIds[i];
// 			NftItem storage item = _idToNftItem[tokenId];

// 			// 检查是否超时
// 			if (
// 				item.isListed &&
// 				currentTime <= item.listingTime + LISTING_DURATION
// 			) {
// 				validCount++;
// 			}
// 		}

// 		// 创建有效上架项数组
// 		NftItem[] memory validItems = new NftItem[](validCount);
// 		uint256 index = 0;

// 		// 填充有效上架项
// 		for (uint256 i = 0; i < totalListed; i++) {
// 			uint256 tokenId = _listedTokenIds[i];
// 			NftItem storage item = _idToNftItem[tokenId];

// 			if (
// 				item.isListed &&
// 				currentTime <= item.listingTime + LISTING_DURATION
// 			) {
// 				validItems[index] = item;
// 				index++;
// 			}
// 		}

// 		return validItems;
// 	}

// 	/**
// 	 * @dev 计算上架费用
// 	 * @param priceInWei NFT的售价，单位为wei
// 	 * @return fee 上架费用，单位为wei
// 	 */
// 	function calculateListingFee(
// 		uint256 priceInWei
// 	) public view returns (uint256) {
// 		uint256 fee = (priceInWei * listingFeePercentage) / 10000;
// 		return fee;
// 	}

// 	/**
// 	 * @dev 提现累积的上架费用（仅合约所有者可调用）
// 	 */
// 	function withdrawFees() external onlyOwner nonReentrant {
// 		uint256 amount = totalFeesCollected;
// 		require(amount > 0, "No fees to withdraw");

// 		totalFeesCollected = 0;

// 		(bool success, ) = owner().call{ value: amount }("");
// 		require(success, "Withdrawal failed");

// 		emit FeesWithdrawn(owner(), amount);
// 	}

// 	// The following functions are overrides required by Solidity.

// 	function _beforeTokenTransfer(
// 		address from,
// 		address to,
// 		uint256 tokenId,
// 		uint256 batchSize
// 	) internal override(ERC721, ERC721Enumerable) {
// 		super._beforeTokenTransfer(from, to, tokenId, batchSize);
// 	}

// 	function _burn(
// 		uint256 tokenId
// 	) internal override(ERC721, ERC721URIStorage, ERC721Royalty) {
// 		super._burn(tokenId);
// 	}

// 	function tokenURI(
// 		uint256 tokenId
// 	) public view override(ERC721, ERC721URIStorage) returns (string memory) {
// 		return super.tokenURI(tokenId);
// 	}

// 	function supportsInterface(
// 		bytes4 interfaceId
// 	)
// 		public
// 		view
// 		override(ERC721, ERC721Enumerable, ERC721URIStorage, ERC721Royalty)
// 		returns (bool)
// 	{
// 		return super.supportsInterface(interfaceId);
// 	}
// }
