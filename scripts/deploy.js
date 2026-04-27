import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("Démarrage du déploiement...");

  
  const Token = await hre.ethers.getContractFactory("DataToken");
  const token = await Token.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log(`DataToken déployé à l'adresse: ${tokenAddress}`);

  
  const Registry = await hre.ethers.getContractFactory("DatasetRegistry");
  const registry = await Registry.deploy(tokenAddress);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`DatasetRegistry déployé à l'adresse: ${registryAddress}`);

  
  console.log("Configuration des droits de mint...");
  const tx = await token.setRegistryAddress(registryAddress);
  await tx.wait();
  console.log("Droits configurés avec succès !");

  
  const frontendDir = path.join(__dirname, "../frontend/src/contracts");
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  const contractAddresses = {
    DataToken: tokenAddress,
    DatasetRegistry: registryAddress
  };

  fs.writeFileSync(
    path.join(frontendDir, "addresses.json"),
    JSON.stringify(contractAddresses, undefined, 2)
  );

  
  const tokenArtifact = await hre.artifacts.readArtifact("DataToken");
  const registryArtifact = await hre.artifacts.readArtifact("DatasetRegistry");

  fs.writeFileSync(
    path.join(frontendDir, "DataToken.json"),
    JSON.stringify(tokenArtifact, undefined, 2)
  );
  fs.writeFileSync(
    path.join(frontendDir, "DatasetRegistry.json"),
    JSON.stringify(registryArtifact, undefined, 2)
  );

  console.log("Adresses et ABIs exportés vers le frontend.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
