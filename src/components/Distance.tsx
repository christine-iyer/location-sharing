import axios from 'axios';
import { useState } from 'react';

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

interface ApiError {
  message: string;
  response?: {
    data?: {
      error_message?: string;
    };
  };
  request?: unknown;
}

const FindRide = () => {
  const [form, setForm] = useState({
    from: '',
    to: '',
  });
  const [distance, setDistance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateDistance = async () => {
    // Trim input values to remove leading/trailing whitespace
    const from = form.from.trim();
    const to = form.to.trim();

    // Validate input fields
    if (!from || !to) {
      setError('Please fill in both locations.');
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError('Google Maps API key is not configured');
      return;
    }

    console.log('API Key available:', !!apiKey); // Debug API key availability

    setLoading(true);
    setError(null);

    try {
      // Construct the API URL with proper CORS handling
      const apiUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
        from
      )}&destinations=${encodeURIComponent(to)}&key=${apiKey}&mode=driving`;

      console.log('API URL:', apiUrl); // Log the full API URL

      // Make the API request using axios with proper CORS headers
      const responseData = await axios.get(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        withCredentials: false
      }).then(res => res.data as DistanceMatrixResponse);

      // Check if the response contains valid distance data
      if (
        responseData?.status === 'OK' &&
        responseData?.rows?.[0]?.elements?.[0]?.distance
      ) {
        const distanceInMeters = responseData.rows[0].elements[0].distance.value; // Distance in meters
        const distanceInMiles = (distanceInMeters * 0.000621371).toFixed(2); // Convert to miles and round to 2 decimal places

        setDistance(`${distanceInMiles} miles`); // Update state with the converted distance
      } else {
        setError('Unable to calculate distance. Please try again.');
      }
    } catch (err) {
      console.error('Error calculating distance:', err);
      const error = err as ApiError;
      
      if (error.response?.data?.error_message) {
        setError(`Error: ${error.response.data.error_message}`);
      } else if (error.request) {
        setError('No response received from the server. Please check your internet connection and try again.');
      } else {
        setError(`Error: ${error.message ?? 'An unknown error occurred'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 flex-1 flex flex-col justify-center">
      <input
        className="h-12 border border-gray-300 rounded-lg px-4 mb-4"
        placeholder="From"
        value={form.from}
        onChange={(e) => setForm((prev) => ({ ...prev, from: e.target.value }))}
      />

      <input
        className="h-12 border border-gray-300 rounded-lg px-4 mb-4"
        placeholder="To"
        value={form.to}
        onChange={(e) => setForm((prev) => ({ ...prev, to: e.target.value }))}
      />

      <button
        onClick={calculateDistance}
        disabled={loading}
        className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? 'Calculating...' : 'Calculate Distance'}
      </button>

      {error && (
        <p className="mt-4 text-red-500 text-center">{error}</p>
      )}

      {distance && (
        <p className="mt-4 text-green-600 text-center text-lg font-semibold">
          Distance: {distance}
        </p>
      )}
    </div>
  );
};

export default FindRide;
