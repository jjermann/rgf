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
    if (data.time!=null) $('div#'+this.board_id).append("TS["+data.time+"]").show();
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
    this.gui;
    // TODO(?): maybe we want to have the possibility to specify a delay...
    // For now we assume time starts at 0 (or at least >0)...
    this.time=0;
    this._next_time=0;
    // this is equal to the time of the last entry in the action list which is assumed to always grow
    this.duration=0;
    // true if the media stream is ahead of the game stream (and the game stream has not ended)...
    this.waiting=false;
    this.ended=false;
    this._action_list=[];
};

// also create _action_list/whatever else we use in the process...
DisplayStreamWidget.prototype.loadRGF=function(actions) {
    for(var i=0;i<actions.length;i++){
        var action = actions[i];
        this._action_list.push(new Action(action.time, action.property, action.arg, action.position));
    }
    if (this._action_list.length) this.duration=this._action_list[this._action_list.length-1].time;
}

DisplayStreamWidget.prototype.loadStream = function(sources,media_type,width,height,duration) {
    // Set up the basic widgets
    this.board=new BoardWidget(this.id+"_board");
    this.stream=new Stream(this.id+"_stream",sources,media_type,width,height,duration);
    this.gui=new Interface(this.id+"_interface0");
    
    // Set up the placement in the body/some container
    document.body.appendChild(this.board.board_element);
    document.body.appendChild(this.stream.media_element);
    document.body.appendChild(this.gui.interface_element);

    // Initialize the Stream and its interface(s)
    this.stream.initPlayer();
    this.gui.initInterface(this.stream);
    this.stream.addInterface(this.updatedStatus.bind(this),this.updatedTime.bind(this));
    
    // Initialize the the starting Board position
    this.update(0);
};

DisplayStreamWidget.prototype.updatedStatus = function() {
    // TODO...
};

DisplayStreamWidget.prototype.updatedTime = function() {
    this._next_time=this.stream.status.currentTime;
    // we only update the internal (this.time) clock if we still
    // have actions to process resp. if the "action stream" is
    // ahead of the "media stream"
    if (this._next_time<=this.duration) {
        if (this.waiting) {
            this.waiting=false;
        }
        this.update(this._next_time);
    } else if (this.ended) {
        this.update(this._next_time);
    } else {
        this._next_time=this.duration;
        this.update(this._next_time);
        // we should tell the stream to react appropriately, e.g. pause?
        // it should furthermore give some hint to the user and continue playing
        // once it caught up...
        // otherwise the "media stream" and "game stream" get out of sync...
        if (!this.waiting && !this.ended) {
            this.waiting=true;
            // this.stream.player.pause();
        }
    }
};

DisplayStreamWidget.prototype.update = function(time) {
    if (time>=this.time) {
        this._advance(time-this.time);
        this.time=time;
    } else {
        /* somehow get to the previous time, see RGF.txt e.g... */
        this.time=time;
    }
};

DisplayStreamWidget.prototype._advance = function(time_step) {
    /* applies all actions from this.time up to this.time+time_step.
       If property=="VT" and arg=="ENDED" we act accordingly...  */
    while (this._action_list.length>0 && this._action_list[0].time<=this.time+time_step) {
        if (this._action_list[0].property=="VT" && this._action_list[0].arg=="ENDED") {
            this.ended=true;
        }
        // we might as well send the VT[ENDED] to the BoardWidget...
        this.board.apply(this._action_list.shift());
    }
};
