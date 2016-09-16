(function (window){

	
	var allCanvases = []; //holds all canvas objects and their boxes
	var INTERVAL = 20;  // how often, in milliseconds, we check to see if a redraw is needed
	var isDrag = false;
	var isResizeDrag = false;
	var expectResize = -1; // New, will save the # of the selection handle if the mouse is over one.
	var mx, my; // mouse coordinates

	// The node (if any) being selected.
	// If in the future we want to select multiple objects, this will get turned into an array
	var mySel = null;

	// The selection color and width. Right now we have a red selection with a small width
	var mySelColor = '#CC0000';
	var mySelWidth = 2;
	var mySelBoxColor = 'darkred'; // New for selection boxes
	var mySelBoxSize = 6;

	// New, holds the 8 tiny boxes that will be our selection handles
	// the selection handles will be in this order:
	// 0  1  2
	// 3     4
	// 5  6  7
	var selectionHandles = [];


	// we use a fake canvas to draw individual shapes for selection testing
	var ghostcanvas;
	var gctx; // fake canvas context

	// since we can drag from anywhere in a node
	// instead of just its x/y corner, we need to save
	// the offset of the mouse when we start dragging.
	var offsetx, offsety;

	// Padding and border style widths for mouse offsets
	var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;

	function drawableCanvasObject(canvas, backgroundImage){
		this.canvas = canvas;
		this.img = backgroundImage;
		this.ctx = canvas.getContext('2d');
		this.isValid = false;
		this.boxes2 = [];
		this.width = canvas.width;
		this.height = canvas.height;
	}

	function createCanvas(img, canvasIdentifier){
		var imgWidth = img.width;
		var imgHeight = img.height;

		var p = img.parentElement;
		var drawableCanvas = document.createElement("div");
		drawableCanvas.classList.add("drawableDiv");
		drawableCanvas.setAttribute("width", imgWidth);

		img.setAttribute("style", "display:none");

		var canvasElement = document.createElement("canvas");
		canvasElement.setAttribute("width", imgWidth);
		canvasElement.setAttribute("height", imgHeight);
		canvasElement.setAttribute("canvpos", canvasIdentifier);

		p.appendChild(drawableCanvas);
		drawableCanvas.appendChild(canvasElement);

		var canvasImg = new Image();
		canvasImg.onload = function(){
			var x = new drawableCanvasObject(canvasElement, img);
			allCanvases.push(x);

			initializeCanvas(x);
		}

		canvasImg.src = img.getAttribute("src");
	}

	function initializeCanvas(canvasObject){
		canvas = canvasObject.canvas;
		var HEIGHT = canvasObject.height;
		var WIDTH = canvasObject.width;
		ctx = canvasObject.ctx;

		//fixes a problem where double clicking causes text to get selected on the canvas
		canvas.onselectstart = function () { return false; }

		// fixes mouse co-ordinate problems when there's a border or padding
		// see getMouse for more detail
		if (document.defaultView && document.defaultView.getComputedStyle) {
			stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)     || 0;
			stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)      || 0;
			styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10) || 0;
			styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)  || 0;
		}

	  // set our events. Up and down are for dragging,
	  // double click is for making new boxes
	  canvas.onmousedown = myDown;
	  canvas.onmouseup = myUp;
	  canvas.ondblclick = myDblClick;
	  canvas.onmousemove = myMove;	
	  
	  addRect(canvasObject, 260, 70, 60, 65, 'rgba(0, 205, 0, 0.7)');

	 // set up the selection handle boxes
	  for (var i = 0; i < 8; i ++) {
	    var rect = new Box2;
	    selectionHandles.push(rect);
	  }	

	  setInterval(function(){mainDraw(canvasObject)}, INTERVAL);	
	}

	// Main draw loop.
	// While draw is called as often as the INTERVAL variable demands,
	// It only ever does something if the canvas gets invalidated by our code
	function mainDraw(canvasObject) {

		var ctx = canvasObject.ctx;
		var backImage = canvasObject.img;

		if (canvasObject.isValid == false) {
			clear(canvasObject);

		// Add stuff you want drawn in the background all the time here
		/* added by Miguel */
		if(backImage != 'undefined') {
		  ctx.drawImage(backImage, 0,0, canvasObject.width, canvasObject.height);
		}

		// draw all boxes
		var l = canvasObject.boxes2.length;
		for (var i = 0; i < l; i++) {
		  canvasObject.boxes2[i].draw(ctx); // we used to call drawshape, but now each box draws itself
		}

		// Add stuff you want drawn on top all the time here

		canvasObject.isValid = true;
		}
	}	


	//wipes the context
	function clear(canvasObject){
		canvasObject.ctx.clearRect(0, 0, canvasObject.width, canvasObject.height);
	}

	//Initialize a new Box, add it, and invalidate the canvas
	function addRect(canvasObject, x, y, w, h, fill) {
	  var rect = new Box2;
	  rect.x = x;
	  rect.y = y;
	  rect.w = w
	  rect.h = h;
	  rect.fill = fill;
	  canvasObject.boxes2.push(rect);
	  invalidate(canvasObject);
	}

	// Box object to hold data
	function Box2() {
	  this.x = 0;
	  this.y = 0;
	  this.w = 1; // default width and height?
	  this.h = 1;
	  this.fill = '#444444';
	}

	// New methods on the Box class
	Box2.prototype = {
	  // we used to have a solo draw function
	  // but now each box is responsible for its own drawing
	  // mainDraw() will call this with the normal canvas
	  // myDown will call this with the ghost canvas with 'black'
	  draw: function(context, optionalColor) {

	  	  var WIDTH = context.canvas.width;
	  	  var HEIGHT = context.canvas.height;

	      if (context === gctx) {
	        context.fillStyle = 'black'; // always want black for the ghost canvas
	      } else {
	        context.fillStyle = this.fill;
	      }
	      
	      // We can skip the drawing of elements that have moved off the screen:
	      if (this.x > WIDTH || this.y > HEIGHT) return; 
	      if (this.x + this.w < 0 || this.y + this.h < 0) return;
	      
	      context.fillRect(this.x,this.y,this.w,this.h);
	            
	    // draw selection
	    // this is a stroke along the box and also 8 new selection handles
	    if (mySel === this) {
	      context.strokeStyle = mySelColor;
	      context.lineWidth = mySelWidth;
	      context.strokeRect(this.x,this.y,this.w,this.h);
	      
	      // draw the boxes
	      
	      var half = mySelBoxSize / 2;
	      
	      // 0  1  2
	      // 3     4
	      // 5  6  7
	      
	      // top left, middle, right
	      selectionHandles[0].x = this.x-half;
	      selectionHandles[0].y = this.y-half;
	      
	      selectionHandles[1].x = this.x+this.w/2-half;
	      selectionHandles[1].y = this.y-half;
	      
	      selectionHandles[2].x = this.x+this.w-half;
	      selectionHandles[2].y = this.y-half;
	      
	      //middle left
	      selectionHandles[3].x = this.x-half;
	      selectionHandles[3].y = this.y+this.h/2-half;
	      
	      //middle right
	      selectionHandles[4].x = this.x+this.w-half;
	      selectionHandles[4].y = this.y+this.h/2-half;
	      
	      //bottom left, middle, right
	      selectionHandles[6].x = this.x+this.w/2-half;
	      selectionHandles[6].y = this.y+this.h-half;
	      
	      selectionHandles[5].x = this.x-half;
	      selectionHandles[5].y = this.y+this.h-half;
	      
	      selectionHandles[7].x = this.x+this.w-half;
	      selectionHandles[7].y = this.y+this.h-half;

	      
	      context.fillStyle = mySelBoxColor;
	      for (var i = 0; i < 8; i ++) {
	        var cur = selectionHandles[i];
	        context.fillRect(cur.x, cur.y, mySelBoxSize, mySelBoxSize);
	      }
	    }
	    
	  } // end draw

	}

	function clearGhost(canvasObject){
		gctx.clearRect(0, 0, canvasObject.width, canvasObject.height);
	}	

	function invalidate(canvasObject){
		canvasObject.isValid = false;
	}

	// Happens when the mouse is clicked in the canvas
	function myDown(e){
	  getMouse(e);
	  
	  //we are over a selection box
	  if (expectResize !== -1) {
	    isResizeDrag = true;
	    return;
	  }

	  var element = e.target;
	  var canvasObject = allCanvases[parseInt(element.getAttribute("canvpos"))];

	  if(gctx == null || (ghostcanvas.width != canvasObject.width && ghostcanvas.height != canvasObject.height)){
	  	ghostcanvas = document.createElement("canvas");
	  	ghostcanvas.width = canvasObject.width;
	  	ghostcanvas.height = canvasObject.height;
	  	gctx = ghostcanvas.getContext('2d');
	  }
	  
	  clearGhost(canvasObject);
	  var l = canvasObject.boxes2.length;
	  for (var i = l-1; i >= 0; i--) {
	    // draw shape onto ghost context
	    canvasObject.boxes2[i].draw(gctx, 'black');
	    
	    // get image data at the mouse x,y pixel
	    var imageData = gctx.getImageData(mx, my, 1, 1);
	    
	    // if the mouse pixel exists, select and break
	    if (imageData.data[3] > 0) {
	      mySel = canvasObject.boxes2[i];
	      offsetx = mx - mySel.x;
	      offsety = my - mySel.y;
	      mySel.x = mx - offsetx;
	      mySel.y = my - offsety;
	      isDrag = true;
	      
	      invalidate(canvasObject);
	      clearGhost(canvasObject);
	      return;
	    }
	    
	  }
	  // havent returned means we have selected nothing
	  mySel = null;
	  // clear the ghost canvas for next time
	  clearGhost(gctx);
	  // invalidate because we might need the selection border to disappear
	  invalidate(canvasObject);
	}	


	// Happens when the mouse is moving inside the canvas
	function myMove(e){

		var element = e.target;
		var canvasObject = allCanvases[parseInt(element.getAttribute("canvpos"))];	
	  if (isDrag) {
	    getMouse(e);
	    
	    mySel.x = mx - offsetx;
	    mySel.y = my - offsety;   
	    
	    // something is changing position so we better invalidate the canvas!
	    invalidate(canvasObject);
	  } else if (isResizeDrag) {
	    // time ro resize!
	    var oldx = mySel.x;
	    var oldy = mySel.y;
	    
	    // 0  1  2
	    // 3     4
	    // 5  6  7
	    switch (expectResize) {
	      case 0:
	        mySel.x = mx;
	        mySel.y = my;
	        mySel.w += oldx - mx;
	        mySel.h += oldy - my;
	        break;
	      case 1:
	        mySel.y = my;
	        mySel.h += oldy - my;
	        break;
	      case 2:
	        mySel.y = my;
	        mySel.w = mx - oldx;
	        mySel.h += oldy - my;
	        break;
	      case 3:
	        mySel.x = mx;
	        mySel.w += oldx - mx;
	        break;
	      case 4:
	        mySel.w = mx - oldx;
	        break;
	      case 5:
	        mySel.x = mx;
	        mySel.w += oldx - mx;
	        mySel.h = my - oldy;
	        break;
	      case 6:
	        mySel.h = my - oldy;
	        break;
	      case 7:
	        mySel.w = mx - oldx;
	        mySel.h = my - oldy;
	        break;
	    }
	    
	    invalidate(canvasObject);
	  }
	  
	  getMouse(e);
	  // if there's a selection see if we grabbed one of the selection handles
	  if (mySel !== null && !isResizeDrag) {
	    for (var i = 0; i < 8; i++) {
	      // 0  1  2
	      // 3     4
	      // 5  6  7
	      
	      var cur = selectionHandles[i];
	      
	      // we dont need to use the ghost context because
	      // selection handles will always be rectangles
	      if (mx >= cur.x && mx <= cur.x + mySelBoxSize &&
	          my >= cur.y && my <= cur.y + mySelBoxSize) {
	        // we found one!
	        expectResize = i;
	        invalidate(canvasObject);
	        
	        switch (i) {
	          case 0:
	            this.style.cursor='nw-resize';
	            break;
	          case 1:
	            this.style.cursor='n-resize';
	            break;
	          case 2:
	            this.style.cursor='ne-resize';
	            break;
	          case 3:
	            this.style.cursor='w-resize';
	            break;
	          case 4:
	            this.style.cursor='e-resize';
	            break;
	          case 5:
	            this.style.cursor='sw-resize';
	            break;
	          case 6:
	            this.style.cursor='s-resize';
	            break;
	          case 7:
	            this.style.cursor='se-resize';
	            break;
	        }
	        return;
	      }
	      
	    }
	    // not over a selection box, return to normal
	    isResizeDrag = false;
	    expectResize = -1;
	    this.style.cursor='auto';
	  }
	  
	}

	function myUp(){

	  if(isDrag || isResizeDrag || expectResize > 0){
	    isDrag = false;
	    isResizeDrag = false;
	    expectResize = -1;  
	  }  

	  return;
	}

	// adds a new node
	function myDblClick(e) {
		getMouse(e);
		var element = e.target;
		var canvasObject = allCanvases[parseInt(element.getAttribute("canvpos"))];

		// for this method width and height determine the starting X and Y, too.
		// so I left them as vars in case someone wanted to make them args for something and copy this code
		var width = 20;
		var height = 20;

		addRect(canvasObject, mx - (width / 2), my - (height / 2), width, height, 'rgba(255,255,255,0.2)');
	}

	// Sets mx,my to the mouse position relative to the canvas
	// unfortunately this can be tricky, we have to worry about padding and borders
	function getMouse(e) {
	      var offsetX = 0, offsetY = 0;
		  var element = e.target;

	      if (element.offsetParent) {
	        do {
	          offsetX += element.offsetLeft;
	          offsetY += element.offsetTop;
	        } while ((element = element.offsetParent));
	      }

	      // Add padding and border style widths to offset
	      offsetX += stylePaddingLeft;
	      offsetY += stylePaddingTop;

	      offsetX += styleBorderLeft;
	      offsetY += styleBorderTop;

	      mx = e.pageX - offsetX;
	      my = e.pageY - offsetY
	}



	function initialize(){
		var cList = document.querySelectorAll("img.imas");
		var count = 0;
		[].forEach.call(cList, function(item){
			createCanvas(item, count);
			count++;
		});

		this.addNewRect = function(canvasObject, x, y, w, h, fill){
			var rect = new Box2;
			rect.x = x;
			rec.y= y;
			rect.w = w;
			rect.h = h;
			rect.fill = fill;
			canvasObject.boxes2.push(rect);
			canvasObject.isValid = false;
			return;
		}

		this.annos = allCanvases;
		return this;
	}
	window.onload = function(){
		window.imas = initialize();
	}
})(window)