import BN from 'bn.js';
import dotenv from 'dotenv';
import fs from 'fs';
import { PollingFoundation } from '../../typechain-web3-v1/PollingFoundation';
import { iocContainer } from '../ioc';
import { ConfigurationService } from '../services/ConfigurationService';
import { ContractService } from '../services/ContractService';
import { TestAccountsService } from '../services/TestAccountsService';
import { VoteType } from '../utils/enums';
import { delayPromise, formatBN, randomByWeights, sendETH, stringDecimalETHToWei, toHex } from '../utils/utils';

type ActionType =
   | 'settings'
   | 'contract'
   | 'propose'
   | 'castVote'
   | 'castAllVotesRandomly'
   | 'delegate'
   | 'undelegate'
   | 'wrap'
   | 'wrapAll'
   | 'unwrap'
   | 'fund'
   | 'generateAccounts'
   | 'accountStatus';

// initialize configuration
dotenv.config();

let yargs = require('yargs');

let args = yargs
   .option('network', { alias: 'n', type: 'string', description: 'The name of the network', default: 'coston' })
   .option('action', { alias: 'a', type: 'string', description: 'action' })
   .option('contract', {
      alias: 'c',
      type: 'string',
      default: 'PollingFoundation',
      description: 'Contract name to vote on (e.g. PollingFoundation, ...',
   })
   .option('senderIndex', { alias: 'i', type: 'number', description: 'sequential id of the proposer or voter' })
   .option('proposalDescription', { alias: 'd', type: 'string', description: 'proposal description' })
   .option('proposalId', { alias: 'p', type: 'string', description: 'proposal id' })
   .option('voteType', { alias: 'v', type: 'number', description: 'vote type 0 - against, 1 - for, 2 - abstain' })
   .option('delegationAddress', { alias: 'r', type: 'string', description: 'delegation address' })
   .option('contractName', { alias: 'm', type: 'string', description: 'contract name' })
   .option('amount', { alias: 't', type: 'string', description: 'amount for wrapping/unwrapping/distribution' })
   .option('startIndex', { alias: 's', type: 'number', description: 'start index for account generation, voting' })
   .option('endIndex', { alias: 'e', type: 'number', description: 'end index for account generation, voting' })
   .option('appendAccountFile', { alias: 'f', type: 'string', description: 'filename to append generated accounts' })
   .option('privateKey', { alias: 'k', type: 'string', description: 'private key for for funding voter accounts' }).argv;

process.env.CONFIG_FILE = `configs/networks/${args['network']}.json`;

const configurationService = iocContainer(null).get(ConfigurationService);
// configurationService.network = args['network'];

const contractService = iocContainer(null).get(ContractService);

const testAccountService = iocContainer(null).get(TestAccountsService);

const logger = contractService.logger;

async function getPollingContract(): Promise<PollingFoundation> {
   if (args['contract'] === 'PollingFoundation') {
      let result = await contractService.getContract(args['contract']);
      if (result) {
         return result as PollingFoundation;
      }
   }
   throw new Error(`Non existent polling contract name: '${args['contract']}'`);
}

async function settings() {
   await contractService.waitForInitialization();
   //  let pollingContract = await getPollingContract();

   logger.info(`Network: ${configurationService.network}`);
   logger.info(`Contract: ${args['contract']}`);
   //  logger.info(`Wrapping threshold: ${(await pollingContract.methods.wrappingThreshold().call()).toString()}`);
   //  logger.info(`Absolute threshold: ${(await pollingContract.methods.absoluteThreshold().call()).toString()}`);
   //  logger.info(`Relative threshold: ${(await pollingContract.methods.relativeThreshold().call()).toString()}`);
   //  logger.info(`Voting delay: ${(await pollingContract.methods.votingDelay().call()).toString()}`);
   //  logger.info(`Voting period: ${(await pollingContract.methods.votingPeriod().call()).toString()}`);
   //  logger.info(`Execution delay: ${(await pollingContract.methods.executionDelay().call()).toString()}`);
   //  logger.info(`Execution period: ${(await pollingContract.methods.executionPeriod().call()).toString()}`);
   //  logger.info(`Vote power life time days: ${(await pollingContract.methods.getVotePowerLifeTimeDays().call()).toString()}`);
   //  logger.info(`Vote power block period seconds: ${(await pollingContract.methods.getVpBlockPeriodSeconds().call()).toString()}`);
}

async function propose(proposerIndex: number, description: string) {
   let sender = testAccountService.getProposerAccount(proposerIndex);
   let pollingContract = await getPollingContract();
   let fnToCall = pollingContract.methods['propose(string)'](description);
   let proposalId = await fnToCall.call({ from: sender.address });

   await contractService.signSendAndFinalize(sender, 'propose', pollingContract.options.address, fnToCall);
   logger.info(`Proposal created: ${toHex(proposalId, 32)}`);
   return proposalId;
}

async function castVote(voterIndex: number, proposalId: string, type: VoteType) {
   try {
      let sender = testAccountService.getVoterAccount(voterIndex);
      let pollingContract = await getPollingContract();
      await contractService.signSendAndFinalize(sender, 'castVote', pollingContract.options.address, pollingContract.methods.castVote(proposalId, type));
      return {
         voterIndex,
         type,
      };
   } catch (e: any) {
      return null;
   }
}

