import React from "react";

export function NoTokensMessage({ selectedAddress }) {
  return (
    <>
      <p>Você não tem saTurings para votação</p>
      <p>
        Para obter mais, solicite aos administradores ou execute o comando abaixo:
        <br />
        <br />
        <code>npx hardhat --network localhost faucet {selectedAddress}</code>
      </p>
    </>
  );
}

export function NoTokensMessageAdmin({ selectedAddress }) {
  return (
    <>
      <p>Você não tem saTurings para votação, emita Tokens abaixo: </p>
    </>
  );
}