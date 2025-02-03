// Importações necessárias
const path = require("path");

async function main() {
  // Verificação de rede
  if (network.name === "hardhat") {
    console.warn(
      "You are trying to deploy a contract to the Hardhat Network, which" +
        " gets automatically created and destroyed every time. Use the Hardhat" +
        " option '--network localhost'"
    );
  }

  // Obtém a conta do deployer (quem está implantando o contrato)
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );

  // Exibe o saldo da conta do deployer
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Obtém o contrato Token para implantação
  const Token = await ethers.getContractFactory("Token");
  const token = await Token.deploy({gasLimit: 3e7}); // Implanta o contrato
  await token.deployed(); // Aguarda a confirmação da implantação

  console.log("Token address:", token.address);

  // Salva os arquivos do contrato no diretório do frontend
  saveFrontendFiles(token);
}

// Função para salvar os arquivos do contrato no frontend
function saveFrontendFiles(token) {
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");

  // Cria o diretório de contratos se ele não existir
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  // Salva o endereço do contrato em um arquivo JSON
  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ Token: token.address }, undefined, 2)
  );

  // Obtém o artifact do contrato Token
  const TokenArtifact = artifacts.readArtifactSync("Token");

  // Salva o artifact do contrato em um arquivo JSON
  fs.writeFileSync(
    path.join(contractsDir, "Token.json"),
    JSON.stringify(TokenArtifact, null, 2)
  );
}

// Executa o script de implantação
main()
  .then(() => process.exit(0)) // Encerra o processo com sucesso
  .catch((error) => {
    console.error(error); // Exibe erros no console
    process.exit(1); // Encerra o processo com erro
  });