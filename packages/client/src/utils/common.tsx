export function shortenAddress(address: string) {
  return `${address.slice(0, 5)}...${address.slice(-4)}`;
}

let bnbPrice: number | null = null;
let fetching: Promise<number> | 0 = 0;

export const getBNBUSDPrice = async (): Promise<number> => {
  if (bnbPrice !== null) return bnbPrice;

  if (fetching) return fetching;

  fetching = fetch('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd')
    .then(res => res.json())
    .then(data => {
      const price = data?.binancecoin?.usd;
      bnbPrice = typeof price === 'number' ? price : 0;
      return bnbPrice;
    })
    .catch(err => {
      console.error('Get BNB Price Error:', err);
      return 0;
    });

  return fetching;
};