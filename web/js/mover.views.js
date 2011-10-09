
function Line(startX, startY, endX, endY, raphael) {
    var start = { x: startX, y: startY };
    var end = { x: endX, y: endY };
    var size = 10;
    var angle;

    var getHead = function() {
        angle = Math.atan2(start.x-end.x,end.y-start.y);
        angle = (angle / (2 * Math.PI)) * 360;
        return [ "M", -size, size, "L"+size, size, "L" + 0, -size, "L"+ (-size), size ].join(" ");
    };
    var getPath = function() {
        var body = [ "M" + start.x, start.y, "L" + end.x, end.y ].join(" ");
        return body;
    };
    var redraw = function() {
        head.attr("path", getHead()).transform("").translate(end.x,end.y).rotate((angle+180));
        node.attr("path", getPath());
    };
    var head = raphael.path( getHead() ).attr('fill','#000000').transform("").translate(end.x,end.y).rotate((angle+180));
    var node = raphael.path( getPath() );
    return {
        head: head,
        node: node,
        $node: $(node.node),
        updateStart: function(x, y) {
            start.x = x;
            start.y = y;
            redraw();
            return this;
        },
        updateEnd: function(x, y) {
            end.x = x;
            end.y = y;
            redraw();
            return this;
        },
        remove: function(){
            head.remove();
            node.remove();
        }
    };
}

