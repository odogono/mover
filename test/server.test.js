var fs = require('fs')
    , express = require('express')
    , util = require('util')
    , assert = require('assert')
    , log = require('util').log
    , path = require('path')
    , root = path.join( path.dirname(__filename), '../' )
    , app_main = path.join( root, 'app', 'app.js');

require.paths.push( path.join(root) );
require.paths.push( path.join(root,'node_modules', 'UglifyJS') );
require.paths.push( path.join(root,'node_modules', 'node-XMLHttpRequest') );
require.paths.push( path.join(root,'node_modules', 'node-websocket-client') );
var cio = require( path.join( root, 'node_modules', 'socket.io-client' ) );
// require( path.join( root, 'node_modules', 'socket.io-client', 'support', 'should' ) );
// require( path.join( root, 'node_modules', 'socket.io', 'test', 'common' ) );
// WebSocket = require( path.join(root, 'node_modules', 'socket.io', 'support', 'node-websocket-client', 'lib', 'websocket')).WebSocket

module.exports = {
    /*'test basic': function(beforeExit, assert){
        var app = require(app_main),
            server = app.app;

        assert.response( server,
            { url: '/', headers: { Referer: 'expressjs.com' }},
            // { body: 'thankyou' },
            function(res){
                log('headers: ' + JSON.stringify(res.headers) );
                assert.ok(res.body.indexOf('mover.model') >= 0);
                log('finished that test');
            });
        // beforeExit( function(){
        // });
        // assert.equal( app.paths.data, '/Users/alex/Dropbox/work/mover/data' );
    },//*/

    'test connect':function(next){
        var app = require(app_main),
            server = app.app;

            /*
            var cl = client(3000);
            log('connecting...');
            cl.handshake(function (sid) {
                var ws = websocket(cl, sid);
                log('handshook with ' + sid);
                ws.on('message', function (msg) {
                    log('message !' + msg);
                });
            });//*/

            var socket = cio.connect('http://localhost:3000?bum=dee');
            socket.on('connect', function () {
                log('connected');
            });
            socket.on('error', function(){
                console.log('error happened ' + JSON.stringify(arguments) );
            });
            socket.on('custom event', function () {
                
            });
            socket.on('message', function(msg){
                console.log('msg received ' + msg);
               assert.ok(true); 
               socket.disconnect();
            });
            socket.on('disconnect', function (msg) {
                log('disconnected')
                assert.equal(msg,'booted');
                next();
            });
            socket.send('hi there');
        // var socket = new cio.Socket( { 'auto connect':false });

        // socket.on('connect', function () {
        //   console.log('yay, connected!');
        //   socket.send('hi there!');
        // });

//         socket.on('message', function (msg) {
//           console.log('a new message came in: ' + JSON.stringify(msg));
//         });

// console.log( util.inspect (socket.connect) );
//         socket.connect();
    },
}