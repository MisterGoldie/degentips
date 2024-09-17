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
const backgroundImage = "https://bafybeiedmcuxwwhimtz7ivvsa7mztnlv5t3fhe7c4jd5b6ocgnmcd52sve.ipfs.w3s.link/check%20frame.png";
const AIRSTACK_API_URL = 'https://api.airstack.xyz/gql';
const AIRSTACK_API_KEY = '103ba30da492d4a7e89e7026a6d3a234e';

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

async function getUserInfo(fid: string): Promise<{ dappName: string; profileImage: string } | null> {
  const query = `
    query GetUserFidInformation {
      Socials(input: {filter: {userId: {_eq: "${fid}"}}, blockchain: ethereum}) {
        Social {
          dappName
          profileImage
        }
      }
    }
  `;

  try {
    const response = await fetch(AIRSTACK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': AIRSTACK_API_KEY,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      console.error('Airstack API error:', await response.text());
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data.Socials.Social[0] || null;
  } catch (error) {
    console.error('Error in getUserInfo:', error);
    throw error;
  }
}

app.frame('/', () => {
  const gifUrl = 'https://bafybeieu6ofyhh23mmnul7guyei535rzlznodajpiefop4gtq2r36chtfi.ipfs.w3s.link/IMG_7981.GIF'
  const baseUrl = 'https://degentips-lac.vercel.app/'

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>$Degen tipping balance</title>
      <meta property="fc:frame" content="vNext">
      <meta property="fc:frame:image" content="${gifUrl}">
      <meta property="fc:frame:button:1" content="Check stats">
      <meta property="fc:frame:button:1:action" content="post">
      <meta property="fc:frame:post_url" content="${baseUrl}/api/check-allowance">
    </head>
    <body>
      <h1>$Degen tipping tracker by @goldie. Only viewable on Warpcast. Follow Goldie on Warpcast - https://warpcast.com/goldie </h1>
    </body>
    </html>
  `

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  })
})

app.frame('/check-allowance', async (c) => {
  const { fid } = c.frameData ?? {};
  const errorImage = "https://bafybeif5xdeft5mfhofj3zrawmn3ldqkhemukuclndie6pnomusiwn2xoe.ipfs.w3s.link/error%20frame.png";

  if (!fid) {
    console.error('No FID provided');
    return c.res({
      image: errorImage,
      intents: [
        <Button action="/">Try Again</Button>
      ],
    });
  }

  try {
    const [allowanceDataArray, userInfo] = await Promise.all([
      getAllowanceData(fid.toString()),
      getUserInfo(fid.toString())
    ]);
    console.log('Allowance Data Array:', allowanceDataArray);
    console.log('User Info:', userInfo);

    if (allowanceDataArray && allowanceDataArray.length > 0 && userInfo) {
      const latestAllowance = allowanceDataArray[0];
      console.log('Latest Allowance Data:', latestAllowance);

      if (parseFloat(latestAllowance.remaining_tip_allowance) <= 0) {
        return c.res({
          image: errorImage,
          intents: [
            <Button action="/">Check Again</Button>
          ],
        });
      }

      return c.res({
        image: (
          <div style={{
            backgroundImage: `url(${backgroundImage})`,
            width: '1200px',
            height: '628px',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px',
            color: 'white',
            fontWeight: 'bold',
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <span style={{fontSize: '40px'}}>@{userInfo.dappName}</span>
              <img src={userInfo.profileImage} alt="Profile" style={{width: '100px', height: '100px', borderRadius: '50%'}} />
            </div>
            
            <div style={{marginTop: 'auto', marginBottom: '20px', fontSize: '32px'}}>
              <div>Daily allowance : {latestAllowance.tip_allowance} $Degen</div>
              <div>Remaining allowance : {latestAllowance.remaining_tip_allowance} $Degen</div>
            </div>
            
            <div style={{fontSize: '24px', alignSelf: 'flex-end'}}>
              As of {new Date(latestAllowance.snapshot_day).toLocaleString('en-US', {
                month: 'numeric',
                day: 'numeric',
                year: '2-digit',
                hour: 'numeric',
                minute: '2-digit',
                timeZone: 'America/Chicago',
                hour12: true
              })} CST
            </div>
          </div>
        ),
        intents: [
          <Button action="/">Check Again</Button>
        ],
      });
    } else {
      throw new Error('No allowance data or user info available');
    }
  } catch (error) {
    console.error('Error in check-allowance frame:', error);
    return c.res({
      image: errorImage,
      intents: [
        <Button action="/">Try Again</Button>
      ],
    });
  }
})

devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)