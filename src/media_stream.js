/*  MediaStream 
    -----------
    Responsible for initializing Popcorn and getting the html body for the corresponding
    audio/video/control gui
*/
function MediaStream(mediaId,msSources,duration) {
    this.id=mediaId;
    
    /* fixed header informations */
    // none (no media), audio/video (audio video file/address), youtube, vimeo
    if (msSources.length) {
        this.mediaType=msSources[0].type.split("/")[0];
    } else {
        this.mediaType="none";
    }
    // Array of media stream source objects, only 1 entry for "youtube", "vimeo", irrelevant for "none"
    // src:  the web/file/etc url for the source
    // type: the html5 media type
    this.sources=msSources;

    this.status={
        // If this is set all durationchanges are ignored and maxDuration is used instead.
        // Also this means that the streamType will be set to "knownDuration".
        setDuration: (this.mediaType=="none"),
        // we store the rgf duration in case we need to fallback to the baseplayer
        rgfDuration: duration,
        
        // options for updatedTime()
        currentTime: 0,
        seekable: false,
        // For the interface: where we can maximally seek to
        seekEnd: 0,
        seekPercent: 0,
        // For the interface: where we currently are in relative/absolute percentages
        currentPercentRelative: 0,
        currentPercentAbsolute: 0,
        // If setSuration is not set, duration will be set initially in "canplay",
        // until then it is set to 0 (which produces an error later if it is not changed)
        duration: (this.mediaType=="none") ? duration : 0,
        /* 
            This will be set later depending on the duration:
            noMedia         : The media was not found.
            stream          : The media is a stream with "infinite duration"
            unknownDuration : The media is not a stream but we do not know the duration.
            knownDuration   : (standard) The media has a known duration (might change later though)
        */
        streamType: "",

        // options for updatedStatus()
        paused: true,
        muted: false,
        // TODO: set this somewhere else than (manually) here...
        verticalVolume: false,
        volume: 0.8,
        playbackRate: 1,
        // This is set to true when we reached the end of the media
        ended: false,
        // This is set to true in "canplay"
        ready: false,
        // If true the fallback media should be loaded
        failed: false
    };

    // Popcorn instance
    this.player;
    // used for fallback trigger "failedLoading"
    this.timeoutTime=5;
    this.timeoutValue;
    // associated interfaces that need to be updated
    this.interfaces=[];
}

MediaStream.prototype.addInterface=function(updatedStatusFun,updatedTimeFun) {
    this.interfaces.push({
        updatedStatus: (updatedStatusFun!=undefined) ? updatedStatusFun : function() {},
        updatedTime: (updatedTimeFun!=undefined) ? updatedTimeFun : function() {}
    });
};

// a useful function to have in any case (so it is left in MediaStream class)
MediaStream.prototype.convertTime = function(s) {
    var myTime = new Date(s * 1000);
    var hour = myTime.getUTCHours();
    var min = myTime.getUTCMinutes();
    var sec = myTime.getUTCSeconds();
    var strHour = (hour < 10) ? "0" + hour : hour;
    var strMin = (min < 10) ? "0" + min : min;
    var strSec = (sec < 10) ? "0" + sec : sec;
    return strHour + ":" + strMin + ":" + strSec;
};

// Returns the html element for media stream
MediaStream.prototype.html=function(style) {
    var el, container;
    //el=document.createElement("div");
    //el.id=this.id;
      if (this.mediaType=="none") {
          container=document.createElement("div");
      } else if (this.mediaType=="audio") {
          container=document.createElement("audio");
          for (var i=0; i<this.sources.length; i++) {
              var src=document.createElement("source");
              src.src=this.sources[i].src;
              container.appendChild(src);
          }
      } else if (this.mediaType=="video") {
          container=document.createElement("video");
          for (var i=0; i<this.sources.length; i++) {
              var src=document.createElement("source");
              src.src=this.sources[i].src;
              container.appendChild(src);
          }
      } else if (this.mediaType=="youtube") {
          container=document.createElement("div");
      } else if (this.mediaType=="vimeo") {
          container=document.createElement("div");
      } else {
          alert("illegal type: "+this.mediaType);
      }
      container.id=this.id;
      extend(container.style,style);
      //container.className="jp-jplayer";
    //el.appendChild(container);

    return container;
};

