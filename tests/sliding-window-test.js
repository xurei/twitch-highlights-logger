require('@babel/register')({
    "presets": [
        ["@babel/preset-env", {
            "modules": "commonjs",
            "useBuiltIns": false,
            "targets": {
                "node": "11"
            }
        }]
    ],
});
const slidingWindow = require('../src/webapp/sliding-window').slidingWindow;

const chai = require('chai');
const dirtyChai = require('dirty-chai');
const expect = chai.expect;
chai.use(dirtyChai);

/** @namespace describe */
/** @namespace it */
/** @namespace beforeEach */
/** @namespace before */

function mockChatlog(...timestamps) {
    return timestamps.map(t => {
        return { content_offset_seconds: t };
    });
}

function windowTest(params, timestamps, expected) {
    describe('log: ' + timestamps.join(', '), function() {
        it('should match the expected window', function() {
            const chatlog = mockChatlog(...timestamps);
            const window = slidingWindow(chatlog, params.W, params.N);
            console.log(window);
            expect(window).to.deep.eq(expected);
        });
    });
}

describe('slidingWindow', function() {
    describe('corner case : empty chatlog', function() {
        windowTest(
            {W: 100, N: 3},
            [ ],
            [ ]
        );
    });
    
    describe('Multiple messages at the same timestamp', function() {
        windowTest(
            {W: 100, N: 3},
            [5, 5, 5, 5, 250],
            [
                {start: 5, end: 5, nbMatches: 4},
            ]
        );
    });
    
    describe('W=2, N=1', function() {
        windowTest(
            {W: 2, N: 1},
            [5, 60, 85, 100, 350],
            [
                {start: 5, end: 5, nbMatches: 1},
                {start: 60, end: 60, nbMatches: 1},
                {start: 85, end: 85, nbMatches: 1},
                {start: 100, end: 100, nbMatches: 1},
                {start: 350, end: 350, nbMatches: 1}
            ]
        );
    });
    
    describe('W=120, N=1 (actual case)', function() {
        windowTest(
            {W: 120, N: 1},
            [ 10247.08, 16272.53 ],
            [
                {start: 10247.08, end: 10247.08, nbMatches: 1},
                {start: 16272.53, end: 16272.53, nbMatches: 1},
            ]
        );
    });
    
    describe('W=100, N=3', function() {
        windowTest(
            {W: 100, N: 3},
            [ 5, 60, 85, 100, 350 ],
            [
                {start: 5, end: 100, nbMatches: 4}
            ]
        );
    
        windowTest(
            {W: 100, N: 3},
            [ 5, 60, 85, 90, 100, 350 ],
            [
                {start: 5, end: 100, nbMatches: 5}
            ]
        );
    
        windowTest(
            {W: 100, N: 3},
            [ 5, 60, 85, 100, 110, 120, 130, 140, 150, 200, 300 ],
            [
                {start: 5, end: 100, nbMatches: 4},
                {start: 110, end: 200, nbMatches: 6},
            ]
        );
    
        windowTest(
            {W: 100, N: 3},
            [ 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200 ],
            [
                {start: 10, end: 100, nbMatches: 10},
                {start: 110, end: 200, nbMatches: 10},
            ]
        );
    });
    
    describe('W=100, N=too many', function() {
        windowTest(
            {W: 100, N: 100},
            [ 5, 60, 85, 100, 110, 120, 130, 140, 150, 200, 300 ],
            [
            ]
        );
    });
});
