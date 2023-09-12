/**
 * Returns current selected chainId.
 *
 * @returns Returns selected chain id.
 */
export async function getChainId() {
  return await ethereum.request({ method: 'eth_chainId' });
}
