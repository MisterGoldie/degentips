/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'

interface AllowanceData {
  allowance: number;
  // Add other properties if the API returns more data
}

const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  title: 'DEGEN Allowance Checker',
})

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
      <TextInput placeholder="Enter your Farcaster ID" />,
      <Button action="/check-allowance">Check Allowance</Button>,
    ],
  })
})

app.frame('/check-allowance', async (c) => {
  const { inputText: fid } = c;
  const backgroundImage = "https://bafybeig776f35t7q6fybqfe4zup2kmiqychy4rcdncjjl5emahho6rqt6i.ipfs.w3s.link/Thumbnail%20(31).png";

  let allowanceText = 'Error fetching allowance data';

  if (fid) {
    try {
      const allowanceData = await getTipAllowance(fid);
      allowanceText = `Your $DEGEN allowance: ${allowanceData.allowance}`;
    } catch (error) {
      console.error('Error fetching allowance:', error);
    }
  } else {
    allowanceText = 'Please enter a valid Farcaster ID';
  }

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
        {allowanceText}
      </div>
    ),
    intents: [
      <Button action="/">Check Another</Button>
    ],
  })
})

devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)