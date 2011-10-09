var fs = require('fs'),
    util = require('util'),
    log = util.log,
    path = require('path'),
    root = path.join( path.dirname(__filename), '../' );

var paths = exports.paths = {
    root: root,
    app: path.join( root, 'app' ),
    data: path.join( root, 'data' ),
    etc: path.join( root, 'etc' ),
    lib: path.join( root, 'node_modules' ),
    src: path.join( root, 'src' ),
    templates: path.join(root, 'app', 'templates'),
    test: path.join( root, 'test' ),
    var: path.join( root, 'var' ),
    view: path.join( root, 'app', 'views' ),
    web: path.join( root, 'web' ),
};

require.paths.push( path.root );
require.paths.push( path.join(paths.web, 'js', 'lib') );
require.paths.push( 'node_modules/UglifyJS' );

uuid = require('node-uuid');
connect = require('connect');
parseCookie = require('connect').utils.parseCookie;
express = require('express');
socketio = require('socket.io');
FileSessionStore = require('connect-session-file');
exports._ = _ = exports.underscore = require('underscore');
global.Backbone = exports.Backbone = require('backbone');
require( 'mustache.js' );



var app = exports.app = express.createServer();

app.config = JSON.parse( fs.readFileSync( path.join(paths.etc, 'config.json') ) );
app.path = paths;
app.set('view engine', 'mustache');
app.set('views', path.join(__dirname,'views') );

app.use( express.bodyParser() );
app.use( connect.cookieParser() );
app.use( connect.logger({ format: ":date :response-time\t:method :status\t\t:url" }) );
app.use( connect.favicon() );
app.use( connect.static(app.path.web) );

var storePath = app.config.session.path || process.env.TMPDIR;

app.sessionStore = new FileSessionStore( {
    path:storePath, 
    printDebug:false, 
    reapInterval: process.env.NODE_ENV === 'test' ? -1 : 600000
} );
// log('session path: ' + app.sessionStore.path );
app.use( connect.session({ key:app.config.session.id, secret:'mover-secret', store: app.sessionStore}) );

var include_js = function( js ) {
    if( !_.isArray(js) )
        js = [ js ];
    return _.map( js, function( name ){
        if( name.indexOf('/') !== 0 && name.indexOf('http') !== 0 )
            name = '/js/' + name;
        return name;
    });
};

var include_css = function( css ){
    if( !_.isArray(css) )
        css = [ css ];
    return _.map( css, function( name ){
        if( name.indexOf('/') !== 0 )
            name = '/css/' + name;
        return name;
    });
};

app.locals({
    javascripts: function() {
        var includes = [
            'lib/RequestAnimationFrame',
            'lib/json2.min',
            'lib/jquery-1.6.4.min',
            'lib/underscore',
            'lib/backbone',
            'lib/milk',
            'lib/mustache',
            'lib/raphael-min'
        ];
        if( app.config.socket_server.enabled )
            includes.push('/socket.io/socket.io');
        includes.push( 'mover' );
        includes.push( 'mover.models' );
        includes.push( 'mover.views' );
        includes.push( 'mover.client' );
        return include_js(includes);
    }(),
    css: function(){
        return include_css( ['mover', 'match'] );
    }()
});

function prepareRequest(req){
    var attrname, content, locals = { templates:[] };
    var templatePattern = /(\w+)\.mustache$/i;
    // compile templates
    _.each( fs.readdirSync(paths.templates), function(file){
        if( (file = templatePattern.exec(file)) ){
            content = fs.readFileSync( path.join(app.path.templates,file[0]), 'utf8');
            locals.templates.push( { id:file[1], value:content});
        }
    });

    if( !req.session.clientid ){
        req.session.clientid = uuid();
    }

    locals.app_options = { userid:"" };
    for( attrname in req.params ){ locals.app_options[attrname] = req.params[attrname]; }
    for( attrname in req.query ){ locals.app_options[attrname] = req.query[attrname]; }

    locals.app_options.app = {clientid:req.session.clientid };
    locals.app_options.match = JSON.parse(fs.readFileSync( path.join(app.path.data, 'world.json'), 'utf8' ));
    return locals;
}

app.get('/', function(req, res){
    var locals = prepareRequest(req);

    if( req.accepts('application/json') ){
        res.json( locals.app_options );
    }

    locals.app_options = JSON.stringify(locals.app_options);
    res.render('main', {locals:locals});
});

app.get('/debug', function(req,res){
    // log( util.inspect(req) );
    res.send( util.inspect(req.session) ); 
});

app.listen(3000);


var sio = app.sio = socketio.listen(app);

// apply configuration from config.json
sio.configure(function () {
    _.each( app.config.socketio, function(val,key){
        util.log('setting ' + key + ' to ' + val );
        sio.set(key,val);    
    });
    sio.set('log level', 2);
});


sio.sockets.on('connection', function(socket) {
    log( 'socket ' + socket.id + ' connected with ' + JSON.stringify(socket.handshake.headers));
    log( util.inspect(socket.handshake) );
    // var cookie = parseCookie(socket.handshake.headers.cookie);
    // log( 'socket connected with cookie ' + JSON.stringify(cookie) );
    // console.log('socket connected: ' + JSON.stringify(socket.handshake) );
    socket.on('message', function (){
        log('socket msg: ' + JSON.stringify(arguments) );
        socket.send(JSON.stringify({'ok':true, 'msg':'thankyou'}), function(){
            log('sent ' + JSON.stringify(arguments) );
        });
    });
    socket.on('disconnect', function (){ 
        log('socket disconnect: ' + JSON.stringify(arguments) );
    });
});

//*/