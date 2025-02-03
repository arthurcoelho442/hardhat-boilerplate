import React, { useState } from "react";

export function VoteAndIssue({ vote, issueTokens, isAdmin, balance }) {
  const [codinome, setCodinome] = useState("");
  const [amount, setAmount] = useState("");

  const handleVote = (event) => {
    event.preventDefault();
    if (codinome && amount) {
      vote(codinome, amount);
    }
  };

  const handleIssueTokens = (event) => {
    event.preventDefault();
    if (codinome && amount) {
      issueTokens(codinome, amount);
    }
  };

  // Se for admin e não houver saldo, só deve aparecer a opção para emitir tokens
  if (isAdmin && balance.eq(0)) {
    return (
      <div>
        <h4>Emitir Tokens</h4>
        <form>
          <div className="form-group">
            <label>Codinome</label>
            <input
              className="form-control"
              type="text"
              name="codinome"
              value={codinome}
              onChange={(e) => setCodinome(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Quantidade de saTurings</label>
            <input
              className="form-control"
              type="number"
              step="1"
              name="amount"
              placeholder="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="form-group d-flex mt-3">
            <button className="btn btn-success" onClick={handleIssueTokens}>
              Emitir Tokens
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Se for admin e tiver saldo, exibe a opção de votar e emitir tokens
  if (isAdmin && balance.gt(0)) {
    return (
      <div>
        <h4>Votar ou Emitir Tokens</h4>
        <form>
          <div className="form-group">
            <label>Codinome</label>
            <input
              className="form-control"
              type="text"
              name="codinome"
              value={codinome}
              onChange={(e) => setCodinome(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Quantidade de saTurings</label>
            <input
              className="form-control"
              type="number"
              step="1"
              name="amount"
              placeholder="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="form-group d-flex mt-3">
            <button className="btn btn-primary mr-3" onClick={handleVote}>
              Votar
            </button>
            <button className="btn btn-success" onClick={handleIssueTokens}>
              Emitir Tokens
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Se não for admin e tiver saldo, exibe a opção de votar
  if (!isAdmin && balance.gt(0)) {
    return (
      <div>
        <h4>Votar</h4>
        <form>
          <div className="form-group">
            <label>Codinome</label>
            <input
              className="form-control"
              type="text"
              name="codinome"
              value={codinome}
              onChange={(e) => setCodinome(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Quantidade de saTurings</label>
            <input
              className="form-control"
              type="number"
              step="1"
              name="amount"
              placeholder="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="form-group d-flex mt-3">
            <button className="btn btn-primary" onClick={handleVote}>
              Votar
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Se não for admin e não houver saldo, não exibe nada
  return null;
}