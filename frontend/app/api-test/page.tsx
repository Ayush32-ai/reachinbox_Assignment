'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export default function ApiTestPage() {
  const [results, setResults] = useState<{
    health: any;
    scheduled: any;
    sent: any;
    error: string | null;
  }>({
    health: null,
    scheduled: null,
    sent: null,
    error: null,
  });
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResults({ health: null, scheduled: null, sent: null, error: null });

    try {
      // Test 1: Health endpoint (no auth)
      const healthRes = await fetch('http://localhost:4000/health');
      const healthData = await healthRes.json();
      setResults((prev) => ({ ...prev, health: healthData }));

      // Test 2: Scheduled emails (requires auth)
      try {
        const scheduledData = await apiClient.getScheduledEmails();
        setResults((prev) => ({ ...prev, scheduled: scheduledData }));
      } catch (err: any) {
        setResults((prev) => ({ 
          ...prev, 
          scheduled: { error: err.message, status: 'Auth required' } 
        }));
      }

      // Test 3: Sent emails (requires auth)
      try {
        const sentData = await apiClient.getSentEmails();
        setResults((prev) => ({ ...prev, sent: sentData }));
      } catch (err: any) {
        setResults((prev) => ({ 
          ...prev, 
          sent: { error: err.message, status: 'Auth required' } 
        }));
      }
    } catch (err: any) {
      setResults((prev) => ({ ...prev, error: err.message }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Backend Connection Test</h1>
        
        <button
          onClick={testConnection}
          disabled={loading}
          className="mb-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </button>

        <div className="space-y-4">
          {/* Health Check */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Health Check (No Auth)</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {results.health ? JSON.stringify(results.health, null, 2) : 'Not tested'}
            </pre>
            <p className={`mt-2 text-sm ${results.health ? 'text-green-600' : 'text-gray-500'}`}>
              {results.health ? '✓ Connected' : 'Not tested'}
            </p>
          </div>

          {/* Scheduled Emails */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Scheduled Emails (Auth Required)</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {results.scheduled 
                ? JSON.stringify(results.scheduled, null, 2) 
                : 'Not tested'}
            </pre>
            <p className={`mt-2 text-sm ${
              results.scheduled?.error 
                ? 'text-yellow-600' 
                : results.scheduled 
                ? 'text-green-600' 
                : 'text-gray-500'
            }`}>
              {results.scheduled?.error 
                ? `⚠ ${results.scheduled.error}` 
                : results.scheduled 
                ? '✓ Authenticated' 
                : 'Not tested'}
            </p>
          </div>

          {/* Sent Emails */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Sent Emails (Auth Required)</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {results.sent 
                ? JSON.stringify(results.sent, null, 2) 
                : 'Not tested'}
            </pre>
            <p className={`mt-2 text-sm ${
              results.sent?.error 
                ? 'text-yellow-600' 
                : results.sent 
                ? 'text-green-600' 
                : 'text-gray-500'
            }`}>
              {results.sent?.error 
                ? `⚠ ${results.sent.error}` 
                : results.sent 
                ? '✓ Authenticated' 
                : 'Not tested'}
            </p>
          </div>

          {/* Error */}
          {results.error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-2 text-red-800">Error</h2>
              <p className="text-red-600">{results.error}</p>
            </div>
          )}

          {/* Connection Info */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2 text-blue-800">Connection Info</h2>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>Frontend: {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</li>
              <li>Backend API: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}</li>
              <li>Auth Token: {typeof window !== 'undefined' && localStorage.getItem('auth_token') ? 'Present' : 'Not set'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
