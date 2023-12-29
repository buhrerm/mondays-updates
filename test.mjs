import { handler } from './index.mjs';

async function test() {
    const mockEvent = {
      "boardId": 4172979215,
      "start": 1,
      "count": 5
    }; // Mock Lambda event object
    const mockContext = {

    }; // Mock Lambda context object
    try {
        const result = await handler(mockEvent, mockContext);
        console.log('Lambda function output:', result);
    } catch (error) {
        console.error('Error executing Lambda function:', error);
    }
}

test();
