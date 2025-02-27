import { Component, OnInit} from '@angular/core';
import * as THREE from 'three';
import { RouterOutlet } from '@angular/router';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FormsModule } from '@angular/forms';
import Noise from 'noisejs';
import { gsap } from 'gsap';
import internal from 'node:stream';
//import * as Noise from 'noisejs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  title = '3d-map-app';

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private cube!: THREE.Mesh;
  private controls!: OrbitControls;
  
  //private Noise = require('noise');
  //private noise: Noise;// new Noise(Math.random());
  //ivate noise = new Noise(Math.random());
  private noise = new Noise.Noise(Math.random());
  private treeNoise = new Noise.Noise(Math.random());
  //Models
  

  private landModel!: THREE.Group;
  private waterModel!: THREE.Group;
  private models: THREE.Group[] = [];


  private minMapSize = 5
  private maxMapSize = 20

  

  mapRows = 10;
  mapCols = 10;
  private mapGrid = this.createGrid(this.mapRows, this.mapCols);

  private landPositions: Array<[number, number]> = [];

  ngOnInit(): void {
    this.buildMap();
    this.initThreeJS();
  }

  public updateMapRows(): void {
    if (this.mapRows < this.minMapSize ){
      this.mapRows = this.minMapSize;
    }

    if (this.mapRows > this.maxMapSize ){
      this.mapRows = this.maxMapSize;
    }
    //alert(this.mapRows);
  }

  public updateMapCols(): void {
    if (this.mapCols < this.minMapSize ){
      this.mapCols = this.minMapSize;
    }

    if (this.mapCols > this.maxMapSize ){
      this.mapCols = this.maxMapSize;
    }
    //alert(this.mapRows);
  }

  public regenerateMap(): void {
    this.noise = new Noise.Noise(Math.random());
    
    this.mapGrid = this.createGrid(this.mapRows, this.mapCols);

    this.buildMap();
    this.initThreeJS();

  }

  private createGrid(rows: number, cols: number): number[][] {
    const grid: number[][] = [];
  
    for (let i = 0; i < rows; i++) {
      
      const row: number[] = [];
      for (let j = 0; j < cols; j++) {
        row.push(0);
      }
      grid.push(row);
    }
  
    return grid;
  }

  private PlaceOnLand(newTileValue:number): void{
    if (this.landPositions.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.landPositions.length);
      const [randRow, randCol] = this.landPositions[randomIndex];
      
      this.mapGrid[randRow][randCol] = newTileValue;

      this.landPositions.splice(randomIndex, 1);
    }
  }

  private buildMap(): void {
    
    const xOffset = 20
    const yOffset = 20
    
    const scale = 6;
    const threshold = 0.0;

    const treeThreshold = 0.6;

    this.landPositions = [];
    
    for (let row = 0; row < this.mapGrid.length; row++) {
      for (let col = 0; col < this.mapGrid[row].length; col++) {
        //noise_value = noise([row / scale, col / scale])  # Scale row and col for smoothness

        //dynamically build matrix with width and height here

        let noiseValue = this.noise.simplex2((row + xOffset) / scale, (col + yOffset) / scale);
        //let noiseValue = this.noise.perlin2(row / scale, col / scale);
        
        if (noiseValue > threshold){
          //Land
          this.mapGrid[row][col] = 1;
          
          let treeValue = this.noise.simplex2((row + xOffset) / scale, (col + yOffset) / scale);

          if (treeValue > treeThreshold){
            this.mapGrid[row][col] = 2;
          }
          else{
            //Add Land Tile if its not a tree
            this.landPositions.push([row, col]);
          }
          
        }
        else{
          //Water
          this.mapGrid[row][col] = 0;
        }
    
      }
    }

    //Castle
    this.PlaceOnLand(3);

    //Houses
    this.PlaceOnLand(4);
    this.PlaceOnLand(4);

    //this.PlaceOnLand(landPositions,5);

    
    //LAND:
    //Rare buildings like
    //Wizard Tower,Library,Pyramid,Statue,Cave/Mine,Vulcano,Mountain?,Portal,sleeping dragon?,witch hut,Floating Island+Island With Waterfall,Farm,Windmill,graveyard,temple/dungeon,cathedral,garden/patch of flowers
    // campfire,random sotnes,master sword like pedastal,treasure,random hut,fountain
    //Lake?
    //Airship?,Baloon?

    //Castle skins?

    //Water:
    //Fish,Boat,Rocks,small island,large boat,Lighthouse on island,sunken ship
            
            

  }


  private initThreeJS(): void {

    this.scene = new THREE.Scene();

    this.scene.background = null; 

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    //Camera Position
    this.camera.position.x = 20;
    this.camera.position.y = 10;
    this.camera.position.z = 30;
    
    //this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix()

    this.renderer = new THREE.WebGLRenderer({antialias: true,alpha: true});
    this.renderer.shadowMap.enabled = true;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    

    this.renderer.domElement.classList.add('myCanvasClass');

    const container = document.getElementById('threejs-container');
    if (container) {
      if (container.hasChildNodes()) {
        while (container.firstChild) {
          container.removeChild(container.firstChild); 
        }
      }

      container.appendChild(this.renderer.domElement);
    }
    
    //document.body.appendChild(this.renderer.domElement);
    

    // Resize the renderer when the window is resized
    const resizeRenderer = () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', resizeRenderer);

    // Add orbit controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;
    this.controls.screenSpacePanning = false; 

    //Experimental Control Setting
    this.controls.enablePan = false;

    const centerX = (this.mapCols/2) * 2
    const centerZ = (this.mapRows/2) * 2
    this.controls.target.set(centerX, 0, centerZ)

    this.controls.maxDistance = 100;
    this.controls.minDistance = 5;

    //LIGHT

    const ambientLight = new THREE.AmbientLight(0x404040, 6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
    directionalLight.position.set(1, 1, 1).normalize();
    //directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    //LOAD MODELS
    const loader = new GLTFLoader();
    const modelPaths = [
      'tiles/water.gltf',
      'tiles/land.gltf',
      'tiles/tree.gltf',
      'tiles/castle.gltf',
      'tiles/house.gltf',
      'tiles/portal.gltf',
      'tiles/mountain.gltf'
    ];

    let loadedCount = 0;
    modelPaths.forEach((path, index) => {
      loader.load(path, (gltf) => {
        gltf.scene.scale.set(1, 1, 1);
        this.models[index] = gltf.scene;
        loadedCount++;

        //const mixer = new THREE.AnimationMixer(gltf.scene);

        // Add all the animations to the mixer
        /*
        gltf.animations.forEach((clip) => {
          mixer.clipAction(clip).play();
        });*/

        if (loadedCount === modelPaths.length) {
          this.spawnGrid();
        }
      }, undefined, (error) => {
        console.error('Error loading model', error);
      });
    });


    this.animate();
  }

  
  private spawnGrid(): void {
    const spacing = 2;//it has to be two, because the tiles are (1,1,1) in blender, which is double the size
    let delay = 0;

    for (let row = 0; row < this.mapGrid.length; row++) {
      for (let col = 0; col < this.mapGrid[row].length; col++) {
        //const xPos = col * spacing - (this.mapGrid[row].length * spacing) / 2;
        //const yPos = 0;
        //const zPos = row * spacing - (this.mapGrid.length * spacing) / 2;

        const xPos = col * spacing;
        const yPos = 0;
        const zPos = row * spacing;

        

        const modelIndex = this.mapGrid[row][col];
        

        if (this.models[modelIndex]) {
          const model = this.models[modelIndex].clone();

          

          //Pre Animation Positions
          model.position.set(xPos, yPos - 5, zPos);
          //model.position.set(xPos, yPos, zPos);
          model.scale.set(0, 0, 0);

          model.castShadow = true;
          model.receiveShadow = true;

          this.scene.add(model);
          
          gsap.to(model.position, {
            y: yPos,
            duration: 1,
            delay: delay / 1000,
            ease: "bounce.out"
          });

          gsap.to(model.scale, {
            x: 1,      
            y: 1,      
            z: 1,      
            duration: 1, 
            delay: delay / 1000,  
            ease: "bounce.out"
          });

          delay += 10;

        }
      }
    }
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

}


