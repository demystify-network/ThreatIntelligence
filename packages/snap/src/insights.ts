import dotenv from "dotenv"

dotenv.config()


/**
 * As an example, get transaction insights by looking at the transaction data
 * and attempting to decode it.
 *
 * @param transaction - The transaction to get insights for.
 * @returns The transaction insights.
 */
export async function getInsights(transaction: Record<string, unknown>) {
  try {
    console.log("In insights.ts");
    const result = await getSimulationAssetChanges(transaction);
    if(result.balance !== '') {
      return result;
    }
    console.log("Could not find address from api call, returning dummy response");
    return { "balance": "3.12", "address": "0x72a5843cc08275c8171e582972aa4fda8c397b2a", "tags": "secondeye solution,EXPLOITER,US_GOV_BLOCKED", "firstTransactionTimestamp": "13-Dec-2017", "percentTransactionByRisk": ["40.64", "10.35", "50.11"], "riskScore": "10.00", "transactionTraces": { "topCreditsByRisk": [{ "id": "0", "address": "311f71389e3de68f7b2097ad02c6ad7b2dde4c71", "tags": "scam_phishing,CONTRACT,EXPLOITER", "directTransfer": { "amount": "0.00" }, "indirectTransfers": { "totalPaths": 1, "estimatedAmount": "2.10" } }], "topDebitsByRisk": [{ "id": "0", "address": "311f71389e3de68f7b2097ad02c6ad7b2dde4c71", "tags": "scam_phishing,CONTRACT,EXPLOITER", "directTransfer": { "amount": "0.00" }, "indirectTransfers": { "totalPaths": 1, "estimatedAmount": "1.10" } }] } };
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
  console.log("insights.ts: Inside getSimulationAssetChanges: ", transaction);
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
  console.log("Result: ", result);

  return result;
}