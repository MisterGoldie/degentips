/** @jsxImportSource frog/jsx */

import { Button, Frog } from 'frog'
import { devtools } from 'frog/dev'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'
import { neynar } from 'frog/middlewares'

interface AllowanceData {
  snapshot_day: string;
  tip_allowance: string;
  remaining_tip_allowance: string;
  user_rank: string;
}

export const app = new Frog({
  basePath: '/api',
  imageOptions: { width: 1200, height: 628 },
  title: '$DEGEN tracker',
}).use(
  neynar({
    apiKey: 'NEYNAR_FROG_FM',
    features: ['interactor', 'cast'],
  })
);

const DEGEN_TIPS_API_URL = 'https://api.degen.tips/airdrop2/allowances';
const gifUrl = 'https://bafybeia4atcvnyksmtksjivpjnhqcjygitebabpcoqsarddk2uhhqbvpy.ipfs.w3s.link/IMG_7980.GIF';

async function getAllowanceData(fid: string): Promise<AllowanceData[]> {
  try {
    const url = `${DEGEN_TIPS_API_URL}?fid=${fid}`;
    console.log('Fetching allowance data from:', url);
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Degen.tips API error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    const data = await response.json();
    console.log('Received data from Degen.tips:', data);
    
    if (Array.isArray(data) && data.length > 0) {
      return data.sort((a, b) => new Date(b.snapshot_day).getTime() - new Date(a.snapshot_day).getTime());
    } else {
      console.log('No allowance data available');
      return [];
    }
  } catch (error) {
    console.error('Error in getAllowanceData:', error);
    throw error;
  }
}

app.frame('/', (c) => {
  return c.res({
    image: gifUrl,
    intents: [
      <Button action="/check-allowance">Check My Allowance</Button>
    ],
  });
});

app.frame('/check-allowance', async (c) => {
  const { fid } = c.frameData ?? {};

  if (!fid) {
    console.error('No FID provided');
    return c.res({
      image: (
        <div
          style={{
            width: '1200px',
            height: '628px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontSize: '40px',
            fontWeight: 'bold',
            textAlign: 'center',
            backgroundColor: '#000000',
          }}
        >
          <div style={{ display: 'flex' }}>Unable to retrieve user information: No FID provided</div>
        </div>
      ),
      intents: [
        <Button action="/">Try Again</Button>
      ],
    });
  }

  try {
    const allowanceDataArray = await getAllowanceData(fid.toString());
    console.log('Allowance Data Array:', allowanceDataArray);

    if (allowanceDataArray && allowanceDataArray.length > 0) {
      const latestAllowance = allowanceDataArray[0];
      console.log('Latest Allowance Data:', latestAllowance);

      return c.res({
        image: (
          <div
            style={{
              width: '1200px',
              height: '628px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'white',
              fontSize: '32px',
              fontWeight: 'bold',
              textAlign: 'center',
              backgroundColor: '#000000',
            }}
          >
            <div style={{ display: 'flex', fontSize: '40px', marginBottom: '20px' }}>Your $DEGEN Allowance</div>
            <div style={{ display: 'flex' }}>Daily Allowance: {latestAllowance.tip_allowance} $DEGEN</div>
            <div style={{ display: 'flex' }}>Remaining Balance: {latestAllowance.remaining_tip_allowance} $DEGEN</div>
            <div style={{ display: 'flex', fontSize: '24px', marginTop: '20px' }}>
              As of: {new Date(latestAllowance.snapshot_day).toLocaleDateString()}
            </div>
          </div>
        ),
        intents: [
          <Button action="/">Check Again</Button>
        ],
      });
    } else {
      throw new Error('No allowance data available');
    }
  } catch (error) {
    console.error('Error in check-allowance frame:', error);
    return c.res({
      image: (
        <div
          style={{
            width: '1200px',
            height: '628px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontSize: '40px',
            fontWeight: 'bold',
            textAlign: 'center',
            backgroundColor: '#000000',
          }}
        >
          <div style={{ display: 'flex' }}>Error fetching data. Please try again later.</div>
        </div>
      ),
      intents: [
        <Button action="/">Try Again</Button>
      ],
    });
  }
});

devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)