// This file is for locally testing your lambda function


import { handler } from './index.mjs';
import fs from 'fs';

async function test() {
    // const mockEvent = {
    //   "itemId": 4172979215,
    //   "start": 1,
    //   "count": 5
    // };
    const mockEvent = {
      "body":`{"itemId":5371574991,"height":600}`
    }
    const mockContext = {  };
    try {
        const result = await handler(mockEvent, mockContext);
        console.log('Lambda function output:', result);
        fs.writeFile('./example.html', result.body, (err) => {
          if (err) {
              console.error('An error occurred:', err);
              return;
          }
          console.log('HTML file has been saved.');
      });
    } catch (error) {
        console.error('Error executing Lambda function:', error);
    }
}

test();
