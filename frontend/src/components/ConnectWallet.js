import React from "react";
import { NetworkErrorMessage } from "./NetworkErrorMessage";

export function ConnectWallet({ connectWallet, networkError, dismiss }) {
  return (
    <div
      className="container d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh" }}
    >
      <div className="row text-center">
        <div className="col-12">
          {networkError && (
            <NetworkErrorMessage message={networkError} dismiss={dismiss} />
          )}
        </div>
        <div className="col-12 mb-3">
          <p className="lead">Por favor, conecte sua wallet.</p>
        </div>
        <div className="col-12 d-flex justify-content-center">
        <button
          className="btn btn-warning btn-lg d-flex align-items-center"
          type="button"
          onClick={connectWallet}
        >
          <img
            src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/metamask-icon.png" // Caminho da imagem
            alt="MetaMask Fox"
            style={{ width: "24px", height: "24px", marginRight: "10px" }}
          />
          Conectar Wallet
        </button>
        </div>
      </div>
    </div>
  );
}