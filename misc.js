// the following two functions are used to get stable sorting, which is needed
function merge(left,right,comparison) {
    var result = new Array();
    while((left.length > 0) && (right.length > 0)) {
        if(comparison(left[0],right[0]) <= 0) result.push(left.shift());
        else result.push(right.shift());
    }
    while(left.length > 0) result.push(left.shift());
    while(right.length > 0) result.push(right.shift());
    return result;
};

function merge_sort(array,comparison) {
    if(array.length < 2)
        return array;
    var middle = Math.ceil(array.length/2);
    return merge(
        merge_sort(array.slice(0,middle),comparison),
        merge_sort(array.slice(middle),comparison),
        comparison);
};


// only for testing
function createBox(id,title,width,height,left,top) {
    var el,tmp;
    var title_height=20;
    el=document.createElement("div");
        tmp=document.createElement("div");
        tmp.style.position="absolute";
        tmp.style.width=width+"px";
        tmp.style.height=title_height+"px";
        tmp.style.left=left+"px";
        tmp.style.top=top+"px";
        tmp.style.border="solid grey 1px";
        tmp.style.overflow="hidden";
        tmp.style.fontWeight="bold";
        tmp.style.fontSize="100%";
        tmp.style.padding=4+"px";
        tmp.innerHTML=title;
        tmp.id=id+"_title";
        el.appendChild(tmp);

        tmp=document.createElement("div");
        tmp.style.position="absolute";
        tmp.style.width=width+"px";
        tmp.style.height=height+"px";
        tmp.style.left=left+"px";
        tmp.style.top=(top+title_height+13)+"px";
        tmp.style.border="solid black 1px";
        tmp.style.padding=4+"px";
        tmp.style.overflow="auto";
        tmp.id=id;
        el.appendChild(tmp);
    return el;
};

function BoardWidget(board_id) {
/*  Go board internals/etc (should already exist)
    Has no information about time...
    Maybe also responsible for the drawing of the go board and/or variations (no idea)
    This is just here for testing!
*/
    this.board_id=board_id;
    this.sgftree;
    // for drawing (?)
    this.board_element=this._initBoardElement(this.board_id);
};
BoardWidget.prototype._initBoardElement=function(id) {
    // only for testing at the moment
    return createBox(id,"During Recording (without any tree structure)",500,500,640,10);
};
BoardWidget.prototype.clear=function() {
    // Clears the whole game stream variation tree, reseting to an "initial" empty one.
   
    // For testing:
    $('div#'+this.board_id).text("");
};

BoardWidget.prototype.apply=function(data) {
    // For testing:
    var rec_el=$('div#'+this.board_id);
    if (data.property=="KeyFrame") {
        rec_el.text(data.arg);
    } else if (data.property=="Ended") {
        rec_el.append("<br/>"+"Game ended.").show();
    } else {
        if (data.property[0]==";") {
            rec_el.append("<br/>;TS["+data.time+"] ");
            rec_el.append(data.property.slice(-(data.property.length-1))+"["+data.arg+"]").show();
        } else {
            rec_el.append(" ");
            rec_el.append(data.property+"["+data.arg+"]").show();
        }
        // note that the line below is exactly "NOT" what is usually done by the
        // board drawing or creation of the sgf tree!
        if (data.time!=-1) rec_el.append("TS["+data.time+"]").show();
    }
};


/*  A single modification on the go board. Depends on the actual implementation... */
function Action(time,property,arg,position) {
    this.time=time;
    /* the following two arguments (property/position) could e.g. also be queryied in
       the RGF game tree, so maybe position alone is enough... */
    this.property=property;
    this.arg=arg;
    this.position=position;
};
