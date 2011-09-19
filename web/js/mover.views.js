

mover.view.Match = Backbone.View.extend({
    events:{
        'mousemove canvas'      : 'onInteractMove',
        'mouseup canvas'        : 'onInteractUp',
        'mousedown canvas'      : 'onInteractDown'
    },

    width: 600,
    height: 400,

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
        this.arrowView.bind('finish', function(arrow){
            console.log('arrow added ' + JSON.stringify(arrow) );
        });
    },
    
    make: function(tagName, attributes, content){
        var $result = $($('#tmpl_match').text()),
            $canvas = $('canvas', $result);
        this.canvas = $canvas.get(0);
        this.ctx2d = this.canvas.getContext('2d');
        this.canvas.width = this.width; this.canvas.style.width = this.canvas.width + 'px';
        this.canvas.height = this.height; this.canvas.style.height = this.canvas.height + 'px';
        // this.resized = false;
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
            ctx.fillStyle = model.get('colour');
            ctx.save();
            ctx.translate( (self.canvas.width/2)+pos[0], (self.canvas.height/2)+pos[1] );
            ctx.fillRect( -(dims[0]/2), -(dims[1]/2), dims[0],dims[1] );
            ctx.strokeRect( -(dims[0]/2), -(dims[1]/2), dims[0],dims[1] );
            ctx.restore();
        });

        this.arrowView.render();
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
        this.ctx = this.canvas.getContext('2d');
        this.arrows = new mover.model.Entities();
        // this.arrows.add( {id:'testArrow', pos:[-50,-50],tar:[50,50]} );

        this.imgArrow = $('#img_arrow').get(0);
        // var arrowimg = $('#arrowimg').get(0);
        console.log( this.arrows );
    },

    onInteractMove: function(evt){
        var x = evt.pageX - this.canvas.oLeft, y = evt.pageY - this.canvas.oTop;
        // convert to world coordinates
        x -= this.canvas.width/2;
        y -= this.canvas.height/2;
        this.cursor = [ x, y ];

        if( this.arrow ){
            this.arrow.set({tar:[x,y]});
            // console.log( this.arrow.toString() );
        }
    },

    onInteractUp: function(evt){
        // send an event
        this.trigger('finish', this.arrow);
        this.arrow = null;
    },

    onInteractDown: function(evt){
        // create a new arrow model and add it to the collection
        this.arrow = new mover.model.Entity({pos:_.clone(this.cursor),tar:_.clone(this.cursor)});
        this.arrows.add( this.arrow );
    },

    render: function(){
        var self = this, ctx = this.ctx,
            img = this.imgArrow, pos = [0,0], tar = null,
            size = 24,
            distance = 0,
            arrowSize = 16,
            arrowInc = 10,
            tailHeight = 5,
            posinc = 8, inc = 0, steps = 0,
            shift =  -(arrowSize/2),
            wx = (self.canvas.width/2), wy = (self.canvas.height/2),
            toRad = Math.PI/180;

        this.arrows.each( function(arrow){
            pos = arrow.get('pos');
            tar = arrow.get('tar');
            distance = arrow.length();
            inc = arrowInc;
            steps = (distance/inc)>>0;

            // $('#arrow_debug').text( arrow.toString() + ' distance: ' + distance);
            if( distance <= 10)
                return;

            ctx.save();
            // translate into world coords
            ctx.translate( wx + tar[0], wy + tar[1] );

            ctx.rotate( arrow.get('ang') );

            ctx.drawImage( img, shift, 0, arrowSize, arrowSize );

            for( i=steps;--i>=2; ){
                ctx.drawImage( img, 0, 110, 128, 18, shift, inc*i, arrowSize, tailHeight );
            }
            
            ctx.restore();
            ctx.restore();
            // console.log('draw arrow ' + arrow );
        });
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