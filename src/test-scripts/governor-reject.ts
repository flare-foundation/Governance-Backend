// Example commandline:
// yarn ts-node src/test-scripts/governor-reject.ts -n coston -a settings
//
// equivalent
// yarn reject-cli -a settings

import dotenv from "dotenv";
import { GovernorReject } from "../../typechain-web3-v1/GovernorReject";
import { iocContainer } from "../ioc";
import { ConfigurationService } from "../services/ConfigurationService";
import { ContractService } from "../services/ContractService";
import { TestAccountsService } from "../services/TestAccountsService";
import { VoteType } from "../utils/enums";

// initialize configuration
dotenv.config();

let yargs = require("yargs");

let args = yargs
   .option("network", { alias: "n", type: "string", description: "The name of the network", default: "coston" })
   .option("action", { alias: "a", type: "string", description: "action" })
   .option("senderIndex", { alias: "i", type: "number", description: "sequential id of the proposer or voter" })
   .option("proposalDescription", { alias: "d", type: "string", description: "proposal description" })
   .option("proposalId", { alias: "p", type: "number", description: "proposal id" })
   .option("voteType", { alias: "v", type: "number", description: "vote type 0 - against, 1 - for, 2 - abstain" })
   .option("delegationAddress", { alias: "r", type: "string", description: "delegation address" })
   .option("contractName", { alias: "m", type: "string", description: "contract name" })
   .argv;

ConfigurationService.network = args['network'];

const configurationService = iocContainer(null).get(ConfigurationService)

const contractService = iocContainer(null).get(ContractService);

const testAccountService = iocContainer(null).get(TestAccountsService);

async function settings() {
   await contractService.waitForInitialization();
   let governorReject = await contractService.governorReject();
   console.log(`Network: ${ConfigurationService.network}`);
   console.log(`Proposal threshold: ${(await governorReject.methods.rejectionThreshold().call()).toString()}`)
   console.log(`Rejection threshold: ${(await governorReject.methods.proposalThreshold().call()).toString()}`)
   console.log(`Voting delay: ${(await governorReject.methods.votingDelay().call()).toString()}`)
   console.log(`Voting period: ${(await governorReject.methods.votingPeriod().call()).toString()}`)
   console.log(`Execution delay: ${(await governorReject.methods.executionDelay().call()).toString()}`)
   console.log(`Execution period: ${(await governorReject.methods.executionPeriod().call()).toString()}`)
   console.log(`Quorum threshold: ${(await governorReject.methods.quorumThreshold().call()).toString()}`)
   console.log(`Vote power life time days: ${(await governorReject.methods.getVotePowerLifeTimeDays().call()).toString()}`)
   console.log(`Vote power block period seconds: ${(await governorReject.methods.getVpBlockPeriodSeconds().call()).toString()}`)
   console.log(`Voting delay: ${(await governorReject.methods.votingDelay().call()).toString()}`)

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

async function castVote(voterIndex: number, proposalId: number, type: VoteType) {
   let sender = testAccountService.getProposerAccount(voterIndex);
   let governorReject = await contractService.governorReject();
   return await contractService.signSendAndFinalize(
      sender,
      "castVote",
      governorReject.options.address,
      governorReject.methods.castVote(proposalId, type)
   )
}

async function delegate(voterIndex: number, address: string) {
   let sender = testAccountService.getProposerAccount(voterIndex);
   let governanceVotePower = await contractService.governanceVotePower();
   return await contractService.signSendAndFinalize(
      sender,
      "delegate",
      governanceVotePower.options.address,
      governanceVotePower.methods.delegate(address)
   )
}

async function undelegate(voterIndex: number) {
   let sender = testAccountService.getProposerAccount(voterIndex);
   let governanceVotePower = await contractService.governanceVotePower();
   return await contractService.signSendAndFinalize(
      sender,
      "delegate",
      governanceVotePower.options.address,
      governanceVotePower.methods.undelegate()
   )
}

async function contract(name: string) {
   console.log(await contractService.getContract(name))
}

async function runGovernorRejectCli() {
   switch (args["action"]) {
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





