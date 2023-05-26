import { defaultSnapOrigin } from '../config';
import { GetSnapsResponse, Snap } from '../types';

/**
 * Get the installed snaps in MetaMask.
 *
 * @returns The snaps installed in MetaMask.
 */
export const getSnaps = async (): Promise<GetSnapsResponse> => {
  return (await window.ethereum.request({
    method: 'wallet_getSnaps',
  })) as unknown as GetSnapsResponse;
};

/**
 * Connect a snap to MetaMask.
 *
 * @param snapId - The ID of the snap.
 * @param params - The params to pass with the snap to connect.
 */
export const connectSnap = async (
  snapId: string = defaultSnapOrigin,
  params: Record<'version' | string, unknown> = {},
) => {
  await window.ethereum.request({
    method: 'wallet_requestSnaps',
    params: {
      [snapId]: params,
    },
  });
};

/**
 * Get the snap from MetaMask.
 *
 * @param version - The version of the snap to install (optional).
 * @returns The snap object returned by the extension.
 */
export const getSnap = async (version?: string): Promise<Snap | undefined> => {
  try {
    const snaps = await getSnaps();

    return Object.values(snaps).find(
      (snap) =>
        snap.id === defaultSnapOrigin && (!version || snap.version === version),
    );
  } catch (e) {
    console.log('Failed to obtain installed snap', e);
    return undefined;
  }
};

export const sendContractTransaction = async (toAccount: string) => {
  // Get the user's account from MetaMask.
  const [from] = (await window.ethereum.request({
    method: 'eth_requestAccounts',
  })) as string[];

  enum TransactionConstants {
    // Arbitrary contract that will revert any transactions that accidentally go through
    Address = '0xa9b10d7c4548F4EDc24834e0A4F75Cb7b54D56A4',
    // Some raw contract transaction data we will decode
    UpdateWithdrawalAccount = '0x83ade3dc00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000047170ceae335a9db7e96b72de630389669b334710000000000000000000000006b175474e89094c44da98b954eedeac495271d0f',
    UpdateMigrationMode = '0x2e26065e0000000000000000000000000000000000000000000000000000000000000000',
    UpdateCap = '0x85b2c14a00000000000000000000000047170ceae335a9db7e96b72de630389669b334710000000000000000000000000000000000000000000000000de0b6b3a7640000',
  }

  // Send a transaction to MetaMask.
  await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from,
        to: toAccount,
        value: '0x0',
        data: TransactionConstants.UpdateWithdrawalAccount,
      },
    ],
  });
};

export const isLocalSnap = (snapId: string) => snapId.startsWith('local:');
