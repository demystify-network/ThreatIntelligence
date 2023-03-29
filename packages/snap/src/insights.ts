import {
  add0x,
  bytesToHex,
  hasProperty,
  isObject,
  remove0x,
} from '@metamask/utils';
import { decode } from '@metamask/abi-utils';

/**
 * As an example, get transaction insights by looking at the transaction data
 * and attempting to decode it.
 *
 * @param transaction - The transaction to get insights for.
 * @returns The transaction insights.
 */
export async function getInsights(transaction: Record<string, unknown>) {
  try {
    // Check if the transaction has data.
    if (
      !isObject(transaction) ||
      !hasProperty(transaction, 'data') ||
      typeof transaction.data !== 'string'
    ) {
      return {
        type: 'Unknown transaction',
      };
    }

    const transactionData = remove0x(transaction.data);

    // Get possible function names for the function signature, i.e., the first
    // 4 bytes of the data.
    const functionSignature = transactionData.slice(0, 8);
    const matchingFunctions = await getFunctionsBySignature(
      add0x(functionSignature),
    );

    // No functions found for the signature.
    if (matchingFunctions.length === 0) {
      return {
        type: 'Unknown transaction',
      };
    }

    // This is a function name in the shape "functionName(arg1Type,arg2Type,...)", so
    // we do a simple slice to get the argument types.
    const functionName = matchingFunctions[0];
    const parameterTypes = functionName
      .slice(functionName.indexOf('(') + 1, functionName.indexOf(')'))
      .split(',');

    // Decode the parameters using the ABI utils library.
    const decodedParameters = decode(
      parameterTypes,
      add0x(transactionData.slice(8)),
    );

    // Simulate the transaction
    const assetChanges = await getSimulationAssetChanges(transaction);

    // Return the function name and decoded parameters.
    return {
      type: functionName,
      args: decodedParameters.map(normalize4ByteValue),
      changes: assetChanges,
    };
  } catch (error) {
    console.error(error);
    return {
      type: 'Unknown transaction',
    };
  }
}

/**
 * The ABI decoder returns certain which are not JSON serializable. This
 * function converts them to strings.
 *
 * @param value - The value to convert.
 * @returns The converted value.
 */
function normalize4ByteValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalize4ByteValue);
  }

  if (value instanceof Uint8Array) {
    return bytesToHex(value);
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  return value;
}

// The API endpoint to get a list of functions by 4 byte signature.
const API_ENDPOINT =
  'https://www.4byte.directory/api/v1/signatures/?hex_signature=';

/* eslint-disable camelcase */
type FourByteSignature = {
  id: number;
  created_at: string;
  text_signature: string;
  hex_signature: string;
  bytes_signature: string;
};
/* eslint-enable camelcase */

/**
 * Gets the function name(s) for the given 4 byte signature.
 *
 * @param signature - The 4 byte signature to get the function name(s) for. This
 * should be a hex string prefixed with '0x'.
 * @returns The function name(s) for the given 4 byte signature, or an empty
 * array if none are found.
 */
async function getFunctionsBySignature(
  signature: `0x${string}`,
): Promise<string[]> {
  const response = await fetch(`${API_ENDPOINT}${signature}`, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Unable to fetch functions for signature "${signature}": ${response.status} ${response.statusText}.`,
    );
  }

  // The response is an array of objects, each with a "text_signature" property.
  const { results } = (await response.json()) as {
    results: FourByteSignature[];
  };

  // The "text_signature" property is a string like "transfer(address,uint256)",
  // which is what we want. They are sorted by oldest first.
  // We pick the oldest because it's probably the result that we want.
  return results
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((result) => result.text_signature);
}

// The API endpoint to get a list of functions by 4 byte signature.
const ALCHEMY_API_ENDPOINT = 'https://eth-mainnet.g.alchemy.com/v2/alch-demo';

/**
 * Gets the function name(s) for the given 4 byte signature.
 *
 * @param signature - The 4 byte signature to get the function name(s) for. This
 * should be a hex string prefixed with '0x'.
 * @returns The function name(s) for the given 4 byte signature, or an empty
 * array if none are found.
 */
async function getSimulationAssetChanges(
  transaction: Record<string, unknown>,
): Promise<string[]> {
  const response = await fetch(ALCHEMY_API_ENDPOINT, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'alchemy_simulateAssetChanges',
      id: 1,
      params: [
        {
          from: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
          to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          value: '0x0',
          data: '0xa9059cbb000000000000000000000000fc43f5f9dd45258b3aff31bdbe6561d97e8b71de00000000000000000000000000000000000000000000000000000000000f4240',
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Unable to fetch simulation results": ${response.status} ${response.statusText}.`,
    );
  }

  // The response is an array of objects, each with a "text_signature" property.
  const { result } = (await response.json()) as {
    result: FourByteSignature[];
  };
  console.log(result);

  return result.changes;
}