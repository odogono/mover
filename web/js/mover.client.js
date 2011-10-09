mover.log = function(msg){
    var $container = $('#log'),
        $entry = null,
        count = $container.find('li').size();

    if( count < 15 ){
        $entry = $('<li>' + msg + '</li>');
        $container.append($entry);    
    }
    else {
        // find the first child - change it - and add it to the end
        $container.append( $container.find('li:first').text(msg).detach() );
    }
};


mover.App = Backbone.Router.extend({
    routes: {
        '/'                         : 'routeMain',
        '*args'                     : 'routeMain'
    },

    initialize: function(options){
        var self = this;
        console.log('initialised with ' + JSON.stringify(options));
        
        this.model = new mover.model.Mover();
        this.model.urlRoot = 'http://localhost:3000';
        this.model.set( options.app );

        this.match = new mover.model.Match();
        this.match.set( this.match.parse(options.match) );
        Backbone.history.start({pushState: true});


        var now, last = +(new Date());
        function step() {
            now = +(new Date());
            dt = now - last;
            self.match.update(dt);
            // render();
            setTimeout(step, 1000 / 15 );
            last = now;
        }
        setTimeout(step, 1000 / 15);//*/
    },
    
    routeMain: function(){
        console.log('route main ' + JSON.stringify(arguments) );
        var view = new mover.view.MatchSVG({model:this.match})
        //var view = new mover.view.Match({model:this.match})
            .bind('navigate', this.navigateTo)
            .bind('move', function(entity){
                // mover.log('moving entity ' + entity.id + ' to ' + JSON.stringify( entity.get('tar')));
                // mover.log('dir ' + JSON.stringify(entity.normal()) );
                // send the command to the server
            });

        $('#content .panel .message').replaceWith( view.render().el );
    },
    
    navigateTo: function(target){

    },
});
