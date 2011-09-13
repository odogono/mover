
mover.model.Entity = Backbone.Model.extend({

    update: function(t){  
    },

    setTarget: function( tx, ty ){
        var pos = this.get('pos');
        this.set({tar:[tx,ty], ang:this.getDegrees(pos[0], pos[1], tx, ty) });
    },

    getDegrees : function ( ax,ay, bx,by )
    {
        var x = ax - bx;
        var y = by - ay;
        var angle = 0;

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

        angle = (angle * (180/Math.PI))-180;
        if( angle < 0 ) 
            angle = angle + 360;
        return angle;
    },

    radius: function(){
        var pos = this.get('pos'), 
            dims = this.get('dims');
        return Math.min( dims[0], dims[1] ) / 2;    
    },

    doesPointIntersect: function( p ){
        var pos = this.get('pos'), 
            dims = this.get('dims'),
            left = pos[0] - (dims[0]/2), right = pos[0] + (dims[0]/2),
            top = pos[1] - (dims[1]/2), bottom = pos[1] + (dims[1]/2);
// console.log('doesPointIntersect ' + JSON.stringify(arguments) );
        return (p[0] > left) && (p[0] < right) && (p[1] > top) && (p[1] < bottom);
    },
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