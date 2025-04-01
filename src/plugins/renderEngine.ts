import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { KMZLoader } from 'three/addons/loaders/KMZLoader.js';
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {DRACOLoader} from "three/examples/jsm/loaders/DRACOLoader.js";
import {BufferGeometry, Scene} from "three";

interface ConfigInterfaceEngine {
    tileX: number,
    tileY: number,
    tileZ: number,
    showGrid: boolean,
    showAxes: boolean,
    tileFactor: number,
    roomX: number,
    roomY: number,
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
    currentWallsIds:[];

    cameraPos:any;

    model:any;

    raycaster;
    clickColor:any;

    constructor(id: string, config: ConfigInterfaceEngine) {

        this.config = config;

        this.container = document.querySelector(id);
        this.camera = new THREE.PerspectiveCamera( 60, this.container!.clientWidth / this.container!.clientHeight, 1, 100 );
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer( { antialias: true } );
        this.light = new THREE.DirectionalLight( 0xffffff, 3 );

        this.currentTilesIds = []
        this.currentWallsIds = []

        this.raycaster = new RayCaster(this.camera, this.scene, this.container, this.renderer)

        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
    }
    setClickColor(color:any) {
        this.clickColor = color;
        this.raycaster.setClickColor(this.clickColor)
    }
    getClickColor():any {
        return this.clickColor
    }
    changeAllColor() {
        this.currentTilesIds.forEach((e) => {
            const obj = (this.scene.getObjectByProperty('uuid', e) as THREE.Mesh)
            if (obj.type === 'Mesh') {
                // @ts-ignore
                obj.material.color.set(parseInt(('0x' + this.clickColor)))
            }
        })
        this.render()
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
        this.initRaycaster()
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

        for (let x = 0; x < timesColumn; x++) {
            for (let y = 0; y < timesRow; y++) {
                let startX = (((tileXMeter * timesColumn) / 2) - (tileXMeter * timesColumn) + (tileXMeter / 2))
                let startY = (((tileYMeter * timesRow) / 2) - (tileYMeter * timesRow) + (tileYMeter / 2))
                const tile = new Tile(
                {
                        x: tileXMeter,
                        y: tileYMeter,
                        z: (this.config.tileZ / 100)
                    },
                    this.scene,
                    (x + "-" + y),
                    {
                        posX: (startX + (tileXMeter * x)),
                        posY: (startY + (tileYMeter * y)),
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
        this.renderWalls()
    }
    updateFloor(roomX:number, roomY:number) {
        this.config.roomX = roomX;
        this.config.roomY = roomY;

        this.removeOldTiles()
        this.renderTiles();
        this.camera.updateProjectionMatrix();
        this.raycaster.setNewTiles(this.currentTilesIds)
        this.render()
    }

    removeOldTiles():void {
        this.currentTilesIds.forEach((obj) => {
            // @ts-ignore
            const object = (this.scene.getObjectByProperty('uuid', obj) as THREE.Mesh)
            object.geometry.dispose();
            (object!.material as THREE.MeshBasicMaterial).dispose();
            this.scene.remove(object!)
        })
        this.currentTilesIds = []
    }
    renderWalls():void {

        if (this.currentWallsIds.length > 0) {
            this.currentWallsIds.forEach((obj) => {
                // @ts-ignore
                const object = (this.scene.getObjectByProperty('uuid', obj) as THREE.Mesh)
                object.geometry.dispose();
                (object!.material as THREE.MeshBasicMaterial).dispose();
                this.scene.remove(object!)
            })
        }
        this.currentWallsIds = []

        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(this.config.roomX, this.config.roomY),
            new THREE.MeshBasicMaterial( {color: 0x25282A, side: THREE.DoubleSide} )
        )
        floor.rotation.set(Math.PI / 2, 0, 0)
        this.scene.add(floor)

        const afterWall = new THREE.Mesh(
            new THREE.PlaneGeometry(this.config.roomX, 1),
            new THREE.MeshBasicMaterial( {color: 0x2D2335, side: THREE.DoubleSide} )
        )
        afterWall.position.set(((this.config.roomX * -1) + this.config.roomX), .5, (0 - (this.config.roomY / 2)))
        this.scene.add(afterWall)

        const leftWall = new THREE.Mesh(
            new THREE.PlaneGeometry(this.config.roomY, .75),
            new THREE.MeshBasicMaterial( {color: 0x2D2335, side: THREE.DoubleSide} )
        )
        leftWall.rotation.set(0, Math.PI / 2, 0)
        leftWall.position.set((0 - (this.config.roomX / 2)), .375, 0)
        this.scene.add(leftWall)

        console.log(floor)

        // @ts-ignore
        this.currentWallsIds.push(floor.uuid)
        // @ts-ignore
        this.currentWallsIds.push(afterWall.uuid)
        // @ts-ignore
        this.currentWallsIds.push(leftWall.uuid)

        console.log(this.currentWallsIds)

    }
    switch2d():void {

    }
    getTilesCount():number {
        return (this.currentTilesIds.length / 2)
    }
    initRaycaster() {
        this.raycaster.init(this.currentTilesIds)
    }
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
    getCubeUuid(): string {
        return this.cube!.uuid
    }
    getFrameUuid(): string {
        return this.frame!.uuid
    }

    render() {
        //console.log("ID: " + this.id)
        /*
        MESH
         */
        const geometry = new THREE.BoxGeometry( this.x, this.z, this.y );
        const material = new THREE.MeshBasicMaterial( {color: 0x191919} );
        this.cube = new THREE.Mesh( geometry, material );

        this.cube.position.set(this.posX, ((this.z / 2) + 0.01), this.posY)

        this.scene!.add(this.cube)

        if (this.showWireframe) {
            this.renderWireframe(geometry);
        }
    }
    renderWireframe(geometry:any) {
        const edges = new THREE.EdgesGeometry( geometry );
        const lineMaterial = new THREE.LineBasicMaterial( { color: 'black' } );
        this.frame = new THREE.LineSegments( edges, lineMaterial );
        this.frame!.position.set(this.posX, ((this.z / 2) + 0.01), this.posY)
        this.scene!.add(this.frame)
    }

    handleClick(event: Event):void {
        console.log(event)
    }

}

export class RayCaster {
    camera;
    scene;
    pointer;
    container;
    raycast;
    intersecting:[];
    currentTiles:[];
    renderer;
    clickColor:any;
    constructor(camera: THREE.Camera, scene: THREE.Scene, container:any, renderer: THREE.WebGLRenderer) {
        this.camera = camera;
        this.scene = scene;
        this.raycast = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        this.container = container
        this.intersecting = []
        this.renderer = renderer
        this.currentTiles = [];
    }
    setClickColor(color:any) {
        this.clickColor = color
    }
    setNewTiles(tiles:[]) {
        this.currentTiles = tiles
    }
    init(tiles:[]) {
        this.currentTiles = tiles
        // @ts-ignore
        this.container.addEventListener( 'click', (event) => {
            this.onPointerMove(event)
        });

    }
    onPointerMove(event: any):void {
        const rect = this.renderer.domElement.getBoundingClientRect();

        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.pointer.x =( x / this.container.clientWidth ) *  2 - 1;
        this.pointer.y =( y / this.container.clientHeight) * - 2 + 1;
        this.render()
    }
    render():void {
        this.raycast.setFromCamera(this.pointer, this.camera)
        const meshs = this.scene.children.filter((obj) => obj.type === 'Mesh')
        this.intersecting = []
        meshs.forEach((mesh) => {
            const intersects = this.raycast.intersectObject(mesh);
            if (intersects.length !== 0) {
                let obj = intersects[0].object;
                // @ts-ignore
                if (this.currentTiles.includes(obj.uuid)) {
                    // @ts-ignore
                    this.intersecting.push(obj)
                    // @ts-ignore
                    obj.material.color.set(parseInt(('0x' + this.clickColor)))
                    console.log(obj)
                }
            }
        })
        this.renderer.clear();
        this.renderer.render( this.scene, this.camera );
    }
    // @ts-ignore
    genRanHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

}