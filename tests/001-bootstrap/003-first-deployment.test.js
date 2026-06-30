import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { describe } from 'kixx-test';
import {
    assert,
    assertEqual,
    assertMatches,
} from 'kixx-assert';

import { mintPublishingApiToken } from '../../lib/publishing-api-tokens.js';
import { BUILD_IDS } from '../../lib/constants.js';


const baseURL = process.env.TEST_SERVER_BASE_URL;

// The v0 bootstrap deployment publishes everything into the first build id.
// On a fresh site the live build is null, so this id is a valid "non-current"
// staged build for templates and assets, and an explicit target for the
// otherwise current-build-defaulting page metadata and include writes.
const BUILD_ID = BUILD_IDS[0];

// Fixture URLs are resolved relative to this test file so the suite does not
// depend on the process working directory.
const FIXTURES_DIR = new URL('../../fixtures/v0-bootstap/', import.meta.url);

const JSON_API_CONTENT_TYPE = 'application/vnd.api+json; charset=utf-8';

let publishingApiTokenPromise;

function getPublishingApiToken() {
    // Mint once and share the token across every upload in this suite.
    if (!publishingApiTokenPromise) {
        publishingApiTokenPromise = mintPublishingApiToken();
    }

    return publishingApiTokenPromise;
}

function fixtureURL(relativePath) {
    return new URL(relativePath, FIXTURES_DIR);
}

function contentLength(body) {
    // Content-Length is a byte count, not a character count; Blob measures the
    // encoded UTF-8 size so multi-byte fixtures are reported correctly.
    return new Blob([ body ]).size;
}

async function putPublishingApiResource(args) {
    const {
        url,
        contentType,
        body,
    } = args ?? {};

    return fetch(url, {
        method: 'PUT',
        headers: {
            authorization: `Bearer ${ await getPublishingApiToken() }`,
            'content-type': contentType,
            'kixx-build-id': BUILD_ID,
            'content-length': contentLength(body),
        },
        body,
    });
}

function assertSuccessDocument(response, body, type) {
    assert(response);
    assertEqual(200, response.status);
    assertEqual(JSON_API_CONTENT_TYPE, response.headers.get('content-type'));
    assert(body.data);
    assertEqual(type, body.data.type);
    assert(body.data.attributes);
}

function describeTemplateUpload(args) {
    const {
        fixturePath,
        path,
        kind,
        expectedFilepath,
    } = args;

    describe(`upload ${ kind } template ${ expectedFilepath }`, ({ before, it }) => {
        const url = new URL(`${ baseURL }${ path }`);

        let response;
        let body;

        before(async () => {
            const source = await readFile(fixtureURL(fixturePath), 'utf8');

            response = await putPublishingApiResource({
                url,
                contentType: 'text/plain; charset=utf-8',
                body: source,
            });

            body = await response.json();
        });

        it('responded with the staged Template resource', () => {
            assertSuccessDocument(response, body, 'Template');
            assertEqual(expectedFilepath, body.data.id);
            assertEqual(kind, body.data.attributes.kind);
            assertEqual(expectedFilepath, body.data.attributes.filepath);
            assertEqual(BUILD_ID, body.data.attributes.buildId);
        });
    });
}

function describeIncludeUpload(args) {
    const {
        fixturePath,
        path,
        contentType,
        expectedId,
        expectedPathname,
        expectedFilename,
    } = args;

    describe(`upload include ${ expectedId }`, ({ before, it }) => {
        const url = new URL(`${ baseURL }${ path }`);

        let response;
        let body;

        before(async () => {
            const source = await readFile(fixtureURL(fixturePath), 'utf8');

            response = await putPublishingApiResource({
                url,
                contentType,
                body: source,
            });

            body = await response.json();
        });

        it('responded with the Include resource', () => {
            assertSuccessDocument(response, body, 'Include');
            assertEqual(expectedId, body.data.id);
            assertEqual(expectedPathname, body.data.attributes.pathname);
            assertEqual(expectedFilename, body.data.attributes.filename);
            assertEqual(BUILD_ID, body.data.attributes.buildId);
        });
    });
}

