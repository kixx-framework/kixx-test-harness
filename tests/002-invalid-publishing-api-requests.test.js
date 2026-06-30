import process from 'node:process';
import { describe } from 'kixx-test';
import {
    assert,
    assertEqual,
    assertArray,
    assertNonEmptyString,
} from 'kixx-assert';


const INVALID_PUBLISHING_API_TOKEN = 'kxpat_0000000000000000000000000000000000000000000000000000000000000000';
const STAGED_BUILD_ID = 'invalid-request-test-build';


function getPublishingApiToken() {
    const token = process.env.PUBLISHING_API_TOKEN;
    assertNonEmptyString(token);

    return token;
}

function createContentLength(payload) {
    return new Blob([ payload ]).size;
}

function createPageMetadataPayload(attributes = {}) {
    return JSON.stringify({
        data: {
            type: 'PageMetadata',
            attributes: {
                version: 'invalid-request-test',
                ...attributes,
            },
        },
    });
}

async function putPublishingApiResource(args) {
    const {
        url,
        contentType,
        buildId,
        body,
        authorization = `Bearer ${ getPublishingApiToken() }`,
    } = args ?? {};

    const headers = {
        authorization,
    };

    if (contentType) {
        headers['content-type'] = contentType;
    }

    if (buildId) {
        headers['kixx-build-id'] = buildId;
    }

    if (body !== undefined) {
        headers['content-length'] = createContentLength(body);
    }

    return fetch(url, {
        method: 'PUT',
        headers,
        body,
    });
}

function assertPublishingApiError(response, body, expected) {
    const { status, code } = expected ?? {};

    assert(response);
    assertEqual(status, response.status);
    assertEqual('application/vnd.api+json; charset=utf-8', response.headers.get('content-type'));
    assertArray(body.errors);
    const error = body.errors[0];
    assertEqual(String(status), error.status);
    assertEqual(code, error.code);
}


function assertUnauthenticatedPublishingApiError(response, body) {
    assertPublishingApiError(response, body, {
        status: 401,
        code: 'UNAUTHENTICATED_ERROR',
    });
}

