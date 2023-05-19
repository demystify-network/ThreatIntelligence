/**
 * As an example, get transaction insights by looking at the transaction data
 * and attempting to decode it.
 *
 * @param transaction - The transaction to get insights for.
 * @returns The transaction insights.
 */
export async function getInsights(transaction: Record<string, unknown>) {
  try {
    const result = await getSimulationAssetChanges(transaction);
    if(result.balance !== '') {
      return result;
    }
  } catch (error) {
    console.error("----> ", error);
    return {
      type: 'Unknown transaction',
    };
  }
}
/* eslint-enable camelcase */

// Change below as per the env. Figure out how to make this env specific (maybe use dotenv lib)
// const API_ENDPOINT = 'http://localhost:8443/address/threatIntel';
const API_ENDPOINT = 'https://api.demystify.network/address/threatIntel';

// USE env spec. API key. 
const API_KEY = "b98df9b5-8c3e-4e0a-be03-8aea2ee15f3a";

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
) {
  const response = await fetch(API_ENDPOINT, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "address": transaction.to,
      "apiKey": API_KEY
    }),
  });

  if (!response.ok) {
    const errMsg = `Unable to fetch demystify risk score": ${response.status} ${response.statusText}.`;
    console.error(errMsg);
    throw new Error(errMsg);
  }

  // // The response is an array of objects, each with a "text_signature" property.
  const result =  await response.json();

  return result;
}