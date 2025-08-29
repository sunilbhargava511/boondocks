'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function MagicLinkVerification() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('This link appears to be invalid or incomplete');
      return;
    }

    verifyMagicLink(token);
  }, [searchParams]);

  const verifyMagicLink = async (token: string) => {
    try {
      const response = await fetch(`/api/customers/magic-link?token=${token}`);
      
      if (response.ok) {
        // Magic link verified successfully, should be redirected
        setStatus('success');
        setMessage('Successfully signed in! Redirecting...');
        
        // Store token in localStorage as backup
        const data = await response.json();
        if (data.token) {
          localStorage.setItem('customerToken', data.token);
        }
        
        // Wait a moment then redirect manually if needed
        setTimeout(() => {
          router.push('/customers/dashboard');
        }, 2000);
      } else {
        const data = await response.json();
        setStatus('error');
        setMessage(data.error || 'This link has expired or already been used');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error - please try again later');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying Magic Link</h2>
              <p className="text-gray-600">Please wait while we sign you in...</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h2 className="text-xl font-bold text-green-800 mb-2">Success!</h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">❌</span>
              </div>
              <h2 className="text-xl font-bold text-red-800 mb-2">Link Invalid</h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-gray-500 text-sm mb-6">
                You can view your appointments anytime by simply entering your email address.
              </p>
              <div className="space-y-3">
                <a
                  href="/manage-booking"
                  className="block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  View My Appointments
                </a>
                <a
                  href="/"
                  className="block text-gray-600 hover:text-gray-800 text-sm"
                >
                  ← Back to Home
                </a>
              </div>
            </>
          )}
        </div>
        
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Magic links expire after 15 minutes for security
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MagicLinkPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <MagicLinkVerification />
    </Suspense>
  );
}