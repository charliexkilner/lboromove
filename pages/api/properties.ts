import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

// Cache counts for 1 minute to reduce database load
const countCache: Record<string, { count: number, timestamp: number }> = {};
const CACHE_TTL = 60 * 1000; // 1 minute

const SILVER_SQUARE_STREETS = [
  'burleigh road',
  'york road',
  'william street',
  'seward street',
  'radmoor road',
  'arthur street',
  'curzon street',
  'heathcoat street',
  'caldwell street',
  'frederick street'
];

function getSilverSquareWhere() {
  return {
    OR: [
      { location: { in: SILVER_SQUARE_STREETS, mode: 'insensitive' } },
      { street: { in: SILVER_SQUARE_STREETS, mode: 'insensitive' } },
      { title: { in: SILVER_SQUARE_STREETS, mode: 'insensitive' } },
    ]
  };
}

function getRecentlyAddedWhere() {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  return { createdAt: { gte: twoWeeksAgo } };
}

// Generate a cache key based on query parameters
function getCacheKey(params: NextApiRequest['query']): string {
  // Remove pagination params for the count cache key
  const { cursor, limit, ...countParams } = params;
  return JSON.stringify(countParams);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Always set JSON content type first
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('API Request query params:', req.query);
    
    const { 
      bedrooms, 
      bathrooms, 
      maxPrice,
      minBedrooms,
      isGoldenTriangle,
      silverSquare,
      nearCampus,
      onCampus,
      parking,
      ensuite,
      billsIncluded,
      rareFinds,
      recentlyAdded,
      cursor,
      limit = 20,
      countOnly = false,
      fetchAll = false
    } = req.query;

    // Build the where clause for filtering
    const where: any = {};

    // Only apply filters if they are explicitly provided and valid
    if (bedrooms && bedrooms !== 'undefined' && !isNaN(Number(bedrooms))) {
      // IMPORTANT: For bedrooms we want an EXACT match, not a minimum
      where.rooms = Number(bedrooms);
      console.log(`Filtering by EXACT bedrooms: ${bedrooms}`);
    }

    if (minBedrooms && minBedrooms !== 'undefined' && !isNaN(Number(minBedrooms))) {
      where.rooms = { gte: Number(minBedrooms) };
      console.log(`Filtering by min bedrooms: >= ${minBedrooms}`);
    }

    if (bathrooms && bathrooms !== 'undefined' && !isNaN(Number(bathrooms))) {
      where.bathrooms = {
        gte: Number(bathrooms)
      };
      console.log(`Filtering by bathrooms: >= ${bathrooms}`);
    }

    if (maxPrice && maxPrice !== 'undefined' && !isNaN(Number(maxPrice))) {
      where.price = {
        lte: Number(maxPrice),
      };
      console.log(`Filtering by price: <= ${maxPrice} (max price per week)`);
    }

    if (isGoldenTriangle === 'true') {
      where.isGoldenTriangle = true;
      console.log('Filtering by isGoldenTriangle');
    }

    if (silverSquare === 'true') {
      Object.assign(where, getSilverSquareWhere());
      console.log('Filtering by silverSquare');
    }

    if (recentlyAdded === 'true') {
      Object.assign(where, getRecentlyAddedWhere());
      console.log('Filtering by recentlyAdded');
    }

    // For rareFinds: bathrooms >= 4 or amenities contains gym/swimming/cinema/games
    if (rareFinds === 'true') {
      where.OR = [
        { bathrooms: { gte: 4 } },
        { amenities: { hasSome: ['gym', 'swimming pool', 'cinema room', 'games room'] } }
      ];
      console.log('Filtering by rareFinds');
    }

    // For parking, ensuite, billsIncluded: amenities contains
    if (parking === 'true') {
      where.amenities = { hasSome: ['parking', 'driveway', 'garage'] };
      console.log('Filtering by parking');
    }

    if (ensuite === 'true') {
      where.amenities = { hasSome: ['en-suite', 'ensuite'] };
      console.log('Filtering by ensuite');
    }

    if (billsIncluded === 'true') {
      where.amenities = { hasSome: ['bills included', 'all bills included'] };
      console.log('Filtering by billsIncluded');
    }

    // For onCampus: amenities contains on campus/university accommodation/student halls
    if (onCampus === 'true') {
      where.amenities = { hasSome: ['on campus', 'university accommodation', 'student halls'] };
      console.log('Filtering by onCampus');
    }

    // For nearCampus: pseudo, only filter if latitude/longitude present (handled on frontend for now)
    // Add cursor-based pagination
    if (cursor && cursor !== 'undefined') {
      where.id = {
        lt: Number(cursor)
      };
    }

    console.log('API Query where clause:', where);

    // If countOnly is true, check cache first
    if (countOnly === 'true') {
      const cacheKey = getCacheKey(req.query);
      const cachedValue = countCache[cacheKey];
      const now = Date.now();
      
      if (cachedValue && (now - cachedValue.timestamp < CACHE_TTL)) {
        console.log('Using cached count:', cachedValue.count);
        return res.status(200).json({ total: cachedValue.count });
      }
      
      const total = await prisma.property.count({ where });
      // Cache the result
      countCache[cacheKey] = { count: total, timestamp: now };
      console.log('Counted properties:', total);
      return res.status(200).json({ total });
    }

    // Determine if we should fetch all records for map view
    const isFetchingAll = fetchAll === 'true';
    
    // Set up query options based on fetching mode
    const queryOptions: any = {
      where,
      select: {
        id: true,
        title: true,
        price: true,
        rooms: true,
        bathrooms: true,
        images: true,
        description: true,
        location: true,
        amenities: true,
        street: true,
        latitude: true,
        longitude: true,
        isGoldenTriangle: true,
        createdAt: true,
        updatedAt: true,
        keyFeatures: true, // Add keyFeatures for proper map display
        url: true, // Add URL for links
      },
      orderBy: {
        id: 'desc',
      },
    };

    // Only apply pagination limits if not fetching all
    if (!isFetchingAll) {
      queryOptions.take = Number(limit) + 1; // Fetch one extra to check if there are more
      
      // Add cursor-based pagination for regular paginated queries
      if (cursor && cursor !== 'undefined') {
        where.id = {
          lt: Number(cursor)
        };
      }
    }

    console.log(`Fetching properties with ${isFetchingAll ? 'NO' : ''} pagination, limit: ${isFetchingAll ? 'ALL' : limit}`);
    
    const properties = await prisma.property.findMany(queryOptions);

    // Only process pagination info if we're not fetching all
    if (!isFetchingAll) {
      const hasMore = properties.length > Number(limit);
      const items = hasMore ? properties.slice(0, -1) : properties;
      const nextCursor = hasMore ? items[items.length - 1].id : null;

      console.log(`Found ${items.length} properties for paginated view`);
      return res.status(200).json({ 
        properties: items,
        nextCursor,
        hasMore,
        appliedFilters: {
          bedrooms: bedrooms ? Number(bedrooms) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          // Include other filters as needed
        }
      });
    } else {
      // For map view, return all properties without pagination info
      console.log(`Found ${properties.length} properties for map view`);
      return res.status(200).json({ 
        properties,
        hasMore: false,
        appliedFilters: {
          bedrooms: bedrooms ? Number(bedrooms) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          // Include other filters as needed
        }
      });
    }
  } catch (error) {
    // Ensure we're always sending JSON even for errors
    console.error('API Error:', error);
    return res.status(500).json({
      message: 'Failed to fetch properties',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
