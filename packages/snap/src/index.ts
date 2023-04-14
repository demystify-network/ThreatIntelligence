import { OnRpcRequestHandler, OnTransactionHandler } from '@metamask/snaps-types';
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
  var blah = {
    insights: await getInsights(transaction)
  };

  const insights = blah.insights;
  let riskScoreDesc = "Low";
  const riskScore = parseFloat(insights.riskScore)
  if (!isNaN(riskScore)) {
    if (riskScore > 5 && riskScore <= 7) {
      riskScoreDesc = "Medium";
    } else if (riskScore > 7) {
      riskScoreDesc = "High";
    }
  }

  const percentTransactionByRisk = insights.percentTransactionByRisk;
  let highRisk = "n/a";

  if (percentTransactionByRisk !== undefined) {
    highRisk = percentTransactionByRisk[2];
  }

  const categoryAnyIntel = extractCategoryAndIntelAsCSV(insights.tags);


  const creditTransactionTraces = insights.transactionTraces?.topCreditsByRisk;
  let highRiskTransactions: Text[] = []
  if (creditTransactionTraces != undefined) {
    highRiskTransactions = getHighRiskTransfers(creditTransactionTraces, "Income");
  }

  const debitTransactionTraces = insights.transactionTraces?.topDebitsByRisk;
  if (debitTransactionTraces != undefined) {
    highRiskTransactions.concat(getHighRiskTransfers(debitTransactionTraces, "Expense"));
  }

  return {
    content: panel([
      text(`**Account**: ${shortenAddress(transaction.to)}`),

      panel([
        text(`**Risk Score**: ${riskScoreDesc}`),
        text(`**Social Media Reports**: No risk`),
        text(`**Illicit Funds**: ${highRisk}%`),
        divider(),
        text(`**Category**: ${categoryAnyIntel.category}`),
        text(`**Intel**: ${categoryAnyIntel.intel}`),
        divider(),
        text("**High Risk Transfer (ETH)**"),
      ]),

      panel(highRiskTransactions)

    ])
  };

};

function shortenAddress(address: string): string {
  const prefix = address.substring(0, 5);
  const suffix = address.substring(address.length - 4);
  return prefix + "..." + suffix;
}

function extractCategoryAndIntelAsCSV(input: string): { category: string, intel: string } {
  const words = input.split(",");
  const { category: upper, intel: lower } = words.filter(token => token.trim() !== "")
    .reduce((result, token) => {
      if (/^[A-Z_]+$/.test(token)) {
        result.category.push(toCamelCase(token));
      } else {
        result.intel.push(toCamelCase(token));
      }
      return result;
    }, { category: [], intel: [] });

  return {
    category: upper.join(","),
    intel: lower.join(",")
  };
}

function toCamelCase(input: string): string {
  let result = "";
  let nextUpper = true;
  for (var i = 0; i < input.length; i++) {
    const c = input.charAt(i);
    result += nextUpper ? c.toUpperCase() : c.toLowerCase();
    if (c === ' ' || c === '_' || c === '-') {
      nextUpper = true;
    } else {
      nextUpper = false;
    }
  }

  return result;
}


function getHighRiskTransfers(transactionTraces: {}[], incomeExp: string): Text[] {
  let result: Text[] = []
  transactionTraces.forEach(trace => {
    result.push(text(`**${incomeExp}**: ${shortenAddress(trace.address)}`));
    result.push(text(`&nbsp;&nbsp;&nbsp;&nbsp;**Direct / Indirect**: ${trace.directTransfer.amount} / ${trace.indirectTransfers.estimatedAmount} (${trace.indirectTransfers.totalPaths} paths)`));

    const catIntel = extractCategoryAndIntelAsCSV(trace.tags);
    result.push(text(`&nbsp;&nbsp;&nbsp;&nbsp;**Category**: ${catIntel.category}`));
    result.push(text(`&nbsp;&nbsp;&nbsp;&nbsp;**Intel**: ${catIntel.intel}`));

  });


  return result;
}

