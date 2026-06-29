import process from 'node:process';
import { describe } from 'kixx-test';
import { assertMatches } from 'kixx-assert';


describe('smoke check the server', ({ it }) => {
    it('returns an HTML response', () => {
        assertMatches(/^https?:\/\/.+/, process.env.TEST_SERVER_BASE_URL);
    });
});
