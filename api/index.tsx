/** @jsxImportSource frog/jsx */

import { Button, Frog } from 'frog'
import { devtools } from 'frog/dev'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'
import { neynar } from 'frog/middlewares'

interface UserInfo {
  dappName: string;
  profileName: string;
  profileImage: string;
}

interface AllowanceData {
  snapshot_day: string;
  tip_allowance: string;
  remaining_tip_allowance: string;
  user_rank: string;
}

interface AirstackResponse {
  data: {
    Socials: {
      Social: UserInfo[];
    };
  };
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

const AIRSTACK_API_URL = 'https://api.airstack.xyz/gql';
const AIRSTACK_API_KEY = '103ba30da492d4a7e89e7026a6d3a234e';
const DEGEN_TIPS_API_URL = 'https://api.degen.tips/airdrop2/allowances';
const backgroundImage = "https://bafybeig776f35t7q6fybqfe4zup2kmiqychy4rcdncjjl5emahho6rqt6i.ipfs.w3s.link/Thumbnail%20(31).png";

async function getUserInfo(fid: string): Promise<UserInfo | null> {
  const query = `
    query GetUserFidInformation {
      Socials(input: {filter: {userId: {_eq: "${fid}"}}, blockchain: ethereum}) {
        Social {
          dappName
          profileName
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

    const result: AirstackResponse = await response.json();
    return result.data.Socials.Social[0] || null;
  } catch (error) {
    console.error('Error in getUserInfo:', error);
    throw error;
  }
}

async function getAllowanceData(fid: string): Promise<AllowanceData | null> {
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
      const sortedData = data.sort((a, b) => new Date(b.snapshot_day).getTime() - new Date(a.snapshot_day).getTime());
      return sortedData[0];
    } else {
      console.log('No allowance data available');
      return null;
    }
  } catch (error) {
    console.error('Error in getAllowanceData:', error);
    throw error;
  }
}

app.frame('/', (c) => {
  return c.res({
    image: backgroundImage,
    intents: [
      <Button action="/check-allowance">Check My Allowance</Button>,
    ],
  })
})

app.frame('/check-allowance', async (c) => {
  const { fid } = c.frameData ?? {};

  if (!fid) {
    return c.res({
      image: (
        <div style={{ 
          backgroundImage: `url(${backgroundImage})`,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          fontSize: '32px',
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
          <div>Unable to retrieve user information.</div>
          <div>Please try again.</div>
        </div>
      ),
      intents: [
        <Button action="/">Try Again</Button>
      ],
    });
  }

  try {
    const [userInfo, allowanceData] = await Promise.all([
      getUserInfo(fid.toString()),
      getAllowanceData(fid.toString())
    ]);

    if (userInfo && allowanceData) {
      return c.res({
        image: (
          <div style={{ 
            backgroundImage: `url(${backgroundImage})`,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontSize: '32px',
            fontWeight: 'bold',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '20px' }}>{userInfo.profileName}'s $DEGEN Allowance</div>
            <div>Daily: {allowanceData.tip_allowance}</div>
            <div>Remaining: {allowanceData.remaining_tip_allowance}</div>
            <div>Rank: {allowanceData.user_rank}</div>
            <div style={{ fontSize: '24px', marginTop: '20px' }}>As of: {new Date(allowanceData.snapshot_day).toLocaleDateString()}</div>
          </div>
        ),
        intents: [
          <Button action="/">Check Again</Button>
        ],
      });
    } else {
      throw new Error('Failed to fetch user info or allowance data');
    }
  } catch (error) {
    console.error('Error in check-allowance frame:', error);
    return c.res({
      image: (
        <div style={{ 
          backgroundImage: `url(${backgroundImage})`,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          fontSize: '32px',
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
          <div>Error fetching data.</div>
          <div>Please try again.</div>
        </div>
      ),
      intents: [
        <Button action="/">Try Again</Button>
      ],
    });
  }
})

devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)