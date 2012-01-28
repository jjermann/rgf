/*  Interface
    ---------
    Defines the standard audio/video/control gui
*/
function Interface(interface_id) {
    this.interface_id=interface_id;
    this.stream;
    this.interface_element=this._initInterfaceElement(this.interface_id);
}

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
    $('div#'+this.interface_id+' .jp-play').click(function() {
        self.stream.player.play();
    });
    $('div#'+this.interface_id+' .jp-pause').click(function() {
        self.stream.player.pause();
    });
    $('div#'+this.interface_id+' .jp-stop').click(function() {
        self.stream.player.pause();
        if (self.stream.status.ready) {
            self.stream.player.currentTime(0);
        }
        self.stream.player.trigger("stop");
    });
    $('div#'+this.interface_id+' .jp-mute').click(function() {
        self.stream.player.mute();
    });
    $('div#'+this.interface_id+' .jp-unmute').click(function() {
        self.stream.player.unmute();
    });

    // $('div#'+this.interface_id+' .jp-progress').click(function(e) { /* TODO */ });
    $('div#'+this.interface_id+' .jp-seek-bar').click(function(e) {
        var offset = $('div#'+self.interface_id+' .jp-seek-bar').offset();
        var x = e.pageX - offset.left;
        var w = $('div#'+self.interface_id+' .jp-seek-bar').width();
        var p = x/w;
        if (self.stream.status.seekable || self.stream.status.stream_type=="known_duration") {
            self.stream.player.currentTime(p*self.stream.status.seekEnd);
        }
    });
    $('div#'+this.interface_id+' .jp-volume-bar').click(function(e) {
        var offset = $('div#'+self.interface_id+' .jp-volume-bar').offset();
        var x = e.pageX - offset.left;
        var w = $('div#'+self.interface_id+' .jp-volume-bar').width();
        var y = $('div#'+self.interface_id+' .jp-volume-bar').height() - e.pageY + offset.top;
        var h = $('div#'+self.interface_id+' .jp-volume-bar').height();

        if (self.stream.status.verticalVolume) {
            self.stream.player.volume(y/h);
        } else {
            self.stream.player.volume(x/w);
        }
    });
};

// Called whenever the time or duration changes
Interface.prototype.updatedTime = function() {
    $('div#'+this.interface_id+' .jp-current-time').text(this.stream.convertTime(this.stream.status.currentTime));
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
    $('div#'+this.interface_id+' .jp-duration').text(text);
    $('div#'+this.interface_id+' .jp-seek-bar').width(this.stream.status.seekPercent*100+"%");
    $('div#'+this.interface_id+' .jp-play-bar').width(this.stream.status.currentPercentRelative*100+"%");
};

// Called whenever any stream.status entry changes that is not related to time/duration
Interface.prototype.updatedStatus = function() {
    if (this.stream.status.paused) {
        $('div#'+this.interface_id+' .jp-pause').hide();
        $('div#'+this.interface_id+' .jp-play').show();
    } else {
        $('div#'+this.interface_id+' .jp-pause').show();
        $('div#'+this.interface_id+' .jp-play').hide();
    }

    if (this.stream.status.muted) {
        $('div#'+this.interface_id+' .jp-mute').hide();
        $('div#'+this.interface_id+' .jp-unmute').show();
        $('div#'+this.interface_id+' .jp-volume-bar-value').hide();
        $('div#'+this.interface_id+' .jp-volume-bar').hide();
    } else {
        $('div#'+this.interface_id+' .jp-mute').show();
        $('div#'+this.interface_id+' .jp-unmute').hide();
        $('div#'+this.interface_id+' .jp-volume-bar-value').show();
        $('div#'+this.interface_id+' .jp-volume-bar').show();
        $('div#'+this.interface_id+' .jp-volume-bar-value')[this.stream.status.verticalVolume ? "height" : "width"](this.stream.status.volume*100+"%");
                                                
    }
};
