import assert from 'assert';
import dotenv from 'dotenv';
dotenv.config();

export const handler = async (event) => {
    // Set HTML content type

    const responseHeaders = {
        'Content-Type': 'text/html'
    };
    let eventP = event;
    if (eventP.body){
      eventP = JSON.parse(eventP.body);
    }
    const apiKey = process.env.MONDAY_API_KEY;  // Replace with your actual API key
    const itemId = eventP.itemId;  // Assuming itemId is passed in the event
    const height = eventP.height;  // Pixel height of widget

    const query = `query {
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

        const data = await response.json();
        updates = getUniqueUpdatesById(data.data.items[0].updates);

        // Process and return the first 5 updates
        const pUpdates = processUpdates(updates);
        const hUpdates = updatesHtml(pUpdates);
        const ret = formHtml(hUpdates, height);

        return {
            statusCode: 200,
            headers: responseHeaders,
            body: ret,
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
          return updates.filter(u => {
              if (seenIds.has(u.created_at)) {
                  return false;
              }
              seenIds.add(u.created_at);
              return true;
          });
      }

      function processUpdates(updates) {
          return updates.map(u => {
              return {
                creator_name: u.creator.name,
                created_at: u.created_at,
                body: u.body
              }
          });
      }

      function updatesHtml(updates) {
        const updatesHtml = updates.map((update, index) => {
            const isLongUpdate = update.body.length > 300 || update.body.includes('<img');
            let updateBody = update.body;

            // Correcting the malformed img tag
            updateBody = updateBody.replace(/<img alt="([^"]+)" src="<img src=" https?:="" ([^"]+)"="">/g, (match, altText, urlPart) => {
                let url = 'https://' + urlPart.replace(/=/g, ''); // Removing '=' from the URL part
                return `<img alt="${altText}" src="${url}">`;
            });

            const updateElement = `
            <div class="update-card">
                <h3 class="update-title">${update.creator_name}</h3>
                <p class="update-date">${new Date(update.created_at).toLocaleDateString()}</p>
                <div class="update-body${isLongUpdate ? ' expandable' : ''}" ${index === 0 && isLongUpdate ? 'style="max-height: none;"' : ''}>
                    ${updateBody} <!-- Using innerHTML to render HTML content -->
                </div>
                ${isLongUpdate ? '<div class="read-more" onclick="toggleExpand(this)">' + (index === 0 ? 'Collapse' : 'Read More') + '</div>' : ''}
            </div>`;
            return updateElement
        });
        const updatesTextBlock = updatesHtml.join('\n');
        return updatesTextBlock;
    }

    function formHtml(updatesHtml, height){
      // HTML content
      return  `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>GraphQL API Response</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
              }

              .updates-section {
                  position: relative;
                  max-width: 100%;
                  margin: 0 auto;
                  padding: 10px;
              }

              .updates-grid {
                  display: grid;
                  grid-template-columns: 1fr; /* This will make it one column */
                  grid-gap: 20px;
                  margin-bottom: 20px;
                  max-height: ${height}px; /* Set a fixed height for the grid */
                  overflow-y: auto; /* Enable vertical scrolling */
              }

              .update-card {
                  background-color: #fff;
                  border: 1px solid #ddd;
                  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                  padding: 10px;
                  border-radius: 5px;
              }

              .update-title {
                  font-size: 1.2em;
                  font-weight: bold;
              }

              .update-date {
                  font-size: 0.9em;
                  color: #666;
                  margin-bottom: 5px;
              }

              .update-info, .update-title, .update-date {
                  color: black; /* Setting text color to black */
              }

              .update-body {
                  font-size: 16px;
                  max-height: 100px; /* Set a maximum height */
                  overflow: hidden;
                  transition: max-height 0.5s ease;
                  color: black; /* Text color for update body */
              }

              .expandable.expanded {
                  max-height: none;
              }

              .read-more {
                  font-size: 14px; /* Smaller text size */
                  color: grey; /* Text color changed to white */
                  cursor: pointer;
                  text-decoration: none;
              }

              .read-more:hover {
                  color: #d3d3d3;
              }

              /* Responsive Grid */
              @media (max-width: 600px) {
                  .updates-grid {
                      grid-template-columns: 1fr;
                  }
              }
              /* Pagination */
              .load-more-button {
                display: block;
                width: 100%; /* Full width to fit the container */
                padding: 10px 0;
                background-color: white; /* A bright, interactive color */
                color: black;
                text-align: center;
                font-size: 16px;
                font-weight: bold;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: background-color 0.3s ease;
                font-family: proxima-nova;
            }

            .load-more-button:hover {
                background-color: #d3d3d3; /* Darker shade on hover */
            }

            .load-more-button:disabled {
                background-color: #6c757d; /* Disabled state color */
                cursor: not-allowed;
            }

          </style>
      </head>
      <body>
        <section class="updates-section">
            <div class="updates-grid" id="text-block-container">
            ${updatesHtml}
            </div>
          </div>
        </section>
      </body>
      </html>`;
    }
}
