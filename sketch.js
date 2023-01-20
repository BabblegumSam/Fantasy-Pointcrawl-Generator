// FANTASY POINTCRAWL GENERATOR
// 16th January, 2023
// Samuel Mui Shen Ern
// A fantasy pointcrawl map generator for storytelling and roleplaying games which uses a
// procedural generation system based on perlin noise and voronoi diagrams to generate
// biomes and locations.

// ATTRIBUTIONS
// voronoi library: https://github.com/Dozed12/p5.voronoi
// pattern-gradient library: https://github.com/antiboredom/p5.patgrad
// scribble library: https://github.com/generative-light/p5.scribble.js

// create empty arrays for the Class objects
let sites = [];
let bridges = [];
let blocks = [];

let paperTexture, newFont;

let siteCount = 15; // this variable sets the number of points on the map

// these variables are for storying the location and biome data from the CSV files
let locTable, desTable, featTable;
let locArr = [];
let valleyArr, plainsArr, hillArr, mountArr, cityArr, strangeArr, desArr, featArr;

function preload() {
  paperTexture = loadImage("texture.jpg");
  newFont = loadFont("If.ttf")

  locTable = loadTable('locations.csv', 'csv', 'header'); // location types
  desTable = loadTable('descriptors.csv', 'csv'); // descriptor types
  featTable = loadTable('features.csv', 'csv'); // feature types
}

function setup() {
    createCanvas(2480, 1240);
    background(255); 
    
    // these variables define the borders of the map
    xBorder = width/20;
    yBorder = height/10;

    // this function initalizes all the arrays used for generation the information
    // for each point on the map
    arrayInitialize();

    // this function creates the topographical relief map
    reliefMap();
    
    // this block of code uses the p5 voronoi library to "scatter" the points across the map
    // and create the bridges that link the points together
    push();
      translate(width/2, 0);
      translate(xBorder, yBorder);
  
      // these functions use the attached p5 voronoi library to generate data 
      // for the Sites and Bridges
	    voronoiRndSites(siteCount, 200); 
	    voronoi(width/2-(xBorder*2), height - (yBorder * 2), true);

      // this function calculates and displays the Sites and Bridges of the Map
      voronoiDisplay(255, 255, 0);
    pop();

    // this function displays the information for each point
    information();
  
    // this function creates the image overlay that gives the map a notepad-like texture
    push();
      translate(-xBorder, -yBorder);

      scale(2.2);

      tint(255, 35);
      image(paperTexture, 0, 0);
    pop();
}

function arrayInitialize() {
  // each point is categorized into one of six "biomes"
  // these are Valley, Plains, Hill, Mountain, City, and Strange
  // each biome has a list of possible location types stored in a specific column of a csv table
  valleyArr = locTable.getColumn("Valley");
  plainsArr = locTable.getColumn("Plains");
  hillArr = locTable.getColumn("Hill");
  mountArr = locTable.getColumn("Mountain");
  cityArr = locTable.getColumn("City");
  strangeArr = locTable.getColumn("Strange");

  // this sorts the columns into a single array for easy access
  locArr = [valleyArr, plainsArr, hillArr, mountArr, cityArr, strangeArr];

  // as the columns of the table are not of the same length, this block of code
  // removes all the empty array elements for the sake of neatness
  for (let array of locArr) {
    for (let i = array.length - 1; i >= 0; i--) {
      if (array[i] == '') {
        array.splice(i, 1);
      }
    }
  }

  // as the descriptor and feature tables only feature one column, I only need
  // to use the getArray() function to sort them into an array
  desArr = desTable.getArray();
  featArr = featTable.getArray();
}

function voronoiSettings(w, h) {
}

