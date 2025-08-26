'use client';

import React from 'react';
import { Provider, Service } from '@/lib/types';
import { isProviderAvailableOnDay } from '@/lib/data';

interface ProviderSelectorProps {
  providers: Provider[];
  service: Service;
  selectedProvider?: Provider;
  onProviderSelect: (provider: Provider) => void;
  onBack: () => void;
}

const ProviderCard: React.FC<{
  provider: Provider;
  service: Service;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ provider, service, isSelected, onSelect }) => {
  const isRestricted = provider.restrictions?.notAcceptingNewClients;
  
  // Calculate days available
  const daysAvailable = Object.values(provider.availability)
    .filter(day => day !== null).length;

  return (
    <div
      className={`
        p-6 rounded-lg border-2 cursor-pointer transition-all duration-200
        ${isRestricted 
          ? 'border-red-200 bg-red-50 opacity-60 cursor-not-allowed' 
          : isSelected 
            ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200 hover:shadow-md' 
            : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
        }
      `}
      onClick={isRestricted ? undefined : onSelect}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-bold text-gray-900">
          {provider.name}
        </h3>
        {provider.restrictions?.cashOnly && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
            💵 Cash Only
          </span>
        )}
      </div>

      {/* Availability */}
      <div className="mb-3">
        <div className="text-sm font-medium text-gray-700 mb-1">
          Available: {daysAvailable === 7 ? 'All week' : `${daysAvailable} days/week`}
        </div>
        <div className="flex gap-1 text-xs">
          {Object.entries(provider.availability).map(([day, hours]) => (
            <span
              key={day}
              className={`
                px-1 py-0.5 rounded text-xs
                ${hours 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-500'
                }
              `}
            >
              {day.substring(0, 3).toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      {/* Description */}
      {provider.description && (
        <p className="text-gray-600 text-sm mb-3 leading-relaxed">
          {provider.description}
        </p>
      )}

      {/* Special Notes */}
      <div className="space-y-2">
        {provider.restrictions?.notAcceptingNewClients && (
          <div className="p-2 bg-red-100 border border-red-200 rounded text-xs text-red-800">
            ❌ Not accepting new clients
          </div>
        )}
        
        {provider.restrictions?.noKidsUnder && (
          <div className="p-2 bg-yellow-100 border border-yellow-200 rounded text-xs text-yellow-800">
            👶 No kids under {provider.restrictions.noKidsUnder}
          </div>
        )}
        
        {provider.restrictions?.conversationPreference && (
          <div className="p-2 bg-blue-100 border border-blue-200 rounded text-xs text-blue-800">
            💬 Great conversationalist (add note with preference 0-3)
          </div>
        )}
        
        {provider.name === 'Jan' && service.name.includes('Kid') && (
          <div className="p-2 bg-orange-100 border border-orange-200 rounded text-xs text-orange-800">
            ⏰ Kids cuts take 45 minutes (not {service.duration})
          </div>
        )}

        {provider.notes && provider.notes !== 'No description provided' && (
          <div className="p-2 bg-gray-100 border border-gray-200 rounded text-xs text-gray-700">
            📝 {provider.notes}
          </div>
        )}
      </div>
    </div>
  );
};

const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  providers,
  service,
  selectedProvider,
  onProviderSelect,
  onBack
}) => {
  // Filter available providers (exclude Michelle for new clients)
  const availableProviders = providers.filter(provider => 
    !provider.restrictions?.notAcceptingNewClients
  );

  const unavailableProviders = providers.filter(provider => 
    provider.restrictions?.notAcceptingNewClients
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
        >
          ← Back to Services
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Choose Your Barber
        </h1>
        <p className="text-gray-600">
          for <span className="font-semibold">{service.name}</span> • {service.duration} min • {service.price === 0 ? 'FREE' : `$${service.price}`}
        </p>
      </div>

      {/* Available Providers */}
      {availableProviders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Available Barbers
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {availableProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                service={service}
                isSelected={selectedProvider?.id === provider.id}
                onSelect={() => onProviderSelect(provider)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Unavailable Providers (for reference) */}
      {unavailableProviders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-500 mb-4">
            Currently Unavailable
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {unavailableProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                service={service}
                isSelected={false}
                onSelect={() => {}} // No action for unavailable providers
              />
            ))}
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {selectedProvider && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">
                Selected: {selectedProvider.name}
              </h3>
              <p className="text-blue-700 text-sm">
                {service.name} • {service.duration} minutes • {service.price === 0 ? 'FREE' : `$${service.price}`}
              </p>
            </div>
            <button
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              onClick={() => onProviderSelect(selectedProvider)}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Need help choosing?</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• All our barbers are skilled professionals</li>
          <li>• Check availability - some barbers have limited schedules</li>
          <li>• Consider special notes (cash only, conversation preferences, etc.)</li>
          <li>• Call <span className="font-medium">(650) 597-2454</span> if you have questions</li>
        </ul>
      </div>
    </div>
  );
};

export default ProviderSelector;