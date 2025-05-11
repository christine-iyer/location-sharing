import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

interface DistanceMatrixResponse {
  status: string;
  rows: Array<{
    elements: Array<{
      distance?: {
        value: number;
        text: string;
      };
      status: string;
    }>;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Google Maps API key is not configured' });
  }

  try {
    const apiUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
      from as string
    )}&destinations=${encodeURIComponent(to as string)}&key=${apiKey}&mode=driving`;

    const response = await axios.get<DistanceMatrixResponse>(apiUrl);
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching distance:', error);
    return res.status(500).json({ error: 'Failed to fetch distance data' });
  }
} 