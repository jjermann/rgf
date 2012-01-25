/*  Involves Go game logic.... */

/*  Go board internals/etc (should already exist)
    Has no "time" information (unsure?).
    Maybe also responsible for the drawing of the go board and/or variations (no idea)
*/
function BoardWidget() {
    this.gametree;
};
BoardWidget.prototype.apply=function(data) {
    //testing...
    $('.output').append(data.property+"["+data.arg+"]").show();;
};

/*  Internal storage of an RGF gametree, basically exactly the same as for sgf.
    Probably also used in BoardWidget()... */
function GameTree() { };

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
function DisplayStreamWidget() {
    this.board_widget=new BoardWidget();
    this.stream;
    // gametree will not change unless we are recording!
    // we assume it has already been loaded...
    this.gametree;
    this.current_time;
    this.duration;
    // additional data... (atm used for "testing")
    this.data;
    this._action_list_future=[];
    
    this.loadRGF();
};

// create this.gametree
// also create _action_list_future/whatever else we use in the process...
DisplayStreamWidget.prototype.loadRGF=function() {
    this._action_list_future.push(new Action(0,";GS","http://www.youtube.com/embed/Z6zZbkDmvks",""));
    this._action_list_future.push(new Action(13,";B","wh",""));
    this._action_list_future.push(new Action(16,";W","cq",""));
    this._action_list_future.push(new Action(18,";B","bi",""));
    this._action_list_future.push(new Action(21,";W","cc",""));
    this._action_list_future.push(new Action(12,";B","ep",""));
    this._action_list_future.push(new Action(14,";W","bo",""));
    this._action_list_future.push(new Action(30,";B","cr",""));
}

DisplayStreamWidget.prototype.loadStream = function(stream_id,sources,media_type,width,height,duration) {
    var self=this;

    // for testing 
    var el=document.createElement("div");
    el.className="output";

    this.stream=new Stream(stream_id,sources,media_type,width,height,duration);
    document.body.appendChild(el);
    document.body.appendChild(this.stream.media_element);
    document.body.appendChild(this.stream.interface_element);

    this.stream.player=this.stream.initPlayer();

    this.stream.player.listen("loadedmetadata", function() {
        self.current_time=this.stream.player.currentTime();
        self.duration=this.stream.player.duration();
    });
    //pl.listen("ended", function() { });
    this.stream.player.listen("timeupdate", function() {
        self.update(this.currentTime());
    });
    this.stream.player.listen("durationchange", function() {
        self.duration=this.duration();
    });
};

DisplayStreamWidget.prototype.update = function(time) {
    // for testing
//    document.getElementById(this.stream.id+"_time").innerHTML=time;
//    $('.jp-current-time').text(time);
    
    if (time>=this.current_time) {
        this.advance(time-this.current_time);
        this.current_time=time;
    } else {
        /* somehow get to the previous time, see RGF.txt e.g... */
        this.current_time=time;
    }
};

DisplayStreamWidget.prototype.advance = function(time_step) {
    /* check data resp. gametree/whatever to find out what (if anything) happens
       from current_time up to current_time+time_step and return the corresponding
       "actions" as a (chronologically sorted) array to be passed on to the
       go board widget... */
    while (this._action_list_future.length>0 && this._action_list_future[0].time<=this.current_time+time_step) {
        this.board_widget.apply(this._action_list_future.shift());
    }
    /* Should return data to allow undo/jump back, see e.g. RGF.txt */
};
