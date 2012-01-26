/*  This Javascript file contains all Go specific parts/classes... */

function BoardWidget(board_id) {
/*  Go board internals/etc (should already exist)
    Has no information about time...
    Maybe also responsible for the drawing of the go board and/or variations (no idea)
*/
    this.board_id=board_id;
    this.sgftree;
    // for drawing (?)
    this.board_element=this._initBoardElement(this.board_id);
};
BoardWidget.prototype._initBoardElement=function(id) {
    // only for testing at the moment
    var el=document.createElement("div");
    el.id=id;
    return el;
};
BoardWidget.prototype.apply=function(data) {
    // for testing...
    $('div#'+this.board_id).append(data.property+"["+data.arg+"]").show();
};

/*  A single modification on the go board. Depends on the actual implementation... */
function Action(time,property,arg,position) {
    this.time=time;
    /* the following two arguments (property/position) could e.g. also be queryied in
       the RGF game tree, so maybe position alone is enough... */
    this.property=property;
    this.arg=arg;
    this.position=position;
};

/*  DisplayStreamWidget (not sure about the design!)
    -------------------
    Responsible to initialize a "Stream" and to synchronize with the current board drawing...
    Responsible for putting the actual html body...
    (already exists?)
*/
function DisplayStreamWidget(base_id) {
    /*
        id=base_id   = ID
        media_id     = ID_media
        interface_id = ID_interface
        board_id     = ID_board
    */
    this.id=base_id;
    this.board;
    this.stream;
    // gametree will not change unless we are recording!
    // we assume it has already been loaded...
    this.rgftree;
    this.current_time;
    this.duration;
    this._action_list_future=[];
};

// create this.gametree
// also create _action_list_future/whatever else we use in the process...
DisplayStreamWidget.prototype.loadRGF=function(actions) {
    for(var i=0;i<actions.length;i++){
        var action = actions[i];
        this._action_list_future.push(new Action(action.time, action.property, action.arg, action.position));
    }
}

DisplayStreamWidget.prototype.loadStream = function(sources,media_type,width,height,duration) {
    var self=this;

    this.board=new BoardWidget(this.id+"_board");
    this.stream=new Stream(this.id,sources,media_type,width,height,duration);
    
    // no "nice" placements yet
    document.body.appendChild(this.board.board_element);
    document.body.appendChild(this.stream.media_element);
    document.body.appendChild(this.stream.interface_element);

    this.stream.initPlayer();

    this.stream.player.listen("loadedmetadata", function() {
        self.current_time=this.stream.player.currentTime();
        self.duration=this.stream.player.duration();
    });
    this.stream.player.listen("timeupdate", function() {
        self.update(this.currentTime());
    });
    this.stream.player.listen("durationchange", function() {
        self.duration=this.duration();
    });
};

DisplayStreamWidget.prototype.update = function(time) {
    if (time>=this.current_time) {
        this._advance(time-this.current_time);
        this.current_time=time;
    } else {
        /* somehow get to the previous time, see RGF.txt e.g... */
        this.current_time=time;
    }
};

DisplayStreamWidget.prototype._advance = function(time_step) {
    /* check data resp. gametree/whatever to find out what (if anything) happens
       from current_time up to current_time+time_step and return the corresponding
       "actions" as a (chronologically sorted) array to be passed on to the
       go board widget... */
    while (this._action_list_future.length>0 && this._action_list_future[0].time<=this.current_time+time_step) {
        this.board.apply(this._action_list_future.shift());
    }
    /* Should return data to allow undo/jump back, see e.g. RGF.txt */
};
