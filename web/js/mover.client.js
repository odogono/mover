mover.App = Backbone.Router.extend({
    routes: {
        '/'                         : 'routeMain',
        '*args'                     : 'routeMain',
    },

    initialize: function(options){
        console.log('initialised with ' + JSON.stringify(options));
        
        this.match = new mover.model.Match();
        this.match.set( this.match.parse(options.match) );
        Backbone.history.start({pushState: true});
    },
    
    routeMain: function(){
        console.log('route main ' + JSON.stringify(arguments) );
        var view = new mover.view.Match({model:this.match}).bind('navigate', this.navigateTo);
        $('#content .panel').empty().append( view.render().el );
    },
    
    navigateTo: function(target){

    },
});
