/*  MediaInterface
    --------------
    Defines the standard audio/video/control gui
*/
function MediaInterface(interfaceId,mediaStream) {
    var self = this;
    
    self.id = interfaceId;
    self.mediaStream = mediaStream;
    
    self.onTimeChange = self.updateSeekBar.bind(self);
    self.onDurationChange = self.updateSeekDuration.bind(self);
    self.onStatusChange = self.updateControls.bind(self);

    // add the necessary html and initialize the MediaInterface
    document.getElementById(self.id).appendChild(self.html());
    self.init();
}

// to simplify selecting interface elements...
MediaInterface.prototype.sel=function(s) { return $('#'+this.id+' .'+s); };

MediaInterface.prototype.html=function() {
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

MediaInterface.prototype.init=function() {
    var self=this;

    self.mediaStream.bind('statusChange', self.onStatusChange);
    self.mediaStream.bind('durationChange', self.onDurationChange);
    self.mediaStream.bind('timeChange', self.onTimeChange);
    
    // set the initial status
    self.onStatusChange(self.mediaStream.status);
    self.onDurationChange(self.mediaStream.status);
    self.onTimeChange(self.mediaStream.status);

    // set eventHandlers
    self.sel('jp-play').click(function() {
        self.mediaStream.player.play();
    });
    self.sel('jp-pause').click(function() {
        self.mediaStream.player.pause();
    });
    self.sel('jp-stop').click(function() {
        self.mediaStream.player.pause();
        self.mediaStream.seekTime(0);
        self.mediaStream.player.trigger("stop");
    });
    self.sel('jp-mute').click(function() {
        self.mediaStream.player.mute();
    });
    self.sel('jp-unmute').click(function() {
        self.mediaStream.player.unmute();
    });

    self.sel('jp-seek-bar').click(function(e) {
        var offset = self.sel('jp-seek-bar').offset();
        var x = e.pageX - offset.left;
        var w = self.sel('jp-seek-bar').width();
        var p = x/w;
        self.mediaStream.seekPer(p);
    });
    self.sel('jp-volume-bar').click(function(e) {
        var offset = self.sel('jp-volume-bar').offset();
        var x = e.pageX - offset.left;
        var w = self.sel('jp-volume-bar').width();
        var y = self.sel('jp-volume-bar').height() - e.pageY + offset.top;
        var h = self.sel('jp-volume-bar').height();

        if (self.mediaStream.status.verticalVolume) {
            self.mediaStream.player.volume(y/h);
        } else {
            self.mediaStream.player.volume(x/w);
        }
    });
};

// Called whenever the duration changes
MediaInterface.prototype.updateSeekDuration = function(status) {
    var text;
    if (status.ready) {
        var s=status.streamType;
        if (s=="knownDuration") {
            text=this.mediaStream.convertTime(status.duration);
        } else if (s=="unknownDuration" && status.seekable) {
            text="(seek) "+this.mediaStream.convertTime(status.seekEnd);
        // TODO: seeking in stream?
        } else if (s=="stream") {
            text="Streaming...";
        }
    } else {
        text="Loading...";
    }
    this.sel('jp-duration').text(text);
};

// Called whenever the time changes
MediaInterface.prototype.updateSeekBar = function(status) {
    this.sel('jp-current-time').text(this.mediaStream.convertTime(status.currentTime));
    this.sel('jp-seek-bar').width(status.seekPercent*100+"%");
    this.sel('jp-play-bar').width(status.currentPercentRelative*100+"%");
};

// Called whenever any stream.status entry changes that is not related to time/duration
MediaInterface.prototype.updateControls = function(status) {
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
        this.sel('jp-volume-bar-value')[status.verticalVolume ? "height" : "width"](status.volume*100+'%');
    }
};
