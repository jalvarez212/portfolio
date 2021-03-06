//The MIT License (MIT) - See Licence.txt for details

//Copyright (c) 2013 Mick Grierson, Matthew Yee-King, Marco Gillies


Maxim maxim;


void setup()
{
  size(600, 600);
  maxim = new Maxim(this);
  player = maxim.loadFile("");
  player.setLooping(false);
  player.volume(0.45);
  background(0);
  rectMode(CENTER);
  textSize(24);
  text("Draw on the screen to get started", 10, 30);


}


//void draw()
//{
//  
//}

void mouseMoved()
{
  player.play();
  float red = map(mouseX, 0, width, 0, 255);
  float blue = map(mouseY, 0, width, 0, 255);
  float green = dist(mouseX,mouseY,width/2,height/2);
  
  float speed = dist(pmouseX, pmouseY, mouseX, mouseY);
  float alpha = map(speed, 0, 20, 0, 5);
  //println(alpha);
  float lineWidth = map(speed, 0, 10, 10, 1);
  lineWidth = constrain(lineWidth, 0, 10);
  
  noStroke();
  fill(0, alpha);
  rect(width/2, height/2, width, height);
  
  stroke(red, green, blue, 255);
  strokeWeight(lineWidth);
  strokeCap(ROUND);
  
  //rect(mouseX, mouseY, speed, speed);
  //line(pmouseX, pmouseY,mouseX, mouseY);
  //brush1(mouseX, mouseY,speed, speed,lineWidth);
  //brush2(mouseX, mouseY,speed, speed,lineWidth);
  //brush3(mouseX, mouseY,speed, speed,lineWidth);
  //brush4(pmouseX, pmouseY,mouseX, mouseY,lineWidth);

  brush5(pmouseX, pmouseY,mouseX, mouseY, lineWidth);
//brush6(mouseX, mouseY,speed, speed,lineWidth);
  //brush7(pmouseX, pmouseY,mouseX, mouseY,lineWidth);

  player.setFilter(map(mouseY,0,height,50,5000),10);
  player2.ramp(1.,1000);
  player2.speed((float) mouseX/width/2);
}

void mouseReleased()
{

  player2.ramp(0.,1000);

        
}


//The MIT License (MIT) - See Licence.txt for details

//Copyright (c) 2013 Mick Grierson, Matthew Yee-King, Marco Gillies


void brush1(int x,int y, int px, int py, int lineWidth) {
  strokeWeight(lineWidth);
  ellipse(x,y,px,py); 
  
  return;
}


void brush2(int x,int y, int px, int py, int lineWidth) {
  strokeWeight(lineWidth);
  pushMatrix();
  translate(x,y);
  rotate(random(px));
  rect(0+random(50),0+random(50),10,10); 
  popMatrix();
  return;
}

void brush3(int x,int y, int px, int py, int lineWidth) {
  strokeWeight(lineWidth);
  pushMatrix();
  translate(x,y);
  rotate(random(px));
  line(0+random(50),0+random(50),0,0);
  rotate(random(px));
  line(0+random(50),0+random(50),0,0);
  rotate(random(px));
  line(0+random(50),0+random(50),0,0);
  popMatrix();

  return;
}

void brush4(int x,int y, int px, int py, int lineWidth) {
  strokeWeight(lineWidth);
  line(px,py,x,y);
  line(px,py,x,y);
  line(width/2+((width/2)-px),py,width/2+((width/2)-x),y);
  line(px,height/2+((height/2)-py),x,height/2+((height/2)-y));
  line(width/2+((width/2)-px),height/2+((height/2)-py),width/2+((width/2)-x),height/2+((height/2)-y));
  return;
}

void brush5(int x,int y, int px, int py, int lineWidth) {
  strokeWeight(lineWidth);
  line(px,py,x,y);
  line(width/2+((width/2)-px),py,width/2+((width/2)-x),y);
  line(px,height/2+((height/2)-py),x,height/2+((height/2)-y));
  line(width/2+((width/2)-px),height/2+((height/2)-py),width/2+((width/2)-x),height/2+((height/2)-y));
  line(width/2+((width/2)-py),width/2-((width/2)-px),width/2+((width/2)-y),width/2-((width/2)-x));
  line(height/2-((height/2)-py),width/2-((width/2)-px),height/2-((height/2)-y),width/2-((width/2)-x));
  line(width/2+((width/2)-py),height/2+((height/2)-px),width/2+((width/2)-y),height/2+((height/2)-x));
  line(width/2-((width/2)-py),height/2+((height/2)-px),width/2-((width/2)-y),height/2+((height/2)-x));
  return;
}


void brush55(int x,int y, int px, int py, int lineWidth) {
  strokeWeight(lineWidth);
  line(px,py,x,y);
  line(width/4+((width/4)-px),py,width/4+((width/4)-x),y);
  line(px,height/4+((height/4)-py),x,height/4+((height/4)-y));
  line(width/4+((width/4)-px),height/4+((height/4)-py),width/4+((width/4)-x),height/4+((height/4)-y));
  line(width/4+((width/4)-py),width/4-((width/4)-px),width/2+((width/4)-y),width/4-((width/4)-x));
  line(height/4-((height/4)-py),width/4-((width/4)-px),height/4-((height/4)-y),width/4-((width/4)-x));
  line(width/4+((width/4)-py),height/4+((height/4)-px),width/4+((width/4)-y),height/4+((height/4)-x));
  line(width/4-((width/4)-py),height/4+((height/4)-px),width/4-((width/4)-y),height/4+((height/4)-x));
  return;
}

void brush6(int x,int y, int px, int py, int lineWidth) {
  strokeWeight(lineWidth);
  px=px+random(50);
  py=py+random(50);
  ellipse(x,y,px,py);
  ellipse(width/2+((width/2)-x),y,px,py);
  ellipse(x,height/2+((height/2)-y),px,py);
  ellipse(width/2+((width/2)-x),height/2+((height/2)-y),px,py);
  ellipse(width/2+((width/2)-y),width/2-((width/2)-x),px,py);
  ellipse(height/2-((height/2)-y),width/2-((width/2)-x),px,py);
  ellipse(width/2+((width/2)-y),height/2+((height/2)-x),px,py);
  ellipse(width/2-((width/2)-y),height/2+((height/2)-x),px,py);  
  return;
}

void brush7(int x,int y, int px, int py, int lineWidth) {
  strokeWeight(lineWidth);
  line(px,py,x,y);
  line(width/2+((width/2)-px),py,width/2+((width/2)-x),y);
  return;
}
