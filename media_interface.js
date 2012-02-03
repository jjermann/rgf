/*  MediaInterface
    --------------
    Defines the standard audio/video/control gui
*/
function MediaInterface(interface_id) {
    this.id=interface_id;
    this.media_stream;
    this.html=this._initHTML();
}

// to simplify selecting interface elements...
MediaInterface.prototype.sel=function(s) { return $('div#'+this.id+' .'+s); };

MediaInterface.prototype._initHTML=function() {
    var el, container, singletype, gui, lvl1, lvl2, lvl3;
    /* jp-controls */
    el=document.createElement("div");
    el.id=this.id;
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

MediaInterface.prototype.init=function(media_stream) {
    this.media_stream=media_stream;
    this.media_stream.addInterface(this.updatedStatus.bind(this),this.updatedTime.bind(this));
    var self=this;
    // initial setup, most of this is not really needed
    var initial_status={
        currentTime: 0,
        seekable: false,
        seekEnd: 0,
        seekPercent: 0,
        currentPercentRelative: 0,
        currentPercentAbsolute: 0,
        paused: true,
        muted: false,
        // TODO: set this somewhere else...
        verticalVolume: false,
        volume: 0.8,
        ended: false,
        ready: false
    };
    this.updatedStatus(initial_status);
    this.updatedTime(initial_status);

    /* set eventHandlers */
    this.sel('jp-play').click(function() {
        self.media_stream.player.play();
    });
    this.sel('jp-pause').click(function() {
        self.media_stream.player.pause();
    });
    this.sel('jp-stop').click(function() {
        self.media_stream.player.pause();
        if (self.media_stream.status.ready) {
            self.media_stream.player.currentTime(0);
        }
        self.media_stream.player.trigger("stop");
    });
    this.sel('jp-mute').click(function() {
        self.media_stream.player.mute();
    });
    this.sel('jp-unmute').click(function() {
        self.media_stream.player.unmute();
    });

    this.sel('jp-seek-bar').click(function(e) {
        var offset = self.sel('jp-seek-bar').offset();
        var x = e.pageX - offset.left;
        var w = self.sel('jp-seek-bar').width();
        var p = x/w;
        if (self.media_stream.status.seekable || self.media_stream.status.stream_type=="known_duration") {
            self.media_stream.player.currentTime(p*self.media_stream.status.seekEnd);
        }
    });
    this.sel('jp-volume-bar').click(function(e) {
        var offset = self.sel('jp-volume-bar').offset();
        var x = e.pageX - offset.left;
        var w = self.sel('jp-volume-bar').width();
        var y = self.sel('jp-volume-bar').height() - e.pageY + offset.top;
        var h = self.sel('jp-volume-bar').height();

        if (self.media_stream.status.verticalVolume) {
            self.media_stream.player.volume(y/h);
        } else {
            self.media_stream.player.volume(x/w);
        }
    });
};

// Called whenever the time or duration changes
MediaInterface.prototype.updatedTime = function(status) {
    this.sel('jp-current-time').text(this.media_stream.convertTime(status.currentTime));
    var text;
    if (status.ready) {
        var s=status.stream_type;
        if (s=="known_duration") {
            text=this.media_stream.convertTime(status.duration);
        } else if (s=="unknown_duration" && status.seekable) {
            text="(seek) "+this.media_stream.convertTime(status.seekEnd);
        // TODO: seeking in stream?
        } else if (s=="stream") {
            text="Streaming...";
        }
    } else {
        text="Loading...";
    }
    this.sel('jp-duration').text(text);
    this.sel('jp-seek-bar').width(status.seekPercent*100+"%");
    this.sel('jp-play-bar').width(status.currentPercentRelative*100+"%");
};

// Called whenever any stream.status entry changes that is not related to time/duration
MediaInterface.prototype.updatedStatus = function(status) {
    if (status.paused) {
        this.sel('jp-pause').hide();
        this.sel('jp-play').show();
    } else {
        this.sel('jp-pause').show();
        this.sel('jp-play').hide();
    }

    if (status.muted) {
        this.sel('jp-mute').hide();
        this.sel('jp-unmute').show();
        this.sel('jp-volume-bar-value').hide();
        this.sel('jp-volume-bar').hide();
    } else {
        this.sel('jp-mute').show();
        this.sel('jp-unmute').hide();
        this.sel('jp-volume-bar-value').show();
        this.sel('jp-volume-bar').show();
        this.sel('jp-volume-bar-value')[status.verticalVolume ? "height" : "width"](status.volume*100+"%");
                                                
    }
};
