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
  dailyAllowance: number;
  currentAllowance: number;
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

async function getAllowanceData(fid: string): Promise<AllowanceData | null> {
  try {
    const url = `${DEGEN_TIPS_API_URL}?fid=${fid}&season=season2&limit=1`;
    console.log('Fetching allowance data from:', url);
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        console.log('No allowance data found for this user');
        return null;
      }
      const errorText = await response.text();
      console.error('Degen.tips API error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    const data = await response.json();
    console.log('Received data from Degen.tips:', data);
    if (Array.isArray(data) && data.length > 0) {
      return {
        dailyAllowance: data[0].dailyAllowance || 0,
        currentAllowance: data[0].currentAllowance || 0
      };
    } else {
      console.log('No allowance data found in the response');
      return null;
    }
  } catch (error) {
    console.error('Error in getAllowanceData:', error);
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
      getUserInfo(fidString).catch(error => {
        console.error('Error fetching user info:', error);
        return null;
      }),
      getAllowanceData(fidString).catch(error => {
        console.error('Error fetching allowance data:', error);
        return null;
      })
    ]);

    if (userInfo) {
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
            {allowanceData ? (
              <>
                <div>Daily Allowance: {allowanceData.dailyAllowance} $DEGEN</div>
                <div>Current Allowance: {allowanceData.currentAllowance} $DEGEN</div>
              </>
            ) : (
              <div>No allowance data available</div>
            )}
          </div>
        ),
        intents: [
          <Button action="/">Check Again</Button>
        ],
      });
    } else {
      throw new Error('Failed to fetch user info');
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