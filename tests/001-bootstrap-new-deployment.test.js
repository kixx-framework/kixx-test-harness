import process from 'node:process';
import { describe } from 'kixx-test';
import { assert, assertEqual, assertArray } from 'kixx-assert';


describe('smoke check the server', ({ before, it }) => {
    const baseURL = process.env.TEST_SERVER_BASE_URL;

    let response;
    let body;

    before(async () => {
        response = await fetch(baseURL);
        body = await response.json();
    });

    it('returns the bare 404', () => {
        assert(response);
        assertEqual(404, response.status);
        assertEqual('application/json; charset=utf-8', response.headers.get('content-type'));
        assertArray(body.errors);
        const error = body.errors[0];
        assertEqual('404', error.status);
        assertEqual('NOT_FOUND_ERROR', error.code);
    });
});
