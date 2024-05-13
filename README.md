<h1 align="center">
  Solpad CMv3 & UI
</h1>
<p align="center"> Build your Solana NFT project in less than 30 minutes </p>
<p align="center">
 <img width="800" alt="solpad" src="https://i.imgur.com/YQbPt0F.png" />
 </p>

`This project is meant for those with no prior expertise in Solana`

`for Linux or MacOS systems`

using the `devnet` network for testing, change it to `mainnet-Beta` after testing everything.

Try the project first to determine whether this is what you're searching for: https://demo.solpad.art

### What You Need?


### Node.js installed (version 16.15 or higher)
https://nodejs.org/en/download/package-manager,

```sh
node --version
```

### npm installed
https://www.npmjs.com/package/install

```sh
npm --version
```

### VSCode editor

https://code.visualstudio.com/download

### Solana CLI installed  

https://docs.solanalabs.com/cli/install

```sh
sh -c "$(curl -sSfL https://release.solana.com/v1.18.12/install)"
```

```sh
solana --version
```

### Sugar installed

```sh
bash <(curl -sSf https://sugar.metaplex.com/install.sh)
```

`Note: You may need to restart your terminal after installation`

```sh
sugar --version
```


### Phantom Wallet or Solflare extension installed

https://phantom.app/download, 
https://solflare.com/download

-----------------------------------------------------------------------------------------------------------------

### Getting Started

Clone this repo

```sh
git clone https://github.com/Solpad-art/CMV3-UI.git
```

```sh
cd CMV3-UI
```

```sh
code.
```

`it will open your project in VSCode`


### Create Candy Machine V3 


Set Up a New Wallet

```sh
solana-keygen new --no-bip39-passphrase --outfile ./wallet.json  
```
copy your wallet private key on the `wallet.json` file then import it to Phantom Wallet or Solflare extension, 
you will need to connect it to get `NEXT_PUBLIC_LUT`,
`Be careful! Keep it in a safe place. Then delete it from your files`

confirm that the wallet you just generated is the wallet that the Solana CLI will use.

```sh
solana config set --keypair ./wallet.json
```

### Connect to a Solana Cluster 

```sh
Solana config set --url https://api.devnet.solana.com
```

### Fund your wallet

```sh
solana airdrop 1
```
or use the Solana faucet

https://faucet.solana.com

update `Config.json`, `assets.json`, and `collection.json` files. to match your data,
you can also use your image by replacing it but keeping the same filename.

Make sure to replace `YOUR_WALLET_ADDRESS` with the wallet address you created earlier in the `config.json` file


### Use Suger to validate, upload, deploy, and verify your candy machine

```sh
sugar validate
```
```sh
sugar upload
```
```sh
sugar deploy
```

import your candy machine ID in the `.env.example` file as `NEXT_PUBLIC_CANDY_MACHINE_ID`

```sh
sugar verify
```
```sh
sugar guard add
```

change the `.env.example` file name to `.env` and enter your details.

------------------------------------------------------------------------------

### Set Up a Minting Site 

```sh
pnpm install
```
```sh
pnpm run dev
```

Open your browser at http://localhost:3000  

Connect your wallet which you used to create the candy machine,
You should see an `initialize` button,
Click it and then click `Create LUT`,
Copy the LUT address that you see in the success box and paste it into the `.env` file as the value for `NEXT_PUBLIC_LUT`

Add your candy machine groups to the settings.tsx file. Optional,
`E.g. if one of your groups is called WL you should have an entry for it in there`

you can modify `settings.tsx` to change the texts and images. 

create a GitHub account if you don't have one, and upload your files.

### Deploy your own to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Solpad-art/CMV3-UI&env=NEXT_PUBLIC_CANDY_MACHINE_ID,NEXT_PUBLIC_MULTIMINT,NEXT_PUBLIC_MAXMINTAMOUNT,NEXT_PUBLIC_LUT,NEXT_PUBLIC_ENVIRONMENT,NEXT_PUBLIC_RPC,NEXT_PUBLIC_MICROLAMPORTS,NEXT_PUBLIC_BUYMARKBEER)

`feel free to create an issue or a pull request`

### If you feel that it is difficult for you, you can apply to launch and host it on our platform
https://solpad.art/dashboard/basic-drop/


### Disclaimer!
This is not an official project by the Metaplex team. You can use that code at your own risk, 

 use it only for honest projects.


Happy Minting!

### Thanks to the @metaplex-foundation , @quicknode, @MarkSackerberg


`Resources`

[Original UI code](https://github.com/MarkSackerberg/umi-cmv3-ui-inofficial/) , [Original CM installation guide](https://www.quicknode.com/guides/solana-development/nfts/how-to-deploy-an-nft-collection-on-solana-using-sugar-candy-machine-umi)  

Mixed and redesigned by Solpad team 

`info@solpad.art`

https://solpad.art
