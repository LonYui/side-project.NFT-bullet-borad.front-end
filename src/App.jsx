import React, { useEffect, useState } from 'react';
import instaLogo from './assets/instaLogo.png';
import './App.css';
import idl from './idl.json';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import { Buffer } from 'buffer';

import kp from './keypair.json'
window.Buffer = Buffer;

const insta_HANDLE = 'florist.nft';
const insta_LINK = `https://instagram.com/${insta_HANDLE}`;

const {SystemProgram, Keypair} = web3;

const arr = Object.values(kp._keypair.secretKey)
const secrete = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secrete)

const programID = new PublicKey(idl.metadata.address)

const network = clusterApiUrl('devnet')

const opts = {
  preflightCommitment: "processed"
}



const App = () => {

  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');
        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getProvider = () => {
  const connection = new Connection(network, opts.preflightCommitment);
  const provider = new Provider(
    connection, window.solana, opts.preflightCommitment,
  );
	return provider;
}
  
  const connectWallet = async () => {
  const { solana } = window;

  if (solana) {
    const response = await solana.connect();
    console.log('Connected with Public Key:', response.publicKey.toString());
    setWalletAddress(response.publicKey.toString());
  }
};

  const onInputChange = (event) => {
  const { value } = event.target;
  setInputValue(value);
};
  
  const sendGif = async () => {
    if(inputValue.length===0){
      return 
    }
    setInputValue('');
    console.log(`gif link:${inputValue}`)
    try{
      const provider = getProvider();
      const program = new Program(idl,programID,provider);

      await program.rpc.addGif(inputValue,{
        accounts:{
          baseAccount:baseAccount.publicKey,
          user:provider.wallet.publicKey
        },
      })
      console.log('gif 成功上鏈',inputValue)
      await getGifList()
    } catch (error){
      console.log("Error sending GIF:",error)
    }    
};
  const upvoteGif = async (gif_link,gif_author_pubkey) => {
    if(gif_link.length===0){
      return 
    }
    console.log(`gif link:${gif_link}`)
      try{
      const provider = getProvider();
      const program = new Program(idl,programID,provider);

      await program.rpc.upVote(gif_link,{
        accounts:{
          baseAccount:baseAccount.publicKey,
          user:provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
          authorAccount: gif_author_pubkey,
        },
      })
      console.log('gif 成功投票',gif_link)
      await getGifList()
    } catch (error){
      console.log("Error 投票 GIF:",error)
    }    


  }
  

  const createGifAccount = async() => {
    try{
          const provider = getProvider();
    const program = new Program(idl, programID, provider);
    console.log('ping')
    await program.rpc.startStuffOff({
        accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId
        },
        signers: [baseAccount],
    })
    console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
    await getGifList()
    }
    catch(error) {
      console.log("error happening when createing base account : ",error)
    }
  };
  
  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  
  const renderConnectedContainer = () => {
    if(gifList === null){
    return (      <div className="connected-container">
        <button className="cta-button submit-gif-button" onClick={createGifAccount}>
          Do One-Time Initialization For GIF Program Account
        </button>
      </div>)
  }else {
    return (
  <div className="connected-container">
    <form
      onSubmit={(event) => {
        event.preventDefault();
        sendGif()
      }}
    >
      <input type="text" placeholder="Enter gif link!"
        value={inputValue} onChange={onInputChange}/>
      <button type="submit" className="cta-button submit-gif-button">Submit</button>
    </form>
    <div className="gif-grid">
        {/* Map through gifList instead of TEST_GIFS */}
        {gifList.map((gif) => (
          <div className="gif-item" key={gif}>
            <img src={gif.gifLink} alt={gif} />
              <div class="middle"><div class="text">{gif.userAddress.toString()}</div></div>
            <button onClick={(event) => {
        event.preventDefault();
        upvoteGif(gif.gifLink,gif.userAddress)}}>{gif.voteCount}❤️‍🩹</button>
          </div>
          

        ))}
    </div>
  </div>
)}};
  const getGifList = async() => {
    try {
      const provider = getProvider()
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey)

      console.log("Got the account", account)
      setGifList(account.gifList)
    }
    catch(error) {
      console.log(error)
      setGifList(null)
    }
  }

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  useEffect(() => {
  if (walletAddress) {
    console.log('Fetching GIF list...');
    getGifList()
  }
}, [walletAddress]);


  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">Gallery</p>
          <p className="sub-text">
            of 賣花少年｜Young Male Florist
          </p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img width="30px" height="30px" alt="insta Logo" className="insta-logo" src={instaLogo} />
          <a
            className="footer-text"
            href={insta_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${insta_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;