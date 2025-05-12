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

interface GeocodingResponse {
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
  status: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { from, to, type = 'distance' } = req.query;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Google Maps API key is not configured' });
  }

  try {
    if (type === 'geocode' && from) {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        from as string
      )}&key=${apiKey}`;
      
      const response = await axios.get<GeocodingResponse>(geocodeUrl);
      return res.status(200).json(response.data);
    }

    if (type === 'distance' && from && to) {
      const distanceUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
        from as string
      )}&destinations=${encodeURIComponent(to as string)}&key=${apiKey}&mode=driving`;

      const response = await axios.get<DistanceMatrixResponse>(distanceUrl);
      return res.status(200).json(response.data);
    }

    return res.status(400).json({ error: 'Invalid request parameters' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
} 