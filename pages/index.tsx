import {
  PublicKey,
  publicKey,
  Umi,
} from "@metaplex-foundation/umi";
import { DigitalAssetWithToken, JsonMetadata } from "@metaplex-foundation/mpl-token-metadata";
import dynamic from "next/dynamic";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { useUmi } from "../utils/useUmi";
import { fetchCandyMachine, safeFetchCandyGuard, CandyGuard, CandyMachine, AccountVersion } from "@metaplex-foundation/mpl-candy-machine"
import styles from "../styles/Home.module.css";
import { guardChecker } from "../utils/checkAllowed";
import { Center, Card, CardHeader, CardBody, StackDivider, Heading, Stack, useToast, Text, Skeleton, useDisclosure, Button, Modal, ModalBody, ModalCloseButton, ModalContent, Image, ModalHeader, ModalOverlay, Box, Divider, VStack, Flex, Link } from '@chakra-ui/react';
import { ButtonList } from "../components/mintButton";
import { GuardReturn } from "../utils/checkerHelper";
import { ShowNft } from "../components/showNft";
import { InitializeModal } from "../components/initializeModal";
import { image, headerText, discord, github, linkedin, twitter } from "../settings";
import { useSolanaTime } from "@/utils/SolanaTimeContext";
import router from "next/router";

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

const useCandyMachine = (
  umi: Umi,
  candyMachineId: string,
  checkEligibility: boolean,
  setCheckEligibility: Dispatch<SetStateAction<boolean>>,
  firstRun: boolean,
  setfirstRun: Dispatch<SetStateAction<boolean>>
) => {
  const [candyMachine, setCandyMachine] = useState<CandyMachine>();
  const [candyGuard, setCandyGuard] = useState<CandyGuard>();
  const toast = useToast();


  useEffect(() => {
    (async () => {
      if (checkEligibility) {
        if (!candyMachineId) {
          console.error("No candy machine in .env!");
          if (!toast.isActive("no-cm")) {
            toast({
              id: "no-cm",
              title: "No candy machine in .env!",
              description: "Add your candy machine address to the .env file!",
              status: "error",
              duration: 999999,
              isClosable: true,
            });
          }
          return;
        }

        let candyMachine;
        try {
          candyMachine = await fetchCandyMachine(umi, publicKey(candyMachineId));
          //verify CM Version
          if (candyMachine.version != AccountVersion.V2){
            toast({
              id: "wrong-account-version",
              title: "Wrong candy machine account version!",
              description: "Please use latest sugar to create your candy machine. Need Account Version 2!",
              status: "error",
              duration: 999999,
              isClosable: true,
            });
            return;
          }
        } catch (e) {
          console.error(e);
          toast({
            id: "no-cm-found",
            title: "The CM from .env is invalid",
            description: "Are you using the correct environment?",
            status: "error",
            duration: 999999,
            isClosable: true,
          });
        }
        setCandyMachine(candyMachine);
        if (!candyMachine) {
          return;
        }
        let candyGuard;
        try {
          candyGuard = await safeFetchCandyGuard(umi, candyMachine.mintAuthority);
        } catch (e) {
          console.error(e);
          toast({
            id: "no-guard-found",
            title: "No Candy Guard found!",
            description: "Do you have one assigned?",
            status: "error",
            duration: 999999,
            isClosable: true,
          });
        }
        if (!candyGuard) {
          return;
        }
        setCandyGuard(candyGuard);
        if (firstRun){
          setfirstRun(false)
        }
      }
    })();
  }, [umi, checkEligibility]);

  return { candyMachine, candyGuard };


};


