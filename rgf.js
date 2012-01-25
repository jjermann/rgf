/*  Stream 
    ------
    Responsible for initializing Popcorn and getting the html body for the corresponding
    audio/video/control gui
*/
function Stream(stream_id,sources,media_type,width,height,duration) {
    // stream id of the div/video element to be created
    this.id=stream_id;
    // none (no media), audio/video (audio video file/address), youtube, vimeo
    this.media_type=media_type;
    // Array of sources, only 1 entry for "youtube", "vimeo", irrelevant for "none"
    this.source=sources;
    // Media properties: width, height, duration
    this.width=width;
    this.height=height;
    this.duration=duration; //TODO: for artificially setting duration
    
    this.media_element=this.initMediaElement();

    // TODO: Ideally we deactivate the native controls in all cases
    // and write our own "uniform" Kaya.gs "styled" controls...
    // The controls could/should e.g. be drawn underneath the board since they are mainly used
    // to navigate the "board situation", not the video/audio/nothing stream...
    this.interface_element=this.initInterfaceElement();

    // Popcorn instance
    this.player;
}

Stream.prototype._convertTime = function(s) {
    var myTime = new Date(s * 1000);
    var hour = myTime.getUTCHours();
    var min = myTime.getUTCMinutes();
    var sec = myTime.getUTCSeconds();
    var strHour = (hour < 10) ? "0" + hour : hour;
    var strMin = (min < 10) ? "0" + min : min;
    var strSec = (sec < 10) ? "0" + sec : sec;
    return strHour + ":" + strMin + ":" + strSec;
};


Stream.prototype.initMediaElement=function() {
    var el=document.createDocumentFragment();
    if (this.media_type=="none") {
        el=document.createElement("div");
        el.id=this.id;
    } else if (this.media_type=="audio") {
        el=document.createElement("audio");
        el.id=this.id;
        el.width=this.width;
        el.height=this.height;
        for (var i=0; i<this.source.length; i++) {
            var src=document.createElement("source");
            src.src=this.source[i];
            el.appendChild(src);
        }
    } else if (this.media_type=="video") {
        el=document.createElement("video");
        el.id=this.id;
        el.width=this.width;
        el.height=this.height;
        for (var i=0; i<this.source.length; i++) {
            var src=document.createElement("source");
            src.src=this.source[i];
            el.appendChild(src);
        }
    } else if (this.media_type=="youtube") {
        el=document.createElement("div");
        el.id=this.id;
//        el.style.width=this.width+"px";
//        el.style.height=this.height+"px";
    } else if (this.media_type=="vimeo") {
        el=document.createElement("div");
        el.id=this.id;
//        el.style.width=this.width+"px";
//        el.style.height=this.height+"px";
    } else { alert("illegal type: "+this.media_type); }
    return el;
};

Stream.prototype.initInterfaceElement=function() {
    var el, container, singletype, gui, lvl1, lvl2, lvl3;
    /* jp-controls */
    el=document.createElement("div");
    el.className="jp-jplayer";
      container=document.createElement("div");
      container.className="jp-audio";
        singletype=document.createElement("div");
        singletype.className="jp-type-single";
          gui=document.createElement("div");
          gui.className="jp-gui jp-interface";
            lvl1=document.createElement("ul");
            lvl1.className="jp-controls";
              lvl2=document.createElement("li");
              lvl2.innerHTML='<a href="javascript:;" class="jp-play">play';
              lvl1.appendChild(lvl2);

              lvl2=document.createElement("li");
              lvl2.innerHTML='<a href="javascript:;" class="jp-pause">pause</a>';
              lvl1.appendChild(lvl2);

              lvl2=document.createElement("li");
              lvl2.innerHTML='<a href="javascript:;" class="jp-stop">stop</a>';
              lvl1.appendChild(lvl2);

              lvl2=document.createElement("li");
              lvl2.innerHTML='<a href="javascript:;" class="jp-mute" title="mute">mute</a>';
              lvl1.appendChild(lvl2);

              lvl2=document.createElement("li");
              lvl2.innerHTML='<a href="javascript:;" class="jp-unmute" title="unmute">unmute</a>';
              lvl1.appendChild(lvl2);
/*
              lvl2=document.createElement("li");
              lvl2.innerHTML='<a href="javascript:;" class="jp-volume-max" title="max volume">max volume</a>';
              lvl1.appendChild(lvl2);
*/
          gui.appendChild(lvl1);
            lvl1=document.createElement("div");
            lvl1.className="jp-progress";
              lvl2=document.createElement("div");
              lvl2.className="jp-seek-bar";
                lvl3=document.createElement("div");
                lvl3.className="jp-play-bar";
                lvl2.appendChild(lvl3);
              lvl1.appendChild(lvl2);
            gui.appendChild(lvl1);

            lvl1=document.createElement("div");
            lvl1.className="jp-volume-bar";
              lvl2=document.createElement("div");
              lvl2.className="jp-volume-bar-value";
              lvl1.appendChild(lvl2);
            gui.appendChild(lvl1);

            lvl1=document.createElement("div");
            lvl1.className="jp-time-holder";
              lvl2=document.createElement("div");
              lvl2.className="jp-current-time";
              lvl1.appendChild(lvl2);

              lvl2=document.createElement("div");
              lvl2.className="jp-duration";
              lvl1.appendChild(lvl2);
            gui.appendChild(lvl1);
          singletype.appendChild(gui);
        container.appendChild(singletype);
      el.appendChild(container);

    return el;
};

