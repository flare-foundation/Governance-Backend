import { refreshArtifacts } from '../utils/artifact-utils';

const contractToSync = ['ClaimSetupManager', 'GovernanceVotePower', 'PollingFoundation',
   'wNat', 'FtsoRewardManager', 'DistributionToDelegators'];

refreshArtifacts(contractToSync)
   .then(() => process.exit(0))
   .catch((error) => {
      console.error(error);
      process.exit(1);
   });
