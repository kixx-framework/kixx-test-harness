import process from 'node:process';
import { describe } from 'kixx-test';
import { assert, assertEqual, assertMatches } from 'kixx-assert';


describe('smoke check the server', ({ before, it }) => {
    const baseURL = process.env.TEST_SERVER_BASE_URL;

    let response;
    let body;

    before(async () => {
        response = await fetch(baseURL);
        body = await response.text();
    });

    it('returns an HTML response', () => {
        assert(response);
        assertEqual(200, response.status);
        assertEqual('text/html; charset=utf-8', response.headers.get('content-type'));
        // Match a sample of the HTML document, just to be sure there is something there.
        assertMatches('<!doctype html>', body.slice(0, 50));
    });
});
