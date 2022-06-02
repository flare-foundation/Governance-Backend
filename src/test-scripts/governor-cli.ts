// Example commandline:
// yarn ts-node src/test-scripts/governor-cli.ts -n coston -a settings
//
// equivalent
// yarn governor-cli -a settings
// 
// Examples:
// yarn governor-cli -a propose -i 0 -d "Test proposal CLI5"
// yarn governor-cli -a castVote -i 0 -p 0x119c34902e27e9af7d0686bcf9518b1c9dff170b8603acd79a6d3cd678d6b46d -v 0
// yarn governor-cli -a generateAccounts -s 0 -e 100 -f .env
// yarn governor-cli -a accountStatus
// yarn governor-cli -a fund -t 110 -k 0x00000...<private-key>
// yarn governor-cli -a wrapAll -t 100
// yarn governor-cli -a castAllVotesRandomly -p 0x119c34902e27e9af7d0686bcf9518b1c9dff170b8603acd79a6d3cd678d6b46d
// TODO:
// - adapt for reject and accept
// - check database
// - create listable APIs
// - create aggregates
// - check against specs

import BN from "bn.js";
import dotenv from "dotenv";
import fs from "fs";
import Web3 from "web3";
import { GovernorAccept } from "../../typechain-web3-v1/GovernorAccept";
import { GovernorReject } from "../../typechain-web3-v1/GovernorReject";
import { iocContainer } from "../ioc";
import { ConfigurationService } from "../services/ConfigurationService";
import { ContractService } from "../services/ContractService";
import { TestAccountsService } from "../services/TestAccountsService";
import { VoteType } from "../utils/enums";
import { formatBN, randomByWeights, sendETH, stringDecimalETHToWei, toHex } from "../utils/utils";

type ActionType = "settings" | "contract" | "propose" | "castVote" | "castAllVotesRandomly" | "delegate" | "undelegate" | "wrap" | "wrapAll" | "unwrap" | "fund" | "generateAccounts" | "accountStatus";

// initialize configuration
dotenv.config();

let yargs = require("yargs");

let args = yargs
   .option("network", { alias: "n", type: "string", description: "The name of the network", default: "coston" })
   .option("action", { alias: "a", type: "string", description: "action" })
   .option("contract", { alias: "c", type: "string", default: "reject", description: "Type of voting contract: 'accept' or 'reject'" })
   .option("senderIndex", { alias: "i", type: "number", description: "sequential id of the proposer or voter" })
   .option("proposalDescription", { alias: "d", type: "string", description: "proposal description" })
   .option("proposalId", { alias: "p", type: "string", description: "proposal id" })
   .option("voteType", { alias: "v", type: "number", description: "vote type 0 - against, 1 - for, 2 - abstain" })
   .option("delegationAddress", { alias: "r", type: "string", description: "delegation address" })
   .option("contractName", { alias: "m", type: "string", description: "contract name" })
   .option("amount", { alias: "t", type: "string", description: "amount for wrapping/unwrapping/distribution" })
   .option("startIndex", { alias: "s", type: "string", description: "start index for account generation" })
   .option("endIndex", { alias: "e", type: "string", description: "end index for account generation" })
   .option("appendAccountFile", { alias: "f", type: "string", description: "filename to append generated accounts" })
   .option("privateKey", { alias: "k", type: "string", description: "private key for for funding voter accounts" })
   .argv;

ConfigurationService.network = args['network'];

const configurationService = iocContainer(null).get(ConfigurationService)

const contractService = iocContainer(null).get(ContractService);

const testAccountService = iocContainer(null).get(TestAccountsService);

const logger = contractService.logger;

async function pollingContract() {
   if (args["contract"] === "accept") {
      return await contractService.governorReject();
   } else {
      return await contractService.governorAccept();
   }
}

function isAccept() {
   return args["contract"] === "accept"
}

async function settings() {
   await contractService.waitForInitialization();
   let pollingContract: GovernorAccept | GovernorReject = await contractService.governorReject();
   logger.info(`Network: ${ConfigurationService.network}`);
   // TODO
   logger.info(`Proposal threshold: ${(await pollingContract.methods.rejectionThreshold().call()).toString()}`)

   logger.info(`Rejection threshold: ${(await pollingContract.methods.proposalThreshold().call()).toString()}`)
   logger.info(`Voting delay: ${(await pollingContract.methods.votingDelay().call()).toString()}`)
   logger.info(`Voting period: ${(await pollingContract.methods.votingPeriod().call()).toString()}`)
   logger.info(`Execution delay: ${(await pollingContract.methods.executionDelay().call()).toString()}`)
   logger.info(`Execution period: ${(await pollingContract.methods.executionPeriod().call()).toString()}`)
   logger.info(`Quorum threshold: ${(await pollingContract.methods.quorumThreshold().call()).toString()}`)
   logger.info(`Vote power life time days: ${(await pollingContract.methods.getVotePowerLifeTimeDays().call()).toString()}`)
   logger.info(`Vote power block period seconds: ${(await pollingContract.methods.getVpBlockPeriodSeconds().call()).toString()}`)
   logger.info(`Voting delay: ${(await pollingContract.methods.votingDelay().call()).toString()}`)

   // expect(await governorReject.isProposer(accounts[3])).to.equals(true);
   // expect(await governorReject.isProposer(accounts[4])).to.equals(false);

}

