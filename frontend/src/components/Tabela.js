import React from "react";

export function Tabela({ usersWithBalances }) {
  return (
    <div className="card">
      <div className="card-header bg-warning text-dark">
        <h5 className="text-center">Classificação</h5>
      </div>
      <div className="card-body p-0">
        <table className="table table-striped table-bordered mb-0">
          <thead className="table-warning">
            <tr>
              <th className="text-center">Codinome</th>
              <th className="text-center">Qtd. saTurings</th>
            </tr>
          </thead>
          <tbody>
            {usersWithBalances.map((user, index) => (
              <tr key={index}>
                <td className="text-center">{user.codinome}</td>
                <td className="text-center">{user.balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}