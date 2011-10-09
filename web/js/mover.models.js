
mover.model.Entity = Backbone.Model.extend({

    getAngle: function( pos, tar ){
        pos = pos || this.get('pos');
        tar = tar || this.get('tar');
        if( pos === undefined || tar === undefined )
            return 0;
        
        var x = pos[0] - tar[0],
            y = tar[1] - pos[1],
            angle = 0;

        if( (x===0) && (y>=0) )
            angle = Math.PI*2;
        else if((x === 0) && (y <=0))
            angle = (Math.PI);
        else if((x < 0) && (y <= 0))
            angle = (Math.PI+(Math.PI/2)) - Math.atan(y/x);
        else if((x < 0) && (y >= 0))
            angle = (3*Math.PI/2) + Math.abs(Math.atan(y/x));
        else if(y > 0)
            angle = (2*Math.PI+(Math.PI/2)) - Math.atan(y/x);
        else 
            angle = -1 * Math.atan(y/x) + (Math.PI/2);
        if( angle < 0 ) 
            angle = angle + (2*Math.PI);
        return angle;
    },

    set: function(attrs,options){

        if( attrs.pos !== undefined || attrs.tar !== undefined ){
            // attrs.ang = this.getAngle( attrs.pos, attrs.tar );
        }
        return Backbone.Model.prototype.set.call(this, attrs, options);    
    },

    radius: function(){
        var pos = this.get('pos'), 
            dims = this.get('dims');
        return Math.min( dims[0], dims[1] ) / 2;    
    },

    length: function(){
        var pos = this.get('pos'),
            tar = this.get('tar'),
            xS = tar[0] - pos[0],
            yS = tar[1] - pos[1];
        
        return Math.sqrt( yS*yS + xS*xS);
    },

    normal: function( mul ){
        var pos = this.get('pos'),
            tar = this.get('tar'),
            xS,yS, len;
        mul = mul || 1;

        if( !tar )
            return [0,0];
        
        xS = tar[0] - pos[0];
        yS = tar[1] - pos[1];
        
        len = Math.sqrt( yS*yS + xS*xS );
        
        if( len === 0 )
            len = 1;
        return [ (xS/len) * mul, (yS/len) * mul ];
    },

    doesPointIntersect: function( p ){
        var pos = this.get('pos'), 
            dims = this.get('dims'),
            left = pos[0] - (dims[0]/2), right = pos[0] + (dims[0]/2),
            top = pos[1] - (dims[1]/2), bottom = pos[1] + (dims[1]/2);
        return (p[0] > left) && (p[0] < right) && (p[1] > top) && (p[1] < bottom);
    },

    toString: function(){
        var pos = this.get('pos'),
            tar = this.get('tar') || [0,0], 
            ang = this.get('ang') * (180/Math.PI),
            result = [
                this.id, ' ',
                pos[0], ',', pos[1], ' -> ',
                tar[0], ',', tar[1],
                ' = ', ang
            ];
        return result.join('');
    }
});

mover.model.Entities = Backbone.Collection.extend({
    model: mover.model.Entity
});


mover.model.Match = Backbone.Model.extend({

    initialize: function(){
        var self=this;
        this.entities = new mover.model.Entities();
        // fwd all events from the collection outwards
        this.entities.bind('all', function(){
            self.trigger.apply(self,arguments);
        });

        this.entities.bind('change:tar', function(entity){
            // update velocity
            entity.set({vel:entity.normal(1)});
        });
    },

    // simulation update
    update: function(t){
        var self = this,
            pos,vel,tar;
        // $('#arrow_debug').text('t ' + t );
        if( !this.entities )
            return;
        
        // mover.log( new Date().getTime() + ' : updating match');

        this.entities.each( function(entity){
            pos = entity.get('pos');
            vel = entity.get('vel');
            tar = entity.get('tar');
            if( vel ){
                // mover.log('updating entity ' + entity.id + ' ' + JSON.stringify(vel) );
                entity.set( {pos:[ pos[0] + vel[0], pos[1] + vel[1] ]});
            }
        });
    },

    parse: function(resp, xhr){
        if( resp.entities ){
            this.entities.reset( resp.entities );
            delete resp.entities;
        }
        return resp;
    },

    toJSON: function(){
        var result = Backbone.Model.prototype.toJSON.call(this);
        result.entities =this.entities.toJSON();
        return result;
    }
});




mover.model.Command = Backbone.Model.extend({
         
});



mover.model.Mover = Backbone.Model.extend({

    urlRoot: 'http://localhost',

    initialize: function(){
    },

    connect: function(){
        var self = this;

        this.connection = io.connect(this.urlRoot)
        .on('error', function(reason){
            console.log('connect error ' + reason );
            self.trigger('disconnect', 'error', reason);
        })
        .on('connect', function(){
            var sio_id = this.socket.sessionid;
            console.log('connected ' + sio_id );
        })
        .on('connect_failed', function(){
            console.log('connect_failed: ' + JSON.stringify(arguments));
            self.set({connected:false});
        })
        .on('message', function(){
            // self.onMessage();
            console.log('message: ' + JSON.stringify(arguments) );
        })
        .on('reconnecting', function(reconnectionDelay,reconnectionAttempts){
            console.log('reconnecting ' + reconnectionAttempts );
        })
        .on('disconnect', function(){
            console.log('disconnected');
            self.set({connected:false});
        });
        
        // register all events
        for( name in this.events ){
            this.connection.on( name, this.events[name] );
        }
        this.events = {};
    },
});