function voronoiDisplay(r, g, b) {
  let diagram = voronoiGetDiagram(); // get the voronoi diagram data from the library

  // this 'for loop' loops through the entire list of point Sites generated by the library,
  // creates Site objects using their data, then places them in an array
  for (let i = 0; i < diagram["cells"].length; i++) {
    let x = diagram["cells"][i]["site"]["x"];
    let y = diagram["cells"][i]["site"]["y"];
    let s = new Site(x, y, diagram["cells"][i]["site"]["voronoiId"]);
    sites.push(s);

    // this function gathers the data on the topography surrounding the map
    // to determine the biome of the point
    for (let i = 0; i < sites.length; i++) {
      sites[i].getData(); 
    }    
  }

  // this 'for loop' does two things for each point Site on the map
  // 1. Draws in the voronoi cells for each respective Site
  // 2. Create Bridges to neighboring point Sites
  for (let i = 0; i < sites.length; i++) {

    // create a voronoi cell Block class object for the point Site
    let Bl = new Block(i);
    blocks.push(Bl);
    
    // get the locations for the neighboring point Sites
    let cellId = voronoiGetSite(sites[i].x, sites[i].y, false);
    let dest = random(voronoiNeighbors(cellId));
    let dest2 = random(voronoiNeighbors(cellId)); 
    let dest3 = random(voronoiNeighbors(cellId)); 
    
    // loop through all the possible end destinations for the specific point Site and 
    // stores each one in a 'bridgeEnd' variable
    for (let j = 0; j < sites.length; j++) {
      let bridgeEnd = diagram["cells"][j]["site"]["voronoiId"]; 

      // this variable contains the coordinates for the starting point Site
      let bridgeX = diagram["cells"][j]["site"]["x"];
      let bridgeY = diagram["cells"][j]["site"]["y"];
      
        // the following blocks of code only draws one bridge if it matches one of the possible
        // end destinations for the bridges

        // note: removing the 'bridgeEnd' and conditional statement will cause the code to draw a bridge
        // to every single other point Site on the map from every single point Site

        // build a bridge to the first neighbor
        if (dest == bridgeEnd) {
          let B = new Bridge(sites[i].x, sites[i].y, bridgeX, bridgeY, r, g, b);
          bridges.push(B);
        }
      
        // has a 70% chance to build a bridge to the second neighbor
        if (dest2 == bridgeEnd && floor(random(100)) >= 70) {
            let B = new Bridge(sites[i].x, sites[i].y, bridgeX, bridgeY, r, g, b);
            bridges.push(B);
        }

        // has a 30% chance to build a bridge to the second neighbor
        if (dest3 == bridgeEnd && floor(random(100)) >= 30) {
            let B = new Bridge(sites[i].x, sites[i].y, bridgeX, bridgeY, r, g, b);
            bridges.push(B);          
        }  
    }
  }
  
  // draw in the voronoi cell Blocks
  for (let i = 0; i < sites.length; i++) {
    blocks[i].display();
  }

  // draw in the bridges
  for (let i = 0; i < bridges.length; i++) {
    bridges[i].display();
  }

  // draw in the sites
  for (let i = 0; i < sites.length; i++) {
    sites[i].display();    
  }
}

class Site {
    constructor(x, y, id) {

        // location variables
        this.x = x;
        this.y = y;

        this.size = random(80, 100); // size variables

        this.id = id; // the specific id of the point Site within the generated voronoi diagram

        this.data = []; // this stores the data to determine what biome with which to label the Site
        this.sampleSize = 50; // this variable determines how wide a sample size to gather data from

        // these two variables are left empty as they will be defined in later
        this.biomeData;
        this.biome;
    }
    
    // this function gathers data from the surrounding region of the point Site to determine it's biome
    // note: this does not determine if the Site belong to the CITY or STRANGE biome as that will be
    // defined later on in the Block class

    getData() {
      push();
      
        // these 'for loops' loop through the sample area determined by the sample size variable
        // and gatherd the color data from a grid of data points within that sample area
        for (let x = this.x -this.sampleSize; x <= this.x + this.sampleSize; x += this.sampleSize/10) {
          for (let y = this.y -this.sampleSize; y <= this.y + this.sampleSize; y += this.sampleSize/10) {
            let index = ((x + width/2 + xBorder) + (y + yBorder) * width) * 4;
            let r = pixels[index];
            let g = pixels[index + 1];
            let b = pixels[index + 2];

            // this block of code averages out the topography variation to create a data point
            // note: RED values are left untouched as they do not affect the colour variation on the relief map
            let average = (g + b) / 2;      
            this.data.push(average);
          }
        }
      pop();

      // this variable then averages out all the data points within a sample area to create a data sample
      let areaAverage = 0;
      for (let i = this.data.length - 1; i >= 0; i--) {
        areaAverage += this.data[i];
      }
      areaAverage = areaAverage /(this.data.length - 1);


      // this data sample is then processed to determine the biome of a point Site's surrounding area
      this.biomeData = areaAverage/4;

      this.processData(); 
    }

    // if the average falls within a certain bracket, a biome is assigned to the specific class object
    processData() {
      if (this.biomeData >= 140) {
        this.biome = "Valley";
      } else if (this.biomeData >= 100) {
        this.biome = "Plains";
      } else if (this.biomeData >= 50) {
        this.biome = "Hill";
      } else if (this.biomeData >= 0) {
        this.biome = "Mountain";
      }
    }

