import { Buffer } from 'node:buffer';
import process from 'node:process';
import { describe } from 'kixx-test';
import {
    assert,
    assertEqual,
    assertArray,
    assertMatches,
    assertNonEmptyString,
    assertValidDate,
} from 'kixx-assert';


const ADMIN_USER = {
    emailAddress: 'Margaret.Hamilton@example.com',
    password: 'Apollo11-to-the-M00N',
};

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

describe('create token with invalid Authorization header', ({ before, it }) => {
    const baseURL = process.env.TEST_SERVER_BASE_URL;

    const url = new URL(`${ baseURL }/admin-api/v1/publishing-api-tokens`);

    const data = {
        type: 'PublishingApiToken',
        attributes: {
            permissions: [
                { effect: 'allow', action: [ '*' ], resource: '*' },
            ],
            timeToLiveSeconds: 300,
            description: 'Temporary Test Token',
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
                authorization: 'Basic foo-bar-baz',
                'content-type': 'application/vnd.api+json; charset=utf-8',
                'content-length': contentLength,
            },
            body: payload,
        });

        body = await response.json();
    });

    it('failed with an UNAUTHENTICATED_ERROR', () => {
        assert(response);
        assertEqual(401, response.status);
        assertEqual('application/vnd.api+json; charset=utf-8', response.headers.get('content-type'));
        assertArray(body.errors);
        const error = body.errors[0];
        assertEqual('401', error.status);
        assertEqual('UNAUTHENTICATED_ERROR', error.code);
    });
});

describe('create token with wrong admin password', ({ before, it }) => {
    const baseURL = process.env.TEST_SERVER_BASE_URL;

    const url = new URL(`${ baseURL }/admin-api/v1/publishing-api-tokens`);

    const data = {
        type: 'PublishingApiToken',
        attributes: {
            permissions: [
                { effect: 'allow', action: [ '*' ], resource: '*' },
            ],
            timeToLiveSeconds: 300,
            description: 'Temporary Test Token',
        },
    };

    let response;
    let body;

    before(async () => {
        const payload = JSON.stringify({ data });
        const contentLength = new Blob([ payload ]).size;
        const credentials = `${ ADMIN_USER.emailAddress }:this-is-a-wrong-password`;
        const encodedCredentials = Buffer.from(credentials, 'utf8').toString('base64');

        response = await fetch(url, {
            method: 'POST',
            headers: {
                authorization: `Basic ${ encodedCredentials }`,
                'content-type': 'application/vnd.api+json; charset=utf-8',
                'content-length': contentLength,
            },
            body: payload,
        });

        body = await response.json();
    });

    it('failed with InvalidCredentials', () => {
        assert(response);
        assertEqual(401, response.status);
        assertEqual('application/vnd.api+json; charset=utf-8', response.headers.get('content-type'));
        assertArray(body.errors);
        const error = body.errors[0];
        assertEqual('401', error.status);
        assertEqual('InvalidCredentials', error.code);
    });
});

describe('create token with admin credentials', ({ before, it }) => {
    const baseURL = process.env.TEST_SERVER_BASE_URL;

    const url = new URL(`${ baseURL }/admin-api/v1/publishing-api-tokens`);

    const data = {
        type: 'PublishingApiToken',
        attributes: {
            permissions: [
                { effect: 'allow', action: [ '*' ], resource: '*' },
            ],
            timeToLiveSeconds: 300,
            description: 'Temporary Test Token',
        },
    };

    let response;
    let body;

    before(async () => {
        const payload = JSON.stringify({ data });
        const contentLength = new Blob([ payload ]).size;
        const credentials = `${ ADMIN_USER.emailAddress }:${ ADMIN_USER.password }`;
        const encodedCredentials = Buffer.from(credentials, 'utf8').toString('base64');

        response = await fetch(url, {
            method: 'POST',
            headers: {
                authorization: `Basic ${ encodedCredentials }`,
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
        const { data: tokenData } = body;
        const { attributes } = tokenData;

        assertEqual('PublishingApiToken', tokenData.type);
        assertMatches(/^[a-f0-9]{64}$/u, tokenData.id);
        assertMatches(/^kxpat_[a-f0-9]{64}$/u, attributes.token);
        assertArray(attributes.permissions);
        assertEqual(1, attributes.permissions.length);

        const permission = attributes.permissions[0];
        assertEqual('allow', permission.effect);
        assertArray(permission.action);
        assertEqual(1, permission.action.length);
        assertEqual('*', permission.action[0]);
        assertEqual('*', permission.resource);

        assertEqual('Temporary Test Token', attributes.description);
        assertNonEmptyString(attributes.createdBy);
        assertNonEmptyString(attributes.tokenCreationDate);
        assertNonEmptyString(attributes.tokenExpirationDate);

        const tokenCreationDate = new Date(attributes.tokenCreationDate);
        const tokenExpirationDate = new Date(attributes.tokenExpirationDate);
        assertValidDate(tokenCreationDate);
        assertValidDate(tokenExpirationDate);
        assertEqual(
            tokenCreationDate.getTime() + (data.attributes.timeToLiveSeconds * 1000),
            tokenExpirationDate.getTime(),
        );
    });
});

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
