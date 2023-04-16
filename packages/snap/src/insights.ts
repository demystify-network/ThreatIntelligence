
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
    return { "balance": "3.12", "address": "0x72a5843cc08275c8171e582972aa4fda8c397b2a", "tags": "secondeye solution,EXPLOITER,US_GOV_BLOCKED", "firstTransactionTimestamp": "13-Dec-2017", "percentTransactionByRisk": ["40.64", "10.35", "50.11"], "riskScore": "10.00", "transactionTraces": { "topCreditsByRisk": [{ "id": "0", "address": "311f71389e3de68f7b2097ad02c6ad7b2dde4c71", "tags": "scam_phishing,CONTRACT,EXPLOITER", "directTransfer": { "amount": "0.00" }, "indirectTransfers": { "totalPaths": 1, "estimatedAmount": "2.10" } }], "topDebitsByRisk": [{ "id": "0", "address": "311f71389e3de68f7b2097ad02c6ad7b2dde4c71", "tags": "scam_phishing,CONTRACT,EXPLOITER", "directTransfer": { "amount": "0.00" }, "indirectTransfers": { "totalPaths": 1, "estimatedAmount": "1.10" } }] } };
  } catch (error) {
    console.error("----> ", error);
    return {
      type: 'Unknown transaction',
    };
  }
}
/* eslint-enable camelcase */

// The API endpoint to get a list of functions by 4 byte signature.
const API_ENDPOINT = 'https://api.demystify.network/address/score';

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
  console.log("insights.ts: Inside getSimulationAssetChanges")
  const response = await fetch(API_ENDPOINT, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      "address": "0x72a5843cc08275C8171E582972Aa4fDa8C397B2A",
      "apiKey": "B98DF9B5-8C3E-4E0A-BE03-8AEA2EE15F3A"
    }),
  });

  if (!response.ok) {
    const errMsg = `Unable to fetch demystify risk score": ${response.status} ${response.statusText}.`;
    console.error(errMsg);
    throw new Error(errMsg);
  }

  // The response is an array of objects, each with a "text_signature" property.
  const { result } = (await response.json());
  console.log("Result: ", result);

  return result;
}