/*  Stream 
    ------
    Responsible for initializing Popcorn and getting the html body for the corresponding
    audio/video/control gui
*/
function Stream(media_id,sources,media_type,width,height,manual_duration) {
    this.media_id=media_id;
    // none (no media), audio/video (audio video file/address), youtube, vimeo
    this.media_type=media_type;
    // Array of sources, only 1 entry for "youtube", "vimeo", irrelevant for "none"
    this.source=sources;
    // Media properties: width, height, duration
    this.width=width;
    this.height=height;

    this.status={
        set_duration: (manual_duration>0),
        // options for updatedTime()
        currentTime: 0,
        seekPercent: 0,
        currentPercentRelative: 0,
        currentPercentAbsolute: 0,
        duration: (manual_duration>0) ? manual_duration : 0,
        // options for updatedStatus()
        paused: true,
        muted: false,
        volume: 0,
        playbackRate: 1,
        ended: false,
        ready: false
    };

    this.media_element=this._initMediaElement(this.media_id);

    // Popcorn instance
    this.player;
    // associated interfaces that need to be updated
    this.interfaces=[];
}

Stream.prototype.addInterface=function(new_interface) { this.interfaces.push(new_interface); };

// a useful function to have in any case (so it is left in Stream class)
Stream.prototype.convertTime = function(s) {
    var myTime = new Date(s * 1000);
    var hour = myTime.getUTCHours();
    var min = myTime.getUTCMinutes();
    var sec = myTime.getUTCSeconds();
    var strHour = (hour < 10) ? "0" + hour : hour;
    var strMin = (min < 10) ? "0" + min : min;
    var strSec = (sec < 10) ? "0" + sec : sec;
    return strHour + ":" + strMin + ":" + strSec;
};

// to simplify selecting interface elements...
//Stream.prototype.sel=function(s) { return $('div#'+this.interface_id+' .'+s); };

Stream.prototype._initMediaElement=function(id) {
    var el, container;
    //el=document.createElement("div");
    //el.id=id;
      if (this.media_type=="none") {
          container=document.createElement("div");
      } else if (this.media_type=="audio") {
          container=document.createElement("audio");
          container.width=this.width;
          container.height=this.height;
          for (var i=0; i<this.source.length; i++) {
              var src=document.createElement("source");
              src.src=this.source[i];
              container.appendChild(src);
          }
      } else if (this.media_type=="video") {
          container=document.createElement("video");
          container.width=this.width;
          container.height=this.height;
          for (var i=0; i<this.source.length; i++) {
              var src=document.createElement("source");
              src.src=this.source[i];
              container.appendChild(src);
          }
      } else if (this.media_type=="youtube") {
          container=document.createElement("div");
          if (this.width!=null) container.style.width=this.width+"px";
          if (this.height!=null) container.style.height=this.height+"px";
      } else if (this.media_type=="vimeo") {
          container=document.createElement("div");
          if (this.width!=null) container.style.width=this.width+"px";
          if (this.width!=null) container.style.height=this.height+"px";
      } else { alert("illegal type: "+this.media_type); }
      container.id=id;
      //container.className="jp-jplayer";
    //el.appendChild(container);

    return container;
};

