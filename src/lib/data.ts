
// Re-export types and data from marketPlaceData.ts to ensure compatibility with existing components
import { marketplaceItems, MarketplaceItem } from './marketPlaceData';

// Define Agent type as an alias to MarketplaceItem for backward compatibility
export type Agent = MarketplaceItem;

// Export the marketplace items as agents
export const agents = marketplaceItems;
