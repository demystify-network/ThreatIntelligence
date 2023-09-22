import { OnTransactionHandler } from '@metamask/snaps-types';
import { Text, divider, panel, text } from '@metamask/snaps-ui';
import { utils } from 'web3';
import { getInsights } from './insights';
import { getChainId } from './util';

export const onTransaction: OnTransactionHandler = async ({ transaction }) => {
  const hexChainId = await getChainId();
  const chainId = parseInt(`${hexChainId}`, 16);

  let warnText = text('');
  if (chainId !== 1) {
    warnText = text(
      '&#x270B; Ethereum Mainnet was used to generate below insights. Support for your selected chain coming soon.',
    );
  }

  const result = {
    insights: await getInsights(transaction),
  };

  const { insights } = result;

  const { status } = insights;

  if (status === 429) {
    return {
      content: panel([
        text(
          'You have hit max limit for free use. Please try again after some time.',
        ),
        text(
          'To increase you usage limit write us at contact@demystify.network',
        ),
      ]),
    };
  }

  const category = getCategory(insights.category);

  let socialMediaRep = 'No Reports';
  if (
    insights.socialMediaReports !== undefined &&
    insights.socialMediaReports !== ''
  ) {
    socialMediaRep = insights.socialMediaReports;
  }

  let riskScoreDesc = 'N/A';

  const riskScore = parseFloat(insights.riskScore);
  if (!isNaN(riskScore)) {
    if (riskScore <= 5) {
      riskScoreDesc = 'Low';
    } else if (riskScore > 5 && riskScore <= 7) {
      riskScoreDesc = 'Medium';
    } else if (riskScore > 7) {
      riskScoreDesc = 'High';
    }
  }

  if (socialMediaRep === 'High Risk' || riskScoreDesc === 'High') {
    riskScoreDesc = 'High &#10071;';
  } else if (socialMediaRep === 'Medium Risk' || riskScoreDesc === 'Medium') {
    riskScoreDesc = 'Medium &#x270B;';
  } else if (riskScoreDesc === 'Low') {
    riskScoreDesc = 'Low &#x2705;';
  } else {
    riskScoreDesc = 'N/A &#x270B;';
  }

  const { percentTransactionByRisk } = insights;
  let highRisk = 'N/A';

  if (percentTransactionByRisk !== undefined) {
    highRisk = `${percentTransactionByRisk[2]}%`;
  }

  const creditTransactionTraces = insights.transactionTraces?.topCreditsByRisk;
  let highRiskTransactions: Text[] = [];
  if (creditTransactionTraces !== undefined) {
    highRiskTransactions = getHighRiskTransfers(
      creditTransactionTraces,
      'Income',
    );
  }

  const debitTransactionTraces = insights.transactionTraces?.topDebitsByRisk;
  if (debitTransactionTraces !== undefined) {
    highRiskTransactions = highRiskTransactions.concat(
      getHighRiskTransfers(debitTransactionTraces, 'Expense'),
    );
  }

  return {
    content: panel([
      text('**General Information**'),
      warnText,
      text(`**Account**: ${shortenAddress(transaction.to as string)}`),

      panel([
        text(
          `**First Transaction**: ${getFirstTransactionAt(
            insights.firstTransactionTimestamp,
          )}`,
        ),
        text(`**Balance (ETH)**: ${getBalance(insights.balance)}`),
        divider(),
        text('**Risk Summary**'),
        text(`**Risk Score**: ${riskScoreDesc}`),
        text(`**Category**: ${category}`),
        text(`**Tags**: ${naIfUndefined(insights.tags)}`),
        text(`**Social Media Reports**: ${socialMediaRep}`),
        text(`**Illicit Funds**: ${highRisk}`),
        text(`  **FAQ**: https://demystify.network/faq.html`),
        divider(),
        text('**Supporting Data**'),
      ]),
      panel(highRiskTransactions),
    ]),
  };

  /**
   * For a given balance in wei, returns it in Ether.
   *
   * @param bal - Balance in wei format.
   * @returns Returns the balance in Ehter with 6 decimal precision.
   */
  function getBalance(bal: string): string {
    const balance = naIfUndefined(bal);
    if (balance === 'N/A') {
      return balance;
    }

    return parseFloat(utils.fromWei(balance, 'ether')).toFixed(6);
  }

  /**
   * Returns first transaction timestamp if available.
   *
   * @param firstTxnTS - First transaction timestamp.
   * @returns Returns first transaction timestamp if available, else No Data.
   */
  function getFirstTransactionAt(firstTxnTS: string): string {
    if (firstTxnTS === undefined || firstTxnTS === '') {
      return '&#x270B; No Data';
    }

    return firstTxnTS;
  }

  /**
   * Checks if a provided text is undefined or empty.
   *
   * @param someString - Text to check if its undefined or empty.
   * @returns Returns someString itself if not undefied or empty else 'N/A'.
   */
  function naIfUndefined(someString: string): string {
    if (someString === undefined || someString.trim() === '') {
      return 'N/A';
    }

    return someString;
  }
};

/**
 * Shortens the Ethereum (ETH) address to fit in smaller screen real estate.
 *
 * @param address - ETH address which will be shortened.
 * @returns Shortened address.
 */
function shortenAddress(address: string): string {
  const prefix = address.substring(0, 5);
  const suffix = address.substring(address.length - 4);
  return `${prefix}...${suffix}`;
}

/**
 * For the given transactions as received from API response, formats in desired format to be shown in snap.
 *
 * @param transactionTraces - Transaction traces as received from API response.
 * @param incomeExp - Whether its income or expense.
 * @returns Returns an array of Text with the right format as we want to render in snap.
 */
function getHighRiskTransfers(
  transactionTraces: any[],
  incomeExp: string,
): Text[] {
  const result: Text[] = [];
  const numOfEleToRead =
    transactionTraces.length >= 2 ? 2 : transactionTraces.length;
  for (let index = 0; index < numOfEleToRead; index++) {
    const trace = transactionTraces[index];
    result.push(text(`**${incomeExp}**: ${shortenAddress(trace.address)}`));
    result.push(
      text(
        `&nbsp;&nbsp;&nbsp;&nbsp;**Direct / Indirect**: ${trace.directTransfer.amount} / ${trace.indirectTransfers.estimatedAmount} (${trace.indirectTransfers.totalPaths} paths)`,
      ),
    );

    result.push(
      text(
        `&nbsp;&nbsp;&nbsp;&nbsp;**Category/Tags**: ${getCategory(
          trace.category,
        )} / ${trace.tags}`,
      ),
    );
  }

  return result;
}

/**
 * Returns category with any replacement which is required for UI.
 *
 * @param category - Category as received in response.
 * @returns Cateogry with any replacement that is needed.
 */
function getCategory(category: any) {
  if (category !== undefined && category !== '') {
    return category.replace('US_GOV_BLOCKED', 'SANCTIONED');
  }
  return 'N/A';
}
