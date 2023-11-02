import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      accounts: [
        {
          privateKey: '0x0101010101010101010101010101010101010101010101010101010101010101',
          balance: "10000000000000000000000"
        },
        {
          privateKey: '0x0202020202020202020202020202020202020202020202020202020202020202',
          balance: "0"
        },
        {
          privateKey: '0x0303030303030303030303030303030303030303030303030303030303030303',
          balance: "0"
        },
        {
          privateKey: '0x0404040404040404040404040404040404040404040404040404040404040404',
          balance: "0"
        }
      ]      
    }
  }
};

export default config;
