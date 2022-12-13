import BN from 'bn.js';
import * as fs from 'fs';
import glob from 'glob';
import Web3 from 'web3';
import { DEFAULT_GAS, DEFAULT_GAS_PRICE } from './interfaces';
import crypto from 'crypto';

export const BIPS = 10_000;

export interface ContractWithAbi {
   contract: any;
   abi: string;
}

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
   if ((padToBytes as any) > 0) {
      return Web3.utils.leftPad(Web3.utils.toHex(x), padToBytes! * 2);
   }
   return Web3.utils.toHex(x);
}

export function toBN(x: string | number | BN, toZeroIfFails = false) {
   if (x && x.constructor?.name === 'BN') return x as BN;
   try {
      return Web3.utils.toBN(x as any);
   } catch (e) {
      if (toZeroIfFails) {
         return Web3.utils.toBN(0);
      }
      throw new Error(e);
   }
}

export function getWeb3(rpcLink: string, logger?: any) {
   const web3 = new Web3();
   if (rpcLink.startsWith('http')) {
      web3.setProvider(new Web3.providers.HttpProvider(rpcLink));
   } else if (rpcLink.startsWith('ws')) {
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
      provider.on('close', () => {
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
   let contractData = await getWeb3ContractWithAbi(web3, address, name);
   return contractData.contract;
}

export async function getWeb3ContractWithAbi(web3: any, address: string, name: string): Promise<ContractWithAbi> {
   let abiPath = '';
   try {
      abiPath = await relativeContractABIPathForContractName(name, 'artifacts');
      let abi = getAbi(`artifacts/${abiPath}`);
      return {
         contract: new web3.eth.Contract(abi, address),
         abi,
      };
   } catch (e: any) {
      console.error(`getWeb3Contract error - ABI not found: ${e}`);
   }
}

export function prefix0x(tx: string) {
   if (!tx) {
      return '0x0';
   }
   return tx.startsWith('0x') ? tx : '0x' + tx;
}

export function getWeb3Wallet(web3: Web3, privateKey: string) {
   return web3.eth.accounts.privateKeyToAccount(prefix0x(privateKey));
}

export function waitFinalize3Factory(web3: Web3) {
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
            throw new Error('Response timeout');
         }
         console.log(`Delay backoff ${delay} (${cnt})`);
      }
      return res;
   };
}

export async function relativeContractABIPathForContractName(name: string, artifactsRoot = 'artifacts'): Promise<string> {
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
}

export function etherToValue(web3: Web3, eth: number) {
   return web3.utils.toWei(web3.utils.toBN(eth), 'ether');
}

// time
export function getUnixEpochTimestamp() {
   return Math.floor(Date.now() / 1000);
}

export function secToHHMMSS(time: number, secDecimals = 0) {
   const days = Math.floor(time / (3600 * 24));
   let hours = Math.floor(time / 3600);
   const minutes = Math.floor((time - hours * 3600) / 60);
   const seconds = round(time - hours * 3600 - minutes * 60, secDecimals);

   hours = hours % 24;

   let sdays = '';

   if (days > 0) {
      sdays = days.toString() + ' ';
   }

   const shours: string = hours.toString().padStart(2, '0');
   const smin: string = minutes.toString().padStart(2, '0');
   const ssec: string = seconds.toString().padStart(2, '0');

   return sdays + shours + ':' + smin + ':' + ssec;
}

export function formatBN(val: any, decimals = 5) {
   let sm = val.toString();
   if (!sm || sm === '0' || sm === '') {
      return '0';
   }
   return sm.toString().slice(0, -18) + '.' + sm.toString().slice(-18).slice(0, decimals);
}

export async function sendETH(
   web3: Web3,
   privateKey: string,
   toAddress: string,
   amount: number | string | BN,
   gas = DEFAULT_GAS,
   gasPrice = DEFAULT_GAS_PRICE
) {
   let sender = web3.eth.accounts.privateKeyToAccount(privateKey);
   let tx = {
      from: sender.address,
      to: toAddress,
      value: amount.toString(),
      gas,
      gasPrice,
   };
   let signed = (await sender.signTransaction(tx)).rawTransaction;
   let receipt = await web3.eth.sendSignedTransaction(signed);
   return receipt;
}

export function stringDecimalETHToWei(ethValue: string) {
   let [whole, decimal] = ethValue.split('.');
   decimal = (decimal || '').slice(0, 18);
   decimal = Web3.utils.padRight(decimal, 18);
   return whole + decimal;
}

export function randomByWeights<T>(values: T[], weights: number[]): T {
   if (values.length != weights.length) {
      throw new Error('Lengths do not match');
   }
   if (!values.length) {
      throw new Error('Empty choices now allowed');
   }

   let total = weights.reduce((a, b) => a + b);
   let rand = safeRandom() * total;
   let sum = 0;
   for (let i = 0; i < values.length; i++) {
      let weight = weights[i];
      if (sum + weight > rand) {
         return values[i];
      }
      sum += weight;
   }
   return values[values.length - 1];
}

export async function delayPromise<T>(call: () => Promise<T>, delayMs = 100) {
   await sleepms(delayMs);
   return call();
}

export function safeRandom() {
    return crypto.randomInt(0xffffffff)/0xffffffff;
}
