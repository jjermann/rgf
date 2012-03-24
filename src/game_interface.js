/*  GameInterface
    --------------
    Defines a control interface for the game stream with access to the media stream
*/
function GameInterface(interfaceId,gameStream,mediaStream) {
    var self=this;
    
    self.id=interfaceId;
    self.gameStream=gameStream;
    self.mediaStream=mediaStream;

    // add the necessary html and initialize the GameInterface
    document.getElementById(self.id).appendChild(self.html());
    self.init();
}

// to simplify select interface elements...
GameInterface.prototype.sel=function(s) { return $('#'+this.id+' .'+s); };

GameInterface.prototype.html=function() {
    var el, container, singletype, gui, lvl1, lvl2, lvl3;
    container=document.createElement("div");
    container.className="gs-interface";
      lvl1=document.createElement("ul");
      lvl1.className="gs-controls";
        lvl2=document.createElement("li");
        lvl2.innerHTML='<a href="javascript:;" class="gs-step-backward">backward</a>';
        lvl1.appendChild(lvl2);

        lvl2=document.createElement("li");
        lvl2.innerHTML='<a href="javascript:;" class="gs-step-forward">forward';
        lvl1.appendChild(lvl2);

        // TODO: several steps forward/backward
      container.appendChild(lvl1);

    return container;
};

GameInterface.prototype.init=function() {
    var self=this;
    var ignoreList=[";","BL","WL","OB","OW"];

    /* set eventHandlers */
    this.sel('gs-step-forward').click(function() {
        var oldTime=self.gameStream.status.time;
        if (oldTime<0) oldTime=0;
        self.gameStream.step(1,false,ignoreList,false);
        var newTime=self.gameStream.status.time;
        if (newTime<0) newTime=0;
        
        if (oldTime!=newTime) {
            var oldControl=self.gameStream.status.inControl;
            self.gameStream.status.inControl=true;
            self.gameStream.status.storedTime=undefined;
            self.mediaStream.seekTime(newTime);
            self.gameStream.status.inControl=oldControl;
        }
    });
    this.sel('gs-step-backward').click(function() {
        var oldTime=self.gameStream.status.time;
        if (oldTime<0) oldTime=0;
        self.gameStream.step(-1,false,ignoreList,false);
        var newTime=self.gameStream.status.time;
        if (newTime<0) newTime=0;

        if (oldTime!=newTime) {
            var oldControl=self.gameStream.status.inControl;
            self.gameStream.status.inControl=true;
            self.gameStream.status.storedTime=undefined;
            self.mediaStream.seekTime(newTime);
            self.gameStream.status.inControl=oldControl;
        }
    });
};