// create a Popcorn instance, this needs the corresponding id (from this.html) in the document first...
MediaStream.prototype.init=function() {
    var pl;
    var self=this;
    
    if (this.mediaType=="none") {
        Popcorn.player("baseplayer");
        pl=Popcorn.baseplayer("#"+this.id);
    } else if (this.mediaType=="audio") {
        pl=Popcorn("#"+this.id);
    } else if (this.mediaType=="video") {
        pl=Popcorn("#"+this.id);
    } else if (this.mediaType=="youtube") {
        pl=Popcorn.youtube("#"+this.id,this.sources[0].src);
    } else if (this.mediaType=="vimeo") {
        pl=Popcorn.vimeo("#"+this.id,this.sources[0].src);
    } else { alert("illegal type: "+this.mediaType); }

    this.timeoutValue=setTimeout(function() {
        if (!self.status.ready) self.player.trigger("failedLoading");
    },this.timeoutTime*1000);

//this.date=new Date();
//this.dateZero=this.date.getTime();
//console.log(self.mediaId+": instanced, t="+(self.date.getTime()-self.dateZero));
    this.player=pl;
    this.player.controls(false);

    // initial setup
    this.interfaces.forEach(function(inter) { inter.updatedStatus(this.status); inter.updatedTime(this.status); });

//    this.player.listen("loadedmetadata", function() {
//        self.status.ready=true;
//        self._updateInterface();
//    });
    this.player.listen("play", function() {
        if (self.status.ready && self.status.ended) {
            self.status.ended=false;
            self.player.currentTime(0);
            // self.interfaces.forEach(function(inter) { inter.updatedTime(); });
        }
        self.status.paused=false;
        self.interfaces.forEach(function(inter) { inter.updatedStatus(self.status); });
    });
    this.player.listen("pause", function() {
        self.status.paused=true;
        self.interfaces.forEach(function(inter) { inter.updatedStatus(self.status); });
    });
// All of this is already done in "pause"...
//    this.player.listen("stop", function() {
//        self.status.paused=true;
//        self.interfaces.forEach(function(inter) { inter.updatedStatus(self.status); });
//    });
    this.player.listen("ended", function() {
        self.status.ended=true;
        self.player.pause();
        // self.player.currentTime(0);
    });
    this.player.listen("canplay", function() {
        if (!self.status.ready) {
            self.status.ready=true;
            if (!self.status.setDuration) self.status.duration=this.duration();
            self.streamtypeupdate(self.status.duration);
                
            for (var i=0; i<self.interfaces.length; i++) {
                self.interfaces[i].updatedStatus(self.status);
            }
            this.trigger("timeupdate");
        }
    });
    this.player.listen("failedLoading", function() { self.fallback(); });

    this.player.listen("timeupdate", function() {
        if (self.status.ready) {
            self.status.currentTime=this.currentTime();
            // TODO: seeking in stream?
            if (self.status.streamType!= "stream" && this.seekable() && this.seekable().length>0) {
                self.status.seekable=true;
            } else {
                self.status.seekable=false;
            }

            if (self.status.streamType=="knownDuration") {
                if (self.status.currentTime>=self.status.duration) {
                    self.status.currentTime=self.status.duration;
                    if (!self.status.ended) this.trigger("ended");
                }

                if (self.status.seekable) { self.status.seekEnd=this.seekable().end(0); } 
                else { self.status.seekEnd=self.status.duration; }
                self.status.seekPercent=self.status.seekEnd/self.status.duration;
                self.status.currentPercentRelative=self.status.currentTime/self.status.seekEnd;
                self.status.currentPercentAbsolute=self.status.currentTime/self.status.duration;        
            } else if (self.status.streamType=="unknownDuration") {
                if (self.status.seekable) {
                    self.status.seekEnd=this.seekable().end(0);
                    self.status.seekPercent=1;
                    self.status.currentPercentRelative=self.status.currentTime/self.status.seekEnd;
                } else {
                    self.status.seekEnd=0;
                    self.status.seekPercent=1;
                    self.status.currentPercentRelative=0;
                }
                self.status.currentPercentAbsolute=0;
                if (self.status.currentTime<self.status.seekEnd) { self.status.ended=false; }
            } else if (self.status.streamType=="stream") {
                // TODO: for now no seeking at all in stream...
                self.status.seekEnd=0;
                self.status.seekPercent=1;
                self.status.currentPercentRelative=0;
                self.status.currentPercentAbsolute=0;
            }

            for (var i=0; i<self.interfaces.length; i++) {
                self.interfaces[i].updatedTime(self.status);
            }
        }
    });

    this.player.listen("durationchange", function() {
        if (self.status.ready) {
            if (!self.status.setDuration) self.status.duration=this.duration();
            self.streamtypeupdate(self.status.duration);
            if (self.status.currentTime<self.status.duration) { self.status.ended=false; }
        }
        self.interfaces.forEach(function(inter) { inter.updatedTime(self.status); });
    });
    this.player.listen("volumechange", function() {
        self.status.muted=this.muted();
        self.status.volume=this.volume();
        self.interfaces.forEach(function(inter) { inter.updatedStatus(self.status); });
    });

    if (this.mediaType=="none") {
//        setTimeout(function() {
        self.player.trigger("canplay");
//        },10);
    }
    
    // youtube is horribly broken
    if (this.mediaType=="youtube" || this.mediaType=="vimeo") {
        this.player.listen("canplaythrough", function() {
            setTimeout(function() {
                self.player.pause();
                self.player.currentTime(0);
                self.player.trigger("canplay");
            },1000);
        });
    }
    
//var events=["abort","canplay","canplaythrough","durationchange","canshowcurrentframe","dataunavailable","emptied","empty","ended","error","loadeddata","loadedmetadata","loadstart","mozaudioavailable","pause","play","playing","progress","ratechange","seeked","seeking","suspend","volumechange","waiting"];
//events.forEach(function(e) {
//    self.player.listen(e, function() { self.date=new Date(); console.log(self.mediaId+": "+e+" , t="+(self.date.getTime()-self.dateZero)+", ready="+self.status.ready+", paused="+self.status.paused+", currentTime="+self.status.currentTime+", duration="+self.status.duration+", ended="+self.status.ended); });
//});
    
    return this.player;
};

MediaStream.prototype.streamtypeupdate = function(duration) {
    if (duration==0) {
        this.status.streamType="noMedia";
        this.player.trigger("failedLoading");
    } else if (duration==undefined) {
        this.status.streamType="unknownDuration";
    } else if (duration===Infinity) {
        this.status.streamType="stream";
    } else if (duration>0) {
        this.status.streamType="knownDuration";
    } else {
        // unknown stream type (?)
        this.player.trigger("failedLoading");
    }

    return this.status.streamType;
};

MediaStream.prototype.fallback = function() {
    this.status.ready="false";
    this.status.failed="true";
    
    for (var i=0; i<this.interfaces.length; i++) {
        this.interfaces[i].updatedStatus(this.status);
    }
    this.close();
};

MediaStream.prototype.close = function() {
    clearTimeout(this.timeoutValue);
    this.player.unlisten("play");
    this.player.unlisten("pause");
    this.player.unlisten("ended");
    this.player.unlisten("canplay");
    this.player.unlisten("failedLoading");
    this.player.unlisten("timeupdate");
    this.player.unlisten("durationchange");
    this.player.unlisten("volumechange");
};
