import React from "react";

export function Vote({ vote }) {
  return (
    <div>
      <h4>Vote</h4>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.target);
          const codinome = formData.get("codinome");
          const amount = formData.get("amount");

          if (codinome && amount) {
            vote(codinome, amount);
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
          <input className="btn btn-primary" type="submit" value="Vote" />
        </div>
      </form>
    </div>
  );
}