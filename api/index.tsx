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
  // In a real implementation, you would generate an actual image here.
  // For this example, we'll return a placeholder URL.
  const text = allowanceData 
    ? `Your $DEGEN allowance: ${allowanceData.allowance}`
    : errorMessage || 'Enter your Farcaster ID to check your $DEGEN allowance';
  return `https://placehold.co/600x400/1e1e1e/ffffff?text=${encodeURIComponent(text)}`;
}