    // each point Site class object is then drawn into place and numbered
    display() {
        noStroke();
        strokeWeight(this.size/9);
        let s = new Scribble();

        fill(0, 125);
        s.roughness = 2;
        s.scribbleEllipse(this.x, this.y, this.size, this.size);

        push();
            fill(255);
            stroke(255, 0, 0, 200);
            strokeWeight(this.size/10);
            noStroke();
            textSize(this.size/2)
            textFont(newFont);
            textStyle('bold');
            textAlign(CENTER, CENTER);
            text(this.id + 1, this.x, this.y - textAscent()/4);
        pop();
    }
}

class Bridge {
  constructor(xStart, yStart, xEnd, yEnd) {
      this.start = createVector(xStart, yStart);
      this.end = createVector(xEnd, yEnd);
      this.sWeight = 15;
  
    }
  
    // this draws in the bridge
    display() {
      push();
        noFill();

        strokeWeight(this.sWeight);
        stroke(0, 150); 

        strokeWeight(this.sWeight);
        stroke(255, 255, 0, 150);  

        let l = new Scribble();
        l.scribbleLine(this.start.x, this.start.y, this.end.x, this.end.y);
      pop();
    }
}

class Block {
  constructor(id) {
    this.id = id; // the id of the specific cell Block in the generated voronoi diagram
    
    // location variables
    this.w = width/2 - xBorder *2;
    this.h = height - yBorder *2;

    // size variables for the 'createGraphics()' function
    this.cellW = this.w/6;
    this.cellH = this.h/6;

    this.buffer = createGraphics(this.cellW, this.cellH);
    this.pattern; // the buffer will later be ported into this variable for display

    // this array allows for specific alteration of the distribution rate 
    // of sizes for the City block type
    this.sizeArr = [1, 1, 3, 3, 5]; 
    this.xSizer = random(this.sizeArr);
    this.ySizer = random(this.sizeArr);

    // these variables set the stroke weights for the cell BLocks
    this.borderWeight = 10;
    this.sWeight = this.borderWeight/2;
  
    // this array allows for specific alteration of the distribution rate for the different block types 
    this.variation = [0, 0, 0, 1, 1, 2];
    this.picker = random(this.variation);

    this.cells = voronoiGetCells();
    this.diagram = voronoiGetDiagram();
  }

  display() {

    strokeWeight(this.borderWeight);
    stroke(0, 240, 240, 60);
    
    this.palette(); // this function determines the specific type of cell Block

    // draw in the cell Block borders
    // code adapted from Chris Martin's experimentation with the p5 voronoi library
    // https://cmartcreations2.com/exploring-voronoi/
    beginShape();
		  for (let segment = 0; segment < this.cells[this.id].length; segment++) { 
        vertex(this.cells[this.id][segment][0], this.cells[this.id][segment][1]);
        vertex(this.cells[this.id][(segment+1) % this.cells[this.id].length][0], this.cells[this.id][(segment+1) % this.cells[this.id].length][1]);
		  }
    endShape(CLOSE);
  }

  palette() {
    switch(this.picker) {
     
      case 0: // neither CITY nor STRANGE biome, default to assigned point Site biome 
        break;

      case 1: // CITY BIOME
            sites[this.id].biome = "City"; // assign the corresponding point Site biome to CITY

            this.buffer.translate(this.cellW/2, this.cellH/2);       

            this.buffer.push();
            this.buffer.rotate(random());

            let xSpace = this.cellW/12;
            let ySpace = this.cellH/12;

            // draw in the grid pattern of rectangles differing proportionally in size
              this.buffer.push();
                for (let xX = -this.cellW; xX <= this.cellW; xX += xSpace * 2) {
                  for (let yY = -this.cellH; yY <= this.cellH; yY += ySpace * 2) {
                    this.buffer.fill(0, 200, 200, 200);
                    this.buffer.stroke(255, 255, 255, 225);
                  
                    let xSizer = random(this.sizeArr);
                    let ySizer = random(this.sizeArr);
                    this.buffer.strokeWeight(this.borderWeight * 0.75);
                    this.buffer.rect(xX, yY, xSpace * xSizer, ySpace * ySizer);
                  
                  } 
                }
              this.buffer.pop();
 
            this.buffer.pop();

            // draw in the grid lines for the pattern
            this.buffer.strokeWeight(this.borderWeight)
            this.buffer.noFill();
            this.buffer.stroke(200, 200, 0, 125);
            this.buffer.rect(-this.cellW/2, -this.cellH/2, this.cellW, this.cellH);
          break;

      case 2:
        sites[this.id].biome = "Strange"; // assign the corresponding point Site biome to STRANGE
        
        // determine the center of the biome
        let x = this.diagram["cells"][this.id]["site"]["x"];
        let y = this.diagram["cells"][this.id]["site"]["y"];
          push();

            for (let i = 4; i >= 0; i --) {
              // alternate the fill colors of the biome, giving it a layered look
              if (5 % i == 1) { fill(0, 200, 0, 75); } 
              else { fill(200, 25);}

              translate(x, y);
              translate(-x/1.325, -y/1.3);
              scale(0.75);

              noStroke();
              
              // draw in smaller versions of the cell Block within itself to mark out the biome
              beginShape();
                for (let segment = 0; segment < this.cells[this.id].length; segment++) {
                  vertex(this.cells[this.id][segment][0], this.cells[this.id][segment][1]);
                  vertex(this.cells[this.id][(segment+1) % this.cells[this.id].length][0], this.cells[this.id][(segment+1) % this.cells[this.id].length][1]);
                }
              endShape(CLOSE);
            }

          pop();

          // draw in lines leading from the corners of the cell Block to the center
          for (let segment = 0; segment < this.cells[this.id].length; segment++) {
           strokeWeight(this.borderWeight/1.5);
            line(x, y, this.cells[this.id][segment][0], this.cells[this.id][segment][1]);
          } 
        break;
    }
    this.buffer.pop();
    this.pattern = createPattern(this.buffer);
    fillPattern(this.pattern);
  }
}  
  
