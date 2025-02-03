import React from "react";

export function NoTokensMessage({ selectedAddress }) {
  return (
    <>
      <p>Você não tem saTurings para votação</p>
      <p>
        Para conseguir mais peça para os administradores ou execute o comando abaixo:
        <br />
        <br />
        <code>npx hardhat --network localhost faucet {selectedAddress}</code>
      </p>
    </>
  );
}