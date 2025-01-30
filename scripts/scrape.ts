import { ScrapingManager } from '../lib/ScrapingManager';

async function main() {
  const manager = new ScrapingManager();
  await manager.scrapeAll();
}

main()
  .catch(console.error)
  .finally(() => process.exit());