function reliefMap() { // draw in the relief map
  let inc = 0.002;
  let yoff = 0;
  noiseDetail(9, 0.45);

  loadPixels();

  for (let y = 0; y < height; y++) {
    let xoff = 0;
    for (let x = 0; x < width; x++) {

      let index = (x + y * width) * 4;

      let r = noise(xoff, yoff) * 255;

      // uses a threshold function to draw in the relief map by drawing in a pixel
      // as either light yellow or red/orange and using a noise function to
      // give it a hand painted texture
      if (threshold(r) == 225) {
        pixels[index + 1] = threshold(r) - (noise(xoff, yoff) * 255);
        pixels[index + 2] = threshold(r) - (noise(xoff * 10, yoff * 10) * 255);
        pixels[index + 3] = 255 - (noise(xoff * 100, yoff * 100) * 100);

      } else {
        pixels[index + 1] = 255 - (noise(xoff, yoff) * 0);
        pixels[index + 2] = 255 - (noise(xoff * 10, yoff * 10) * 50);
        pixels[index + 3] = 255 - (noise(xoff * 100, yoff * 100) * 50);       
      }
      xoff += inc;
    }
    yoff += inc;
  }
  updatePixels(0, 0, width, height);
}

// multiple thresholds are used simultaneously to create the topographical look
function threshold(value) {
  if (value >= 220 && value < 255 ||
      value >= 200 && value < 223 ||
      value >= 250 && value < 273 ||
      value >= 150 && value < 153 ||
      value >= 100 && value < 103 || 
      value >= 90 && value < 93 || 
      value >= 75 && value < 88 || 
      value >= 60 && value < 63 || 
      value >= 40 && value < 43) {
      return value = 225;
  } else {
      return value = 255;
  }
}

// write in the information for each point
function information() {
  
  push();
  translate(xBorder/2, yBorder/1.5);

  for (let i = 0; i < sites.length; i++) {
    let modulo = i % 8;
    let x = 0;
    let y = (height - yBorder * 2)/7 * modulo;
    if (i >= round(sites.length/2) ) { x = width/4;
                                }    
   infoBox(x, y, sites[i].id);
   print(sites[i].id)

  }

  pop();
}

// write in the specific information presented for each point depending on the point's biome
function infoBox(x, y, id) {
  push();
    translate(x, y);

    stroke(255, 225);
    strokeWeight(15);

    textFont("Arial");
    textStyle(BOLD);
    textSize(height/30)

    let descriptor = random(desArr);
    desArr.splice(descriptor, 1);

    // note: location types are biome specific while the descriptors and features are not
    let location = locationPicker(sites[id].biome); 
    print(id + ": " + sites[id].biome);

    text(id + 1 + ". " + descriptor + " " + location, 0, 0);

    strokeWeight(7.5);

    textSize(height/50)
    text("Features:", 0, textAscent() * 2);
    let textH = textAscent();

    textSize(height/55)
    textStyle(BOLDITALIC);

    let feature1 = random(featArr);
    let feature2 = random(featArr);
    
    text(feature1 + " & " + feature2, 0, textH * 3);

  pop();
}

// this 'switch-case' conditional function returns randomly selected words or phrases
// corresponding to the point's biome
function locationPicker(id) {
  switch(id) {
    case "Valley":
      return random(valleyArr);
    
    case "Plains":
      return random(plainsArr);

    case "Hill":
      return random(hillArr);


    case "Mountain":
      return random(mountArr);


    case "City":
      return random(cityArr);

    case "Strange":
      return random(strangeArr);
  }
}
