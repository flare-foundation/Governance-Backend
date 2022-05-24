import { refreshArtifacts } from "./utils";

const contractToSync = [
   "GovernanceVotePower",
   "GovernorReject",
   "GovernorAccept",
   "wNat"
];

refreshArtifacts(contractToSync)
   .then(() => process.exit(0))
   .catch((error) => {
      console.error(error);
      process.exit(1);
   });
