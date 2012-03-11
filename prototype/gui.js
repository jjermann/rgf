function DisplayGUI(baseId,msSources,duration) {
    /*
       DisplayGUI:      ID
       MediaStream:     ID_media
       MediaInterface:  ID_interface
       BoardPlayer:     ID_board
                        ID_board_sgf
                        ID_board_actions
                        ID_board_eidogo
       GameStream:      ID_game
                        ID_game_rgf
    */
    this.id=baseId;
    
    // create components
    this.board=new BoardPlayer(this.id+"_board");
    this.gameStream=new GameStream(this.id+"_game",this.board,duration);
    this.mediaStream=new MediaStream(this.id+"_media",msSources,duration);
    this.mediaInterface=new MediaInterface(this.id+"_interface");

    // initialize the main HTML element(s)
    this.html=document.createElement("div");
    this.html.id=this.id;    
    this.html.appendChild(this.mediaStream.html({
        position: "absolute",
        top:      "4px",
        left:     "4px",
        width:    "640px",
        //height:   "500px",
        border:   "solid black 1px"
    }));
    this.html.appendChild(this.board.html({
        position: "absolute",
        /*
        overflow: "hidden";
        width:    "431px",
        height:   "431px",
        */
        left:     "650px",
        top:      "4px"
    }));
    this.html.appendChild(this.mediaInterface.html({
        position: "absolute",
        left:     "654px",
//        top:      "434px"
        top:      "471px"
//          left:     "1080px",
//          top:      "8px"
    }));

    // Textbox to output the current RGF tree
    this.html.appendChild(createBox(this.id+"_game_rgf","Current RGF Tree",{
        position: "absolute",
        width:    "640px",
        height:   "500px",
        top:      "560px",
        left:     "4px"
    }));
    // Textbox to output the current pseudo SGF file
    this.html.appendChild(createBox(this.id+"_board_sgf","Current SGF tree", {
        position: "absolute",
        width:    "422px",
        height:   "500px",
        top:      "560px",   
        left:     "650px"
    }));
    // Textbox to output the currently applied action list
    this.html.appendChild(createBox(this.id+"_board_actions","Currently applied actions", {
        position: "absolute",
        width:    "382px",
        height:   "500px",
        top:      "560px",   
        left:     "1078px"
    }));
    
    // insert the gui into the html body
    document.body.appendChild(this.html);

    // initialize the board
    this.board.eidogoConfig.gsInsertAction=this.gameStream.applyActionList.bind(this.gameStream);
    this.board.init();
    
    // Allow the game stream to force an update of the time of the media stream manually
    this.gameStream.updateCurrentTime=this.mediaStream.updateTime.bind(this.mediaStream);
    // The game stream is set to the initial (starting) position
    this.gameStream.update(0);

    // initialize the media stream
    this.mediaStream.addInterface(this.gameStream.updatedStatus.bind(this.gameStream),this.gameStream.updatedTime.bind(this.gameStream));
    this.mediaStream.addInterface(this.updatedStatus.bind(this));
    this.mediaInterface.init(this.mediaStream);
    this.mediaStream.init();
};

DisplayGUI.prototype.updatedStatus = function(newstatus) {
    if (newstatus.failed) {
        // TODO: should load the fallback media stream...
        alert("Media stream loading failed!");
    }
};

DisplayGUI.prototype.hide = function() {
    $("div#"+this.id+" ").hide();
};

DisplayGUI.prototype.show = function() {
    $("div#"+this.id+" ").show();
};

    