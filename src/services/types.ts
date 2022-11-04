import { PollingFoundation } from "../../typechain-web3-v1/PollingFoundation";
import { NonPayableTransactionObject } from "../../typechain-web3-v1/types";


type getGenericType<T> = T extends NonPayableTransactionObject<infer U> ? U : never

export type ProposalVotesEventParams = getGenericType<ReturnType<PollingFoundation['methods']['getProposalVotes']>>

export type ProposalInfoEventParams = getGenericType<ReturnType<PollingFoundation['methods']['getProposalInfo']>>
