import React from "react";
import { ethers } from "ethers";
import TokenArtifact from "../contracts/Token.json";
import contractAddress from "../contracts/contract-address.json";
import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { VoteAndIssue } from "./VoteAndIssue";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { NoTokensMessage, NoTokensMessageAdmin } from "./NoTokensMessage";
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
      votingStatus: 0,
      eError: undefined,
      codinome: undefined,
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
              Bem-vindo!{" "}
              {this.state.codinome ? (
                <b>{this.state.codinome}</b>
              ) : (
                <span>Carregando codinome...</span>
              )}
              , você tem{" "}
              <b>
                {ethers.utils.formatEther(this.state.balance)} Turings
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

            {this.state.eError && (
              <div className="alert alert-danger" role="alert">
                {this.state.eError}
              </div>
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            {this.state.balance.eq(0) && (
              this.state.isAdmin ? (
                <NoTokensMessageAdmin selectedAddress={this.state.selectedAddress} />
              ) : (
                <NoTokensMessage selectedAddress={this.state.selectedAddress} />
              )
            )}

            {this.state.balance && (
              <VoteAndIssue
                vote={(codinome, amount) => this._vote(codinome, amount)}
                issueTokens={(codinome, amount) => this._issueTokens(codinome, amount)}
                isAdmin={this.state.isAdmin}
                balance={this.state.balance}
              />
            )}
          </div>

          <div className="col-md-6">
            {this.state.usersWithBalances.length > 0 && (
              <Tabela usersWithBalances={this.state.usersWithBalances}/>
            )}

            <br />
            <p>
              Estado atual da votação: 
              <span className={this.state.votingStatus === 0 ? "text-success" : "text-danger"}>
                {this.state.votingStatus === 0 ? " Ativa" : " Desativada"}
              </span>
            </p>

            {this.state.isAdmin && (
              <div>
                {this.state.votingStatus === 0 ? (
                  <button
                    className="btn btn-danger"
                    onClick={async () => {
                      const tx = await this._token.votingOff();
                      await tx.wait();
                      this._updateVotingStatus();
                    }}
                  >
                    Desativar Votação
                  </button>
                ) : (
                  <button
                    className="btn btn-success"
                    onClick={async () => {
                      const tx = await this._token.votingOn();
                      await tx.wait();
                      this._updateVotingStatus();
                    }}
                  >
                    Ativar Votação
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  componentWillUnmount() {
    this._stopPollingData();
  }

  async componentDidMount() {
    this._initializeEthers();

    this._token.on('Voted', (voter, amount) => {
      this._updateBalance();
    });

    this._token.on('TokensIssued', (admin, recipient, amount) => {
      this._updateBalance(); 
    });
  }

  async _connectWallet() {
    const [selectedAddress] = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!selectedAddress) {
      console.error("Endereço da carteira não encontrado");
      return;
    }

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
    this._getCodinomeUser(userAddress);
    this._updateVotingStatus();
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

  async _getCodinomeUser(userAddress) {
    try {
      const codinome = await this._token.getCodinomeUser(userAddress);
      this.setState({ codinome });
    } catch (error) {
      console.error("Erro ao buscar codinome:", error);
      this.setState({ codinome: userAddress });
    }
  }

  async _getUsersWithBalances() {
    const [codinomes, balances] = await this._token.getUsersWithBalances();
    const usersWithBalances = codinomes
      .map((codinome, index) => ({
        codinome,
        balance: balances[index].toString(),
      }))
      .filter(user => user.balance !== '0');
  
    usersWithBalances.sort((a, b) => {
      return parseInt(b.balance) - parseInt(a.balance); 
    });
  
    this.setState({ usersWithBalances });
  }

  async _checkIfAdmin(userAddress) {
    const isAdmin = await this._token.isAdmin(userAddress);
    this.setState({ isAdmin });
  }

  async _updateVotingStatus() {
    const votingStatus = await this._token.votingStatus(); 
    this.setState({ votingStatus });
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
      this._dismissEError();

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
      
      if (error.reason) {
        const match = error.reason.match(/'([^']+)'/);
        this.setState({ eError: match[1] });
      } else {
        console.error(error);
        this.setState({ transactionError: error });
      }
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }

  async _vote(codinome, amount) {
    try {
      this._dismissTransactionError();
      this._dismissEError();

      if (!codinome) {
        console.error("Codinome inválido");
        return;
      }

      const tx = await this._token.vote(codinome, amount);
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

      if (error.reason) {
        const match = error.reason.match(/'([^']+)'/);
        this.setState({ eError: match[1] });
      } else {
        console.error(error);
        this.setState({ transactionError: error });
      }
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }

  _dismissEError() {
    this.setState({ eError: undefined });
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
      this.setState({
        networkError: `Por favor, conecte-se à rede correta (ID da rede: ${HARDHAT_NETWORK_ID})`,
      });
    }
  }
}