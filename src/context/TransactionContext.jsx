import React, {useEffect, useState} from 'react';
import { ethers } from 'ethers';
import { contractABI, contractAddress } from '../util/constants';

export const TransactionContext = React.createContext();

const { ethereum } = window;

const getEthereumContract = () => {
    const provider = new ethers.JsonRpcProvider(process.env.REACT_APP_API_URL);
    const signer = new ethers.Wallet(process.env.REACT_APP_PRIVATE_KEY, provider);
    const transactionContract = new ethers.Contract(contractAddress, contractABI, signer);

   /*  const tx = signer.sendTransaction({
        to: '0x643952c05967B56bc5c2D5B953f41740657EDD26',
        value: ethers.parseUnits('0.001', 'ether'),
      });
      console.log(tx); */

   return transactionContract;
}

export const TransactionProvider = ({children}) => {

     const [currentAccount, setCurrentAccount] = useState('');

     const [formData, setFormData] = useState({addressTo: '', amountTo: '', keyword: '', message: ''});
     const [isLoading, setIsLoading] = useState(false);
     const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount'));

     const handleChange = (e, name) => {

         setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
     }

      const checkIfWalletIsConnected = async () => {
    
    try{

        if (!ethereum) return alert ("Please install metamask!");
        const accounts = await ethereum.request({ method: 'eth_accounts'});

        if(accounts.length){
            setCurrentAccount(accounts[0]);
        }
        else{
            console.log("No accout found!");
        }
        console.log(accounts);

      } catch(error) {
       
        throw new Error("No ethereum object...");
    }
  }    

      const connectWallet = async () => {
          try {
            if (!ethereum) return alert ("Please install metamask!");

            const accounts = await ethereum.request({ method: 'eth_requestAccounts'});

            setCurrentAccount(accounts[0]);
          } catch (error) {
              console.log(error);

              throw new Error("No ethereum object...");
          }
      }

      const sendTransaction = async () => {

          try {
            if (!ethereum) return alert ("Please install metamask!");

            const {addressTo, amount, keyword, message} = formData;

            const transactionContract = getEthereumContract();
            const parsedAmount = ethers.parseUnits(amount, "ether");

            await ethereum.request({ 
                method: 'eth_sendTransaction',
                params: [{
                from: currentAccount,
                to: addressTo, 
                gas: '0x5208',
                value: '0x' + parsedAmount.toString(16),
                }]
            })

           const transactionHash = await transactionContract.addToBlockchain(addressTo,parsedAmount,message,keyword);
           
           setIsLoading(true);
           console.log(`Loading - ${transactionHash.hash}`);
           await transactionHash.wait();

           setIsLoading(false);
           console.log(`Success - ${transactionHash.hash}`);

           const transactionCount = await transactionContract.getTransactionCount();

           setTransactionCount(transactionCount.toNumber());

          } catch (error) {
            console.log(error);

            throw new Error("No ethereum object...");
          }
      }

     useEffect(()=> {
        checkIfWalletIsConnected();
     },[]);

    return (
        <TransactionContext.Provider value={{connectWallet, currentAccount,formData,setFormData,handleChange, sendTransaction}}>
            {children}
        </TransactionContext.Provider>
    );
   }