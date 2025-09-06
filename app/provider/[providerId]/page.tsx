'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import MobileProviderCalendar from '@/components/MobileProviderCalendar';

interface Provider {
  providerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  displayName?: string;
  avatarInitials?: string;
}

export default function ProviderCalendarPage() {
  const params = useParams();
  const providerId = params.providerId as string;
  
  const [provider, setProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (providerId) {
      loadProvider();
    }
  }, [providerId]);

  const loadProvider = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/provider/${providerId}`);
      
      if (response.ok) {
        const data = await response.json();
        setProvider(data.provider);
      } else if (response.status === 404) {
        setError('Provider not found');
      } else {
        setError('Failed to load provider information');
      }
    } catch (error) {
      console.error('Failed to load provider:', error);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // PWA Install prompt handling
  useEffect(() => {
    let deferredPrompt: any;
    
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Show install button after a delay (optional)
      setTimeout(() => {
        const shouldShow = !window.matchMedia('(display-mode: standalone)').matches;
        if (shouldShow && provider) {
          showInstallPrompt(deferredPrompt);
        }
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [provider]);

  const showInstallPrompt = async (deferredPrompt: any) => {
    if (deferredPrompt && provider) {
      const userChoice = confirm(`Add ${provider.firstName}'s Calendar to your home screen?`);
      if (userChoice) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User ${outcome} the install prompt`);
        deferredPrompt = null;
      }
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading calendar...</p>
        
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #f5f5f0;
            padding: 20px;
          }
          
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #e0e0e0;
            border-top: 4px solid #c41e3a;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          p {
            color: #666;
            font-size: 16px;
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h1>⚠️</h1>
          <h2>{error || 'Provider not found'}</h2>
          <p>Please check the URL and try again.</p>
          <button 
            onClick={() => window.location.href = '/providers'}
            className="back-button"
          >
            Go to Provider Login
          </button>
        </div>
        
        <style jsx>{`
          .error-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #f5f5f0;
            padding: 20px;
          }
          
          .error-content {
            text-align: center;
            background: white;
            padding: 40px;
            border: 2px solid #f44336;
            border-radius: 8px;
            max-width: 400px;
            width: 100%;
          }
          
          .error-content h1 {
            font-size: 48px;
            margin: 0 0 20px 0;
          }
          
          .error-content h2 {
            font-family: 'Oswald', sans-serif;
            color: #2c2c2c;
            margin: 0 0 15px 0;
            font-size: 24px;
          }
          
          .error-content p {
            color: #666;
            margin: 0 0 30px 0;
            line-height: 1.5;
          }
          
          .back-button {
            background: #c41e3a;
            color: white;
            border: none;
            padding: 12px 24px;
            font-family: 'Oswald', sans-serif;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.2s;
          }
          
          .back-button:hover {
            background: #a01729;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="mobile-calendar-page">
      <MobileProviderCalendar provider={provider} />
      
      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: #f5f5f0;
          overflow-x: hidden;
        }
        
        .mobile-calendar-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  );
}