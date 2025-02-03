import React from "react";
import { ethers } from "ethers";
import TokenArtifact from "../contracts/Token.json";
import contractAddress from "../contracts/contract-address.json";
import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { IssueTokens } from "./IssueTokens"; 
import { Vote } from "./Vote";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { NoTokensMessage } from "./NoTokensMessage";
import { Tabela } from "./Tabela";

const HARDHAT_NETWORK_ID = '31337';
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    this.initialState = {
      tokenData: undefined,
      selectedAddress: undefined,
      balance: undefined,
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
      isAdmin: false,
      usersWithBalances: [],
    };

    this.state = this.initialState;
  }

  render() {
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }
  
    if (!this.state.selectedAddress) {
      return (
        <ConnectWallet 
          connectWallet={() => this._connectWallet()} 
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }
  
    if (!this.state.tokenData || !this.state.balance) {
      return <Loading />;
    }
  
    return (
      <div className="container p-4">
        <div className="row">
          <div className="col-12">
            <h1>
              {this.state.tokenData.name} ({this.state.tokenData.symbol})
            </h1>
            <p>
              Bem vindo <b>{this.state.selectedAddress}</b>, você tem {" "}
              <b>
                {ethers.utils.formatEther(this.state.balance)}  Turings{/* {this.state.tokenData.symbol} */}
              </b> 
              .
            </p>
          </div>
        </div>
  
        <hr />
  
        <div className="row">
          <div className="col-12">
            {this.state.txBeingSent && (
              <WaitingForTransactionMessage txHash={this.state.txBeingSent} />
            )}
  
            {this.state.transactionError && (
              <TransactionErrorMessage
                message={this._getRpcErrorMessage(this.state.transactionError)}
                dismiss={() => this._dismissTransactionError()}
              />
            )}
            
            {/* Exibir erros de votação */}
            {this.state.voteError && (
              <div className="alert alert-danger" role="alert">
                {this.state.voteError}
              </div>
            )}
          </div>
        </div>
  
        <div className="row">
          {/* Coluna para Vote e IssueTokens */}
          <div className="col-md-6">
            {this.state.balance.eq(0) && (
              <NoTokensMessage selectedAddress={this.state.selectedAddress} />
            )}
  
            {this.state.balance.gt(0) && (
              <Vote vote={(codinome, amount) => this._vote(codinome, amount)} />
            )}
  
            {this.state.isAdmin && (
              <IssueTokens
                issueTokens={(codinome, amount) => this._issueTokens(codinome, amount)}
              />
            )}
          </div>
  
          {/* Coluna para a tabela */}
          <div className="col-md-6">
            <Tabela usersWithBalances={this.state.usersWithBalances}/>
          </div>
        </div>
      </div>
    );
  }
  

  componentWillUnmount() {
    this._stopPollingData();
  }

  async _connectWallet() {
    const [selectedAddress] = await window.ethereum.request({ method: 'eth_requestAccounts' });
    this._checkNetwork();
    this._initialize(selectedAddress);

    window.ethereum.on("accountsChanged", ([newAddress]) => {
      this._stopPollingData();
      if (newAddress === undefined) {
        return this._resetState();
      }
      this._initialize(newAddress);
    });
  }

  _initialize(userAddress) {
    this.setState({
      selectedAddress: userAddress,
    });

    this._initializeEthers();
    this._getTokenData();
    this._startPollingData();
    this._checkIfAdmin(userAddress);
    this._getUsersWithBalances();
  }

  async _initializeEthers() {
    this._provider = new ethers.providers.Web3Provider(window.ethereum);
    this._token = new ethers.Contract(
      contractAddress.Token,
      TokenArtifact.abi,
      this._provider.getSigner(0)
    );
  }

  _startPollingData() {
    this._pollDataInterval = setInterval(() => this._updateBalance(), 1000);
    this._updateBalance();
  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  async _getUsersWithBalances() {
    const [codinomes, balances] = await this._token.getUsersWithBalances();
    
    const usersWithBalances = codinomes
      .map((codinome, index) => ({
        codinome,
        balance: balances[index].toString(),
      }))
      .filter(user => user.balance !== '0'); // Filtra usuários com saldo diferente de 0
  
    this.setState({ usersWithBalances });
  }
  
  
  async _checkIfAdmin(userAddress) {
    const isAdmin = await this._token.isAdmin(userAddress);
    this.setState({ isAdmin });
  }

  async _getTokenData() {
    const name = await this._token.name();
    const symbol = await this._token.symbol();
    this.setState({ tokenData: { name, symbol } });
  }

  async _updateBalance() {
    const balance = await this._token.balanceOf(this.state.selectedAddress);
    this.setState({ balance });
    this._getUsersWithBalances();
  }

  async _issueTokens(codinome, amount) {
    try {
      this._dismissTransactionError();
      const tx = await this._token.issueToken(codinome, amount);
      this.setState({ txBeingSent: tx.hash });
      const receipt = await tx.wait();
      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }
      await this._updateBalance();
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }

  async _vote(codinome, amount) {
    try {
      this._dismissTransactionError();
      this._dismissVoteError(); // Limpar erros de votação anteriores

      const tx = await this._token.vote(codinome, amount);
      this.setState({ txBeingSent: tx.hash });

      // Aguardar a confirmação da transação
      const receipt = await tx.wait();

      // Verificar se a transação foi bem-sucedida
      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }

      // Atualizar o saldo após a votação
      await this._updateBalance();
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return; // Usuário rejeitou a transação
      }

      // Capturar o evento VoteFailed
      if (error.reason) {
        this.setState({ voteError: error.reason }); // Exibir a mensagem de erro
      } else {
        console.error(error);
        this.setState({ transactionError: error });
      }
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }

  _dismissVoteError() {
    this.setState({ voteError: undefined });
  }
  
  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message;
    }
    return error.message;
  }

  _resetState() {
    this.setState(this.initialState);
  }

  async _switchChain() {
    const chainIdHex = `0x${HARDHAT_NETWORK_ID.toString(16)}`;
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    await this._initialize(this.state.selectedAddress);
  }

  _checkNetwork() {
    if (window.ethereum.networkVersion !== HARDHAT_NETWORK_ID) {
      this._switchChain();
    }
  }
}