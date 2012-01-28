/*  Interface
    ---------
    Defines the standard audio/video/control gui
*/
function Interface(interface_id) {
    this.interface_id=interface_id;
    this.stream;
    this.interface_element=this._initInterfaceElement(this.interface_id);
}

// to simplify selecting interface elements...
Interface.prototype.sel=function(s) { return $('div#'+this.interface_id+' .'+s); };

Interface.prototype._initInterfaceElement=function(id) {
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

Interface.prototype.initInterface=function(stream) {
    this.stream=stream;
    this.stream.addInterface(this.updatedStatus.bind(this),this.updatedTime.bind(this));
    var self=this;
    // initial setup
    this.updatedStatus();
    this.updatedTime();

    /* set eventHandlers */
    this.sel('jp-play').click(function() {
        self.stream.player.play();
    });
    this.sel('jp-pause').click(function() {
        self.stream.player.pause();
    });
    this.sel('jp-stop').click(function() {
        self.stream.player.pause();
        if (self.stream.status.ready) {
            self.stream.player.currentTime(0);
        }
        self.stream.player.trigger("stop");
    });
    this.sel('jp-mute').click(function() {
        self.stream.player.mute();
    });
    this.sel('jp-unmute').click(function() {
        self.stream.player.unmute();
    });

    this.sel('jp-seek-bar').click(function(e) {
        var offset = self.sel('jp-seek-bar').offset();
        var x = e.pageX - offset.left;
        var w = self.sel('jp-seek-bar').width();
        var p = x/w;
        if (self.stream.status.seekable || self.stream.status.stream_type=="known_duration") {
            self.stream.player.currentTime(p*self.stream.status.seekEnd);
        }
    });
    this.sel('jp-volume-bar').click(function(e) {
        var offset = self.sel('jp-volume-bar').offset();
        var x = e.pageX - offset.left;
        var w = self.sel('jp-volume-bar').width();
        var y = self.sel('jp-volume-bar').height() - e.pageY + offset.top;
        var h = self.sel('jp-volume-bar').height();

        if (self.stream.status.verticalVolume) {
            self.stream.player.volume(y/h);
        } else {
            self.stream.player.volume(x/w);
        }
    });
};

// Called whenever the time or duration changes
Interface.prototype.updatedTime = function() {
    this.sel('jp-current-time').text(this.stream.convertTime(this.stream.status.currentTime));
    var text;
    if (this.stream.status.ready) {
        var s=this.stream.status.stream_type;
        if (s=="known_duration") {
            text=this.stream.convertTime(this.stream.status.duration);
        } else if (s=="unknown_duration" && this.stream.status.seekable) {
            text="(seek) "+this.stream.convertTime(this.stream.status.seekEnd);
        // TODO: seeking in stream?
        } else if (s=="stream") {
            text="Streaming...";
        }
    } else {
        text="Loading...";
    }
    this.sel('jp-duration').text(text);
    this.sel('jp-seek-bar').width(this.stream.status.seekPercent*100+"%");
    this.sel('jp-play-bar').width(this.stream.status.currentPercentRelative*100+"%");
};

// Called whenever any stream.status entry changes that is not related to time/duration
Interface.prototype.updatedStatus = function() {
    if (this.stream.status.paused) {
        this.sel('jp-pause').hide();
        this.sel('jp-play').show();
    } else {
        this.sel('jp-pause').show();
        this.sel('jp-play').hide();
    }

    if (this.stream.status.muted) {
        this.sel('jp-mute').hide();
        this.sel('jp-unmute').show();
        this.sel('jp-volume-bar-value').hide();
        this.sel('jp-volume-bar').hide();
    } else {
        this.sel('jp-mute').show();
        this.sel('jp-unmute').hide();
        this.sel('jp-volume-bar-value').show();
        this.sel('jp-volume-bar').show();
        this.sel('jp-volume-bar-value')[this.stream.status.verticalVolume ? "height" : "width"](this.stream.status.volume*100+"%");
                                                
    }
};
