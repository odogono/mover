
mover.model.Entity = Backbone.Model.extend({

    getAngle: function( pos, tar ){
        pos = pos || this.get('pos');
        tar = tar || this.get('tar');
        if( pos === undefined || tar === undefined )
            return 0;
        
        var x = pos[0] - tar[0],
            y = tar[1] - pos[1],
            x = tar[0] - pos[0],
            y = pos[1] - tar[1],
            angle = 0;

        if( (x==0) && (y>=0) )
            angle = Math.PI*2;
        else if((x == 0) && (y <=0))
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

        if( attrs.pos !== undefined || attrs.tar != undefined ){
            attrs.ang = this.getAngle( attrs.pos, attrs.tar );
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
    model: mover.model.Entity,
});


mover.model.Match = Backbone.Model.extend({

    initialize: function(){
        this.entities = new mover.model.Entities();    
    },

    // simulation update
    update: function(t){
        var self = this,
            velocity = null;
        
        this.entities.each( function(ent){
            velocity = ent.get('vel');
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
    },
});