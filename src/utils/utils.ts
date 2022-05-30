import * as fs from "fs";
import glob from "glob";
import Web3 from "web3";
import BN from "bn.js";

export async function sleepms(milliseconds: number) {
   await new Promise((resolve: any) => {
      setTimeout(() => {
         resolve();
      }, milliseconds);
   });
}

export function round(x: number, decimal: number = 0) {
   if (decimal === 0) return Math.round(x);

   const dec10 = 10 ** decimal;

   return Math.round(x * dec10) / dec10;
}

export function toHex(x: string | number | BN, padToBytes?: number) {
   if (padToBytes as any > 0) {
      return Web3.utils.leftPad(Web3.utils.toHex(x), padToBytes! * 2);
   }
   return Web3.utils.toHex(x);
}


export function getWeb3(rpcLink: string, logger?: any) {
   const web3 = new Web3();
   if (rpcLink.startsWith("http")) {
      web3.setProvider(new Web3.providers.HttpProvider(rpcLink));
   } else if (rpcLink.startsWith("ws")) {
      const provider = new Web3.providers.WebsocketProvider(rpcLink, {
         // @ts-ignore
         clientConfig: {
            keepalive: true,
            keepaliveInterval: 60000, // milliseconds
         },
         reconnect: {
            auto: true,
            delay: 2500,
            onTimeout: true,
         },
      });
      provider.on("close", () => {
         if (logger) {
            logger.error(` ! Network WS connection closed.`);
         }
      });
      web3.setProvider(provider);
   }
   web3.eth.handleRevert = true;
   // web3.eth.defaultCommon = { customChain: { name: 'coston', chainId: 20210413, networkId: 20210413 }, baseChain: 'ropsten', hardfork: 'petersburg' };
   //    }
   return web3;
}

export function getAbi(abiPath: string) {
   let abi = JSON.parse(fs.readFileSync(abiPath).toString());
   if (abi.abi) {
      abi = abi.abi;
   }
   return abi;
}

export async function getWeb3Contract(web3: any, address: string, name: string) {
   let abiPath = "";
   try {
      abiPath = await relativeContractABIPathForContractName(name, "artifacts");
      return new web3.eth.Contract(getAbi(`artifacts/${abiPath}`), address);
   } catch (e: any) {
      try {
         abiPath = await relativeContractABIPathForContractName(name, "data/artifacts");
         return new web3.eth.Contract(getAbi(`data/artifacts/${abiPath}`), address);
      }
      catch (e2) {
         console.error(`getWeb3Contract error - ABI not found (run yarn c): ${e2}`);
      }
   }
}

export function prefix0x(tx: string) {
   if (!tx) {
      return "0x0";
   }
   return tx.startsWith("0x") ? tx : "0x" + tx;
}

export function getWeb3Wallet(web3: any, privateKey: string) {
   return web3.eth.accounts.privateKeyToAccount(prefix0x(privateKey));
}

export function waitFinalize3Factory(web3: any) {
   return async (address: string, func: () => any, delay: number = 1000) => {
      const nonce = await web3.eth.getTransactionCount(address);
      const res = await func();
      const backoff = 1.5;
      let cnt = 0;
      while ((await web3.eth.getTransactionCount(address)) === nonce) {
         await new Promise((resolve: any) => {
            setTimeout(() => {
               resolve();
            }, delay);
         });
         if (cnt < 8) {
            delay = Math.floor(delay * backoff);
            cnt++;
         } else {
            throw new Error("Response timeout");
         }
         console.log(`Delay backoff ${delay} (${cnt})`);
      }
      return res;
   };
}

export async function relativeContractABIPathForContractName(name: string, artifactsRoot = "artifacts"): Promise<string> {
   return new Promise((resolve, reject) => {
      glob(`contracts/**/${name}.sol/${name}.json`, { cwd: artifactsRoot }, (er: any, files: string[] | null) => {
         if (er) {
            reject(er);
         } else {
            if (files && files.length === 1) {
               resolve(files[0]);
            } else {
               reject(files);
            }
         }
      });
   });
}

export async function getCryptoSafeRandom() {
   return Web3.utils.randomHex(32);
};

export function etherToValue(web3: Web3, eth: number) {
   return web3.utils.toWei(web3.utils.toBN(eth), "ether");
}

// time
export function getUnixEpochTimestamp() {
   return Math.floor(Date.now() / 1000);
}

export function prettyPrintObject(normalized: any) {
   let res: any = {};
   for (let key in normalized) {
      let obj = (normalized as any)[key];
      if (typeof obj === "object") {
         res[key] = (normalized as any)[key]?.toString();
      } else {
         res[key] = (normalized as any)[key];
      }
   }
   console.log(JSON.stringify(res, null, 2));
}

export function secToHHMMSS(time: number, secDecimals = 0) {
   const days = Math.floor(time / (3600 * 24));
   let hours = Math.floor(time / 3600);
   const minutes = Math.floor((time - (hours * 3600)) / 60);
   const seconds = round(time - (hours * 3600) - (minutes * 60), secDecimals);

   hours = hours % 24;

   let sdays = "";

   if (days > 0) {
      sdays = days.toString() + " ";
   }

   const shours: string = hours.toString().padStart(2, "0")
   const smin: string = minutes.toString().padStart(2, "0")
   const ssec: string = seconds.toString().padStart(2, "0")

   return sdays + shours + ':' + smin + ':' + ssec;
}

export async function refreshArtifacts(contracts: string[], artifactsPath = '../flare-smart-contracts/artifacts') {
   const fse = require('fs-extra');
   const path = require('path');

   for (let contract of contracts) {
      let abiPath = "";
      try {
         abiPath = await relativeContractABIPathForContractName(contract, artifactsPath);
      } catch (e: any) {
         console.log(`Cannot find contract ${contract}`)
         continue;
      }
      fse.copySync(path.join(artifactsPath, abiPath), path.join("artifacts", abiPath));
   }

}



