export const CONTRACTS = {
    localhost: {
        name: "localhost",
        chainId: 31337,
        currency: "ETH",
        contractAddress : "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        contractUsdcaddress : "0x07865c6E87B9F70255377e024ace6630C1Eaa37F",
        contractLendingController : "0xdcAF816E4C8b4885E3c0b9C336EcE6Cd68d0B60D",
        contractTicket : "0x8291b043Bf5DED5DD1753656D1900126488708AC",
      }
  };
  
  export const CONTRACT = chainId => {
    for (const n in CONTRACTS) {
      if (CONTRACTS[n].chainId === chainId) {
        return CONTRACTS[n];
      }
    }
  };
  