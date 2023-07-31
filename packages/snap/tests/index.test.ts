import { onTransaction } from '../src';
import { getInsights } from '../src/insights';

jest.mock('../src/insights', () => ({
  ...jest.requireActual('../src/insights'),
  getInsights: jest.fn(),
}));

const mockedGetInsights = getInsights as jest.Mock;

describe('onTransaction', () => {
  it('should return result as expected with all attributes', async () => {
    const transaction = {
      data: '0x83ade3dc00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000047170ceae335a9db7e96b72de630389669b334710000000000000000000000006b175474e89094c44da98b954eedeac495271d0f',
      from: '0xff193f66906eebcb664f92db2116c4712cb304c4',
      gas: '0x8232',
      maxFeePerGas: '0xb70fdda0',
      maxPriorityFeePerGas: '0xb70fdd8b',
      to: '0xd4b88df4d29f5cedd6857912842cff3b20c8cfa3',
      value: '0x0',
    };

    mockedGetInsights.mockResolvedValue({
      balance: '100',
      address: '0xd4b88df4d29f5cedd6857912842cff3b20c8cfa3',
      category: 'MIXER,US_GOV_BLOCKED',
      tags: 'tornado.cash,exploiter',
      socialMediaReports: '',
      firstTransactionTimestamp: '17-Dec-2019',
      percentTransactionByRisk: ['71.75', '12.78', '15.46'],
      riskScore: '10.00',
      transactionTraces: {
        topCreditsByRisk: [
          {
            id: '0',
            address: '905b63fff465b9ffbf41dea908ceb12478ec7601',
            category: 'MIXER',
            tags: 'tornado.cash,exploiter',
            directTransfer: {
              amount: '0.00',
            },
            indirectTransfers: {
              totalPaths: 201,
              estimatedAmount: '44.20',
            },
          },
          {
            id: '1',
            address: '2e9494387868eb9ec6997b711d655de82f53713f',
            category: 'GAMBLING',
            tags: 'findtherabbit.me',
            directTransfer: {
              amount: '0.00',
            },
            indirectTransfers: {
              totalPaths: 10,
              estimatedAmount: '0.73',
            },
          },
        ],
        topDebitsByRisk: [
          {
            id: '0',
            address: '5acc84a3e955bdd76467d3348077d003f00ffb97',
            category: 'EXPLOITER',
            tags: 'forsage.io',
            directTransfer: {
              amount: '0.00',
            },
            indirectTransfers: {
              totalPaths: 4,
              estimatedAmount: '0.02',
            },
          },
          {
            id: '1',
            address: '905b63fff465b9ffbf41dea908ceb12478ec7601',
            category: 'MIXER',
            tags: 'tornado.cash,exploiter',
            directTransfer: {
              amount: '0.00',
            },
            indirectTransfers: {
              totalPaths: 22,
              estimatedAmount: '0.97',
            },
          },
          {
            id: '2',
            address: '4e8ecf79ade5e2c49b9e30d795517a81e0bf00b8',
            category: 'LOTTERY,GAMBLING',
            tags: 'fomo3d',
            directTransfer: {
              amount: '0.00',
            },
            indirectTransfers: {
              totalPaths: 1,
              estimatedAmount: '0.00',
            },
          },
        ],
      },
    });

    const result = await onTransaction({ transaction, chainId: '' });

    expect(mockedGetInsights).toHaveBeenCalled();
    expect(result).not.toBeNull();

    const { content }: any = result;
    expect(content).not.toBeNull();
    expect(content.type).toBe('panel');

    const { children } = content;
    expect(children).not.toBeNull();
    expect(children).toHaveLength(3);

    const accountText: any = children[0];
    expect(accountText).not.toBeNull();
    expect(accountText.value).toBe('**Account**: 0xd4b...cfa3');

    const riskScorePanel = children[1];
    expect(riskScorePanel).not.toBeNull();

    const riskScorePanelChildren = riskScorePanel.children;
    expect(riskScorePanelChildren).not.toBeNull();
    expect(riskScorePanelChildren).toHaveLength(9);

    assertTextFiled(riskScorePanelChildren[0], '**Risk Score**: High &#10071;');

    assertTextFiled(
      riskScorePanelChildren[2],
      '**Category**: MIXER,US_GOV_BLOCKED',
    );

    assertTextFiled(
      riskScorePanelChildren[3],
      '**Intel**: tornado.cash,exploiter',
    );

    assertTextFiled(
      riskScorePanelChildren[4],
      '**Social Media Reports**: No Reports',
    );
    assertTextFiled(riskScorePanelChildren[5], '**Illicit Funds**: 15.46%');
    assertTextFiled(riskScorePanelChildren[6], '&#9889; Demystify.Network');

    assertTextFiled(
      riskScorePanelChildren[8],
      '**Potentially Risky Transfers (ETH)**',
    );

    const incomeExpensePanel = children[2];
    expect(incomeExpensePanel).not.toBeNull();
    expect(incomeExpensePanel.type).toBe('panel');

    const incomeExpensePanelChildren: any = incomeExpensePanel.children;
    expect(incomeExpensePanelChildren).not.toBeNull();
    expect(incomeExpensePanelChildren).toHaveLength(15);

    let incomeCount = 0;
    let expenseCount = 0;
    incomeExpensePanelChildren.forEach((element: any) => {
      expect(element).not.toBeNull();
      expect(element.type).toBe('text');
      if (element.value.startsWith('**Income**')) {
        incomeCount += 1;
      }

      if (element.value.startsWith('**Expense**')) {
        expenseCount += 1;
      }
    });

    expect(incomeCount).toBe(2);
    expect(expenseCount).toBe(3);
  });
});

/**
 * Helper function to assert text field.
 *
 * @param textElement - Text element whose value to be tested.
 * @param value - Expected value.
 */
function assertTextFiled(textElement: any, value: string) {
  expect(textElement).not.toBeNull();
  expect(textElement.type).toBe('text');
  expect(textElement.value).toBe(value);
}
