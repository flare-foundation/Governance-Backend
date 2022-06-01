// Example commandline:
// yarn ts-node src/test-scripts/governor-cli.ts -n coston -a settings
//
// equivalent
// yarn governor-cli -a settings
// 
// Examples:
// yarn governor-cli -a propose -i 0 -d "Test proposal CLI2"
// yarn governor-cli -a castVote -i 0 -p 0xf3df5f5cdb0ba92b28e787aa38c22415817ea8a8646b196cf418d86440fb3d52 -v 0
// yarn governor-cli -a generateAccounts -s 0 -e 100 -f .env
// yarn governor-cli -a accountStatus
// TODO:
// - Wrap funds from account
// - Fill account 
// - Generate many voting accounts, fill them with faucet
// - Delegate/undelegate

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
import { formatBN, toHex } from "../utils/utils";

type ActionType =  "settings" | "contract" | "propose" | "castVote" | "delegate" | "undelegate" | "wrap" | "unwrap" | "fund" | "generateAccounts" | "accountStatus";

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
   .option("amount", { alias: "t", type: "string", description: "amount for wrapping/unwrapping" })
   .option("startIndex", { alias: "s", type: "string", description: "start index for account generation" })
   .option("endIndex", { alias: "e", type: "string", description: "end index for account generation" })
   .option("appendAccountFile", { alias: "f", type: "string", description: "filename to append generated accounts" })
   .argv;

ConfigurationService.network = args['network'];

const configurationService = iocContainer(null).get(ConfigurationService)

const contractService = iocContainer(null).get(ContractService);

const testAccountService = iocContainer(null).get(TestAccountsService);

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
   console.log(`Network: ${ConfigurationService.network}`);
   // TODO
   console.log(`Proposal threshold: ${(await pollingContract.methods.rejectionThreshold().call()).toString()}`)

   console.log(`Rejection threshold: ${(await pollingContract.methods.proposalThreshold().call()).toString()}`)
   console.log(`Voting delay: ${(await pollingContract.methods.votingDelay().call()).toString()}`)
   console.log(`Voting period: ${(await pollingContract.methods.votingPeriod().call()).toString()}`)
   console.log(`Execution delay: ${(await pollingContract.methods.executionDelay().call()).toString()}`)
   console.log(`Execution period: ${(await pollingContract.methods.executionPeriod().call()).toString()}`)
   console.log(`Quorum threshold: ${(await pollingContract.methods.quorumThreshold().call()).toString()}`)
   console.log(`Vote power life time days: ${(await pollingContract.methods.getVotePowerLifeTimeDays().call()).toString()}`)
   console.log(`Vote power block period seconds: ${(await pollingContract.methods.getVpBlockPeriodSeconds().call()).toString()}`)
   console.log(`Voting delay: ${(await pollingContract.methods.votingDelay().call()).toString()}`)

   // expect(await governorReject.isProposer(accounts[3])).to.equals(true);
   // expect(await governorReject.isProposer(accounts[4])).to.equals(false);

}

async function propose(proposerIndex: number, description: string) {
   let sender = testAccountService.getProposerAccount(proposerIndex);
   let governorReject = await contractService.governorReject();
   return await contractService.signSendAndFinalize(
      sender,
      "propose",
      governorReject.options.address,
      governorReject.methods["propose(string)"](description)
   )
}

async function castVote(voterIndex: number, proposalId: string, type: VoteType) {
   let sender = testAccountService.getVoterAccount(voterIndex);
   let governorReject = await contractService.governorReject();
   console.log(proposalId, type)
   return await contractService.signSendAndFinalize(
      sender,
      "castVote",
      governorReject.options.address,
      governorReject.methods.castVote(proposalId, type)
   )
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

async function fund(voterIndex: number, value: number | string | BN) {
   // let sender = testAccountService.getVoterAccount(voterIndex);
   // let wNat = await contractService.wNat();
   // return await contractService.signSendAndFinalize(
   //    sender,
   //    "fund",
   //    wNat.options.address,
   //    wNat.methods.withdraw(value)
   // )
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
   console.log(`${endIndex - startIndex + 1} accounts generated`);
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
         console.log(`${i}\t${address}\t${formatBN(balance)}\t${wNatBalance}\t${delegateOf}`);
      } catch (e: any) {
         break;
      }
      i++;
   }
}

async function contract(name: string) {
   console.log(await contractService.getContract(name))
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
      case "delegate":
         await delegate(args["senderIndex"], args["delegationAddress"]);
         return;
      case "undelegate":
         await undelegate(args["senderIndex"]);
         return;
      case "wrap":
         await wrap(args["senderIndex"], args["amount"]);
         return;
      case "unwrap":
         await unwrap(args["senderIndex"], args["amount"]);
         return;
      case "fund":
         await fund(args["senderIndex"], args["amount"]);
         return;
      case "generateAccounts":
         await generateAccounts(args["startIndex"], args["endIndex"], args["appendAccountFile"]);
         return;
      case "accountStatus":
         await voterAccountStatus();
         return;
      default:
         console.log("Wrong action!")
   }
}

runGovernorRejectCli()
   .then(() => process.exit(0))
   .catch((error) => {
      console.error(error);
      process.exit(1);
   });





