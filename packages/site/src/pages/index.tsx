import { useContext, useState } from 'react';
import styled from 'styled-components';
import { MetamaskActions, MetaMaskContext } from '../hooks';
import {
  connectSnap,
  getSnap,
  sendContractTransaction,
} from '../utils';
import {
  ConnectButton,
  InstallFlaskButton,
  ReconnectButton,
  Card,
  SendTransactionButton,
  Dropdown
} from '../components';

const Container = styled.div`
  background-image: url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPOBAkdC1sQwVhNZgaJ4Eqsjhpxyx2r44x7m5WMwD-dJqBDsLbNQY4JIS2qiPV8pIQ64w&usqp=CAU');
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  margin-top: 7.6rem;
  margin-bottom: 7.6rem;
  ${({ theme }) => theme.mediaQueries.small} {
    padding-left: 2.4rem;
    padding-right: 2.4rem;
    margin-top: 2rem;
    margin-bottom: 2rem;
    width: auto;
  }
`;

const Heading = styled.h1`
  margin-top: 0;
  margin-bottom: 2.4rem;
  text-align: center;
`;

const Span = styled.span`
  color: ${(props) => props.theme.colors.primary.default};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.large};
  font-weight: 500;
  margin-top: 0;
  margin-bottom: 0;
  color: white;
  font-weight: bold;
  ${({ theme }) => theme.mediaQueries.small} {
    font-size: ${({ theme }) => theme.fontSizes.text};
  }
`;

const CardContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  max-width: 64.8rem;
  width: 100%;
  height: 100%;
  margin-top: 1.5rem;
`;

const Notice = styled.div`
  background-color: ${({ theme }) => theme.colors.background.alternative};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  color: ${({ theme }) => theme.colors.text.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;

  & > * {
    margin: 0;
  }
  ${({ theme }) => theme.mediaQueries.small} {
    margin-top: 1.2rem;
    padding: 1.6rem;
  }
`;

const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.error.muted};
  border: 1px solid ${({ theme }) => theme.colors.error.default};
  color: ${({ theme }) => theme.colors.error.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-bottom: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;
  ${({ theme }) => theme.mediaQueries.small} {
    padding: 1.6rem;
    margin-bottom: 1.2rem;
    margin-top: 1.2rem;
    max-width: 100%;
  }
`;

const Index = () => {
  const [state, dispatch] = useContext(MetaMaskContext);

  const handleConnectClick = async () => {
    try {
      await connectSnap();
      const installedSnap = await getSnap();

      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      });
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const handleSendTransactionClick = async () => {
    try {
      await sendContractTransaction(selectedValue);
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  }

  const [selectedValue, setSelectedValue] = useState('0xa9b10d7c4548F4EDc24834e0A4F75Cb7b54D56A4');
  const options = [
    { value: '0xa9b10d7c4548F4EDc24834e0A4F75Cb7b54D56A4', label: 'Bad Actor 1' },
    { value: '0x7ed1e469fcb3ee19c0366d829e291451be638e59', label: 'Bad Actor 2' },
    { value: '0x08A8fDBddc160A7d5b957256b903dCAb1aE512C5', label: 'Bad Actor 3' },
  ];

  const handleDropdownChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedValue(event.target.value);
  };

  return (
    <Container>
      <Heading>EvilSwap</Heading>
      <Subtitle>
        Swap, Earn and LOOSE on leading defraduatized crypto trading protocol
      </Subtitle>
      <CardContainer>
        {state.error && (
          <ErrorMessage>
            <b>An error happened:</b> {state.error.message}
          </ErrorMessage>
        )}
        {!state.isFlask && (
          <Card
            content={{
              title: 'Install',
              description:
                'Snaps is pre-release software only available in MetaMask Flask, a canary distribution for developers with access to upcoming features.',
              button: [<InstallFlaskButton />],
            }}
            fullWidth
          />
        )}
        {!state.installedSnap && (
          <Card
            content={{
              title: 'Connect',
              description:
                'Get started by connecting to and installing the example snap.',
              button:
                [<ConnectButton
                  onClick={handleConnectClick}
                  disabled={!state.isFlask}
                />
                ],
            }}
            disabled={!state.isFlask}
          />
        )}
        {/* {shouldDisplayReconnectButton(state.installedSnap) && (
          <Card
            content={{
              title: 'Reconnect',
              description:
                'While connected to a local running snap this button will always be displayed in order to update the snap if a change is made.',
              button:
                [<ReconnectButton
                  onClick={handleConnectClick}
                  disabled={!state.installedSnap}
                />
                ],
            }}
            disabled={!state.installedSnap}
          />
        )} */}
        <Card
          content={{
            title: 'Swap Funds',
            description: 'Transact with OFAC Blocked Address',
            button: [
              <Dropdown options={options} onChange={handleDropdownChange} />,
              <SendTransactionButton
                onClick={handleSendTransactionClick}
                disabled={!state.installedSnap}
              />
            ]
          }}
          disabled={!state.installedSnap}
          fullWidth={true}
        />
      </CardContainer>
    </Container>
  );
};

export default Index;
