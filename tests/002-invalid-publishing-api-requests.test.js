import process from 'node:process';
import { describe } from 'kixx-test';
import {
    assert,
    assertEqual,
    assertArray,
} from 'kixx-assert';


const INVALID_PUBLISHING_API_TOKEN = 'kxpat_0000000000000000000000000000000000000000000000000000000000000000';


function assertUnauthenticatedPublishingApiError(response, body) {
    assert(response);
    assertEqual(401, response.status);
    assertEqual('application/vnd.api+json; charset=utf-8', response.headers.get('content-type'));
    assertArray(body.errors);
    const error = body.errors[0];
    assertEqual('401', error.status);
    assertEqual('UNAUTHENTICATED_ERROR', error.code);
}


describe('put template with invalid bearer token', ({ before, it }) => {
    const baseURL = process.env.TEST_SERVER_BASE_URL;

    const url = new URL(`${ baseURL }/publishing-api/v1/templates/base/website.html`);

    let response;
    let body;

    before(async () => {
        const payload = '<doc></doc>';
        const contentLength = new Blob([ payload ]).size;

        response = await fetch(url, {
            method: 'PUT',
            headers: {
                authorization: `Bearer ${ INVALID_PUBLISHING_API_TOKEN }`,
                'content-type': 'text/plain; charset=utf-8',
                'content-length': contentLength,
                'kixx-build-id': 'invalid-token-test-build',
            },
            body: payload,
        });

        body = await response.json();
    });

    it('failed with an UNAUTHENTICATED_ERROR', () => {
        assertUnauthenticatedPublishingApiError(response, body);
    });
});

describe('put page metadata with invalid bearer token', ({ before, it }) => {
    const baseURL = process.env.TEST_SERVER_BASE_URL;

    const url = new URL(`${ baseURL }/publishing-api/v1/pages/home`);

    const data = {
        type: 'PageMetadata',
        attributes: {
            version: 'invalid-token-test',
            page: {
                title: 'Home',
            },
        },
    };

    let response;
    let body;

    before(async () => {
        const payload = JSON.stringify({ data });
        const contentLength = new Blob([ payload ]).size;

        response = await fetch(url, {
            method: 'PUT',
            headers: {
                authorization: `Bearer ${ INVALID_PUBLISHING_API_TOKEN }`,
                'content-type': 'application/vnd.api+json; charset=utf-8',
                'content-length': contentLength,
                'kixx-build-id': 'invalid-token-test-build',
            },
            body: payload,
        });

        body = await response.json();
    });

    it('failed with an UNAUTHENTICATED_ERROR', () => {
        assertUnauthenticatedPublishingApiError(response, body);
    });
});

describe('put include with invalid bearer token', ({ before, it }) => {
    const baseURL = process.env.TEST_SERVER_BASE_URL;

    const url = new URL(`${ baseURL }/publishing-api/v1/includes/home/intro.md`);

    let response;
    let body;

    before(async () => {
        const payload = 'Intro copy';
        const contentLength = new Blob([ payload ]).size;

        response = await fetch(url, {
            method: 'PUT',
            headers: {
                authorization: `Bearer ${ INVALID_PUBLISHING_API_TOKEN }`,
                'content-type': 'text/markdown; charset=utf-8',
                'content-length': contentLength,
                'kixx-build-id': 'invalid-token-test-build',
            },
            body: payload,
        });

        body = await response.json();
    });

    it('failed with an UNAUTHENTICATED_ERROR', () => {
        assertUnauthenticatedPublishingApiError(response, body);
    });
});

describe('put static asset with invalid bearer token', ({ before, it }) => {
    const baseURL = process.env.TEST_SERVER_BASE_URL;

    const url = new URL(`${ baseURL }/publishing-api/v1/assets/css/site.css`);

    let response;
    let body;

    before(async () => {
        const payload = 'body { color: black; }';
        const contentLength = new Blob([ payload ]).size;

        response = await fetch(url, {
            method: 'PUT',
            headers: {
                authorization: `Bearer ${ INVALID_PUBLISHING_API_TOKEN }`,
                'content-type': 'text/css; charset=utf-8',
                'content-length': contentLength,
                'kixx-build-id': 'invalid-token-test-build',
            },
            body: payload,
        });

        body = await response.json();
    });

    it('failed with an UNAUTHENTICATED_ERROR', () => {
        assertUnauthenticatedPublishingApiError(response, body);
    });
});
