export type PollingContractType = "accept" | "reject"
export interface Proposal {
   contract: string;
   pollingType: PollingContractType,
   proposalId: string;
   proposer: string;
   targets: string[];  
   values: string[];  
   signatures: string[]; 
   calldatas: string[]; 
   startTime: number;
   endTime: number;
   description: string;
   votePowerBlock: number;
   wrappingThreshold: number;
   absoluteThreshold: number;
   relativeThreshold: number;
}


// event ProposalCreated(
//    uint256 proposalId,
//    address proposer,
//    address[] targets,
//    uint256[] values,
//    string[] signatures,
//    bytes[] calldatas,
//    uint256 startTime,
//    uint256 endTime,
//    string description,
//    uint256 votePowerBlock,
//    uint256 wrappingThreshold,
//    uint256 absoluteThreshold,
//    uint256 relativeThreshold
// );