export default function Home() {
  const umi = useUmi();
  const solanaTime = useSolanaTime();
  const toast = useToast();
  const { isOpen: isShowNftOpen, onOpen: onShowNftOpen, onClose: onShowNftClose } = useDisclosure();
  const { isOpen: isInitializerOpen, onOpen: onInitializerOpen, onClose: onInitializerClose } = useDisclosure();
  const [mintsCreated, setMintsCreated] = useState<{ mint: PublicKey, offChainMetadata: JsonMetadata | undefined }[] | undefined>();
  const [isAllowed, setIsAllowed] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [ownedTokens, setOwnedTokens] = useState<DigitalAssetWithToken[]>();
  const [guards, setGuards] = useState<GuardReturn[]>([
    { label: "startDefault", allowed: false, maxAmount: 0 },
  ]);
  const [firstRun, setFirstRun] = useState(true);
  const [checkEligibility, setCheckEligibility] = useState<boolean>(true);


  if (!process.env.NEXT_PUBLIC_CANDY_MACHINE_ID) {
    console.error("No candy machine in .env!")
    if (!toast.isActive('no-cm')) {
      toast({
        id: 'no-cm',
        title: 'No candy machine in .env!',
        description: "Add your candy machine address to the .env file!",
        status: 'error',
        duration: 999999,
        isClosable: true,
      })
    }
  }
  const candyMachineId: PublicKey = useMemo(() => {
    if (process.env.NEXT_PUBLIC_CANDY_MACHINE_ID) {
      return publicKey(process.env.NEXT_PUBLIC_CANDY_MACHINE_ID);
    } else {
      console.error(`NO CANDY MACHINE IN .env FILE DEFINED!`);
      toast({
        id: 'no-cm',
        title: 'No candy machine in .env!',
        description: "Add your candy machine address to the .env file!",
        status: 'error',
        duration: 999999,
        isClosable: true,
      })
      return publicKey("11111111111111111111111111111111");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { candyMachine, candyGuard } = useCandyMachine(umi, candyMachineId, checkEligibility, setCheckEligibility, firstRun, setFirstRun);

  useEffect(() => {
    const checkEligibilityFunc = async () => {
      if (!candyMachine || !candyGuard || !checkEligibility || isShowNftOpen) {
        return;
      }
      setFirstRun(false);
      
      const { guardReturn, ownedTokens } = await guardChecker(
        umi, candyGuard, candyMachine, solanaTime
      );

      setOwnedTokens(ownedTokens);
      setGuards(guardReturn);
      setIsAllowed(false);

      let allowed = false;
      for (const guard of guardReturn) {
        if (guard.allowed) {
          allowed = true;
          break;
        }
      }

      setIsAllowed(allowed);
      setLoading(false);
    };

    checkEligibilityFunc();
    // On purpose: not check for candyMachine, candyGuard, solanaTime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [umi, checkEligibility, firstRun]);


   
  const PageContent = () => {
    return (
      <>
        <style jsx global>
          {`
      body {
          background: #000; 
       }
   `}
        </style>

        <div className={styles.nftBoxGrid}>
        <div className={styles.optionSelectBox4}>
        <h1 className={styles.title}>Demo Project</h1>
            
            <br/>
            <h2 className={styles.selectBoxTitle2}>Description </h2>
            <br/>
              <h3 className={styles.selectBoxTitle}>This Is A Sample Event So You Can See How Your Actual Event Will Look</h3>
              <br/>
            <br/>
            <h2 className={styles.selectBoxTitle2}>Instructions</h2>
            <br/>
            <h3 className={styles.selectBoxTitle}>Select The Event You Want, Then Carefully Read The Instructions.
                                                  Learn Where The Event Is Being Held And How To Get There.
                                                  Mint The Ticket And Wait For The Event Date.
                                                  when You Arrive At The Event, You’ll Find The Sponsor Waiting For You.</h3>
      
      <br/>
    
        </div>
        <div 
          className={styles.optionSelectBox4}>
         <Image src={image} alt="token" width={620} height={350} borderRadius={20}/>
         
        </div>
        </div>

        <div className={styles.nftBoxGrid}>
        <div className={styles.optionSelectBox4}>
   
       <VStack >
       <Text fontSize={"md"} fontStyle={"italic"} marginTop={"30"} marginRight={"150"} > Remaining NFTs</Text>
       <Text fontWeight={"semibold"} marginRight={"150"}>{Number(candyMachine?.data.itemsAvailable) - Number(candyMachine?.itemsRedeemed)}/{Number(candyMachine?.data.itemsAvailable)}</Text>
       </VStack>
        </div>
        <div 
          className={styles.optionSelectBox4}>
        <Stack divider={<StackDivider />} spacing='8'>
              {loading ? (
                <div>
                  <Divider my="10px" />
                  <Skeleton height="30px" my="10px" />
                  <Skeleton height="30px" my="10px" />
                  <Skeleton height="30px" my="10px" />
                </div>
              ) : (
                <ButtonList 
                  guardList={guards}
                  candyMachine={candyMachine}
                  candyGuard={candyGuard}
                  umi={umi}
                  ownedTokens={ownedTokens}
                  setGuardList={setGuards}
                  mintsCreated={mintsCreated}
                  setMintsCreated={setMintsCreated}
                  onOpen={onShowNftOpen}
                  setCheckEligibility={setCheckEligibility}

                />
              )}
            </Stack>
         
        </div>
        </div>

        <div className={styles.nftBoxGrid}>

        <div className={styles.optionSelectBox5}>
        <div className={styles.link}>
        
         </div>
         
            </div>
            <div className={styles.optionSelectBox5}>
        <div className={styles.link}>
        <Link href="https://www.linkedin.com/company/solpad-nft" className={styles.link} target="_blank" rel="noreferrer">
        <Image src={linkedin} alt="token" width={10} height={10} borderRadius={20}/>
        </Link>
         </div>
         
            </div>
            <div className={styles.optionSelectBox5}>
        <div className={styles.link}>
        <Link href="https://twitter.com/Solpadnft" className={styles.link} target="_blank" rel="noreferrer">
        <Image src={twitter} alt="token" width={10} height={10} borderRadius={20}/>
        </Link>
         </div>
         
            </div>
            <div className={styles.optionSelectBox5}>
        <div className={styles.link}>
        <Link href="https://discord.gg/jmMY8MrQCt" className={styles.link} target="_blank" rel="noreferrer">
        <Image src={discord} alt="token" width={10} height={10} borderRadius={20}/>
        </Link>
         </div>
         
            </div>
            <div className={styles.optionSelectBox5}>
        <div className={styles.link}>
        <Link href="https://github.com/solpad-art" className={styles.link} target="_blank" rel="noreferrer">
        <Image src={github} alt="token" width={10} height={10} borderRadius={20}/>
        </Link>
                 </div>
         
            </div>
            <div className={styles.optionSelectBox5}>
        <div className={styles.link}>
        
         </div>
         
            </div>
            <div className={styles.optionSelectBox5}>
        <div className={styles.link}>
        
         </div>
         </div>
            <div className={styles.optionSelectBox5}>
        <div className={styles.link}>
        
         </div>
         </div>
            <div className={styles.optionSelectBox5}>
        <div className={styles.link}>
        
         </div>
         </div>
            <div className={styles.optionSelectBox5}>
        <div className={styles.link}>
        
         </div>
         </div>
            <div className={styles.optionSelectBox5}>
        <div className={styles.link}>
        
         </div>
         </div>
         
            <div className={styles.optionSelectBox5}>
        <div className={styles.link}>
        <Link href="https://solpad.art/" className={styles.link} target="_blank" rel="noreferrer">
          <h2 className={styles.selectBoxTitle2}>Launchpad</h2>
                </Link>
         </div>
         </div>
            <div className={styles.optionSelectBox5}>
        <div className={styles.link}>
        <Link href="https://solnm.com/" className={styles.link} target="_blank" rel="noreferrer">
          <h2 className={styles.selectBoxTitle2}>Market</h2>
                </Link>
         </div>
            </div>
            

            <div className={styles.optionSelectBox5} >
              
              <div className={styles.link}>
          <Link href="https://solpad.art/dashboard/basic-drop" className={styles.link} target="_blank" rel="noreferrer">
          <h2 className={styles.selectBoxTitle2}>Apply</h2>
                </Link>
                </div>
            </div>
            <div className={styles.optionSelectBox5} >
              
              <div className={styles.link}>
          <Link href="https://docs.solpad.art/" className={styles.link} target="_blank" rel="noreferrer">
          <h2 className={styles.selectBoxTitle2}>Docs</h2>
                </Link>
                </div>
            </div>

            <div className={styles.optionSelectBox5} >
              
              <div className={styles.link}>
          
                </div>
                
            </div>
            <div className={styles.optionSelectBox5} >
              
              <div className={styles.link}>
          
                </div>
                
            </div>
            <div className={styles.optionSelectBox5} >
              
              <div className={styles.link}>
          
                </div>
                
            </div>
            
           </div>
        <br/>
        
        <Card backgroundColor={"#000"} >

          <CardBody>
            
   
          </CardBody>
        </Card >
        {umi.identity.publicKey === candyMachine?.authority ? (
          <>
            <Center>
              <Button backgroundColor={"red.200"} marginTop={"11"} onClick={onInitializerOpen}>Initialize Everything!</Button>
            </Center>
            <Modal isOpen={isInitializerOpen} onClose={onInitializerClose}>
              <ModalOverlay />
              <ModalContent  backgroundColor={"#000"} maxW="600px">
                <ModalHeader>Initializer</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  < InitializeModal umi={umi} candyMachine={candyMachine} candyGuard={candyGuard} />
                </ModalBody>
              </ModalContent>
            </Modal>

          </>)
          :
          (<></>)
        }

        <Modal isOpen={isShowNftOpen} onClose={onShowNftClose}>
          <ModalOverlay />
          <ModalContent backgroundColor={"#000"}>
            <ModalHeader >Your minted NFT</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <ShowNft nfts={mintsCreated} />
            </ModalBody>
          </ModalContent>
        </Modal>
      </>
    );
  };

  return (
    <main>
      <div className={styles.wallet}>
        <WalletMultiButtonDynamic />
      </div>

      <div className={styles.center}>
        <PageContent key="content" />
      </div>
      
    </main>
  );
}
