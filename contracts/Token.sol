//SPDX-License-Identifier: UNLICENSED

// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.20;

// We import this library to be able to use console.log
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Token is ERC20, AccessControl {
    using Strings for uint256;
    struct User {
        address addr;
        address[] votados;
    }

    enum Voting {
        ON,
        OFF
    }
    Voting public votingStatus;

    address public owner;
    address professora = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    
    bytes32 public constant ADMIN_ROLE  = keccak256("ADMIN_ROLE");
    bytes32 public constant USER_ROLE   = keccak256("USER_ROLE");

    mapping(string => User) public users;
    modifier openVoting() {
        require(votingStatus == Voting.ON, 'Votacao encerrada');
        _;
    }

    event Voted(address indexed voter, address indexed votedAddr, uint256 amount);
    event TokensIssued(address indexed admin, address indexed recipient, uint256 amount);

    constructor() ERC20("saTurings", "SAT") {
        address[19] memory addrs = [
            0x70997970C51812dc3A010C7d01b50e0d17dc79C8,
            0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC,
            0x90F79bf6EB2c4f870365E785982E1f101E93b906,
            0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65,
            0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc,
            0x976EA74026E726554dB657fA54763abd0C3a0aa9,
            0x14dC79964da2C08b23698B3D3cc7Ca32193d9955,
            0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f,
            0xa0Ee7A142d267C1f36714E4a8F75612F20a79720,
            0xBcd4042DE499D14e55001CcbB24a551F3b954096,
            0x71bE63f3384f5fb98995898A86B02Fb2426c5788,
            0xFABB0ac9d68B0B445fB7357272Ff202C5651694a,
            0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec,
            0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097,
            0xcd3B766CCDd6AE721141F452C550Ca635964ce71,
            0x2546BcD3c84621e976D8185a91A922aE77ECEc30,
            0xbDA5747bFD65F08deb54cb465eB87D40e51B197E,
            0xdD2FD4581271e230360230F9337D5c0430Bf44C0,
            0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199
        ];

        string memory codinome;
        owner = msg.sender;
        votingStatus = Voting.ON;

        // ADMIN
        _grantRole(DEFAULT_ADMIN_ROLE, owner);
        _grantRole(ADMIN_ROLE, owner);
        _grantRole(ADMIN_ROLE, professora);

        // USERS
        for(uint i = 0; i < addrs.length; i++){
            codinome = string(abi.encodePacked("nome", (i + 1).toString()));
            users[codinome].addr = addrs[i];
            _grantRole(USER_ROLE, addrs[i]);
        }
        _grantRole(USER_ROLE, owner);
    }

    function issueToken(string memory codinome, uint256 amount) public onlyRole(ADMIN_ROLE) {
        require(users[codinome].addr != address(0), "Usuario nao encontrado");
        _mint(users[codinome].addr, amount);
        emit TokensIssued(msg.sender, users[codinome].addr, amount);
    }

    function vote(string memory codinome, uint256 amount) openVoting() public onlyRole(USER_ROLE) {
        // Verifica se a quantidade de tokens está dentro do limite
        require(amount <= 2 * (10 ** 18), 'Valor acima do montante de saTurings permitido');
        
        // Impede o autovoto
        address addrVoto = users[codinome].addr;
        require(msg.sender != addrVoto, 'Nao e possivel votar em si mesmo');
        
        // Verifica se o usuário já votou no destinatário
        string memory codinomeUser = getCodinomeUser(msg.sender);
        for (uint i = 0; i < users[codinomeUser].votados.length; i++) {
            require(users[codinomeUser].votados[i] != addrVoto, 'Usuario ja votado');
        }

        // Registra o voto e recompensa
        users[codinomeUser].votados.push(addrVoto);
        _mint(addrVoto, amount);            // Mint de tokens para quem foi votado
        _mint(msg.sender, 2 * (10 ** 17));  // Mint de tokens como recompensa

        // Emite o evento de votação
        emit Voted(msg.sender, addrVoto, amount);
    }

    function votingOn() public onlyRole(ADMIN_ROLE) {
        votingStatus = Voting.ON;
    }

    function votingOff() public onlyRole(ADMIN_ROLE) {
        votingStatus = Voting.OFF;
    }

    function isAdmin(address user) public view returns (bool) {
        return hasRole(ADMIN_ROLE, user);
    }

    function getCodinomeUser(address addrSender) public view returns ( string memory ) {
        string memory codinome;
        for (uint i = 0; i < 19; i++) {
            codinome = string(abi.encodePacked("nome", (i + 1).toString()));
            if (users[codinome].addr == addrSender) {
                return codinome;
            }
        }
        revert("Usuario nao encontrado");
    }

    function getUsersWithBalances() public view returns (string[] memory, uint256[] memory) {
        string[] memory codinomes = new string[](19);
        uint256[] memory balances = new uint256[](19);
        string memory  codinome;
        uint256 balance;

        for (uint i = 0; i < 19; i++) {
            codinome    = string(abi.encodePacked("nome", (i + 1).toString()));
            balance     = balanceOf(users[codinome].addr);
            if (balance > 0){
                codinomes[i]    = codinome;
                balances[i]     = balance;
            }
        }

        return (codinomes, balances);
    }
}
