'use client';

import React from 'react';
import { Service } from '@/lib/types';
import { getServicesByCategory } from '@/lib/data';

interface ServiceSelectorProps {
  services: Service[];
  onServiceSelect: (service: Service) => void;
  selectedService?: Service;
}

const ServiceCard: React.FC<{
  service: Service;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ service, isSelected, onSelect }) => {
  return (
    <div
      className={`
        p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md
        ${isSelected 
          ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200' 
          : 'border-gray-200 bg-white hover:border-blue-300'
        }
      `}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900 leading-tight">
          {service.name}
        </h3>
        <div className="text-right">
          <div className="text-xl font-bold text-blue-600">
            {service.price === 0 ? 'FREE' : `$${service.price}`}
          </div>
          <div className="text-sm text-gray-500">
            {service.duration} min
          </div>
        </div>
      </div>
      
      <p className="text-gray-600 text-sm leading-relaxed">
        {service.description}
      </p>
      
      {service.name.includes('Teenager Cut') && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          💡 Please bring reference pictures and clearly communicate desired length
        </div>
      )}
    </div>
  );
};

const CategorySection: React.FC<{
  title: string;
  services: Service[];
  selectedService?: Service;
  onServiceSelect: (service: Service) => void;
}> = ({ title, services, selectedService, onServiceSelect }) => {
  if (services.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-600">
        {title}
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            isSelected={selectedService?.id === service.id}
            onSelect={() => onServiceSelect(service)}
          />
        ))}
      </div>
    </div>
  );
};

const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  services,
  onServiceSelect,
  selectedService
}) => {
  const haircutServices = getServicesByCategory(services, 'Haircuts');
  const beardServices = getServicesByCategory(services, 'Beards');
  const combinationServices = getServicesByCategory(services, 'Combination');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Choose Your Service
        </h1>
        <p className="text-gray-600">
          Select the service you'd like to book at Boondocks Barbershop
        </p>
      </div>

      <CategorySection
        title="✂️ Haircuts"
        services={haircutServices}
        selectedService={selectedService}
        onServiceSelect={onServiceSelect}
      />

      <CategorySection
        title="🧔 Beard Services"
        services={beardServices}
        selectedService={selectedService}
        onServiceSelect={onServiceSelect}
      />

      <CategorySection
        title="💪 Full Service Combinations"
        services={combinationServices}
        selectedService={selectedService}
        onServiceSelect={onServiceSelect}
      />

      {selectedService && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">
                Selected: {selectedService.name}
              </h3>
              <p className="text-blue-700 text-sm">
                {selectedService.duration} minutes • {selectedService.price === 0 ? 'FREE' : `$${selectedService.price}`}
              </p>
            </div>
            <button
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              onClick={() => onServiceSelect(selectedService)}
            >
              Continue →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceSelector;