/*  RecorderBarInterface
    --------------------
    Provides a recorder interface for the game stream, also using the mediaStream occasionally
*/
function RecorderBarInterface(config,gameStream,mediaStream) {
    var self=this;
    
    self.onActionQueued = self.insertAction.bind(self);
    self.onRemovedAction = self.removeAction.bind(self);
    self.onUpdate = self.update.bind(self);
    self.onTimeModified = function(firstIndex,lastIndex) {
        for (var i=firstIndex; i<=lastIndex; i++) {
            self._updateActionTime(i);
        }
    }

    self.onDurationChange = function(status) {
        if (status.streamType=="knownDuration" && status.duration>0) {
            self.status.msDuration=status.duration;
        } else {
            self.status.msDuration=undefined;
        }

        self.updateDuration();
    };

    self.config={
        interfaceId: config.interfaceId,
        timeInterval: config.timeInterval ? config.timeInterval : 120,
        minDt: 0.0001,
        _width: parseInt($('#'+config.interfaceId).width(),10),
        _height: parseInt($('#'+config.interfaceId).height(),10),
        _initialKeyFrameTime: -6,
        _setupTime: -3
    };
    self.config._barIntWidth=self.config._width;
    self.config._barIntHeight=Math.round(self.config._height*0.4);
    self.config._barIntHalfHeight=Math.round(self.config._barIntHeight/2);

    self.status={
        actionList: []
    };
        
    // add the necessary html and initialize the RecorderBar
    document.getElementById(self.config.interfaceId).appendChild(self.html(self.config));

    if (gameStream) self.attachStream(gameStream);
    if (mediaStream) self.attachMediaStream(mediaStream);
}

RecorderBarInterface.prototype.attachStream = function(gameStream) {
    var self=this;

    self.gameStream=gameStream;
    self.gameStream._rgfGame.bind('actionQueued', self.onActionQueued);
    self.gameStream._rgfGame.bind('removedAction', self.onRemovedAction);
    self.gameStream._rgfGame.bind('timeModified', self.onTimeModified);
    self.gameStream.bind('update', self.onUpdate);
    
    for (var i=0; i<self.gameStream._rgfGame.actionList.length; i++) {
        self.insertAction(i);
    }

    self.updateDuration();
    self.setBasePos(0.5);
};

RecorderBarInterface.prototype.attachMediaStream = function(mediaStream) {
    var self=this;

    self.mediaStream=mediaStream;
    self.mediaStream.bind('durationChange', self.onDurationChange);
    
    self.onDurationChange(self.mediaStream.status);
};

RecorderBarInterface.prototype.html = function(config) {
    var self=this;

    var barInterface=document.createElement("div");
    self._barInterface=barInterface;
    barInterface.className="recorder_bar_interface";
    barInterface.style.overflow="hidden";
    barInterface.style.position="relative";
    barInterface.style.top=0+"px";
    barInterface.style.left=0+"px";
    barInterface.style.width=config._width+"px";
    barInterface.style.height=config._height+"px";

      var bar=document.createElement("div");
      self._bar=bar;
      bar.className="recorder_bar ui-widget-content";
      bar.style.position="absolute";
      bar.style.top=Math.round((self.config._height-self.config._barIntHeight)/2)+"px";
      bar.style.height=self.config._barIntHeight+"px";
      bar.style.width="1000000px";
      bar.style.left="0px";
        var el=document.createElement("div");
        el.className="recorder_bar_beginning";
        el.style.position="absolute";
        el.style.left=0;
        bar.appendChild(el);
        el=document.createElement("div");
        el.className="recorder_bar_end";
        el.style.position="absolute";
        el.style.right=0;
        bar.appendChild(el);
      barInterface.appendChild(bar);
      
      $(bar).draggable({
          cursor:      "move",
          axis:        "x",
          drag: function(e,ui) {
              var time=self._getTime(self.config._barBasePos-ui.position.left);
              if (time<0) time=0;
              if (self.mediaStream) self.mediaStream.seekTime(time);
              else self.gameStream.update(time);
          }
      });

      var baseMarker=document.createElement("div");
      self._baseMarker=baseMarker;
      baseMarker.id=self.config.interfaceId+"_basemarker";
      baseMarker.style.position="absolute";
      baseMarker.style.top="0px";
      baseMarker.style.left="0px";
        el=document.createElement("div");
        el.style.position="absolute";
        el.style.zIndex=10000;
        el.className="basemarker";
          var el2=document.createElement("div");
          el2.style.position="absolute";
          el2.style.zIndex=10001;
          el2.className="basemarker_top";
          el.appendChild(el2);
        baseMarker.appendChild(el);
      barInterface.appendChild(baseMarker);

      $(baseMarker).draggable({
          handle:      ".basemarker_top",
          cursor:      "move",
          axis:        "x",
          containment: "parent",
          drag: function(e,ui) {
              var p=ui.position.left/self.config._barIntWidth;
              self.setBasePos(p);
          }
      });

    return self._barInterface;
};

RecorderBarInterface.prototype.actionHtml = function(index) {
    var self=this,
        action=self.gameStream._rgfGame.actionList[index];
    
    var container=document.createElement("div");
    container.className="action_container ui-widget-content";
    container.style.position="absolute";
    container.style.top=self.config._barIntHalfHeight+"px";

      var el=document.createElement("div");
      el.style.position="absolute";
      el.className="action";
      el.className+=" name_"+action.name;
      if (typeof action.arg == 'string' && action.arg!="" && action.arg.length < 10) el.className+=" arg_"+action.arg;
      else el.className+=" noarg";
      if (action.position) el.className+=" pos";
      else el.className+=" nopos";
      if (action.time<0) el.className+=" initial";
      else el.className+=" regular";
      el.style.zIndex=index+1;

        var el2=document.createElement("div");
        el2.className="top";
        el2.style.zIndex=index+1;
        el.appendChild(el2);

        var el2=document.createElement("div");
        el2.className="drag";
        el2.style.zIndex=index+1;
        el.appendChild(el2);

        var el2=document.createElement("div");
        el2.className="bottom";
        el2.style.zIndex=index+1;
        el.appendChild(el2);

      container.appendChild(el);

    return container;
};


RecorderBarInterface.prototype._updateActionTime = function(index) {
    var self=this,
        action=self.gameStream._rgfGame.actionList[index];

    if (action.time>=0) {
        var pos=self._getPos(action.time);
    } else if (action.time==-1) {
        var pos=self._getPos(self.config._setupTime);
    } else if (action.time==-2) {
        var pos=self._getPos(self.config._initialKeyFrameTime);
    } else {
        alert("Invalid time...");
    }
    
    self.status.actionList[index].style.left=pos+"px";
};
RecorderBarInterface.prototype._getPos = function(time) {
    return Math.round(time*this.config._barIntWidth/this.config.timeInterval);
};
RecorderBarInterface.prototype._getTime = function(pos) {
    return pos*this.config.timeInterval/this.config._barIntWidth;
};

RecorderBarInterface.prototype.update = function() {
    var gsIndex=this.gameStream.status.timeIndex-1,
        gsTime=this.gameStream.status.time,
        gsCounter=this.gameStream.status.timeCounter;
    gsIndex=(gsIndex < 0) ? 0 : gsIndex;
    this._setCurrentAction(gsIndex);
    this._setCurrentTime(gsTime,gsCounter);
};

RecorderBarInterface.prototype._updateBarContainment = function() {
    var x1=Math.round($(this._barInterface).offset().left-$(this._bar).width()+this.config._barBasePos);
    var x2=x1+$(this._bar).width();
    $(this._bar).draggable("option", "containment", [x1,-10000,x2,10000]);
};
RecorderBarInterface.prototype.updateDuration = function() {
    var self=this;
    
    if (self.status.msDuration) {
        var nDuration=self.status.msDuration;
    } else {
        var nDuration=self.gameStream._rgfGame.duration.time;
        if (nDuration<0) nDuration=0;
    }

    var barWidth=self._getPos(nDuration)+"px";
    self._bar.style.width=barWidth;
    self._updateBarContainment();
};
RecorderBarInterface.prototype.setBasePos = function(p) {
    if (p<0 || p>1) alert("invalid percentage!");
    this.config._barBasePos=Math.round(this.config._barIntWidth*p);
    this._baseMarker.style.left=this.config._barBasePos+"px";
    this._updateBarContainment();
    this.update();
};
RecorderBarInterface.prototype._setCurrentAction = function(index) {
    if (index==this.status.gsIndex) return;
    if (index!=undefined) $(this.status.actionList[index]).find(".action").addClass("currentAction");
    if (this.status.gsIndex!=undefined) $(this.status.actionList[this.status.gsIndex]).find(".action").removeClass("currentAction");

    this.status.gsIndex=index;
};
RecorderBarInterface.prototype._setCurrentTime = function(time,counter) {
    var nTime=time;
    if (time==-1) nTime=this.config._setupTime;
    else if (time==-2) nTime=this.config._initialKeyFrameTime;
    else if (time<0) alert("invalid time...");

    this._bar.style.left=(this.config._barBasePos-this._getPos(nTime))+"px";
    this.status.gsTime=time;
    this.status.gsCounter=counter;
};

RecorderBarInterface.prototype.insertAction = function(index) {
    var self=this;
    
    self.updateDuration();
    
    self.status.actionList.splice(index,0,self.actionHtml(index));
    self._updateActionTime(index);
    $(self._bar).append($(self.status.actionList[index]));
    
    $(self.status.actionList[index]).draggable({
        handle:      ".drag",
        cursor:      "move",
        axis:        "x",
        containment: "parent",
        helper:      "clone",
        opacity:     0.6,
        start: function(e,ui) {
            if (self.mediaStream) self.mediaStream.player.pause();
        },
        drag: function(e,ui) {
            var time=self._getTime(ui.position.left);
            if (time<0) time=0;
            var p=(ui.position.left+parseInt(self._bar.style.left))/self.config._barIntWidth;
            if (self.mediaStream) self.mediaStream.seekTime(time);
            else self.gameStream.update(time);
            self.setBasePos(p);
        },
        stop: function(e,ui) {
            var inst=this;

            var index=self.status.actionList.indexOf(inst);
            var dt=self._getTime(ui.position.left)-self.gameStream._rgfGame.actionList[index].time;
            // TODO: this is not working yet...
            if (Math.abs(dt)>self.config.minDt) self.gameStream.modifyActionTime(index,index,dt);
        }
    });
};
RecorderBarInterface.prototype.removeAction = function(index) {
    this.updateDuration();

    var removed=this.status.actionList.splice(index,1)[0];
    removed.remove();
};
