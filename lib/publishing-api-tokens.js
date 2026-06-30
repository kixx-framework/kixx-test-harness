import { Buffer } from 'node:buffer';
import process from 'node:process';
import {
    assert,
    assertEqual,
    assertNonEmptyString,
} from 'kixx-assert';

import { ADMIN_USER } from './constants.js';


/**
 * Mints a publishing API token with the configured admin test user.
 * @param {Object} [options] - Token request options
 * @param {string} [options.baseURL=process.env.TEST_SERVER_BASE_URL] - Test server base URL
 * @param {number} [options.timeToLiveSeconds=300] - Token lifetime in seconds
 * @param {string} [options.description=Temporary Test Token] - Token description
 * @returns {Promise<string>} Resolves to the bearer token value.
 * @throws {Error} When the server does not return a successful token resource.
 */
export async function mintPublishingApiToken(options) {
    const {
        baseURL = process.env.TEST_SERVER_BASE_URL,
        timeToLiveSeconds = 300,
        description = 'Temporary Test Token',
    } = options ?? {};

    assertNonEmptyString(baseURL);

    const url = new URL(`${ baseURL }/admin-api/v1/publishing-api-tokens`);
    const data = {
        type: 'PublishingApiToken',
        attributes: {
            permissions: [
                { effect: 'allow', action: [ '*' ], resource: '*' },
            ],
            timeToLiveSeconds,
            description,
        },
    };
    const payload = JSON.stringify({ data });
    const contentLength = new Blob([ payload ]).size;
    const credentials = `${ ADMIN_USER.emailAddress }:${ ADMIN_USER.password }`;
    const encodedCredentials = Buffer.from(credentials, 'utf8').toString('base64');

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            authorization: `Basic ${ encodedCredentials }`,
            'content-type': 'application/vnd.api+json; charset=utf-8',
            'content-length': contentLength,
        },
        body: payload,
    });

    const body = await response.json();
    assertEqual(201, response.status);
    assertEqual('application/vnd.api+json; charset=utf-8', response.headers.get('content-type'));
    assert(body.data);
    assert(body.data.attributes);
    assertNonEmptyString(body.data.attributes.token);

    return body.data.attributes.token;
}