async function propose(proposerIndex: number, description: string) {
   let sender = testAccountService.getProposerAccount(proposerIndex);
   let governorReject = await contractService.governorReject();
   let fnToCall = governorReject.methods["propose(string)"](description);
   let proposalId = await fnToCall.call({from: sender.address});
   
   await contractService.signSendAndFinalize(
      sender,
      "propose",
      governorReject.options.address,
      fnToCall
   );
   logger.info(`Proposal created: ${toHex(proposalId, 32)}`);
}

async function castVote(voterIndex: number, proposalId: string, type: VoteType) {
   let sender = testAccountService.getVoterAccount(voterIndex);
   let governorReject = await contractService.governorReject();
   return await contractService.signSendAndFinalize(
      sender,
      "castVote",
      governorReject.options.address,
      governorReject.methods.castVote(proposalId, type)
   )
}


async function castAllVotesRandomly(proposalId: string) {
   let i = 0;
   while (true) {
      try {
         let voteType = randomByWeights<VoteType>([0, 1, 2] as VoteType[], [40, 50, 10])
         await castVote(i, proposalId, voteType);
         logger.info(`Voter ${i} voted ${voteType}`)
         i++;
      } catch (e: any) {
         break;
      }
   }
}

async function delegate(voterIndex: number, address: string) {
   let sender = testAccountService.getVoterAccount(voterIndex);
   let governanceVotePower = await contractService.governanceVotePower();
   return await contractService.signSendAndFinalize(
      sender,
      "delegate",
      governanceVotePower.options.address,
      governanceVotePower.methods.delegate(address)
   )
}

async function undelegate(voterIndex: number) {
   let sender = testAccountService.getVoterAccount(voterIndex);
   let governanceVotePower = await contractService.governanceVotePower();
   return await contractService.signSendAndFinalize(
      sender,
      "delegate",
      governanceVotePower.options.address,
      governanceVotePower.methods.undelegate()
   )
}

async function wrap(voterIndex: number, value: number | string | BN) {
   let sender = testAccountService.getVoterAccount(voterIndex);
   let wNat = await contractService.wNat();
   return await contractService.signSendAndFinalize(
      sender,
      "wrap",
      wNat.options.address,
      wNat.methods.deposit(),
      toHex(value)
   )
}

async function wrapAllVoterAccounts(value: number | string | BN) {
   let i = 0;
   while (true) {
      try {
         await wrap(i, value);
         logger.info(`Account ${i} wrapped value ${formatBN(value)}`)
         i++;
      } catch (e: any) {
         break;
      }
   }
}

async function unwrap(voterIndex: number, value: number | string | BN) {
   let sender = testAccountService.getVoterAccount(voterIndex);
   let wNat = await contractService.wNat();
   return await contractService.signSendAndFinalize(
      sender,
      "unwrap",
      wNat.options.address,
      wNat.methods.withdraw(value)
   )
}

async function fundVoterAccounts(value: number | string | BN, privateKey: string) {
   let i = 0;
   while (true) {
      try {
         let recipient = testAccountService.getVoterAccount(i);
         await sendETH(contractService.web3, privateKey, recipient.address, value)
         logger.info(`Account ${i} (${recipient.address}) funded by ${formatBN(value)}`)
         i++;
      } catch (e: any) {
         break;
      }
   }
}

async function generateAccounts(startIndex: number, endIndex: number, fname: string) {
   const Wallet = require('ethereumjs-wallet').default;
   let text = "";
   for (let i = startIndex; i <= endIndex; i++) {
      let wallet = Wallet.generate();
      let privateKey = wallet.getPrivateKeyString();
      text += `VOTER_PK_${i}=${privateKey}\n`
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
         let delegateOf = (await governanceVotePower.methods.getDelegateOfAtNow(address).call()) || "---";
         logger.info(`${i}\t${address}\t${formatBN(balance)}\t${formatBN(wNatBalance)}\t${delegateOf}`);
      } catch (e: any) {
         break;
      }
      i++;
   }
}

async function contract(name: string) {
   logger.info(await contractService.getContract(name))
}

async function runGovernorRejectCli() {
   switch (args["action"] as ActionType) {
      case "settings":
         await settings();
         return;
      case "contract":
         await contract(args["contractName"]);
         return;
      case "propose":
         await propose(args["senderIndex"], args["proposalDescription"]);
         return;
      case "castVote":
         await castVote(args["senderIndex"], args["proposalId"], args["voteType"]);
         return;
      case "castAllVotesRandomly":
         await castAllVotesRandomly(args["proposalId"]);
         return;
      case "delegate":
         await delegate(args["senderIndex"], args["delegationAddress"]);
         return;
      case "undelegate":
         await undelegate(args["senderIndex"]);
         return;
      case "wrap":
         await wrap(args["senderIndex"], stringDecimalETHToWei(args["amount"]));
         return;
      case "wrapAll":
         await wrapAllVoterAccounts(stringDecimalETHToWei(args["amount"]));
         return;
      case "unwrap":
         await unwrap(args["senderIndex"], stringDecimalETHToWei(args["amount"]));
         return;
      case "fund":
         await fundVoterAccounts(stringDecimalETHToWei(args["amount"]), args["privateKey"]);
         return;
      case "generateAccounts":
         await generateAccounts(args["startIndex"], args["endIndex"], args["appendAccountFile"]);
         return;
      case "accountStatus":
         await voterAccountStatus();
         return;
      default:
         logger.info("Wrong action!")
   }
}

runGovernorRejectCli()
   .then(() => process.exit(0))
   .catch((error) => {
      console.error(error);
      process.exit(1);
   });





