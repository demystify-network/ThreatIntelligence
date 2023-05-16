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


  const creditTransactionTraces = insights.transactionTraces?.topCreditsByRisk;
  let highRiskTransactions: Text[] = []
  if (creditTransactionTraces != undefined) {
    highRiskTransactions = getHighRiskTransfers(creditTransactionTraces, "Income");
  }

  const debitTransactionTraces = insights.transactionTraces?.topDebitsByRisk;
  if (debitTransactionTraces != undefined) {
    highRiskTransactions = highRiskTransactions.concat(getHighRiskTransfers(debitTransactionTraces, "Expense"));
  }

  let socialMediaRep = "No Risk";
  if(insights.socialMediaReports != undefined && insights.socialMediaReports !== "") {
    socialMediaRep = insights.socialMediaReports;
  }

  return {
    content: panel([
      text(`**Account**: ${shortenAddress(transaction.to)}`),

      panel([
        text(`**Risk Score**: ${riskScoreDesc}`),
        text(`**Social Media Reports**: ${socialMediaRep}`),
        text(`**Illicit Funds**: ${highRisk}%`),
        divider(),
        text(`**Category**: ${insights.category}`),
        text(`**Intel**: ${insights.tags}`),
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


function getHighRiskTransfers(transactionTraces: {}[], incomeExp: string): Text[] {
  let result: Text[] = []
  transactionTraces.forEach(trace => {
    result.push(text(`**${incomeExp}**: ${shortenAddress(trace.address)}`));
    result.push(text(`&nbsp;&nbsp;&nbsp;&nbsp;**Direct / Indirect**: ${trace.directTransfer.amount} / ${trace.indirectTransfers.estimatedAmount} (${trace.indirectTransfers.totalPaths} paths)`));

    result.push(text(`&nbsp;&nbsp;&nbsp;&nbsp;**Category**: ${trace.category}`));
    result.push(text(`&nbsp;&nbsp;&nbsp;&nbsp;**Intel**: ${trace.tags}`));

  });


  return result;
}

