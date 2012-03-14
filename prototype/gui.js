function DisplayGUI(baseId,msSources,duration) {
    /*
       DisplayGUI:      ID
       MediaStream:     ID_media
       MediaInterface:  ID_media_interface
       BoardPlayer:     ID_board
                        ID_board_sgf
                        ID_board_actions
                        ID_board_eidogo
       GameStream:      ID_game
                        ID_game_rgf
       GameInterface:   ID_game_interface
    */
    this.id=baseId;
    
    // create components
    this.board=new BoardPlayer(this.id+"_board");
    this.gameStream=new GameStream(this.id+"_game",this.board,duration);
    this.mediaStream=new MediaStream(this.id+"_media",msSources,duration);
    this.mediaInterface=new MediaInterface(this.id+"_media_interface");
    this.gameInterface=new GameInterface(this.id+"_game_interface");

    // attach the mediaStream to the gameStream
    this.gameStream.attachStream(this.mediaStream);
    // Allow the game stream to force an update of the time of the media stream manually
    this.gameStream.updateCurrentTime=this.mediaStream.updateTime.bind(this.mediaStream);
    // attach the gameStream to the board
    this.board.attachStream(this.gameStream);
    // "attach" the board to the gameStream
    this.board.bind('insertActions', this.gameStream.onInsertActions);
    // "attach" the mediaStream to the GUI
    this.mediaStream.bind('statusChange', this.onStatusChange);

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
    this.html.appendChild(this.gameInterface.html({
        position: "absolute",
        left:     "770px",
//        top:      "434px"
        top:      "461px"
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

    // The game stream is set to the initial (starting) position,
    // the other components are initialized
    this.board.init();
    this.gameStream.update(0);
    this.mediaInterface.init(this.mediaStream);
    this.mediaStream.init();
    this.gameInterface.init(this.gameStream, this.mediaStream);

    
    var self=this;
    this.onStatusChange = function(newstatus) {
        if (newstatus.failed) {
            // TODO: should load the fallback media stream...
            alert("Media stream loading failed!");
        }
    };
};


DisplayGUI.prototype.hide = function() {
    $("div#"+this.id+" ").hide();
};

DisplayGUI.prototype.show = function() {
    $("div#"+this.id+" ").show();
};

    