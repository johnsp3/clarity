import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Check, X, Loader2 } from 'lucide-react';
import { auth, db } from '../services/firebase';
import { isApiAvailable as isOpenAIAvailable } from '../services/openai-service';
import { getPerplexityClient } from '../utils/perplexity-search';
import * as Popover from '@radix-ui/react-popover';

type ServiceStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

interface ServiceState {
  firebase: ServiceStatus;
  openai: ServiceStatus;
  perplexity: ServiceStatus;
  lastChecked: Date;
}

export const StatusIndicator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [services, setServices] = useState<ServiceState>({
    firebase: 'connecting',
    openai: 'connecting',
    perplexity: 'connecting',
    lastChecked: new Date()
  });
  const checkIntervalRef = useRef<NodeJS.Timeout>();

  const checkServices = async () => {
    const newState: ServiceState = {
      firebase: 'connecting',
      openai: 'connecting',
      perplexity: 'connecting',
      lastChecked: new Date()
    };

    // Check Firebase
    try {
      if (auth?.currentUser && db) {
        newState.firebase = 'connected';
      } else {
        newState.firebase = 'disconnected';
      }
    } catch {
      newState.firebase = 'error';
    }

    // Check OpenAI
    try {
      newState.openai = isOpenAIAvailable() ? 'connected' : 'disconnected';
    } catch {
      newState.openai = 'error';
    }

    // Check Perplexity
    try {
      newState.perplexity = getPerplexityClient() ? 'connected' : 'disconnected';
    } catch {
      newState.perplexity = 'error';
    }

    setServices(newState);
  };

  useEffect(() => {
    // Initial check
    checkServices();

    // Check every 30 seconds
    checkIntervalRef.current = setInterval(checkServices, 30000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  // Determine overall status
  const getOverallStatus = (): ServiceStatus => {
    const statuses = [services.firebase, services.openai, services.perplexity];
    if (statuses.every(s => s === 'connected')) return 'connected';
    if (statuses.some(s => s === 'error')) return 'error';
    if (statuses.some(s => s === 'connecting')) return 'connecting';
    return 'disconnected';
  };

  const overallStatus = getOverallStatus();

  const getStatusColor = (status: ServiceStatus): string => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-orange-500';
      case 'connecting': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
    }
  };

  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case 'connected': return <Check className="w-3 h-3" />;
      case 'disconnected': return <X className="w-3 h-3" />;
      case 'connecting': return <Loader2 className="w-3 h-3 animate-spin" />;
      case 'error': return <AlertCircle className="w-3 h-3" />;
    }
  };

  const getServiceLabel = (service: string): string => {
    const labels: Record<string, string> = {
      firebase: 'Database',
      openai: 'ChatGPT',
      perplexity: 'Perplexity'
    };
    return labels[service] || service;
  };

  const getStatusMessage = (service: string, status: ServiceStatus): string => {
    if (status === 'connected') return 'Connected';
    if (status === 'connecting') return 'Connecting...';
    
    const messages: Record<string, Record<string, string>> = {
      firebase: {
        disconnected: 'Not authenticated',
        error: 'Connection failed'
      },
      openai: {
        disconnected: 'API key not configured',
        error: 'API error'
      },
      perplexity: {
        disconnected: 'API key not configured',
        error: 'API error'
      }
    };
    
    return messages[service]?.[status] || 'Unknown status';
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          aria-label="Service status"
        >
          <div className="relative">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(overallStatus)}`}>
              {overallStatus === 'connecting' && (
                <div className="absolute inset-0 rounded-full bg-current animate-ping opacity-75" />
              )}
            </div>
          </div>
          <span className="text-xs text-[var(--text-tertiary)] font-medium">
            {overallStatus === 'connected' ? 'All Systems' : 'Status'}
          </span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="w-72 bg-[var(--bg-primary)] border border-[var(--border-light)] rounded-lg shadow-lg p-4 z-50"
          sideOffset={5}
          align="end"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">System Status</h3>
              <button
                onClick={checkServices}
                className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              >
                Refresh
              </button>
            </div>

            {(['firebase', 'openai', 'perplexity'] as const).map((service) => (
              <div key={service} className="flex items-center justify-between py-2 border-b border-[var(--border-light)] last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${getStatusColor(services[service])} bg-opacity-20 flex items-center justify-center`}>
                    <div className={`${getStatusColor(services[service])} text-white rounded-full p-1`}>
                      {getStatusIcon(services[service])}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">
                      {getServiceLabel(service)}
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)]">
                      {getStatusMessage(service, services[service])}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-2 text-xs text-[var(--text-tertiary)] text-center">
              Last checked: {services.lastChecked.toLocaleTimeString()}
            </div>
          </div>

          <Popover.Arrow className="fill-[var(--bg-primary)]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}; 