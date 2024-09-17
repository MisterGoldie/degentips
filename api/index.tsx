// pages/api/degen-allowance.ts
import type { NextApiRequest, NextApiResponse } from 'next'

interface AllowanceData {
  allowance: number;
  // Add other properties if the API returns more data
}

async function getTipAllowance(fid: string): Promise<AllowanceData> {
  const url = `https://www.degen.tips/api/airdrop2/tip-allowance?fid=${fid}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const fid = req.query.fid as string | undefined;

  let allowanceData: AllowanceData | null = null;
  let errorMessage = '';

  if (fid) {
    try {
      allowanceData = await getTipAllowance(fid);
    } catch (error) {
      console.error('Error fetching allowance:', error);
      errorMessage = 'Error fetching allowance data';
    }
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${generateImage(allowanceData, errorMessage)}" />
        <meta property="fc:frame:button:1" content="Check My Allowance" />
        <meta property="fc:frame:input:text" content="Enter your Farcaster ID" />
      </head>
      <body>
        <h1>$DEGEN Tipping Allowance</h1>
        ${allowanceData ? `<p>Your current allowance: ${allowanceData.allowance} $DEGEN</p>` : ''}
        ${errorMessage ? `<p>Error: ${errorMessage}</p>` : ''}
      </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}

function generateImage(allowanceData: AllowanceData | null, errorMessage: string): string {
  const backgroundImage = "https://bafybeig776f35t7q6fybqfe4zup2kmiqychy4rcdncjjl5emahho6rqt6i.ipfs.w3s.link/Thumbnail%20(31).png";
  
  let text = 'Enter your Farcaster ID to check your $DEGEN allowance';
  if (allowanceData) {
    text = `Your $DEGEN allowance: ${allowanceData.allowance}`;
  } else if (errorMessage) {
    text = errorMessage;
  }

  // Here we're using a service that allows text overlay on images
  // You might need to adjust or replace this with your own image generation service
  return `https://img.bruzu.com/?backgroundImage=${encodeURIComponent(backgroundImage)}` +
         `&width=1200&height=630&fontSize=40&fontColor=white&text=${encodeURIComponent(text)}`;
}