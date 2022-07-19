export interface Vote {
   voter: string;
   proposalId: string;
   chainId: number;
   support: number;
   weight: string;
   weightFloat: number;
   reason: string;
}
