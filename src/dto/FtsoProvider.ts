
// Apis for "https://raw.githubusercontent.com/TowoLabs/ftso-signal-providers/master/bifrost-wallet.providerlist.json"

export interface Wallet {
   timestamp: Date;
   providers: Provider[];
}

export interface Provider {
   chainId: number;
   address: string;
   name: string;
   description?: string;
   url?: string;
   logoURI?: string;
   listed?: boolean;
}