mover.view.MatchSVG = Backbone.View.extend({
    events:{
        // 'mousemove canvas'      : 'onInteractMove',
        // 'mouseup canvas'        : 'onInteractUp',
        // 'mousedown canvas'      : 'onInteractDown'
        // 'mouseup svg'     : 'onSVGDown'
        // 'resize window'         : 'onResize'
    },

    width: 640,
    height: 480,

    entities:{},
    targetArrows:{},

    initialize: function(){
        var self = this;
        _.bindAll(this,'render','onResize', 'addEntity');
        
        this.arrows = new mover.model.Entities();

        this.model.bind('all', function(){
            // $('#dump').empty().append( JSON.stringify(self.model.toJSON(),null,2) );
        });
        this.model.set({active:true}).set({active:undefined});
        this.model.bind('change:pos', function(entity){
            // console.log('entity pos ' + JSON.stringify(arguments) );
            self.updateEntity( entity );
        });
        this.model.bind('change:ptar', function(entity){
            self.updateTargetArrow( entity );
        });
        this.model.bind('add', function(entity){
            self.addEntity(entity);
        });
        
        this.setEntities = this.paper.set();
        this.model.entities.each( this.addEntity );
        
        $(window).resize( self.onResize );
    },

    createLine: function( sx,sy, ex,ey ){
        var line = Line(sx, sy, ex, ey, this.paper);
        line.$node.addClass('arrow_line');
        line.$node.css('stroke-dasharray','10,10');
        line.node.attr('stroke-width',6);
        return line;
    },

    make: function(tagName, attributes, content){
        var self = this,
            pos = null, el = null, dims = null,
            $result = $($('#tmpl_match').text());
        
        // Creates canvas 320 x 200 at 10, 50
        // console.log( $result.get(0) );
        this.paper = Raphael( $result.get(0), this.width,this.height );
        this.paper.rect(0,0,this.width,this.height).attr('fill','#FFFFFF').mouseup(function(evt){
            // note - bindAll doesnt seem to work with mouseup
            if( !self.arrow )
                self.onSVGDown(evt);
        });

        this.onResize();
        return $result.get(0);
    },

    addEntity: function(model){
        var self = this,
            pos = model.get('pos'),
            dims = model.get('dims'),
            el = null;

        el = this.paper.rect( -(dims[0]/2), -(dims[1]/2), dims[0], dims[1] );
        el.translate( pos[0], pos[1] );
        // el = this.paper.rect(pos[0] - (dims[0]/2),pos[1] - (dims[1]/2),dims[0],dims[1]);
        el.attr("fill", model.get('colour'));
        el.node.model = model;

        // this.setEntities.push(el);

        // add a reference to the entity
        this.entities[ model.id ] = el;

        // el.transform("");
        el.translate( this.width/2,this.height/2 );
        el.drag( 
            self.onEntityMove, 
            self.onEntityStartMove, 
            self.onEntityEndMove, 
            this,this,this );

        self.updateTargetArrow( model );

        self.updateEntity( model );
        // mover.log('added entity at ' + JSON.stringify(pos) );
    },

    updateEntity: function(entity){
        var view = this.entities[ entity.id ],
            arrow = this.targetArrows[ entity.id ],
            pos = entity.get('pos');
            // dims = entity.get('dims');
        
        sx = pos[0] + (this.width/2);
        sy = pos[1] + (this.height/2);

        // var x = pos[0];// - (dims[0]/2);
        // x += (this.width/2);

        // var y = pos[1];// - (dims[1]/2);
        // y += (this.height/2);

        view.transform("");
        // console.log('update ent ' + x + ',' + y );
        view.translate(sx,sy);

        this.updateTargetArrow(entity);
        // if( arrow )
            // arrow.updateStart(x,y);
    },


    updateTargetArrow: function( entity ){
        // find the view for this entity
        var view = this.entities[ entity.id ],
            arrow = this.targetArrows[ entity.id ],
            pos = entity.get('pos'),
            tar = entity.get('ptar'),
            sx,sy,tx,ty;
        if( !view )
            return;
        if( !tar ){
            if( arrow ){
                arrow.node.remove();
                delete this.targetArrows[entity.id];
            }
            return;
        }
        
        sx = pos[0] + (this.width/2);
        sy = pos[1] + (this.height/2);
        tx = tar[0] + (this.width/2);
        ty = tar[1] + (this.height/2);

        // check if we already have a target arrow for this guy
        if( arrow ){
            // update the arrow
            arrow.updateStart( sx, sy );
            arrow.updateEnd( tx, ty );
            return;
        }

        // a new entry
        arrow = this.createLine( sx,sy, tx,ty );
        this.targetArrows[ entity.id ] = arrow;
    },


    onResize: function(){
        var $canvas = $( this.paper.canvas ), 
            offset = $canvas.parent().offset();
            $window = $(window);
        if( !offset ) 
            return;
        this.canvasOffset = [ offset.left - $window.scrollLeft(), offset.top - $window.scrollTop() ];
        // can't properly resize until the canvas is in the document
        this.resized = $.contains(document.body, $canvas.get(0));
        // console.log('resized: ' + JSON.stringify(this.canvasOffset) );
        // console.log('svg position: ' + JSON.stringify(position) );
    },

    // onSVGDown: function(evt){//evt){
    //     var x = evt.clientX,
    //         y = evt.clientY;
    //     this.onResize();
    //     x -= this.canvasOffset[0];// - this.width/2;
    //     y -= this.canvasOffset[1];// - this.height/2;
    //     x -= this.width/2;
    //     y -= this.height/2;
    //     var pos = [x,y];
    // },


    onEntityStartMove: function(x,y,evt){
        var $target = $(evt.target),
            model = $target.get(0).model,
            cx = evt.clientX,
            cy = evt.clientY;
        
        this.onResize();
        this.selectedEntity = model;
    },

    onEntityMove: function(dx,dy,x,y,evt){
        if( evt.touches && evt.touches.length > 0 ){
            evt = evt.touches[0];
        }
        x = evt.clientX;
        y = evt.clientY;
        x -= this.canvasOffset[0];
        y -= this.canvasOffset[1];

        var sx = x - (this.width/2),
            sy = y - (this.height/2);
        
        $('.debug_pos').text('position: ' + dx + ',' + dy + ' ' + sx + ',' + sy);
        // mover.log( JSON.stringify(evt) );// evt.pageX +","+ evt.pageY );
        // $('#dump').empty().append( evt );
        // console.log( evt );
        
        if( this.selectedEntity ){
            // this.selectedEntityTarget = [sx,sy];
            this.selectedEntity.set({ptar:[sx,sy]});
        }
    },

    
    onEntityEndMove: function(evt){

        if( this.selectedEntity ){
            var target = this.selectedEntity.get('ptar');
            this.selectedEntity.set({ tar:_.clone(target) });
            this.trigger('move', this.selectedEntity );
            this.selectedEntity = null;
            // this.arrow = null;
        }
    },

    render: function(){
        var self=this;

        if( !this.resized )
            this.onResize();
        // requestAnimationFrame( this.render );
        return this;
    }
        
});

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
        this.arrows = new mover.model.Entities();

        // this.model.bind('all', function(){
        //     // $('#dump').empty().append( JSON.stringify(self.model.toJSON(), null, 4) );
        //     $('#dump').empty().append("hello\nworld");
        // });

        this.model.set({active:true}).set({active:undefined});
        this.model.bind('change:pos', function(){
            console.log('entity pos ' + JSON.stringify(arguments) );
        });
        // use a view especially to handle arrow rendering
        this.arrowView = new mover.view.Arrows({canvas:this.canvas, el:this.el, collection:this.arrows});
    },
    
    make: function(tagName, attributes, content){
        var $result = $($('#tmpl_match').text()),
            $canvas = $('canvas', $result);
        this.canvas = $canvas.get(0);
        this.ctx2d = this.canvas.getContext('2d');
        this.canvas.width = this.width; this.canvas.style.width = this.canvas.width + 'px';
        this.canvas.height = this.height; this.canvas.style.height = this.canvas.height + 'px';
        // this.resized = false;
        return $result.get(0);
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
        this.hitEntity = null;

        // draw each of the entities
        this.model.entities.each( function(model){
            pos = model.get('pos'); dims = model.get('dims');
            ctx.strokeStyle = '#FFF';
            // determine whether the cursor is hitting this
            if( self.cursor && model.doesPointIntersect( self.cursor ) ){
                self.hitEntity = model;
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
        if( this.hitEntity )
            $('.debug_pos').text('position: ' + x + ',' + y + ' entity: ' + this.hitEntity.id);
        else
            $('.debug_pos').text('position: ' + x + ',' + y );

        if( this.cursorDown && this.arrow ){
            this.arrow.set({tar:[x,y]});
        }
    },

    onInteractUp: function(evt){
        this.cursorDown = false;
        if( this.arrow && this.selectedEntity ){
            this.trigger('move', this.arrow, this.selectedEntity );
            this.selectedEntity = null;
        }
        
        this.arrow = null;
        // $('#dump').empty().append( JSON.stringify(this.model.toJSON(),null,4) );
    },

    onInteractDown: function(evt){
        if( this.hitEntity ){
            var pos = this.hitEntity.get('pos');
            this.cursorDown = true;
            this.cursorStart = _.clone( this.cursor );
            this.cursorDiff = [ pos[0] - this.cursor[0], pos[1] - this.cursor[1] ];
            // create a new arrow
            this.arrow = new mover.model.Entity({pos:_.clone(pos),tar:_.clone(this.cursor)});
            this.arrows.add( this.arrow );
            this.selectedEntity = this.hitEntity;
        }
    }
});


/**
*
*/
mover.view.Arrows = Backbone.View.extend({
    initialize: function(){
        this.canvas = this.options.canvas;
        this.ctx = this.canvas.getContext('2d');
        this.imgArrow = $('#img_arrow').get(0);
    },

    render: function(){
        var self = this, ctx = this.ctx,
            img = this.imgArrow, pos = [0,0], tar = null,
            size = 24,
            distance = 0,
            arrowSize = 16,
            arrowInc = 20,
            tailHeight = 10,
            posinc = 8, inc = 0, steps = 0,
            shift =  -(arrowSize/2),
            wx = (self.canvas.width/2), wy = (self.canvas.height/2),
            toRad = Math.PI/180;

        this.collection.each( function(arrow){
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

            for( i=steps;--i>=1; ){
                ctx.drawImage( img, 0, 110, 128, 18, shift, 5+inc*i, arrowSize, tailHeight );
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