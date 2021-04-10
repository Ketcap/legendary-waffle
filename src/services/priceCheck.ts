import * as functions from 'firebase-functions';

import { formatItems, gatherItems, groupItems } from './utils';
import { sendNotifications } from '../telegram';
import { REGION } from '../config';

const FIRST_PAGE = 'https://www.akakce.com/fiyati-dusen-urunler/?c=1053';

export const priceCheck = functions
  .region(REGION)
  .pubsub.schedule('every 1 hours')
  .onRun(async () => {
    const items = await gatherItems(FIRST_PAGE, []);
    const groupedItems = groupItems(items);
    const formattedItems = formatItems(groupedItems);
    await sendNotifications(formattedItems);
  });
