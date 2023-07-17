// pages/index.tsx
import React, { useEffect, useState } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import NextLink from "next/link"
import { VStack, Heading, Box } from "@chakra-ui/layout"
import { Text, Button, Link } from '@chakra-ui/react'
import {ethers} from "ethers"
import Web3Modal from 'web3modal'
import WalletConnectProvider from '../node_modules/@walletconnect/web3-provider'
// @ts-ignore
import UserSend from './components/UserSend'
// @ts-ignore
import AdminSet from './components/AdminSet.tsx'
// @ts-ignore
import {WalletABI as abi} from './abi/WalletABI'
import {CONTRACT} from '../config'

import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

declare let window:any

let chainname, currency, contractAddress, blockExplorer;

const Home: NextPage = () => {
    const [balance, setBalance] = useState<string | undefined>()
    const [currentAccount, setCurrentAccount] = useState<string | undefined>()
    const [chainId, setChainId] = useState<number | undefined>()
    const [userAllowance, setUserAllowance]=useState<string>()
    const [contractBalance, setContractBalance]=useState<string>()

    const error = (msg) => {
        toast.error(msg, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
    };

    /* web3Modal configuration for enabling wallet access */
    async function getWeb3Modal() {
        const web3Modal = new Web3Modal({
            cacheProvider: false,
            providerOptions: {
                walletconnect: {
                package: WalletConnectProvider,
                },
            },
        })
        return web3Modal
    }

    /* the connect function uses web3 modal to connect to the user's wallet */
    async function connect() {
        try {
            const web3Modal = await getWeb3Modal()
            const connection = await web3Modal.connect()
            const provider = new ethers.providers.Web3Provider(connection)
            const accounts = await provider.listAccounts()
            
            provider.getNetwork().then((result)=>{
                setChainId(result.chainId)
                console.log(result.chainId);
                setContractVar(result.name, result.chainId, accounts[0]);
            })
        } catch (err) {
            console.log('error:', err);
            error({ err }.err.reason);
        }
    }

    async function disconnect() {
        try {
            const web3Modal = await getWeb3Modal()
            await web3Modal.clearCachedProvider();
            console.log("onClickDisConnect")
            setBalance(undefined)
            setCurrentAccount(undefined)
        } catch (err) {
            console.log('error:', err);
            error({ err }.err.reason);
        }
    }

    function setContractVar(chain:string, chainId:number, account:string) {
        const network = CONTRACT(chainId);
        chainname = network.name;
        currency = network.currency;
        contractAddress = network.contractAddress;
        blockExplorer = network.blockExplorer;
        setCurrentAccount(account)
    }

    useEffect(() => {
        if(!currentAccount || !ethers.utils.isAddress(currentAccount)) return
        if(!window.ethereum) return

        window.ethereum.on('chainChanged', () => {
            window.location.reload();
        })
        window.ethereum.on('accountsChanged', () => {
            changeAccount()
        })

        getInfo();

        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const sharedWallet = new ethers.Contract(contractAddress, abi, provider);

        // listen for changes on an Ethereum address
        console.log(`listening for Transfer...`)

        const myAllowance = sharedWallet.filters.AllowanceRenewed(currentAccount, null, null)
        provider.on(myAllowance, (from, to, amount, event) => {
            console.log('myAllowance', { from, to, amount, event })
            queryUserAllowance(window)
        })

        const contractBalance = sharedWallet.filters.Deposit(null)
        provider.on(contractBalance, (from, to, amount, event) => {
            console.log('contractBalance', { from, to, amount, event })
            queryContractBalance(window)
        })

        // remove listener when the component is unmounted
        return () => {
            provider.removeAllListeners(myAllowance)
            provider.removeAllListeners(contractBalance)
        }
    },[currentAccount])

    async function getInfo() {
        const provider = new ethers.providers.Web3Provider(window.ethereum)

        provider.getNetwork().then((result)=>{
            setChainId(result.chainId)
            setContractVar(result.name, result.chainId, currentAccount);
        }).catch((err)=>error({ err }.err.reason))

        provider.getBalance(currentAccount!).then((result)=>{
            setBalance(ethers.utils.formatEther(result))
        }).catch((err)=>error({ err }.err.reason))

        queryUserAllowance(window)
        queryContractBalance(window)
    }

    async function changeAccount() {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const accounts = await provider.listAccounts()
        setCurrentAccount(accounts[0])
    }

    async function queryUserAllowance(window:any){
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const sharedWallet = new ethers.Contract(contractAddress, abi, provider)

        sharedWallet.checkAllowance().then((result:string)=>{
            setUserAllowance(ethers.utils.formatUnits(result, 18))
        }).catch((err)=>error({ err }.err.reason))
    }

    async function queryContractBalance(window:any){
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const sharedWallet = new ethers.Contract(contractAddress, abi, provider)

        sharedWallet.checkBalance().then((result:string)=>{
            setContractBalance(ethers.utils.formatUnits(result, 18))
        }).catch((err)=>error({ err }.err.reason))
    }

    return (
        <>
        <Head>
            <title>SharedWallet</title>
        </Head>
        <VStack color='purple'>
            <Box w='100%' my={4}>
            {currentAccount? 
                <Button type="button" w='100%' color='red' onClick={disconnect}>
                        ⏏️ Disconnect
                </Button>
                : <Button type="button" w='100%' color='red' onClick={connect}>
                        🔗 Connect MetaMask
                </Button>
            }
            </Box>
        </VStack>
        {currentAccount?
            <VStack color='purple'>
                <Box  my={4} p={4} w='100%' borderWidth="1px" borderRadius="lg">
                    <Heading my={4}  fontSize='xl'>
                        <Link color='purple.500' href={blockExplorer + "address/" + currentAccount}>
                            Account {currentAccount}
                        </Link>
                    </Heading>
                    <Text>${currency} Balance: {balance}</Text>
                    <Text>Chain name: {chainname}</Text>
                    <Text>Chain Id: {chainId}</Text>
                    <Text><b>Your Allowance</b>: {userAllowance}</Text>
                    <UserSend 
                        currentAccount= {currentAccount} 
                        contractAddress = {contractAddress}
                    />
                </Box>
                <Box  mb={0} p={4} w='100%' borderWidth="1px" borderRadius="lg">
                    <Heading my={4}  fontSize='xl'>For Admin use only</Heading>
                    <Text><b>Wallet Balance</b>: {contractBalance}</Text>
                    <AdminSet 
                        currentAccount= {currentAccount} 
                        contractAddress = {contractAddress}
                    />
                </Box>
                <ToastContainer
                    transition={Slide}
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick={false}
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
            </VStack>
            :<></>
        }
        </>
    )
}

export default Home