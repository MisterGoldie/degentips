/** @jsxImportSource frog/jsx */

import { Button, Frog } from 'frog'
import { devtools } from 'frog/dev'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'

interface UserInfo {
  dappName: string;
  profileName: string;
  profileImage: string;
}

interface TipData {
  amount: number;
  // Add other properties as needed
}

interface AirstackResponse {
  data: {
    Socials: {
      Social: UserInfo[];
    };
  };
}

const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  title: 'DEGEN Allowance Checker',
})

const AIRSTACK_API_URL = 'https://api.airstack.xyz/gql';
const AIRSTACK_API_KEY = '103ba30da492d4a7e89e7026a6d3a234e';
const DEGEN_TIPS_API_URL = 'https://api.degen.tips/airdrop2/tips';

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

async function getTipData(fid: string, season: string = 'current', limit: number = 10, offset: number = 0): Promise<TipData[]> {
  try {
    const url = `${DEGEN_TIPS_API_URL}?fid=${fid}&season=${season}&limit=${limit}&offset=${offset}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Degen.tips API error:', await response.text());
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: TipData[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error in getTipData:', error);
    throw error;
  }
}

app.frame('/', (c) => {
  const backgroundImage = "https://bafybeig776f35t7q6fybqfe4zup2kmiqychy4rcdncjjl5emahho6rqt6i.ipfs.w3s.link/Thumbnail%20(31).png";

  return c.res({
    image: (
      <div style={{
        backgroundImage: `url(${backgroundImage})`,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        fontSize: '40px',
        fontWeight: 'bold',
        textAlign: 'center',
      }}>
        Check your $DEGEN tips
      </div>
    ),
    intents: [
      <Button action="/check-tips">Check My Tips</Button>,
    ],
  })
})

app.frame('/check-tips', async (c) => {
  const backgroundImage = "https://bafybeig776f35t7q6fybqfe4zup2kmiqychy4rcdncjjl5emahho6rqt6i.ipfs.w3s.link/Thumbnail%20(31).png";
  const fid = c.frameData?.fid;

  if (!fid) {
    return c.res({
      image: (
        <div style={{
          backgroundImage: `url(${backgroundImage})`,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          fontSize: '40px',
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
          Unable to retrieve user information
        </div>
      ),
      intents: [
        <Button action="/">Try Again</Button>
      ],
    });
  }

  const fidString = fid.toString();

  try {
    const [userInfo, tipData] = await Promise.all([
      getUserInfo(fidString).catch(error => {
        console.error('Error fetching user info:', error);
        return null;
      }),
      getTipData(fidString).catch(error => {
        console.error('Error fetching tip data:', error);
        return null;
      })
    ]);

    if (userInfo && tipData) {
      const totalTips = tipData.reduce((sum, tip) => sum + tip.amount, 0);
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
            fontSize: '30px',
            fontWeight: 'bold',
            textAlign: 'center',
          }}>
            <img src={userInfo.profileImage} alt="Profile" style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '20px' }} />
            <div>{userInfo.profileName}</div>
            <div>Total $DEGEN tips: {totalTips}</div>
            <div>Number of tips: {tipData.length}</div>
          </div>
        ),
        intents: [
          <Button action="/">Check Again</Button>
        ],
      });
    } else {
      throw new Error('Failed to fetch user info or tip data');
    }
  } catch (error) {
    console.error('Error in check-tips frame:', error);
    return c.res({
      image: (
        <div style={{
          backgroundImage: `url(${backgroundImage})`,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          fontSize: '40px',
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
          Error fetching data. Please try again later.
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