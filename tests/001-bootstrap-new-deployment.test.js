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

describe('check the bootstrap token', ({ it }) => {
    it('has set the ADMIN_BOOTSTRAP_TOKEN env var', () => {
        assertEqual('placeholder-bootstrap-token', process.env.ADMIN_BOOTSTRAP_TOKEN);
    });
});

describe('accept bootstrap invite with invalid token', ({ before, it }) => {
    const baseURL = process.env.TEST_SERVER_BASE_URL;

    const url = new URL(`${ baseURL }/admin-api/v1/users/invite`);

    const data = {
        type: 'AdminUser',
        attributes: {
            emailAddress: 'Margaret.Hamilton@example.com',
            password: 'Apollo11',
        },
    };

    let response;
    let body;

    before(async () => {
        const payload = JSON.stringify({ data });
        const contentLength = new Blob([ payload ]).size;

        response = await fetch(url, {
            method: 'POST',
            headers: {
                authorization: 'Bearer some-invalid-token',
                'content-type': 'application/vnd.api+json; charset=utf-8',
                'content-length': contentLength,
            },
            body: payload,
        });

        body = await response.json();
    });

    it('failed', () => {
        assert(response);
        assertEqual(404, response.status);
        assertEqual('application/json; charset=utf-8', response.headers.get('content-type'));
        assertArray(body.errors);
    });
});
