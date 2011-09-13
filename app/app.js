var fs = require('fs'),
    util = require('util'),
    path = require('path'),
    root = path.join( path.dirname(__filename), '../' );

var paths = {
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

require.paths.push( 'node_modules' );
require.paths.push( path.join(paths.web, 'js', 'lib') );
require.paths.push( 'node_modules/express/lib' );
connect = require('connect');
express = require('express');
exports._ = _ = exports.underscore = require('underscore');
global.Backbone = exports.Backbone = require('backbone');
require( 'mustache.js' );

var app = express.createServer();

app.path = paths;
app.set('view engine', 'mustache');
app.set('views', path.join(__dirname,'views') );

app.use( express.bodyParser() );
app.use( connect.logger({ format: ":date :response-time\t:method :status\t\t:url" }) );
app.use( connect.favicon() );
app.use( connect.static(app.path.web) );

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
            'lib/jquery-1.6.2.min',
            'lib/underscore',
            'lib/backbone',
            'lib/mustache',
        ];
        includes.push( 'mover' );
        includes.push( 'mover.models' );
        includes.push( 'mover.views' );
        includes.push( 'mover.client' );
        return include_js(includes);
    }(),
    css: function(){
        return include_css( ['mover', 'match'] );
    }(),
});

function prepareRequest(req){
    var attrname, content, locals = { templates:[] };
    var templatePattern = /(\w+)\.mustache$/i;
    // compile templates
    _.each( fs.readdirSync(paths.templates), function(file){
        if( file=templatePattern.exec(file) ){
            content = fs.readFileSync( path.join(app.path.templates,file[0]), 'utf8');
            locals.templates.push( { id:file[1], value:content});
        }
    });
    locals.app_options = { userid:"" };
    for( attrname in req.params ){ locals.app_options[attrname] = req.params[attrname]; }
    for( attrname in req.query ){ locals.app_options[attrname] = req.query[attrname]; }

    locals.app_options.match = JSON.parse(fs.readFileSync( path.join(app.path.data, 'world.json'), 'utf8' ));

    locals.app_options = JSON.stringify(locals.app_options);
    return locals;
}

app.get('/', function(req, res){
    var locals = prepareRequest(req);
    res.render('main', {locals:locals});
});

app.listen(3000);