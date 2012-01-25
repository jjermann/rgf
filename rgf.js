/*  Stream 
    ------
    Responsible for initializing Popcorn and getting the html body for the corresponding
    audio/video/control gui
*/
function Stream(stream_id,sources,media_type,width,height,duration) {
    // stream id of the div/video element to be created
    this.id=stream_id;
    // Popcorn instance
    this.player;
    // none (no media), audio/video (audio video file/address), youtube, vimeo
    this.media_type=media_type;
    // Array of sources, only 1 entry for "youtube", "vimeo", irrelevant for "none"
    this.source=sources;
    // Media properties: width, height, duration
    this.width=width;
    this.height=height;
    this.duration=duration; //TODO
    
    // Calculate the necessery video window id entries for the HTML body
    this.window;
    if (this.media_type=="none") {
        this.window=document.createElement("div");
        this.window.id=this.id;
    } else if (this.media_type=="audio") {
        this.window=document.createElement("audio");
        this.window.id=this.id;
        this.window.width=this.width;
        this.window.height=this.height;
        this.window.controls="yes";
        for (var i=0; i<this.source.length; i++) {
            var src=document.createElement("source");
            src.src=this.source[i];
            this.window.appendChild(src);
        }
    } else if (this.media_type=="video") {
        this.window=document.createElement("video");
        this.window.id=this.id;
        this.window.width=this.width;
        this.window.height=this.height;
        this.window.controls="yes";
        for (var i=0; i<this.source.length; i++) {
            var src=document.createElement("source");
            src.src=this.source[i];
            this.window.appendChild(src);
        }
    } else if (this.media_type=="youtube") {
        this.window=document.createElement("div");
        this.window.id=this.id;
        this.window.style.width=this.width+"px";
        this.window.style.height=this.height+"px";
    } else if (this.media_type=="vimeo") {
        this.window=document.createElement("div");
        this.window.id=this.id;
        this.window.style.width=this.width+"px";
        this.window.style.height=this.height+"px";
    } else { alert("illegal type: "+this.media_type); }

    // TODO: Ideally we deactivate the native controls in all cases
    // and write our own "uniform" Kaya.gs "styled" controls...
    // The controls could/should e.g. be drawn underneath the board since they are mainly used
    // to navigate the "board situation", not the video/audio/nothing stream...
    this.controls='';
}

// create a Popcorn instance, this needs the corresponding id (this.window) in the document first...
Stream.prototype.initPlayer=function() {
    if (this.media_type=="none") {
        Popcorn.player("baseplayer");
        this.player=Popcorn.baseplayer("#"+this.id);
    } else if (this.media_type=="audio") {
        this.player=Popcorn("#"+this.id);
    } else if (this.media_type=="video") {
        this.player=Popcorn("#"+this.id);
    } else if (this.media_type=="youtube") {
        this.player=Popcorn.youtube("#"+this.id,this.source[0]);
    } else if (this.media_type=="vimeo") {
        this.player=Popcorn.vimeo("#"+this.id,this.source[0]);
    } else { alert("illegal type: "+this.media_type); }
    return this.player;
}    

/*  Go board internals/etc (should already exist)
    Has no "time" information (unsure?).
    Maybe also responsible for the drawing of the go board and/or variations (no idea)
*/
function BoardWidget() {
    this.gametree;
};
BoardWidget.prototype.apply=function(data) {
    //testing...
    var txt=document.getElementById("output")
    txt.innerHTML=data.property+"["+data.arg+"]\n";
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
    this.stream;
    this.board_widget=new BoardWidget();
    // gametree will not change unless we are recording!
    // we assume it has already been loaded...
    this.gametree;
    this.current_time;
    // additional data... (atm used for "testing")
    this.data;
    this._action_list_future=[];
    
    this.loadRGF();
};

// create this.gametree
// also create _action_list_future/whatever else we use in the process...
DisplayStreamWidget.prototype.loadRGF=function() {
    this._action_list_future.push(new Action(0,"W","aa",""));
    this._action_list_future.push(new Action(10,"B","ee",""));
    this._action_list_future.push(new Action(20,"W","ab",""));
}

DisplayStreamWidget.prototype.loadStream = function(stream_id,sources,media_type,width,height,duration) {
    var self=this;
    this.stream=new Stream(stream_id,sources,media_type,width,height,duration);
    document.body.appendChild(this.stream.window);
    this.stream.initPlayer();
    this.current_time=this.stream.player.currentTime();
    this.stream.player.listen("timeupdate", function() {
        self.update(this.currentTime());
    });
};

DisplayStreamWidget.prototype.update = function(time) {
    document.getElementById("time").innerHTML=time;
    if (time>=this.current_time) {
        this.advance(time-this.current_time);
        this.current_time=time;
    } else {
        /* somehow get to the previous time, see rgf.txt e.g... */
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
};
