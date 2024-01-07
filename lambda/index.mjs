import fetch from 'node-fetch';
import assert from 'assert';
import dotenv from 'dotenv';
dotenv.config();


export const handler = async (event) => {
    // If event is from HTTP request
    let data = event;
    if (event.body){
      data = JSON.parse(event.body);
    }
    const responseHeaders = {
      'Content-Type':'application/json'
    }
    const itemId = data.itemId;  // Assuming itemId is passed in the event
    const start = data.start; // Number update to start at. 1 <= start <= updates.length
    const count = data.count;  // Number of updates to display. 1 <= count
    const apiKey = process.env.MONDAY_API_KEY;  // Replace with your actual API key

    const query = `query items {
      items(ids: [${itemId}]) {
        name
        updates{
          id
          created_at
          body
          creator{
            name
          }
        }
      }
    }`;
    let updates = [];

    try {
        const response = await fetch('https://api.monday.com/v2/', {
            method: 'POST',
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });

        assert.equal(typeof start, 'number', "Start must be a number");
        assert.equal(typeof count, 'number', "Count must be a number");
        assert(start > 0, "Start must be a positive number greater than 0");
        assert(count > 0, "Count must be a positive number greater than 0");

        const data = await response.json();
        updates = getUniqueUpdatesById(data.data.boards[0].updates);

        // Process and return the first 5 updates
        const retData = processUpdates(updates, start, count);
        return {
            statusCode: 200,
            headers: responseHeaders,
            body: JSON.stringify(retData),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            headers: responseHeaders,
            body: JSON.stringify(error)
        };
    }

        function getUniqueUpdatesById(updates) {
            const seenIds = new Set();
            return updates.filter(update => {
                if (seenIds.has(update.created_at)) {
                    return false;
                }
                seenIds.add(update.created_at);
                return true;
            });
        }

        function processUpdates(updates, start, count) {
            const updatesToShow = updates.slice(start-1, start-1 + count);

            return updatesToShow.map(update => {
                return {
                  creator_name: update.creator.name,
                  created_at: update.created_at,
                  body: update.body
                }
            });
        }
}
