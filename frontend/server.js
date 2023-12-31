// This file is for locally testing your html code with the deployed lambda server   

const express = require('express');
const app = express();
const port = 3000; // You can choose any port number

app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
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
                max-width: 100%;
                margin: 0 auto;
                padding: 10px;
            }

            .updates-grid {
                display: grid;
                grid-template-columns: 1fr; /* This will make it one column */
                grid-gap: 20px;
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
                color: #f2f2f2;
            }

            #toggle-all {
                 text-align: center;
                 margin-top: 20px;
                 cursor: pointer;
                 color: white; /* Set text color to white */
                 font-family: 'Futura', sans-serif; /* Use Futura font, fall back to sans-serif */
                 font-size: 12px; /* Set font size to 12px */
             }

            /* Responsive Grid */
            @media (max-width: 600px) {
                .updates-grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    </head>
    <body>
      <section class="updates-section">
          <div class="updates-grid" id="text-block-container"></div>
          <div id="toggle-all" class="read-more" onclick="toggleAllUpdates()" style="display: none;">Read More</div>
      </section>

        <script>
          let currentlyShown = 0;
          let updates = [];

            const haskell = {
              "itemId": 4172979215,
              "start": 1,
              "count": 5
            }
            fetch('https://strqjnwqqqzwkkf7ppkdqgcv440nnwfo.lambda-url.us-east-2.on.aws/', {
                method: 'POST',
                headers: {"content-type": "application/json"},
                body: JSON.stringify( haskell )
            })
            .then(response => response.json())
            .then(data => {
                updates = getUniqueUpdatesById(data.data.boards[0].updates);
                displayUpdates(5); // Initially display 5 updates
            })
            .catch(error => console.error(error));

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

            function displayUpdates(count) {
                const textBlockContainer = document.getElementById("text-block-container");
                const updatesToShow = updates.slice(currentlyShown, currentlyShown + count);

                updatesToShow.forEach(update => {
                    const isLongUpdate = update.body.length > 300 || update.body.includes('<img');
                    let updateBody = update.body;

                    // Correcting the malformed img tag
                    updateBody = updateBody.replace(/<img alt="([^"]+)" src="<img src=" https?:="" ([^"]+)"="">/g, (match, altText, urlPart) => {
                        let url = 'https://' + urlPart.replace(/=/g, ''); // Removing '=' from the URL part
                        return \`<img alt="\${altText}" src="\${url}">\`;
                    });

                    const updateElement = \`
                    <div class="update-card">
                        <h3 class="update-title">\${update.creator.name}</h3>
                        <p class="update-date">\${new Date(update.created_at).toLocaleDateString()}</p>
                        <div class="update-body\${isLongUpdate ? ' expandable' : ''}">
                            \${updateBody} <!-- Using innerHTML to render HTML content -->
                        </div>
                        \${isLongUpdate ? '<div class="read-more" onclick="toggleExpand(this)">Read More</div>' : ''}
                    </div>\`;
                    textBlockContainer.innerHTML += updateElement;
                });

                currentlyShown += count;
                updateToggleButton();
            }

            function toggleExpand(element) {
                const textBlock = element.parentElement;
                const updateBody = textBlock.querySelector('.update-body');
                updateBody.classList.toggle('expanded');
                element.innerText = updateBody.classList.contains('expanded') ? 'Collapse' : 'Read More';
            }

            function toggleAllUpdates() {
                displayUpdates(5); // Show next 5 updates
            }

            function updateToggleButton() {
                const toggleAllButton = document.getElementById('toggle-all');
                toggleAllButton.style.display = currentlyShown < updates.length ? 'block' : 'none';
                toggleAllButton.innerText = currentlyShown < updates.length ? 'SHOW MORE UPDATES' : 'SHOW LESS';
            }
        </script>


    </body>
    </html>
`);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
