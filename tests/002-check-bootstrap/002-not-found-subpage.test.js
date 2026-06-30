import process from 'node:process';
import { describe } from 'kixx-test';
import {
    assert,
    assertEqual,
    assertArray,
    assertMatches,
} from 'kixx-assert';


const baseURL = process.env.TEST_SERVER_BASE_URL;


describe('check home page html', ({ before, it }) => {
    let response;
    let body;

    before(async () => {
        const url = new URL(`${ baseURL }/blog`);
        response = await fetch(url);
        body = await response.json();
    });

    it('responds with an HTTP 404 status', () => {
        assertEqual(404, response.status);
    });

    it('responds with JSON error', () => {
        assertMatches('application/json', response.headers.get('content-type'));
        assertArray(body.errors);
        const [ error ] = body.errors;
        assertEqual('404', error.status);
        assertEqual('NOT_FOUND_ERROR', error.code);
    });
});
