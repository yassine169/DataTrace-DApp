
pragma solidity ^0.8.24;

interface IDataToken {
    function mint(address to, uint256 amount) external;
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract DatasetRegistry {
    struct DatasetVersion {
        string cid;          
        string dataHash;     
        string notebookCid;  
        uint256 timestamp;   
    }

    struct Review {
        address reviewer;
        uint8 rating; 
        string comment;
        uint256 timestamp;
    }

    struct Dataset {
        uint256 id;
        address owner;
        string title;
        string description;
        uint256 price;       
        uint256 versionCount;
        uint256 totalTips;   
    }

    uint256 public nextDatasetId = 1; 
    mapping(uint256 => Dataset) public datasets;
    mapping(uint256 => mapping(uint256 => DatasetVersion)) public datasetVersions;
    mapping(uint256 => mapping(address => bool)) public hasAccess;
    
    
    mapping(uint256 => Review[]) public datasetReviews;
    mapping(uint256 => mapping(address => bool)) public hasReviewed;

    uint256[] public publishedDatasetIds;

    IDataToken public tokenContract;
    uint256 public constant REWARD_AMOUNT = 10 * 10**18; 

    event DatasetCreated(uint256 indexed id, address indexed owner, string title, uint256 price);
    event VersionAdded(uint256 indexed id, uint256 versionIndex, string cid, string notebookCid);
    event DatasetPurchased(uint256 indexed id, address indexed buyer, uint256 price);
    event ReviewAdded(uint256 indexed id, address indexed reviewer, uint8 rating);
    event Tipped(uint256 indexed id, address indexed tipper, uint256 amount);

    constructor(address _tokenAddress) {
        tokenContract = IDataToken(_tokenAddress);
    }

    function createDataset(
        string memory _title, string memory _description, uint256 _price,
        string memory _cid, string memory _dataHash, string memory _notebookCid
    ) public {
        uint256 newId = nextDatasetId++;
        datasets[newId] = Dataset(newId, msg.sender, _title, _description, _price, 1, 0);
        datasetVersions[newId][0] = DatasetVersion(_cid, _dataHash, _notebookCid, block.timestamp);
        hasAccess[newId][msg.sender] = true; 
        publishedDatasetIds.push(newId);

        emit DatasetCreated(newId, msg.sender, _title, _price);
        tokenContract.mint(msg.sender, REWARD_AMOUNT);
    }

    function publishNewVersion(
        uint256 _datasetId, string memory _cid, string memory _dataHash, string memory _notebookCid
    ) public {
        require(datasets[_datasetId].id != 0, "Dataset n'existe pas");
        require(datasets[_datasetId].owner == msg.sender, "Seul le proprietaire peut ajouter une version");

        uint256 vIndex = datasets[_datasetId].versionCount;
        datasetVersions[_datasetId][vIndex] = DatasetVersion(_cid, _dataHash, _notebookCid, block.timestamp);
        datasets[_datasetId].versionCount++;
        
        tokenContract.mint(msg.sender, REWARD_AMOUNT / 2);
    }

    function buyAccess(uint256 _datasetId) public {
        require(datasets[_datasetId].id != 0, "Dataset n'existe pas");
        require(!hasAccess[_datasetId][msg.sender], "Acces deja possede");
        uint256 price = datasets[_datasetId].price;
        require(price > 0, "Le dataset est gratuit");

        bool success = tokenContract.transferFrom(msg.sender, datasets[_datasetId].owner, price);
        require(success, "Echec du transfert de tokens");

        hasAccess[_datasetId][msg.sender] = true;
        emit DatasetPurchased(_datasetId, msg.sender, price);
    }

    
    function addReview(uint256 _datasetId, uint8 _rating, string memory _comment) public {
        require(datasets[_datasetId].id != 0, "Dataset n'existe pas");
        require(checkAccess(_datasetId, msg.sender), "Vous devez avoir acces au dataset pour le noter");
        require(!hasReviewed[_datasetId][msg.sender], "Vous avez deja note ce dataset");
        require(_rating >= 1 && _rating <= 5, "La note doit etre entre 1 et 5");

        datasetReviews[_datasetId].push(Review(msg.sender, _rating, _comment, block.timestamp));
        hasReviewed[_datasetId][msg.sender] = true;
        
        emit ReviewAdded(_datasetId, msg.sender, _rating);
    }

    
    function tipOwner(uint256 _datasetId, uint256 _tipAmount) public {
        require(datasets[_datasetId].id != 0, "Dataset n'existe pas");
        require(_tipAmount > 0, "Le montant doit etre superieur a 0");
        
        address owner = datasets[_datasetId].owner;
        require(msg.sender != owner, "Vous ne pouvez pas vous faire un don");

        bool success = tokenContract.transferFrom(msg.sender, owner, _tipAmount);
        require(success, "Echec du transfert de tokens");

        datasets[_datasetId].totalTips += _tipAmount;
        emit Tipped(_datasetId, msg.sender, _tipAmount);
    }

    function getDatasets() public view returns (Dataset[] memory) {
        uint256 count = publishedDatasetIds.length;
        Dataset[] memory allDatasets = new Dataset[](count);
        for (uint256 i = 0; i < count; i++) {
            allDatasets[i] = datasets[publishedDatasetIds[i]];
        }
        return allDatasets;
    }

    function getVersions(uint256 _datasetId) public view returns (DatasetVersion[] memory) {
        uint256 count = datasets[_datasetId].versionCount;
        DatasetVersion[] memory versions = new DatasetVersion[](count);
        for (uint256 i = 0; i < count; i++) {
            versions[i] = datasetVersions[_datasetId][i];
        }
        return versions;
    }

    function getReviews(uint256 _datasetId) public view returns (Review[] memory) {
        return datasetReviews[_datasetId];
    }

    function checkAccess(uint256 _datasetId, address _user) public view returns (bool) {
        if (datasets[_datasetId].price == 0) return true;
        return hasAccess[_datasetId][_user];
    }
}
