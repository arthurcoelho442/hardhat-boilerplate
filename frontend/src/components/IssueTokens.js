import React from "react";

export function IssueTokens({ issueTokens }) {
  return (
    <div>
      <h4>Issue Tokens</h4>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.target);
          const codinome = formData.get("codinome");
          const amount = formData.get("amount");

          if (codinome && amount) {
            issueTokens(codinome, amount);
          }
        }}
      >
        <div className="form-group">
          <label>Codinome</label>
          <input className="form-control" type="text" name="codinome" required />
        </div>
        <div className="form-group">
          <label>Quantidade de saTurings</label>
          <input
            className="form-control"
            type="number"
            step="1"
            name="amount"
            placeholder="1"
            required
          />
        </div>
        <div className="form-group">
          <input className="btn btn-primary" type="submit" value="Issue Tokens" />
        </div>
      </form>
    </div>
  );
}