/*  Stream 
    ------
    Responsible for initializing Popcorn and getting the html body for the corresponding
    audio/video/control gui
*/
function Stream(base_id,sources,media_type,width,height,manual_duration) {
    this.media_id=base_id+"_media";
    this.interface_id=base_id+"_interface";
    // none (no media), audio/video (audio video file/address), youtube, vimeo
    this.media_type=media_type;
    // Array of sources, only 1 entry for "youtube", "vimeo", irrelevant for "none"
    this.source=sources;
    // Media properties: width, height, duration
    this.width=width;
    this.height=height;

    this.status={
        currentTime: 0,
        duration: (manual_duration>0) ? manual_duration : 0,
        paused: true,
        muted: false,
        volume: 0,
        seekPercent: 0,
        currentPercentRelative: 0,
        currentPercentAbsolute: 0,
        playbackRate: 1,
        ended: false
    };

    this.media_element=this._initMediaElement(this.media_id);
    this.interface_element=this._initInterfaceElement(this.interface_id);

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

Stream.prototype._initInterfaceElement=function(id) {
    var el, container, singletype, gui, lvl1, lvl2, lvl3;
    /* jp-controls */
    el=document.createElement("div");
    el.id=id;
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
    this.player=pl;
    this.player.controls(false);

    this.player.pause();
    this._updateInterface();

    /* set eventHandlers */
    $('div#'+this.interface_id+' .jp-play').click(function() {
        self.player.play();
    });
    $('div#'+this.interface_id+' .jp-pause').click(function() {
        self.player.pause();
    });
    $('div#'+this.interface_id+' .jp-stop').click(function() {
        self.player.pause();
        self.player.currentTime(0);
    });
    $('div#'+this.interface_id+' .jp-mute').click(function() {
        self.player.mute();
    });
    $('div#'+this.interface_id+' .jp-unmute').click(function() {
        self.player.unmute();
    });

//TODO    $('div#'+this.interface_id+' .jp-volume-max').click(function() { /* TODO */ });
    $('div#'+this.interface_id+' .jp-progress').click(function(e) { /* TODO */ });
    $('div#'+this.interface_id+' .jp-seek-bar').click(function(e) { /* TODO */ });
    $('div#'+this.interface_id+' .jp-play-bar').click(function(e) { /* TODO */ });
    $('div#'+this.interface_id+' .jp-volume-bar').click(function(e) { /* TODO */ });
    $('div#'+this.interface_id+' .jp-volume-bar-value').click(function(e) { /* TODO */ });

//    this.player.listen("loadedmetadata", function() {
//        self.status.ready=true;
//        self._updateInterface();
//    });
    this.player.listen("play", function() {
        if (self.status.ended) {
            self.status.ended=false;
            self.player.currentTime(0);
        }
        self.status.paused=false;
        self._updateInterface();
    });
    this.player.listen("pause", function() {
        self.status.paused=true;
        self._updateInterface();
    });
    this.player.listen("ended", function() {
        self.player.pause();
        self.status.ended=true;
//        self.player.currentTime(0);
    });
    this.player.listen("timeupdate", function() {
        self.status.currentTime=this.currentTime();
        // TODO: what if we are streaming?
        if (self.status.currentTime>=self.status.duration) {
            self.status.currentTime=self.status.duration;
            if (!self.status.ended) self.player.trigger("ended");
        } else {
            self.status.ended=false;
        }
        self._updateInterface();
    });
    this.player.listen("durationchange", function() {
        self.status.duration=this.duration();
        // TODO: what if we are streaming?
        if (self.status.currentTime>=self.status.duration) {
            self.status.currentTime=self.status.duration;
            if (!self.status.ended) self.player.trigger("ended");
        } else {
            self.status.ended=false;
        }
        self._updateInterface();
    });
    this.player.listen("volumechange", function() {
        self.status.muted=this.muted();
        self.status.volume=this.volume();
        self._updateInterface();
    });
    
    return this.player;
};

Stream.prototype._updateInterface = function() {
    if (this.status.paused) {
        $('div#'+this.interface_id+' .jp-pause').hide();
        $('div#'+this.interface_id+' .jp-play').show();
    } else {
        $('div#'+this.interface_id+' .jp-pause').show();
        $('div#'+this.interface_id+' .jp-play').hide();
    }

    if (this.status.muted) {
        $('div#'+this.interface_id+' .jp-mute').hide();
        $('div#'+this.interface_id+' .jp-unmute').show();
    } else {
        $('div#'+this.interface_id+' .jp-mute').show();
        $('div#'+this.interface_id+' .jp-unmute').hide();
    }

    $('div#'+this.interface_id+' .jp-current-time').text(this._convertTime(this.status.currentTime));
    $('div#'+this.interface_id+' .jp-duration').text(this._convertTime(this.status.duration));
};
