import {
  OnRpcRequestHandler,
  OnTransactionHandler,
} from '@metamask/snaps-types';
import { Text, divider, panel, text } from '@metamask/snaps-ui';
import { getInsights } from './insights';

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = ({ origin, request }) => {
  switch (request.method) {
    case 'hello':
      return snap.request({
        method: 'snap_dialog',
        params: {
          type: 'Confirmation',
          content: panel([
            text(`Hello, **${origin}**!`),
            text('This custom confirmation is just for display purposes.'),
            text(
              'But you can edit the snap source code to make it do something, if you want to!',
            ),
          ]),
        },
      });
    default:
      throw new Error('Method not found.');
  }
};

export const onTransaction: OnTransactionHandler = async ({ transaction }) => {
  const result = {
    insights: await getInsights(transaction),
  };

  const { insights } = result;

  let socialMediaRep = 'No Risk';
  if (
    insights.socialMediaReports !== undefined &&
    insights.socialMediaReports !== ''
  ) {
    socialMediaRep = insights.socialMediaReports;
  }

  let riskScoreDesc = 'Low';

  const riskScore = parseFloat(insights.riskScore);
  if (!isNaN(riskScore)) {
    if (riskScore > 5 && riskScore <= 7) {
      riskScoreDesc = 'Medium';
    } else if (riskScore > 7) {
      riskScoreDesc = 'High';
    }
  }

  if (socialMediaRep === 'High Risk' || riskScoreDesc === 'High') {
    riskScoreDesc = 'High';
  } else if (socialMediaRep === 'Medium Risk' || riskScoreDesc === 'Medium') {
    riskScoreDesc = 'Medium';
  } else {
    riskScoreDesc = 'Low Risk';
  }

  const { percentTransactionByRisk } = insights;
  let highRisk = 'n/a';

  if (percentTransactionByRisk !== undefined) {
    highRisk = percentTransactionByRisk[2];
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
      text(`**Account**: ${shortenAddress(transaction.to)}`),

      panel([
        text(`**Risk Score**: ${riskScoreDesc}`),
        divider(),
        text(`**Category**: ${insights.category}`),
        text(`**Intel**: ${insights.tags}`),
        text(`**Social Media Reports**: ${socialMediaRep}`),
        text(`**Illicit Funds**: ${highRisk}%`),
        divider(),
        text('**Potentially Risky Transfers (ETH)**'),
      ]),
      panel(highRiskTransactions),
    ]),
  };
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
  transactionTraces: [],
  incomeExp: string,
): Text[] {
  const result: Text[] = [];
  transactionTraces.forEach((trace) => {
    result.push(text(`**${incomeExp}**: ${shortenAddress(trace.address)}`));
    result.push(
      text(
        `&nbsp;&nbsp;&nbsp;&nbsp;**Direct / Indirect**: ${trace.directTransfer.amount} / ${trace.indirectTransfers.estimatedAmount} (${trace.indirectTransfers.totalPaths} paths)`,
      ),
    );

    result.push(
      text(
        `&nbsp;&nbsp;&nbsp;&nbsp;**Category/Intel**: ${trace.category} / ${trace.tags}`,
      ),
    );
  });

  return result;
}
