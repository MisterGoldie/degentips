/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'

interface AllowanceData {
  allowance: number;
}

interface UserInfo {
  dappName: string;
  profileName: string;
  profileImage: string;
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

async function getUserInfo(username: string): Promise<UserInfo | null> {
  const query = `
    query GetUserFidInformation {
      Socials(input: {filter: {userId: {_eq: "${username}"}}, blockchain: ethereum}) {
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

async function getTipAllowance(username: string): Promise<AllowanceData> {
  const url = `https://www.degen.tips/api/airdrop2/tip-allowance?username=${username}`;
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
        Enter your Farcaster username to check $DEGEN allowance
      </div>
    ),
    intents: [
      <TextInput placeholder="Enter your Farcaster username" />,
      <Button action="/check-allowance">Check My Allowance</Button>,
    ],
  })
})

app.frame('/check-allowance', async (c) => {
  const username = c.inputText;
  const backgroundImage = "https://bafybeig776f35t7q6fybqfe4zup2kmiqychy4rcdncjjl5emahho6rqt6i.ipfs.w3s.link/Thumbnail%20(31).png";

  if (!username) {
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
          Please enter a Farcaster username
        </div>
      ),
      intents: [
        <Button action="/">Try Again</Button>
      ],
    });
  }

  try {
    const userInfo = await getUserInfo(username);
    const allowanceData = await getTipAllowance(username);

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
          <Button action="/">Check Another</Button>
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