function describePageUpload(args) {
    const {
        title,
        fixturePath,
        path,
        expectedId,
        verifyAttributes,
    } = args;

    describe(title, ({ before, it }) => {
        const url = new URL(`${ baseURL }${ path }`);

        let response;
        let body;

        before(async () => {
            const metadata = JSON.parse(await readFile(fixtureURL(fixturePath), 'utf8'));

            const payload = JSON.stringify({
                data: {
                    type: 'PageMetadata',
                    attributes: metadata,
                },
            });

            response = await putPublishingApiResource({
                url,
                contentType: JSON_API_CONTENT_TYPE,
                body: payload,
            });

            body = await response.json();
        });

        it('responded with the PageMetadata resource', () => {
            assertSuccessDocument(response, body, 'PageMetadata');
            assertEqual(expectedId, body.data.id);
            assertEqual('v0-bootstrap', body.data.attributes.version);

            // Only page metadata carries meta.buildId reporting the build the
            // write actually targeted.
            assert(body.data.meta);
            assertEqual(BUILD_ID, body.data.meta.buildId);

            if (verifyAttributes) {
                verifyAttributes(body.data.attributes);
            }
        });
    });
}

function describeAssetUpload(args) {
    const {
        fixturePath,
        path,
        contentType,
        expectedFilepath,
    } = args;

    describe(`upload static asset ${ expectedFilepath }`, ({ before, it }) => {
        const url = new URL(`${ baseURL }${ path }`);

        let response;
        let body;
        let expectedLength;

        before(async () => {
            const source = await readFile(fixtureURL(fixturePath), 'utf8');
            expectedLength = contentLength(source);

            response = await putPublishingApiResource({
                url,
                contentType,
                body: source,
            });

            body = await response.json();
        });

        it('responded with the staged StaticAsset resource', () => {
            assertSuccessDocument(response, body, 'StaticAsset');
            assertEqual(expectedFilepath, body.data.id);
            assertEqual(expectedFilepath, body.data.attributes.filepath);
            assertEqual(BUILD_ID, body.data.attributes.buildId);
            assertEqual(contentType, body.data.attributes.contentType);
            assertEqual(expectedLength, body.data.attributes.contentLength);
            // The store computes a strong, quoted SHA-256 ETag from the bytes.
            assertMatches(/^"[0-9a-f]{64}"$/, body.data.attributes.etag);
        });
    });
}


// Templates target a staged (non-current) build via the required Kixx-Build-Id.

describeTemplateUpload({
    fixturePath: 'templates/base/base.html',
    path: '/publishing-api/v1/templates/base/base.html',
    kind: 'base',
    expectedFilepath: 'base.html',
});

describeTemplateUpload({
    fixturePath: 'templates/pages/page.html',
    path: '/publishing-api/v1/templates/pages/page.html',
    kind: 'page',
    expectedFilepath: 'page.html',
});

describeTemplateUpload({
    fixturePath: 'templates/pages/blog/post.html',
    path: '/publishing-api/v1/templates/pages/blog/post.html',
    kind: 'page',
    expectedFilepath: 'blog/post.html',
});

describeTemplateUpload({
    fixturePath: 'templates/partials/components/branded-page-header.html',
    path: '/publishing-api/v1/templates/partials/components/branded-page-header.html',
    kind: 'partial',
    expectedFilepath: 'components/branded-page-header.html',
});


// Include source for the blog post, declared by its owning page metadata below.

describeIncludeUpload({
    fixturePath: 'pages/blog/hello-world/post-body.md',
    path: '/publishing-api/v1/includes/blog/hello-world/post-body.md',
    contentType: 'text/markdown; charset=utf-8',
    expectedId: 'blog/hello-world/post-body.md',
    expectedPathname: '/blog/hello-world',
    expectedFilename: 'post-body.md',
});


// Page metadata documents. The root page has an empty wildcard pathname, so it
// is uploaded against the trailing-slash pages route and normalizes to '/'.

describePageUpload({
    title: 'upload root page metadata',
    fixturePath: 'pages/page.json',
    path: '/publishing-api/v1/pages/',
    expectedId: '/',
});

describePageUpload({
    title: 'upload blog/hello-world page metadata',
    fixturePath: 'pages/blog/hello-world/page.json',
    path: '/publishing-api/v1/pages/blog/hello-world',
    expectedId: '/blog/hello-world',
    verifyAttributes: (attributes) => {
        // The include declaration must round-trip so Hyperview can resolve the
        // uploaded post-body.md file for this page.
        assert(attributes.includes);
        assert(attributes.includes.post_body);
        assertEqual('post-body.md', attributes.includes.post_body.filename);
    },
});


// Static asset. The build id is embedded in the served path because base.html
// links the stylesheet at /stylesheets/{{ build_id }}/website.css.

describeAssetUpload({
    fixturePath: 'public/stylesheets/website.css',
    path: `/publishing-api/v1/assets/stylesheets/${ BUILD_ID }/website.css`,
    contentType: 'text/css',
    expectedFilepath: `stylesheets/${ BUILD_ID }/website.css`,
});