function describeInvalidPublishingApiRequest(title, args) {
    const {
        path,
        contentType,
        buildId = STAGED_BUILD_ID,
        body,
        expectedStatus,
        expectedCode,
    } = args ?? {};

    describe(title, ({ before, it }) => {
        const baseURL = process.env.TEST_SERVER_BASE_URL;

        const url = new URL(`${ baseURL }${ path }`);

        let response;
        let responseBody;

        before(async () => {
            response = await putPublishingApiResource({
                url,
                contentType,
                buildId,
                body,
            });

            responseBody = await response.json();
        });

        it(`failed with ${ expectedCode }`, () => {
            assertPublishingApiError(response, responseBody, {
                status: expectedStatus,
                code: expectedCode,
            });
        });
    });
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

describeInvalidPublishingApiRequest(
    'put template with unsupported content type',
    {
        path: '/publishing-api/v1/templates/base/website.html',
        contentType: 'application/json',
        body: '<doc></doc>',
        expectedStatus: 415,
        expectedCode: 'UNSUPPORTED_MEDIA_TYPE_ERROR',
    },
);

describeInvalidPublishingApiRequest(
    'put page metadata with unsupported content type',
    {
        path: '/publishing-api/v1/pages/home',
        contentType: 'text/plain',
        body: createPageMetadataPayload(),
        expectedStatus: 415,
        expectedCode: 'UNSUPPORTED_MEDIA_TYPE_ERROR',
    },
);

describeInvalidPublishingApiRequest(
    'put include with unsupported content type',
    {
        path: '/publishing-api/v1/includes/home/intro.md',
        contentType: 'application/json',
        body: 'Intro copy',
        expectedStatus: 415,
        expectedCode: 'UNSUPPORTED_MEDIA_TYPE_ERROR',
    },
);

describeInvalidPublishingApiRequest(
    'put static asset with missing content type',
    {
        path: '/publishing-api/v1/assets/css/site.css',
        body: new Uint8Array([ 98, 111, 100, 121 ]),
        expectedStatus: 400,
        expectedCode: 'ContentTypeRequired',
    },
);

describeInvalidPublishingApiRequest(
    'put template without build id',
    {
        path: '/publishing-api/v1/templates/base/website.html',
        contentType: 'text/plain',
        buildId: null,
        body: '<doc></doc>',
        expectedStatus: 400,
        expectedCode: 'BuildIdRequired',
    },
);

describeInvalidPublishingApiRequest(
    'put static asset without build id',
    {
        path: '/publishing-api/v1/assets/css/site.css',
        contentType: 'text/css',
        buildId: null,
        body: 'body { color: black; }',
        expectedStatus: 400,
        expectedCode: 'BuildIdRequired',
    },
);

describeInvalidPublishingApiRequest(
    'put template with empty source',
    {
        path: '/publishing-api/v1/templates/base/website.html',
        contentType: 'text/plain',
        body: '',
        expectedStatus: 400,
        expectedCode: 'TemplateSourceRequired',
    },
);

describeInvalidPublishingApiRequest(
    'put include with empty source',
    {
        path: '/publishing-api/v1/includes/home/intro.md',
        contentType: 'text/markdown',
        body: '',
        expectedStatus: 400,
        expectedCode: 'IncludeSourceRequired',
    },
);

describeInvalidPublishingApiRequest(
    'put static asset with empty source',
    {
        path: '/publishing-api/v1/assets/css/site.css',
        contentType: 'text/css',
        body: new Uint8Array(),
        expectedStatus: 400,
        expectedCode: 'StaticAssetSourceRequired',
    },
);

describeInvalidPublishingApiRequest(
    'put template with dotfile filepath',
    {
        path: '/publishing-api/v1/templates/base/.secret.html',
        contentType: 'text/plain',
        body: '<doc></doc>',
        expectedStatus: 400,
        expectedCode: 'BAD_REQUEST_ERROR',
    },
);

describeInvalidPublishingApiRequest(
    'put page metadata with dotfile pathname',
    {
        path: '/publishing-api/v1/pages/.hidden',
        contentType: 'application/vnd.api+json',
        body: createPageMetadataPayload(),
        expectedStatus: 400,
        expectedCode: 'BAD_REQUEST_ERROR',
    },
);

describeInvalidPublishingApiRequest(
    'put include with double slash filepath',
    {
        path: '/publishing-api/v1/includes/home//intro.md',
        contentType: 'text/markdown',
        body: 'Intro copy',
        expectedStatus: 400,
        expectedCode: 'BAD_REQUEST_ERROR',
    },
);

describeInvalidPublishingApiRequest(
    'put static asset with unsafe filepath character',
    {
        path: '/publishing-api/v1/assets/css/site%20main.css',
        contentType: 'text/css',
        body: 'body { color: black; }',
        expectedStatus: 400,
        expectedCode: 'BAD_REQUEST_ERROR',
    },
);

describeInvalidPublishingApiRequest(
    'put page metadata with non-object document',
    {
        path: '/publishing-api/v1/pages/home',
        contentType: 'application/vnd.api+json',
        body: JSON.stringify([]),
        expectedStatus: 400,
        expectedCode: 'BAD_REQUEST_ERROR',
    },
);

describeInvalidPublishingApiRequest(
    'put page metadata with non-object data',
    {
        path: '/publishing-api/v1/pages/home',
        contentType: 'application/vnd.api+json',
        body: JSON.stringify({ data: [] }),
        expectedStatus: 400,
        expectedCode: 'BAD_REQUEST_ERROR',
    },
);

describeInvalidPublishingApiRequest(
    'put page metadata with empty resource type',
    {
        path: '/publishing-api/v1/pages/home',
        contentType: 'application/vnd.api+json',
        body: JSON.stringify({
            data: {
                type: '',
                attributes: {
                    version: 'invalid-request-test',
                },
            },
        }),
        expectedStatus: 400,
        expectedCode: 'BAD_REQUEST_ERROR',
    },
);

describeInvalidPublishingApiRequest(
    'put page metadata with wrong resource type',
    {
        path: '/publishing-api/v1/pages/home',
        contentType: 'application/vnd.api+json',
        body: JSON.stringify({
            data: {
                type: 'Template',
                attributes: {
                    version: 'invalid-request-test',
                },
            },
        }),
        expectedStatus: 409,
        expectedCode: 'JsonApiResourceTypeMismatch',
    },
);

describeInvalidPublishingApiRequest(
    'put page metadata with non-object attributes',
    {
        path: '/publishing-api/v1/pages/home',
        contentType: 'application/vnd.api+json',
        body: JSON.stringify({
            data: {
                type: 'PageMetadata',
                attributes: [],
            },
        }),
        expectedStatus: 400,
        expectedCode: 'BAD_REQUEST_ERROR',
    },
);
