'use client';

import type { LotteryConfig } from '@/types';

const DEFAULT_LOTTERY_CONFIG: LotteryConfig = {
  ticketPrice: 2,
  sellerCommissionPercentage: 10,
  ownerCommissionPercentage: 5,
  clientSalesCommissionToOwnerPercentage: 10,
};

// This function simulates fetching the config.
// In a real app, this could fetch from a server, but for now, it reads from localStorage.
export function getLotteryConfig(): LotteryConfig {
  if (typeof window !== 'undefined') {
    const storedConfig = localStorage.getItem('lotteryConfig');
    if (storedConfig) {
      try {
        // Basic validation to ensure the parsed object has the required keys
        const parsed = JSON.parse(storedConfig);
        if (
          'ticketPrice' in parsed &&
          'sellerCommissionPercentage' in parsed &&
          'ownerCommissionPercentage' in parsed &&
          'clientSalesCommissionToOwnerPercentage' in parsed
        ) {
          return parsed as LotteryConfig;
        }
      } catch (e) {
        console.error("Failed to parse lotteryConfig from localStorage", e);
      }
    }
  }
  // Return default if not in window (SSR) or if localStorage value is invalid
  return DEFAULT_LOTTERY_CONFIG;
}
