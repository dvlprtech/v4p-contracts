import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import 'solidity-docgen';

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  docgen: {
    outputDir: './doc',    
  }, 
  networks: {
    hardhat: {
      accounts: [
        { /* Owner */
          privateKey: '0x0101010101010101010101010101010101010101010101010101010101010101',
          balance: "10000000000000000000000"
        },
        { /* Alice */
          privateKey: '0x0202020202020202020202020202020202020202020202020202020202020202',
          balance: "0"
        },
        { /* Bob */
          privateKey: '0x0303030303030303030303030303030303030303030303030303030303030303',
          balance: "0"
        },
        { /* Carl */
          privateKey: '0x0404040404040404040404040404040404040404040404040404040404040404',
          balance: "10000000000000000000000"
        },
        { /* David */
          privateKey: '0x0505050505050505050505050505050505050505050505050505050505050505',
          balance: "10000000000000000000000"
        },
        { /* Erik */
          privateKey: '0x0606060606060606060606060606060606060606060606060606060606060606',
          balance: "10000000000000000000000"
        },
        { /* Frank */
          privateKey: '0x0707070707070707070707070707070707070707070707070707070707070707',
          balance: "10000000000000000000000"
        },
        { /* Gina */
          privateKey: '0x0808080808080808080808080808080808080808080808080808080808080808',
          balance: "10000000000000000000000"
        }
      ]      
    }
  }
};

export default config;
