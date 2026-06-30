import process from 'node:process';
import { describe } from 'kixx-test';
import { FastHTMLParser } from 'fast-html-dom-parser';
import {
    assert,
    assertEqual,
    assertMatches,
} from 'kixx-assert';

// import { BUILD_IDS } from '../../lib/constants.js';

const baseURL = process.env.TEST_SERVER_BASE_URL;


describe('check home page html', ({ before, it }) => {
    let response;
    let body;

    before(async () => {
        response = await fetch(baseURL);
        body = await response.text();
    });

    it('responds with an HTTP 200 status', () => {
        assertEqual(200, response.status);
    });

    it('responds with HTML', () => {
        assertMatches('text/html', response.headers.get('content-type'));
        assert(body);
    });

    it('has expected metadata', () => {
        const document = new FastHTMLParser(body);
        const [ root ] = document.getElementsByTagName('html');
        assertEqual('en-US', root.getAttribute('lang'));
        const [ head ] = root.getElementsByTagName('head');
        const [ title ] = head.getElementsByTagName('title');
        const [ description ] = head.getElementsByName('description');
        assertEqual('Blank Website', title.textContent);
        assertEqual('Blank website scaffolding', description.getAttribute('content'));
        assertEqual('website', document.getElementById('og-type').getAttribute('content'));
        assertEqual('Blank Website', document.getElementById('og-title').getAttribute('content'));
        assertEqual('Blank website scaffolding', document.getElementById('og-description').getAttribute('content'));
        assertEqual('http://localhost:2026/', document.getElementById('og-url').getAttribute('content'));
        assertEqual('en-US', document.getElementById('og-locale').getAttribute('content'));
        assertEqual('', document.getElementById('og-image').getAttribute('content'));
        assertEqual('http://localhost:2026/', document.getElementById('link-canonical').getAttribute('href'));
        assertEqual('/stylesheets/0.1.0/website.css', document.getElementById('link-stylesheet').getAttribute('href'));
    });

    it('has expected content', () => {
        const document = new FastHTMLParser(body);
        const header = document.getElementById('branded-page-header');
        assertEqual('This is the branded page header', header.getElementsByTagName('p')[0].textContent);
        const [ main ] = document.getElementsByTagName('main');
        assertEqual('Home Page', main.getElementsByTagName('h1')[0].textContent);
    });
});

describe('check home page JSON', ({ before, it }) => {
    let response;
    let body;

    before(async () => {
        const url = new URL(`${ baseURL }/index.json`);
        response = await fetch(url);
        body = await response.json();
    });

    it('responds with an HTTP 200 status', () => {
        assertEqual(200, response.status);
    });

    it('responds with JSON', () => {
        assertMatches('application/json', response.headers.get('content-type'));
        assert(body);
    });

    it('has expected metadata', () => {
        const {
            build_id,
            version,
            baseTemplate,
        } = body;

        assertEqual('0.1.0', build_id);
        assertEqual('v0-bootstrap', version);
        assertEqual('base.html', baseTemplate);
    });
});
