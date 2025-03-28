import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { KMZLoader } from 'three/addons/loaders/KMZLoader.js';
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {DRACOLoader} from "three/examples/jsm/loaders/DRACOLoader.js";
import {Scene} from "three";

interface ConfigInterfaceEngine {
    tileX: number,
    tileY: number,
    tileZ: number,
    showGrid: boolean,
    showAxes: boolean,
    tileFactor: number,
    roomX: number,
    roomY: number
}
interface ConfigInterfaceTile {
    x: number,
    y: number,
    z: number
}

export default class renderEngine {

    container;
    scene;
    camera;
    renderer;
    light;
    controls;
    config:ConfigInterfaceEngine;

    currentTilesIds:[];

    model:any;

    constructor(id: string, config: ConfigInterfaceEngine) {

        this.config = config;

        this.container = document.querySelector(id);
        this.camera = new THREE.PerspectiveCamera( 60, this.container!.clientWidth / this.container!.clientHeight, 1, 100 );
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer( { antialias: true } );
        this.light = new THREE.DirectionalLight( 0xffffff, 3 );

        this.currentTilesIds = []

        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
    }
    async createView():Promise<void> {
        this.renderer.setSize(this.container!.clientWidth, this.container!.clientHeight);
        this.scene.background = new THREE.Color('white');

        // creating light
        this.light.position.set( 0.5, .75, 0.5 ).normalize();
        this.scene.add( this.light );

        // set camera
        this.camera.position.set( 0, 15, 15 );
        this.scene.add(this.camera)

        //await this.addTiles()

        this.renderTiles()

        this.renderer.autoClear = false;
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( this.container!.clientWidth, this.container!.clientHeight );
        this.container!.appendChild( this.renderer.domElement );

        if (this.config.showGrid) {
            const grid = new THREE.GridHelper( 50, 50, 0xffffff, 0x7b7b7b );
            this.scene.add( grid );
        }
        if (this.config.showAxes) {
            const hlp = new THREE.AxesHelper(1);
            this.scene.add(hlp);
        }

        // adding controls
        this.controls.addEventListener( 'change', () => {
            this.render()
        });
        this.controls.update();


        this.camera.updateProjectionMatrix();
        this.render()

        // resize function needs to be always on bottom of create view
        window.addEventListener( 'resize', () => {
            this.onWindowResize()
        });
    }
    onWindowResize():void {

        this.camera.aspect = this.container!.clientWidth / this.container!.clientHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.container!.clientWidth, this.container!.clientHeight);
        this.render();

    }
    render():void {
        this.renderer.clear();
        this.renderer.render( this.scene, this.camera );
    }
    renderTiles():void {
        const tileXMeter = this.config.tileX / 100
        const tileYMeter = this.config.tileY / 100
        const timesColumn = Math.floor((this.config.roomX - (this.config.roomX % tileXMeter)) / tileXMeter)
        const timesRow = Math.floor((this.config.roomY - (this.config.roomY % tileYMeter)) / tileYMeter)

        console.log("----------------------------------")

        for (let x = 0; x < timesColumn; x++) {
            for (let y = 0; y < timesRow; y++) {
                const tile = new Tile(
                {
                        x: tileXMeter,
                        y: tileYMeter,
                        z: (this.config.tileZ / 100)
                    },
                    this.scene,
                    (x + "-" + y),
                    {
                        posX: ((x + 1) * tileXMeter),
                        posY: ((y + 1) * tileYMeter) //überarbeiten !
                    }
                )
                tile.render()
                // @ts-ignore
                this.currentTilesIds.push(tile.getCubeUuid())
                if (tile.getFrameUuid() !== null) {
                    // @ts-ignore
                    this.currentTilesIds.push(tile.getFrameUuid())
                }
            }
        }
    }
    updateFloor(roomX:number, roomY:number) {
        this.config.roomX = roomX;
        this.config.roomY = roomY;

        this.removeOldTiles()
        this.renderTiles();
        this.camera.updateProjectionMatrix();
        this.render()
    }

    removeOldTiles():void {
        console.log(this.scene)
        this.currentTilesIds.forEach((obj) => {
            // @ts-ignore
            const object = (this.scene.getObjectByProperty('uuid', obj) as THREE.Mesh)
            object!.geometry.dispose();
            (object!.material as THREE.MeshBasicMaterial).dispose();
            this.scene.remove(object!)
        })
        this.currentTilesIds = []
        console.log(this.scene)
    }
    /*async addTiles():Promise<void> {
        const loader = new GLTFLoader();

        const timesColumn = Math.floor(this.config.testXMeters / this.config.tileSize)
        const timesRow = Math.floor((this.config.testYMeters - 1) / this.config.tileSize)

        console.log(timesColumn)

        const allGroup = new THREE.Group();

        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('/draco/gltf/');

        loader.setDRACOLoader(dracoLoader);

        for (let x = 0; x < timesColumn; x++) {
            let _this = this;
            for (let y = 0; y < timesRow; y++) {
                loader.loadAsync('/models/tiles/tile_default_draco.glb', (xhr:ProgressEvent) => {
                    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
                }).then((glb:any) => {
                    glb.scene.scale.set(this.config.tileFactor, this.config.tileFactor, this.config.tileFactor)
                    glb.scene.position.set(x, 1, (y + 1))
                    _this.model = glb.scene;
                    allGroup.add(_this.model)
                })
            }
        }

        allGroup.updateMatrixWorld( true )
        this.scene.add(allGroup)
    }*/
}

export class Tile {
    x: number;
    y: number;
    z: number;
    scene: THREE.Scene | null;

    cube: THREE.Mesh | null;
    frame: THREE.LineSegments | null;
    id: string;

    posX: number;
    posY: number;
    showWireframe;
    constructor(config: ConfigInterfaceTile, scene: THREE.Scene, id: string, pos: any) {
        this.x = config.x;
        this.y = config.y;
        this.z = config.z;
        this.scene = scene;
        this.id = id;
        this.posX = pos.posX;
        this.posY = pos.posY;
        this.showWireframe = true;
        this.cube = null;
        this.frame = null;
    }
    getX() {
        return this.x;
    }
    getY() {
        return this.y;
    }

    getCubeUuid(): string[] {
        return [this.cube!.uuid]
    }
    getFrameUuid(): string[] {
        return [this.frame!.uuid]
    }

    render() {
        //console.log("ID: " + this.id)
        /*
        MESH
         */
        const geometry = new THREE.BoxGeometry( this.x, this.z, this.y );
        const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
        this.cube = new THREE.Mesh( geometry, material );
        this.cube.position.set(this.posX, 0, this.posY)
        this.scene!.add(this.cube)

        if (this.showWireframe) {
            this.renderWireframe(geometry);
        }
    }
    renderWireframe(geometry:any) {
        const edges = new THREE.EdgesGeometry( geometry );
        const lineMaterial = new THREE.LineBasicMaterial( { color: 'black' } );
        this.frame = new THREE.LineSegments( edges, lineMaterial );
        this.frame!.position.set(this.posX, 0, this.posY)
        this.scene!.add(this.frame)
    }

}