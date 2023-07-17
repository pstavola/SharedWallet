// src/component/Deposit.tsx
import React, { useState, useRef } from 'react';
import {Button, NumberInput,  NumberInputField,  FormControl,  FormLabel, Input } from '@chakra-ui/react'
import {ethers} from 'ethers'
import {parseUnits } from 'ethers/lib/utils'
// @ts-ignore
import {WalletABI as abi} from '../abi/WalletABI.tsx'
// @ts-ignore
import { Contract } from "ethers"
import { TransactionResponse,TransactionReceipt } from "@ethersproject/abstract-provider"

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Props {
    currentAccount: string | undefined
    contractAddress: string
}

declare let window: any;

export default function Deposit(props:Props){
    const currentAccount = props.currentAccount
    const contractAddress = props.contractAddress
    const [user,setUser]=useState<string>("0x")
    const [depositAmount,setDepositAmount]=useState<string>('100')
    const [amount,setAmount]=useState<string>('100')
    const toastId = useRef(null);

    const pending = () => {
        toastId.current = toast.info("Transaction Pending...", {
            position: "top-right",
            autoClose: false,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
    };

    const success = () => {
        toast.dismiss(toastId.current);
        toast.success("Transaction Complete!", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
    };

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

    async function renew(event:React.FormEvent) {
        event.preventDefault()
        if(!window.ethereum) return
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const sharedWallet:Contract = new ethers.Contract(contractAddress, abi, signer)

        sharedWallet.renewAllowance(user, parseUnits(amount, 18), 600)
        .then((tr: TransactionResponse) => {
            console.log(`TransactionResponse TX hash: ${tr.hash}`);
            pending();
            tr.wait().then((receipt:TransactionReceipt) => {
                console.log("sendCoins receipt",receipt);
                success();
            });
        }).catch((err)=>error({ err }.err.reason))
    }

    async function deposit(event:React.FormEvent) {
        event.preventDefault()
        if(!window.ethereum) return
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const gas_price = provider.getGasPrice() // gasPrice
        const gas_limit = "0x100000"

        const tx = {
            from: currentAccount,
            to: contractAddress,
            value: ethers.utils.parseEther(depositAmount),
            nonce: provider.getTransactionCount(currentAccount, "latest"),
            gasLimit: ethers.utils.hexlify(gas_limit), // 100000
            gasPrice: gas_price,
        }

        signer.sendTransaction(tx).then((tr: TransactionResponse) => {
            console.log(`TransactionResponse TX hash: ${tr.hash}`);
            pending();
            tr.wait().then((receipt:TransactionReceipt) => {
                console.log("deposit receipt",receipt);
                success();
            });
        }).catch((err)=>error({ err }.err.reason))
    }

    const handleChangeDeposit = (value:string) => setDepositAmount(value)
    const handleChangeAmount = (value:string) => setAmount(value)
    const handleChangeUser = (event) => setUser(event.target.value)

    return (
        <form>
        <FormControl my={4}>
        <FormLabel htmlFor='depositAmount'></FormLabel>
        <NumberInput defaultValue={0} min={0} onChange={handleChangeDeposit}>
            <NumberInputField />
        </NumberInput>
        <Button mx={2} onClick={deposit} color='red' isDisabled={!currentAccount}>⬇️ Deposit</Button>
        <FormLabel htmlFor='user'></FormLabel>
        <Input variant='outline' placeholder='Receiver' defaultValue={user} onChange={handleChangeUser}>
        </Input>
        <FormLabel htmlFor='amount'></FormLabel>
        <NumberInput defaultValue={0} min={0} onChange={handleChangeAmount}>
            <NumberInputField />
        </NumberInput>
        <Button mx={2} onClick={renew} color='red' isDisabled={!currentAccount}>⬇️ Send</Button>
        </FormControl>
        </form>
    )
}