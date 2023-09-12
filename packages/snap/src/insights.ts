/**
 * As an example, get transaction insights by looking at the transaction data
 * and attempting to decode it.
 *
 * @param transaction - The transaction to get insights for.
 * @returns The transaction insights.
 */
export async function getInsights(transaction: Record<string, unknown>) {
  try {
    return await getSimulationAssetChanges(transaction);
  } catch (error) {
    console.error('Error while getting insights ', error);
    return error;
  }
}
/* eslint-enable camelcase */

const TARGET =
  'aHR0cHM6Ly9hcGkuZGVteXN0aWZ5Lm5ldHdvcmsvYWRkcmVzcy90aHJlYXRJbnRlbA==';

/**
 * Calls threat intel endpoint.
 *
 * @param transaction - Metamask transaction object.
 * @returns A json string holding details for address like risk score, income/expense details etc.
 */
async function getSimulationAssetChanges(transaction: Record<string, unknown>) {
  const response = await fetch(Buffer.from(TARGET, 'base64').toString(), {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      address: transaction.to,
      additionalInfo: transaction,
    }),
  });

  if (!response.ok) {
    const errMsg = `Unable to fetch demystify risk score": ${response.status} ${response.statusText}.`;
    console.error(errMsg);
    throw { status: response.status, errMsg };
  }

  const result = await response.json();

  return result;
}
