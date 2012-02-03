function DisplayGUI(base_id,sources,media_type,max_duration,width,height) {
    /*
       id=base_id   = ID
       media_id     = ID_media
       interface_id = ID_interface
       board_id     = ID_board
       game_id      = ID_game
    */
    this.id=base_id;
    this.board=new BoardWidget(this.id+"_board");
    this.media_stream=new MediaStream(this.id+"_media_stream",sources,media_type,max_duration,width,height);
    this.media_interface=new MediaInterface(this.id+"_media_interface");
    this.game_stream=new GameStream(this.id+"_game",this.board,max_duration);

    // For testing
    this.txt_element=createBox(this.id+"_game_rgftree","Current RGF Tree",500,500,640,10);
    document.body.appendChild(this.txt_element);

    // Set up the placement in the body/some container
    document.body.appendChild(this.board.board_element);
    document.body.appendChild(this.media_stream.media_element);
    document.body.appendChild(this.media_interface.interface_element);

    // Initialize the MediaStream and its interface(s)
    this.media_stream.initPlayer();
    this.media_interface.initMediaInterface(this.media_stream);
    this.media_stream.addInterface(this.game_stream.updatedStatus.bind(this.game_stream),this.game_stream.updatedTime.bind(this.game_stream));
    
    // Initialize the the starting Board position
    this.game_stream.update(0);
};

