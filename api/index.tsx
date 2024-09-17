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

interface AllowanceData {
  allowance: number;
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
const AIRSTACK_API_KEY = '71332A9D-240D-41E0-8644-31BD70E64036';

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

  const response = await fetch(AIRSTACK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': AIRSTACK_API_KEY,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch data from Airstack');
  }

  const result: AirstackResponse = await response.json();
  return result.data.Socials.Social[0] || null;
}

async function getTipAllowance(fid: string): Promise<AllowanceData> {
  const url = `https://www.degen.tips/api/airdrop2/tip-allowance?fid=${fid}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
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
        Check your $DEGEN allowance
      </div>
    ),
    intents: [
      <Button action="/check-allowance">Check My Allowance</Button>,
    ],
  })
})

app.frame('/check-allowance', async (c) => {
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
    const [userInfo, allowanceData] = await Promise.all([
      getUserInfo(fidString),
      getTipAllowance(fidString)
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
            fontSize: '30px',
            fontWeight: 'bold',
            textAlign: 'center',
          }}>
            <img src={userInfo.profileImage} alt="Profile" style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '20px' }} />
            <div>{userInfo.profileName}</div>
            <div>$DEGEN allowance: {allowanceData.allowance}</div>
          </div>
        ),
        intents: [
          <Button action="/">Check Again</Button>
        ],
      });
    } else {
      throw new Error('User info or allowance not found');
    }
  } catch (error) {
    console.error('Error:', error);
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
          Error fetching user information or allowance
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