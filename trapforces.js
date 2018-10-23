(function (exports){

var sphere;
var canvas, ctx;
var isDragging=false;
var firstClick=false;
var coords;
var nmedium = 1.33;
var nbead = 1.6;

var ray1, ray2;
//var M = {x:0, y:0};
var theta;

var Ray = function(theta){
  this.init(theta);
}

Ray.prototype = {
  init: function(theta){
    this.p0 = {x: canvas.width/2.+canvas.width/2.*Math.tan(theta), y: canvas.width*1.15};
    this.v0 = {x: -Math.sin(theta), y: -Math.cos(theta)};
    this.p1 = null;  // 1st intersection
  },
  trace: function(){
    var n, theta1, theta2, r;
    this.p1 = getIntersection1(this.p0, this.v0);
    if (this.p1 != null){
      //this.p1=p;
      n = direction(this.p1, sphere)

      //Fresnel reflection coeff for s polarized light (orthogonal to screen plane)
      theta1=Math.acos(Math.abs(this.v0.x*n.x+this.v0.y*n.y));
  		theta2=Math.asin(Math.sin(theta1)*nmedium/nbead);
  		//Fresnel reflection coeff for s polarized light (orthogonal to applet plane)
  		r=(nmedium*Math.cos(theta1)-nbead*Math.cos(theta2))/(nmedium*Math.cos(theta1)+nbead*Math.cos(theta2));
  		this.r = r*r;
      this.t = 1-this.r;

      this.v1 = refract(this.v0, n, nmedium, nbead);
      this.v1r = reflect(this.v0, n);

      this.p2 = getIntersection2(this.p1, this.v1);
      n = direction(sphere, this.p2)
      this.v2 = refract(this.v1, n, nbead, nmedium);
      this.v2r = reflect(this.v1, n);

      this.p3 = getIntersection2(this.p2, this.v2r);
      n = direction(sphere, this.p3)
      this.v3 = refract(this.v2r, n, nbead, nmedium);
    }
  },
  drawRays: function(){
    ctx.lineWidth=5;
    ctx.strokeStyle="#00dd00";
    // incident ray
    ctx.globalAlpha=1;
    ctx.beginPath();
    ctx.moveTo(this.p0.x, this.p0.y);
    if (this.p1 != null) {
      ctx.lineTo(this.p1.x, this.p1.y);
    } else {
      ctx.lineTo(this.p0.x+this.v0.x*1000, this.p0.y+this.v0.y*1000);
    }
    ctx.stroke();

    if (this.p1 != null) {
      // 1st reflected ray
      var gamma = 0.6;
      ctx.globalAlpha=Math.pow(this.r, gamma);
      ctx.beginPath();
      ctx.moveTo(this.p1.x, this.p1.y);
      ctx.lineTo(this.p1.x+this.v1r.x*1000, this.p1.y+this.v1r.y*1000);
      ctx.stroke();

      // inside refracted ray
      ctx.globalAlpha=Math.pow(this.t, gamma);
      ctx.beginPath();
      ctx.moveTo(this.p1.x, this.p1.y);
      ctx.lineTo(this.p2.x, this.p2.y);
      ctx.stroke();

      // 1st outside refracted ray
      ctx.globalAlpha=Math.pow(this.t*this.t, gamma);
      ctx.globalAlpha=(1-this.r)*(1-this.r);
      ctx.beginPath();
      ctx.moveTo(this.p2.x, this.p2.y);
      ctx.lineTo(this.p2.x+this.v2.x*1000, this.p2.y+this.v2.y*1000);
      ctx.stroke();

      // inside reflected ray
      ctx.globalAlpha=Math.pow(this.t*this.r, gamma);
      ctx.beginPath();
      ctx.moveTo(this.p2.x, this.p2.y);
      ctx.lineTo(this.p3.x, this.p3.y);
      ctx.stroke();

      // 2nd outside refracted ray
      ctx.globalAlpha=Math.pow(this.t*this.t*this.r, gamma);
      ctx.beginPath();
      ctx.moveTo(this.p3.x, this.p3.y);
      ctx.lineTo(this.p3.x+this.v3.x*1000, this.p3.y+this.v3.y*1000);
      ctx.stroke();


      // incident direction
      ctx.setLineDash([15, 15]);
      ctx.lineWidth=3;
      ctx.globalAlpha=1;
      ctx.strokeStyle="#dddddd";
      ctx.beginPath();
      ctx.moveTo(this.p2.x, this.p2.y);
      ctx.lineTo(this.p2.x+this.v0.x*1000, this.p2.y+this.v0.y*1000);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  },

  drawMomentum: function(){
    var m,m1,m2,m3;

    if (this.p1 != null) {

      //exchanged momentum
      var power, power0, p;
      power0=180;

      // reflected ray
      power=power0*this.r;
      m1 = {x: power*(this.v1r.x-this.v0.x), y: power*(this.v1r.y-this.v0.y)};
      //p = {x: this.p1.x+this.m1.x, y: this.p1.y+this.m1.y};
      drawArrow(this.p1, m1, "#0000ff");

      // 1st outside refracted
      power=power0*this.t*this.t;
      p = {x: this.p2.x+this.v0.x*power, y: this.p2.y+this.v0.y*power }
      m2 = {x: power*(this.v2.x-this.v0.x), y: power*(this.v2.y-this.v0.y)};
      //p = {x: this.p2.x+this.m2.x, y: this.p2.y+this.m2.y};
      drawArrow(p, m2, "#0000ff");

      // 2nd outside refracted
      power=power0*this.t*this.t*this.r;
      m3 = {x: power*(this.v3.x-this.v0.x), y: power*(this.v3.y-this.v0.y)};
      //p = {x: this.p3.x+this.m3.x, y: this.p3.y+this.m3.y};
      drawArrow(this.p3, m3, "#0000ff");

      m = {x: m1.x+m2.x+m3.x, y: m1.y+m2.y+m3.y};
    } else {
      m = {x: 0, y: 0};
    }
    return m;
  }
}

function norm(v){
  return Math.sqrt(v.x*v.x+v.y*v.y);
}

function normalize(v){
  var nv = norm(v);
  return {x: v.x/nv, y: v.y/nv};
}

function direction(p1, p2){
  //return versor pointing form point p1 to p2
  var v = {x: p1.x-p2.x, y: p1.y-p2.y};
  return normalize(v);
}


function getIntersection1(p0, v){
  //Returns the next intersection point with the sphere
  //of a ray starting at p0 (outside sphere) with diretion  v
  var t, A, B, delta, R;

  R=sphere.width/2.;
  A=v.x*(sphere.x-p0.x)+v.y*(sphere.y-p0.y);
  delta=Math.pow(v.x*(p0.x-sphere.x)+v.y*(p0.y-sphere.y),2)+R*R-Math.pow(p0.x-sphere.x,2)-Math.pow(p0.y-sphere.y, 2);

  if (delta >= 0){//intersection exists
    B=Math.sqrt(delta);
    t=A-B;
    return {x: p0.x+v.x*t, y: p0.y+v.y*t};
  } else {
    return null;
    }
  }

function getIntersection2(p0, v){
  //Returns the next intersection point with the sphere
  //of a ray starting at po (inside sphere) with diretion  v
  var t, A, B, delta, R;

  R=sphere.width/2.;
  A=v.x*(sphere.x-p0.x)+v.y*(sphere.y-p0.y);
  delta=Math.pow(v.x*(p0.x-sphere.x)+v.y*(p0.y-sphere.y),2)+R*R-Math.pow(p0.x-sphere.x,2)-Math.pow(p0.y-sphere.y, 2);

  B=Math.sqrt(delta);
  t=A+B;
  return {x: p0.x+v.x*t, y: p0.y+v.y*t};
  }


function refract(v, n, n1, n2) {
    var t, vt, vt2, vn2;
    t={x: -n.y, y: n.x};
    vt=v.x*t.x+v.y*t.y;
    vt2=vt*n1/n2;
    vn2=-Math.sqrt(1.-vt2*vt2);
    return {x: vn2*n.x+vt2*t.x, y: vn2*n.y+vt2*t.y};
    }

function reflect(v, n){
  	var dot;
  	dot = v.x*n.x+v.y*n.y;
  	return {x: v.x-2.*dot*n.x, y: v.y-2.*dot*n.y};
  	}


function drawLine(p1, p2){
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
}

function drawArrow(p1, v, color){
  var uv, p2;
  var tiph=15;
  var tipw=10;
  if (norm(v)>1){
    uv = normalize(v);
    p2 = {x: p1.x+v.x, y: p1.y+v.y};

    ctx.globalAlpha=1;

    ctx.lineWidth=5;
    ctx.strokeStyle=color;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x-.5*uv.x*tiph, p2.y-.5*uv.y*tiph);
    ctx.stroke();

    ctx.lineWidth=1;
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.moveTo(p2.x, p2.y);
    ctx.lineTo(p2.x-tiph*uv.x-tipw*uv.y, p2.y-tiph*uv.y+tipw*uv.x);
    ctx.lineTo(p2.x-.5*tiph*uv.x, p2.y-.5*tiph*uv.y);
    ctx.lineTo(p2.x-tiph*uv.x+tipw*uv.y, p2.y-tiph*uv.y-tipw*uv.x);
    ctx.lineTo(p2.x, p2.y);
    ctx.fill();
  }
}



function draw(){
  ctx.clearRect(0,0,canvas.width, canvas.width);


  // guidelines

  /*
  if (ray1.p1 != null){
    ctx.strokeStyle="#dddddd";
    ctx.beginPath();
    ctx.moveTo(ray1.p2.x, ray1.p2.y);
    ctx.lineTo(ray1.p2.x+ray1.v0.x*1000, ray1.p2.y+ray1.v0.y*1000);
    ctx.stroke();
  }

  if (ray2.p1 != null){
    ctx.strokeStyle="#dddddd";
    ctx.beginPath();
    ctx.moveTo(ray2.p2.x, ray2.p2.y);
    ctx.lineTo(ray2.p2.x+ray2.v0.x*1000, ray2.p2.y+ray2.v0.y*1000);
    ctx.stroke();
  }
*/

  ray1.drawRays();
  ray2.drawRays();
  ctx.drawImage(sphere.img, sphere.x-sphere.width/2., sphere.y-sphere.height/2., sphere.width, sphere.height);

  // momentum exchange
  var M1, M2;
  M1 = ray1.drawMomentum();
  M2 = ray2.drawMomentum();
  M = {x: -M1.x-M2.x, y: -M1.y-M2.y};
  //p = {x: sphere.x+M.x, y: sphere.y+M.y};
  drawArrow(sphere, M, "#ff0000");
}

exports.initCanvas = function(){
  var style;

  //imsphere.src = 'sphere.png';
  coords = document.getElementById("coords");

  canvas = document.getElementById("myCanvas");
  style = window.getComputedStyle(canvas);
  canvas.setAttribute('width', style.getPropertyValue('width'));
  canvas.setAttribute('height', style.getPropertyValue('width'));
  //setting width in css results in stretched canvas bitmap
  //reset canvas.width from css value
  //canvas.width=canvas.width;
  //canvas.height=canvas.width;

  ctx = canvas.getContext("2d");

  sphere = {
    x: canvas.width/2.,
    y: canvas.width*(.5+.15),
    width: canvas.width*0.4,
    height: canvas.width*0.4,
    img: new Image
  }


  sphere.img.src = 'sphere.png';




  canvas.onmousedown=function(e){handleMouseDown(e);};
  canvas.onmouseup=function(e){handleMouseUp(e);};
  canvas.onmousemove=function(e){handleMouseMove(e);};

  /*
  canvas.addEventListener("onmousedown", handleMouseDown, false);
  canvas.addEventListener("onmouseup", handleMouseUp, false);
  canvas.addEventListener("onmousemove", handleMouseMove, false);
  */

  canvas.addEventListener("touchstart", handleTouchStart, false);
  canvas.addEventListener("touchend", handleTouchEnd, false);
  canvas.addEventListener("touchmove", handleTouchMove, false);

  //canvas.touchstart=function(e){handleTouchStart(e);};
  //canvas.touchend=function(e){handleTouchEnd(e);};
  //canvas.touchmove=function(e){handleTouchMove(e);};



  theta = 17*Math.PI/180.;
  document.getElementById("NA").innerHTML = (nmedium*Math.sin(theta)).toFixed(2);
  document.getElementById("index").innerHTML = nbead.toFixed(2);

  ray1 = new Ray(theta);
  ray2 = new Ray(-theta);

  //var p = {x: 0, y: canvas.width};
  //var v = {x: Math.cos(theta), y: -Math.sin(theta)};
  //ray1 = new Ray(p, v);
  //var p = {x: canvas.width, y: canvas.width};
  //var v = {x: Math.cos(Math.PI-theta), y: -Math.sin(Math.PI-theta)};
  //ray2 = new Ray(p, v);




  window.setTimeout(onTimeout, 50)

}

exports.setTheta = function(newtheta){
  theta=newtheta/180.*Math.PI;
  ray1.init(theta);
  ray2.init(-theta);
  document.getElementById("NA").innerHTML = (nmedium*Math.sin(theta)).toFixed(2);
}

exports.setRefractiveIndex = function(val){
  nbead=val/100.;
  document.getElementById("index").innerHTML = nbead.toFixed(2);
}


function handleMouseMove(e){
  if (isDragging){
    canMouseX = parseInt(e.pageX-canvas.offsetLeft);
    canMouseY = parseInt(e.pageY-canvas.offsetTop);
    sphere.x = canMouseX;
    sphere.y = canMouseY;
    isDragging = true;
    //console.log("clientY: "+e.clientY);
    //console.log("pageY: "+e.pageY);
    //console.log("canvas.offsetTop: "+canvas.offsetTop);
    draw();
  }
}

function handleTouchMove(e){
  if (isDragging){
    var touch = e.touches[0];
    canMouseX = parseInt(touch.pageX-canvas.offsetLeft);
    canMouseY = parseInt(touch.pageY-canvas.offsetTop);
    sphere.x = canMouseX;
    sphere.y = canMouseY;
    isDragging = true;
    draw();
    e.preventDefault();
  }
}


function handleMouseDown(e){
  canMouseX = parseInt(e.pageX-canvas.offsetLeft);
  canMouseY = parseInt(e.pageY-canvas.offsetTop);
  sphere.x = canMouseX;
  sphere.y = canMouseY;
  isDragging = true;
  firstClick = true;
  draw();
}

function handleTouchStart(e){
  var touch = e.touches[0];
  canMouseX = parseInt(touch.pageX-canvas.offsetLeft);
  canMouseY = parseInt(touch.pageY-canvas.offsetTop);
  sphere.x = canMouseX;
  sphere.y = canMouseY;
  isDragging = true;
  firstClick = true;
  draw();
}


function handleMouseUp(e){
  isDragging = false;
}

function handleTouchEnd(e){
  isDragging = false;
}

function onTimeout(){
  timeStep();
  window.setTimeout(onTimeout, 50);
}

function timeStep(){
  ray1.trace();
  ray2.trace();
  draw();

  var dt=.3;
  if (firstClick && !isDragging){
    sphere.x = sphere.x+M.x*dt;
    sphere.y = sphere.y+M.y*dt;
  }

  if (sphere.y<0) {
    sphere.y=0;
  } else if (sphere.y>canvas.width) {
    sphere.y=canvas.width;
  }

  if (sphere.x<0) {
    sphere.x=0;
  } else if (sphere.x>canvas.width) {
    sphere.x=canvas.width;
  }

}

})(this.TrapForces={})