// create a Popcorn instance, this needs the corresponding id (this.media_element) in the document first...
Stream.prototype.initPlayer=function() {
    var pl;
    var self=this;
    
    if (this.media_type=="none") {
        Popcorn.player("baseplayer");
        pl=Popcorn.baseplayer("#"+this.media_id);
    } else if (this.media_type=="audio") {
        pl=Popcorn("#"+this.media_id);
    } else if (this.media_type=="video") {
        pl=Popcorn("#"+this.media_id);
    } else if (this.media_type=="youtube") {
        pl=Popcorn.youtube("#"+this.media_id,this.source[0]);
    } else if (this.media_type=="vimeo") {
        pl=Popcorn.vimeo("#"+this.media_id,this.source[0]);
    } else { alert("illegal type: "+this.media_type); }

//this.date=new Date();
//this.date_zero=this.date.getTime();
//console.log(self.media_id+": instanced, t="+(self.date.getTime()-self.date_zero));
    this.player=pl;
    this.player.controls(false);

    // initial setup
    this.interfaces.forEach(function(inter) { inter.updatedStatus(); inter.updatedTime(); });

//    this.player.listen("loadedmetadata", function() {
//        self.status.ready=true;
//        self._updateInterface();
//    });
    this.player.listen("play", function() {
        if (self.status.ready && self.status.ended) {
            self.status.ended=false;
            self.player.currentTime(0);
            self.interfaces.forEach(function(inter) { inter.updatedTime(); });
        }
        self.status.paused=false;
        self.interfaces.forEach(function(inter) { inter.updatedStatus(); });
    });
    this.player.listen("pause", function() {
        self.status.paused=true;
        self.interfaces.forEach(function(inter) { inter.updatedStatus(); });
    });
// All of this is already done in "pause"...
//    this.player.listen("stop", function() {
//        self.status.paused=true;
//        self.interfaces.forEach(function(inter) { inter.updatedStatus(); });
//    });
    this.player.listen("ended", function() {
        self.status.ended=true;
        self.player.pause();
        // self.player.currentTime(0);
    });
    this.player.listen("canplay", function() {
        self.status.ready=true;
        self.status.currentTime=this.currentTime();
        if (!self.status.set_duration) self.status.duration=this.duration();
        self.interfaces.forEach(function(inter) { inter.updatedStatus(); inter.updatedTime(); });
    });
/*  Not needed since we handle it in DisplayStreamWidget...

    this.player.listen("timeupdate", function() {
        if (self.status.ready) {
            self.timeupdate(this.currentTime());
        } else { self._updateInterface(); }
    });
*/
    this.player.listen("durationchange", function() {
        if (self.status.ready) {
            if (!self.status.set_duration) self.status.duration=this.duration();
            if (self.status.currentTime<self.status.duration) {
                self.status.ended=false;
                // TODO...
            } else {
                // TODO...
            }
        }
        self.interfaces.forEach(function(inter) { inter.updatedTime(); });
    });
    this.player.listen("volumechange", function() {
        self.status.muted=this.muted();
        self.status.volume=this.volume();
        self.interfaces.forEach(function(inter) { inter.updatedStatus(); });
    });

    if (this.media_type=="none") {
        self.player.trigger("canplay");
    }
    
    if (this.media_type=="youtube" || this.media_type=="vimeo") {
        this.player.listen("canplaythrough", function() {
            self.player.trigger("canplay");
        });
    }
    
//var events=["abort","canplay","canplaythrough","durationchange","canshowcurrentframe","dataunavailable","emptied","empty","ended","error","loadeddata","loadedmetadata","loadstart","mozaudioavailable","pause","play","playing","progress","ratechange","seeked","seeking","suspend","volumechange","waiting"];
//events.forEach(function(e) {
//    self.player.listen(e, function() { console.log(self.media_id+": "+e+" , t="+(self.date.getTime()-self.date_zero)+", ready="+self.status.ready+", paused="+self.status.paused+", currentTime="+self.status.currentTime+", duration="+self.status.duration+", ended="+self.status.ended); });
//});
    
    return this.player;
};

Stream.prototype.timeupdate = function(time) {
    this.status.currentTime=time;
    // TODO: what if we are streaming?
    if (this.status.currentTime>=this.status.duration) {
        this.status.currentTime=this.status.duration;
        if (!this.status.ended) this.player.trigger("ended");
    } else {
        this.status.ended=false;
    }
    for (var i=0; i<this.interfaces.length; i++) {
        this.interfaces[i].updatedStatus();
        this.interfaces[i].updatedTime();
    }
}