// create a Popcorn instance, this needs the corresponding id (this.media_element) in the document first...
Stream.prototype.initPlayer=function() {
    var self=this;
    var pl;
    if (this.media_type=="none") {
        Popcorn.player("baseplayer");
        pl=Popcorn.baseplayer("#"+this.id);
    } else if (this.media_type=="audio") {
        pl=Popcorn("#"+this.id);
    } else if (this.media_type=="video") {
        pl=Popcorn("#"+this.id);
    } else if (this.media_type=="youtube") {
        pl=Popcorn.youtube("#"+this.id,this.source[0]);
    } else if (this.media_type=="vimeo") {
        pl=Popcorn.vimeo("#"+this.id,this.source[0]);
    } else { alert("illegal type: "+this.media_type); }
    pl.controls(false);

    /* set initial state */
    $('.jp-pause').hide();
    $('.jp-unmute').hide();


    /* set eventHandlers */
    $('.jp-play').click(function() {
        $('.jp-play').hide();
        $('.jp-pause').show();
        pl.play();
    });
    $('.jp-pause').click(function() {
        $('.jp-play').show();
        $('.jp-pause').hide();
        pl.pause();
    });
    $('.jp-stop').click(function() {
        $('.jp-play').show();
        $('.jp-pause').hide();
        pl.pause();
        pl.currentTime(0);
    });
    $('.jp-mute').click(function() {
        $('.jp-mute').hide();
        $('.jp-unmute').show();
        pl.mute();
    });
    $('.jp-unmute').click(function() {
        $('.jp-mute').show();
        $('.jp-unmute').hide();
        pl.unmute();
    });
// (?)    $('.jp-volume-max').click(function() { /* TODO */ });
    $('.jp-progress').click(function(e) { /* TODO */ });
    $('.jp-seek-bar').click(function(e) { /* TODO */ });
    $('.jp-play-bar').click(function(e) { /* TODO */ });
    $('.jp-volume-bar').click(function(e) { /* TODO */ });
    $('.jp-volume-bar-value').click(function(e) { /* TODO */ });
//    $('.jp-time-holder').click(function() { });
//    $('.jp-current-time').click(function() { });
//    $('.jp-duration').click(function() { });


    pl.listen("loadedmetadata", function() {
        $('.jp-current-time').text(self._convertTime(this.currentTime()));
        $('.jp-duration').text(self._convertTime(this.duration()));
    });
    pl.listen("ended", function() {
        $('.jp-play').show();
        $('.jp-pause').hide();
        pl.pause();
        pl.currentTime(0);
        pl.trigger("timeupdate");
    });
    pl.listen("timeupdate", function() {
        $('.jp-current-time').text(self._convertTime(this.currentTime()));
    });
    pl.listen("durationchange", function() {
        $('.jp-duration').text(self._convertTime(this.duration()));
    });

    return pl;
};






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
    $('.output').text("Added "+data.property+"["+data.arg+"] with time argument "+data.time);
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
    
};

// create this.gametree
// also create _action_list_future/whatever else we use in the process...
//Conanbatt: i removed code here. All "use" of this code should be in a different file, lets keep the core clean.
DisplayStreamWidget.prototype.loadRGF=function(actions) {
    for(var i=0;i<actions.length;i++){
        var action = actions[i];
        this._action_list_future.push(new Action(action.time, action.property, action.arg, action.position));
    }
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
