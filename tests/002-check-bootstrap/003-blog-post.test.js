import process from 'node:process';
import { describe } from 'kixx-test';
import { FastHTMLParser } from 'fast-html-dom-parser';
import {
    assert,
    assertEqual,
    assertMatches,
} from 'kixx-assert';


const baseURL = process.env.TEST_SERVER_BASE_URL;


describe('check blog post', ({ before, it }) => {
    let response;
    let body;

    before(async () => {
        const url = new URL(`${ baseURL }/blog/hello-world?utm_source=bogus`);
        response = await fetch(url);
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
        assertEqual('My Blog | Hello World!', title.textContent);
        assertEqual('Hello World! | This is my first blog post', description.getAttribute('content'));
        assertEqual('article', document.getElementById('og-type').getAttribute('content'));
        assertEqual('My Blog | Hello World!', document.getElementById('og-title').getAttribute('content'));
        assertEqual('Hello World! | This is my first blog post', document.getElementById('og-description').getAttribute('content'));
        assertEqual('http://localhost:2026/blog/hello-world', document.getElementById('og-url').getAttribute('content'));
        assertEqual('en-US', document.getElementById('og-locale').getAttribute('content'));
        assertEqual('', document.getElementById('og-image').getAttribute('content'));
        assertEqual('http://localhost:2026/blog/hello-world', document.getElementById('link-canonical').getAttribute('href'));
        assertEqual('/stylesheets/0.1.0/website.css', document.getElementById('link-stylesheet').getAttribute('href'));
    });

    it('has expected content', () => {
        const document = new FastHTMLParser(body);
        const header = document.getElementById('branded-page-header');
        assertEqual('This is the branded page header', header.getElementsByTagName('p')[0].textContent);
        const [ main ] = document.getElementsByTagName('main');
        assertEqual('Hello World!', main.getElementsByTagName('h1')[0].textContent);
        const [ p1, p2 ] = main.getElementsByTagName('p');
        assertEqual('Well, hello World!', p1.textContent);
        assertEqual('This is my <em>first</em> blog post.', p2.innerHTML);
    });
});

describe('check blog post JSON', ({ before, it }) => {
    let response;
    let body;

    before(async () => {
        const url = new URL(`${ baseURL }/blog/hello-world.json`);
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
            pageTemplate,
        } = body;

        assertEqual('0.1.0', build_id);
        assertEqual('v0-bootstrap', version);
        assertEqual('base.html', baseTemplate);
        assertEqual('blog/post.html', pageTemplate);
    });
});
