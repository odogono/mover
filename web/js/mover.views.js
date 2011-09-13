

mover.view.Match = Backbone.View.extend({
    events:{
        'mousemove canvas'      : 'onInteractMove',
        'mouseup canvas'        : 'onInteractUp',
        'mousedown canvas'      : 'onInteractDown'
    },

    initialize: function(){
        var self = this;
        _.bindAll(this, 'render');

        this.model.bind('all', function(){
            $('#dump').empty().append( JSON.stringify(self.model.toJSON()) );
        });
        this.model.set({active:true}).set({active:undefined});
        this.model.bind('change:pos', function(){
            console.log('entity pos ' + JSON.stringify(arguments) );
        });
        // use a view especially to handle arrow rendering
        this.arrowView = new mover.view.Arrows({canvas:this.canvas, el:this.el});
    },
    
    make: function(tagName, attributes, content){
        var $result = $($('#tmpl_match').text()),
            $panel = $('.panel', $result),
            $canvas = $('canvas', $result);
        this.canvas = $canvas.get(0);
        this.ctx2d = this.canvas.getContext('2d');
        this.canvas.width = 600; this.canvas.style.width = this.canvas.width + 'px';
        this.canvas.height = 400; this.canvas.style.height = this.canvas.height + 'px';
        this.resized = false;
        return $result.get(0)
    },

    onResize: function(){
        var $canvas = this.$('canvas'), offset = $canvas.offset();
        this.canvas.oLeft = offset.left;
        this.canvas.oTop = offset.top;
        // can't properly resize until the canvas is in the document
        this.resized = $.contains(document.body, $canvas.get(0));
    },

    render: function(){
        var self = this, ctx = this.ctx2d, pos = null,dims=null;
        requestAnimationFrame( this.render );

        if( !this.resized )
            this.onResize();
        
        // clear the canvas
        ctx.fillStyle = 'rgb(245,245,245)';
        ctx.fillRect( 0, 0, this.canvas.width, this.canvas.height );

        ctx.fillStyle = 'rgb(255,0,0)';

        this.hitModel = null;

        // draw each of the entities
        this.model.entities.each( function(model){
            pos = model.get('pos'), dims = model.get('dims');
            ctx.strokeStyle = '#FFF';
            // determine whether the cursor is hitting this
            if( self.cursor && model.doesPointIntersect( self.cursor ) ){
                self.hitModel = model;
                ctx.strokeStyle = '#000';
            }

            // ctx
            ctx.fillStyle = model.get('colour');
            ctx.save();
            ctx.translate( (self.canvas.width/2)+pos[0], (self.canvas.height/2)+pos[1] );
            ctx.fillRect( -(dims[0]/2), -(dims[1]/2), dims[0],dims[1] );
            ctx.strokeRect( -(dims[0]/2), -(dims[1]/2), dims[0],dims[1] );
            ctx.restore();
        });

        return this;
    },

    onInteractMove: function(evt){
        var x = evt.pageX - this.canvas.oLeft, y = evt.pageY - this.canvas.oTop;
        
        // convert to world coordinates
        x -= this.canvas.width/2;
        y -= this.canvas.height/2;
        this.cursor = [ x, y ];
        $('.debug').text('position: ' + x + ',' + y );

        if( this.cursorDown && this.hitModel ){
            x += this.cursorDiff[0];
            y += this.cursorDiff[1];
            this.hitModel.set({pos:[x,y]});
        }
    },

    onInteractUp: function(evt){
        this.cursorDown = false;
        $('#dump').empty().append( JSON.stringify(this.model.toJSON()) );
    },

    onInteractDown: function(evt){
        if( this.hitModel ){
            var pos = this.hitModel.get('pos');
            this.cursorDown = true;
            this.cursorStart = _.clone( this.cursor );
            this.cursorDiff = [ pos[0] - this.cursor[0], pos[1] - this.cursor[1] ];
        }
    },
});


/**
*
*/
mover.view.Arrows = Backbone.View.extend({
    events:{
        'mousemove canvas'      : 'onInteractMove',
        'mouseup canvas'        : 'onInteractUp',
        'mousedown canvas'      : 'onInteractDown'
    },
    initialize: function(){
        this.canvas = this.options.canvas;
        this.arrows = new Backbone.Collection();
        _.bindAll(this);
    },
    onInteractMove: function(evt){
        var x = evt.pageX - this.canvas.oLeft, y = evt.pageY - this.canvas.oTop;
        if( this.arrow ){
            this.arrow.set({tar:[x,y]});
        }
    },

    onInteractUp: function(evt){
        var x = evt.pageX - this.canvas.oLeft, y = evt.pageY - this.canvas.oTop;
        // console.log('arrows up ' + x + ',' + y );

        // send an event
        this.trigger('finish', this.arrow);
        this.arrow = null;
    },
    onInteractDown: function(evt){
        var x = evt.pageX - this.canvas.oLeft, y = evt.pageY - this.canvas.oTop;
        // console.log('arrows down ' + x + ',' + y );

        // create a new arrow model and add it to the collection
        this.arrow = new mover.model.Entity({pos:[x,y],tar:[x,y]});
        this.arrows.add( this.arrow );
    },

    render: function(){
        return this;
    },
});

/**
*   Renders a indication of direction
*/
mover.view.Arrow = Backbone.View.extend({

    render: function( ctx ){
        return this;
    },
});

mover.World = Backbone.View.extend({
    
});