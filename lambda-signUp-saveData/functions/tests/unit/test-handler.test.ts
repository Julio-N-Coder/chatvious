import { saveUserData } from '../../handlers/saveUserData';
import testPostConfirmationEvent from '../../../events/event.json';
import { expect, describe, test } from '@jest/globals';

// This includes all tests for saveUserData()
describe('Test for hello-from-lambda', function () {
    // This test invokes saveUserData() and compare the result
    test('Verifies successful response', async () => {
        // Invoke saveUserData()
        const result = await saveUserData(testPostConfirmationEvent);

        // Compare the result with the expected result
        expect(result).toEqual(testPostConfirmationEvent);
    });
});
