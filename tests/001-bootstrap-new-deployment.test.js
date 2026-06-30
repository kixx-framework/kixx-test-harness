import process from 'node:process';
import { describe } from 'kixx-test';
import {
    assert,
    assertEqual,
    assertArray,
    assertMatches,
    assertNonEmptyString,
} from 'kixx-assert';


const ADMIN_USER = {
    emailAddress: 'Margaret.Hamilton@example.com',
    password: 'Apollo11-to-the-M00N',
};


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
        assertNonEmptyString(process.env.ADMIN_BOOTSTRAP_TOKEN);
    });
});

describe('accept bootstrap invite with invalid token', ({ before, it }) => {
    const baseURL = process.env.TEST_SERVER_BASE_URL;

    const url = new URL(`${ baseURL }/admin-api/v1/users/invite`);

    const data = {
        type: 'AdminUser',
        attributes: {
            emailAddress: ADMIN_USER.emailAddress,
            password: ADMIN_USER.password,
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

    it('is forbidden', () => {
        assert(response);
        assertEqual(403, response.status);
        assertEqual('application/vnd.api+json; charset=utf-8', response.headers.get('content-type'));
        assertArray(body.errors);
        const error = body.errors[0];
        assertEqual('403', error.status);
        assertEqual('InvalidInvite', error.code);
    });
});

describe('accept bootstrap invite with invalid password', ({ before, it }) => {
    const baseURL = process.env.TEST_SERVER_BASE_URL;
    const bootstrapToken = process.env.ADMIN_BOOTSTRAP_TOKEN;

    const url = new URL(`${ baseURL }/admin-api/v1/users/invite`);

    const data = {
        type: 'AdminUser',
        attributes: {
            emailAddress: ADMIN_USER.emailAddress,
            password: 'too_short',
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
                authorization: `Bearer ${ bootstrapToken }`,
                'content-type': 'application/vnd.api+json; charset=utf-8',
                'content-length': contentLength,
            },
            body: payload,
        });

        body = await response.json();
    });

    it('failed with validation error', () => {
        assert(response);
        assertEqual(422, response.status);
        assertEqual('application/vnd.api+json; charset=utf-8', response.headers.get('content-type'));
        assertArray(body.errors);
        const error = body.errors[0];
        assertEqual('422', error.status);
        assertEqual('VALIDATION_ERROR', error.code);
        assertMatches('password', error.source);
    });
});

describe('accept bootstrap invite', ({ before, it }) => {
    const baseURL = process.env.TEST_SERVER_BASE_URL;
    const bootstrapToken = process.env.ADMIN_BOOTSTRAP_TOKEN;

    const url = new URL(`${ baseURL }/admin-api/v1/users/invite`);

    const data = {
        type: 'AdminUser',
        attributes: {
            emailAddress: ADMIN_USER.emailAddress,
            password: ADMIN_USER.password,
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
                authorization: `Bearer ${ bootstrapToken }`,
                'content-type': 'application/vnd.api+json; charset=utf-8',
                'content-length': contentLength,
            },
            body: payload,
        });

        body = await response.json();
    });

    it('succeeded', () => {
        assert(response);
        assertEqual(201, response.status);
        assertEqual('application/vnd.api+json; charset=utf-8', response.headers.get('content-type'));
        assert(body.data);
        const { data } = body;
        assertEqual('AdminUser', data.type);
        assertNonEmptyString(data.id);
        assertEqual(ADMIN_USER.emailAddress.toLowerCase(), data.attributes.emailAddress);
    });
});

describe('accept bootstrap invite when user exists', ({ before, it }) => {
    const baseURL = process.env.TEST_SERVER_BASE_URL;
    const bootstrapToken = process.env.ADMIN_BOOTSTRAP_TOKEN;

    const url = new URL(`${ baseURL }/admin-api/v1/users/invite`);

    const data = {
        type: 'AdminUser',
        attributes: {
            emailAddress: 'bad-actor@gmail.com',
            password: 'a good enough password',
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
                authorization: `Bearer ${ bootstrapToken }`,
                'content-type': 'application/vnd.api+json; charset=utf-8',
                'content-length': contentLength,
            },
            body: payload,
        });

        body = await response.json();
    });

    it('is forbidden', () => {
        assert(response);
        assertEqual(403, response.status);
        assertEqual('application/vnd.api+json; charset=utf-8', response.headers.get('content-type'));
        assertArray(body.errors);
        const error = body.errors[0];
        assertEqual('403', error.status);
        assertEqual('InvalidInvite', error.code);
    });
});
