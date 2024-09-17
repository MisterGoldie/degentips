// pages/api/farcaster-data.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { DuneClient } from "@duneanalytics/client-sdk";

export const config = {
  runtime: 'edge',
};

interface ProcessedData {
  dataSource: string;
  lastUpdated: string;
  lastUpdateTime: string;
  status: string;
  impact: string;
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const dune = new DuneClient(process.env.DUNE_API_KEY || '');
    const queryResult = await dune.getLatestResult({ queryId: 3610337 });

    if (!queryResult.result?.rows) {
      throw new Error('No data returned from Dune query');
    }

    // Process the query result
    const processedData: ProcessedData[] = queryResult.result.rows.map((row: Record<string, unknown>) => ({
      dataSource: row['📂 Data Source'] as string,
      lastUpdated: row['⏳ Last Updated'] as string,
      lastUpdateTime: row['⌚ Last Update Time (UTC)'] as string,
      status: row['🚦 Status'] as string,
      impact: row['💥 Impact'] as string
    }));

    // Generate HTML for the frame
    const html = generateFrameHtml(processedData);

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error fetching data from Dune:', error);
    res.status(500).send('Error fetching data');
  }
}

function generateFrameHtml(data: ProcessedData[]): string {
  const tableRows = data.map(item => `
    <tr>
      <td>${item.dataSource}</td>
      <td>${item.lastUpdated}</td>
      <td>${item.lastUpdateTime}</td>
      <td>${item.status}</td>
      <td>${item.impact}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${generateChartImage()}" />
        <meta property="fc:frame:button:1" content="Refresh" />
        <style>
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Farcaster Data Freshness</h1>
        <table>
          <tr>
            <th>Data Source</th>
            <th>Last Updated</th>
            <th>Last Update Time (UTC)</th>
            <th>Status</th>
            <th>Impact</th>
          </tr>
          ${tableRows}
        </table>
      </body>
    </html>
  `;
}

function generateChartImage(): string {
  // Here you would generate or fetch a chart image based on the data
  // For this example, we'll just return a placeholder image
  return "https://via.placeholder.com/1200x630?text=Farcaster+Data+Freshness+Chart";
}