async function castAllVotesRandomly(proposalId: string, startIndex?: number, endIndex?: number) {
   let i = startIndex || 0;

   async function castVoteWithDelay(i: number, proposalId: string, voteType: VoteType, delay: number) {
      let result = await delayPromise(() => castVote(i, proposalId, voteType), delay);
      logger.info(`Voter ${result.voterIndex} voted ${result.type}`);
   }
   let promises = [];
   let delay = 0;
   let delayStep = 100;
   while (i < configurationService.voterPrivateKeys.length) {
      try {
         let voteType = randomByWeights<VoteType>([0, 1, 2] as VoteType[], [40, 50, 10]);
         promises.push(castVoteWithDelay(i, proposalId, voteType, delay));
         delay += delayStep;
         i++;
         if (endIndex && i > endIndex) {
            break;
         }
      } catch (e: any) {
         break;
      }
   }
   await Promise.all(promises);
}

async function delegate(voterIndex: number, address: string) {
   let sender = testAccountService.getVoterAccount(voterIndex);
   let governanceVotePower = await contractService.governanceVotePower();
   return contractService.signSendAndFinalize(sender, 'delegate', governanceVotePower.options.address, governanceVotePower.methods.delegate(address));
}

async function undelegate(voterIndex: number) {
   let sender = testAccountService.getVoterAccount(voterIndex);
   let governanceVotePower = await contractService.governanceVotePower();
   return contractService.signSendAndFinalize(sender, 'delegate', governanceVotePower.options.address, governanceVotePower.methods.undelegate());
}

async function wrap(voterIndex: number, value: number | string | BN) {
   let sender = testAccountService.getVoterAccount(voterIndex);
   let wNat = await contractService.wNat();
   return contractService.signSendAndFinalize(sender, 'wrap', wNat.options.address, wNat.methods.deposit(), toHex(value));
}

async function wrapAllVoterAccounts(value: number | string | BN) {
   let i = 0;
   while (true) {
      try {
         await wrap(i, value);
         logger.info(`Account ${i} wrapped value ${formatBN(value)}`);
         i++;
      } catch (e: any) {
         break;
      }
   }
}

async function unwrap(voterIndex: number, value: number | string | BN) {
   let sender = testAccountService.getVoterAccount(voterIndex);
   let wNat = await contractService.wNat();
   return contractService.signSendAndFinalize(sender, 'unwrap', wNat.options.address, wNat.methods.withdraw(value));
}

async function fundVoterAccounts(value: number | string | BN, privateKey: string) {
   let i = 0;
   while (true) {
      try {
         let recipient = testAccountService.getVoterAccount(i);
         await sendETH(contractService.web3, privateKey, recipient.address, value);
         logger.info(`Account ${i} (${recipient.address}) funded by ${formatBN(value)}`);
         i++;
      } catch (e: any) {
         break;
      }
   }
}

async function generateAccounts(startIndex: number, endIndex: number, fname: string) {
   const Wallet = require('ethereumjs-wallet').default;
   let text = '';
   for (let i = startIndex; i <= endIndex; i++) {
      let wallet = Wallet.generate();
      let privateKey = wallet.getPrivateKeyString();
      text += `VOTER_PK_${i}=${privateKey}\n`;
   }
   fs.appendFileSync(fname, text);
   logger.info(`${endIndex - startIndex + 1} accounts generated`);
}

async function voterAccountStatus() {
   let wNat = await contractService.wNat();
   let governanceVotePower = await contractService.governanceVotePower();
   let i = 0;
   while (true) {
      try {
         let account = testAccountService.getVoterAccount(i);
         let address = account.address;
         let balance = await contractService.web3.eth.getBalance(address);
         let wNatBalance = await wNat.methods.balanceOf(address).call();
         let delegateOf = (await governanceVotePower.methods.getDelegateOfAtNow(address).call()) || '---';
         logger.info(`${i}\t${address}\t${formatBN(balance)}\t${formatBN(wNatBalance)}\t${delegateOf}`);
      } catch (e: any) {
         break;
      }
      i++;
   }
}

async function contract(name: string) {
   logger.info(await contractService.getContract(name));
}

async function runGovernorCli() {
   await contractService.waitForInitialization();
   switch (args['action'] as ActionType) {
      case 'settings':
         await settings();
         return;
      case 'contract':
         await contract(args['contractName']);
         return;
      case 'propose':
         await propose(args['senderIndex'], args['proposalDescription']);
         return;
      case 'castVote':
         await castVote(args['senderIndex'], args['proposalId'], args['voteType']);
         return;
      case 'castAllVotesRandomly':
         await castAllVotesRandomly(args['proposalId'], args['startIndex'], args['endIndex']);
         return;
      case 'delegate':
         await delegate(args['senderIndex'], args['delegationAddress']);
         return;
      case 'undelegate':
         await undelegate(args['senderIndex']);
         return;
      case 'wrap':
         await wrap(args['senderIndex'], stringDecimalETHToWei(args['amount']));
         return;
      case 'wrapAll':
         await wrapAllVoterAccounts(stringDecimalETHToWei(args['amount']));
         return;
      case 'unwrap':
         await unwrap(args['senderIndex'], stringDecimalETHToWei(args['amount']));
         return;
      case 'fund':
         await fundVoterAccounts(stringDecimalETHToWei(args['amount']), args['privateKey']);
         return;
      case 'generateAccounts':
         await generateAccounts(args['startIndex'], args['endIndex'], args['appendAccountFile']);
         return;
      case 'accountStatus':
         await voterAccountStatus();
         return;
      default:
         logger.info('Wrong action!');
   }
}

runGovernorCli()
   .then(() => process.exit(0))
   .catch((error) => {
      console.error(error);
      process.exit(1);
   });
