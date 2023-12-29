import fetch from 'node-fetch';
import assert from 'assert';
import dotenv from 'dotenv';
dotenv.config();


export const handler = async (event) => {
  const boardId = event.boardId;  // Assuming boardId is passed in the event
  const start = event.start; // Number update to start at. 1 <= start <= updates.length
  const count = event.count;  // Number of updates to display. 1 <= count
    const apiKey = process.env.MONDAY_API_KEY;  // Replace with your actual API key

    const query = `query { boards (ids: ${boardId}) {updates{id created_at body creator{name}}}}`;
    let updates = [];

    try {
        console.log("HERE");
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
        console.log(data);
        updates = getUniqueUpdatesById(data.data.boards[0].updates);

        // Process and return the first 5 updates
        return processUpdates(updates, start, count);
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
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

            const updatesHtml = updatesToShow.map(update => {
                const isLongUpdate = update.body.length > 300 || update.body.includes('<img');
                let updateBody = update.body;

                // Correcting the malformed img tag
                // updateBody = updateBody.replace(/<img alt="([^"]+)" src="<img src=" https?:="" ([^"]+)"="">/g, (match, altText, urlPart) => {
                //     let url = 'https://' + urlPart.replace(/=/g, ''); // Removing '=' from the URL part
                //     return `<img alt="${altText}" src="${url}">`;
                // });

                return  `
                <div class="update-card">
                    <h3 class="update-title">${update.creator.name}</h3>
                    <p class="update-date">${new Date(update.created_at).toLocaleDateString()}</p>
                    <div class="update-body${isLongUpdate ? ' expandable' : ''}">
                        ${updateBody} <!-- Using innerHTML to render HTML content -->
                    </div>
                    ${isLongUpdate ? '<div class="read-more" onclick="toggleExpand(this)">Read More</div>' : ''}
                </div>`;
            });
            return updatesHtml.join('\n');
            // currentlyShown += count;
            // updateToggleButton();
        }

        function toggleExpand(element) {
            const textBlock = element.parentElement;
            const updateBody = textBlock.querySelector('.update-body');
            updateBody.classList.toggle('expanded');
            element.innerText = updateBody.classList.contains('expanded') ? 'Collapse' : 'Read More';
        }

        function updateToggleButton() {
            const toggleAllButton = document.getElementById('toggle-all');
            toggleAllButton.style.display = start +1 < updates.length ? 'block' : 'none';
            toggleAllButton.innerText = start+1 < updates.length ? 'SHOW MORE UPDATES' : 'SHOW LESS';
        }
}
