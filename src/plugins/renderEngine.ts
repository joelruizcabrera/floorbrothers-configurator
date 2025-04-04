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
    showWalls: boolean,
    showStrips: boolean
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
    currentStripIds:string[];

    cameraPos:any;

    model:any;

    raycaster;
    clickColor:any;
    showWalls:boolean;
    showStrips:boolean;

    tilesOrder:[];

    constructor(id: string, config: ConfigInterfaceEngine) {

        this.config = config;

        this.showWalls = config.showWalls;
        this.showStrips = config.showStrips;

        this.container = document.querySelector(id);
        this.camera = new THREE.PerspectiveCamera( 60, this.container!.clientWidth / this.container!.clientHeight, 1, 100 );
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer( { antialias: true } );
        this.light = new THREE.AmbientLight( 0xffffff, 1 );

        this.currentTilesIds = []
        this.currentWallsIds = []
        this.currentStripIds = []
        this.tilesOrder = []

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
        let timesColumn = Math.floor((this.config.roomX - (this.config.roomX % tileXMeter)) / tileXMeter)
        let timesRow = Math.floor((this.config.roomY - (this.config.roomY % tileYMeter)) / tileYMeter)

        if (this.tilesOrder.length > 0) {
            this.tilesOrder = []
        }

        let allStrips:string[] = []

        console.log(this.showStrips)
        if (this.showStrips) {
            const spaceBetweenX = (this.config.roomX - (tileXMeter * timesColumn)) / 2
            const spaceBetweenY = (this.config.roomY - (tileYMeter * timesRow)) / 2
            if (spaceBetweenX < 0.06) {
                timesColumn = timesColumn - 1
            }
            if (spaceBetweenY < 0.06) {
                timesRow = timesRow - 1
            }
        }
        this.removeOldStrips()

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
                this.tilesOrder.push({
                    uuid: tile.getCubeUuid(),
                    orderId: (x + "-" + y),
                })
                // @ts-ignore
                this.currentTilesIds.push(tile.getCubeUuid())
                if (tile.getFrameUuid() !== null) {
                    // @ts-ignore
                    this.currentTilesIds.push(tile.getFrameUuid())
                }
                if (this.showStrips) {
                    tile.addTileStrip(x, timesColumn, y, timesRow)
                    allStrips = [...allStrips, ...tile.getStrips()]
                }
            }
        }
        this.currentStripIds = allStrips
        if (this.checkSpaceToWalls(timesColumn, timesRow).x > 0 && this.checkSpaceToWalls(timesColumn, timesRow).y > 0) {
            //console.log(this.checkSpaceToWalls(timesColumn, timesRow))
        }
        this.renderWalls()
    }
    checkSpaceToWalls(countTilesX:number, countTilesY:number):any {
        if (countTilesX && countTilesY) {
            let spaceToX = (this.config.roomX - (countTilesX * (this.config.tileX / 100))) / 2
            if (spaceToX > 0) {
                //console.log(spaceToX % 0.06)
            }
            return {
                x: 1,
                y: 1
            }
        } else {
            return
        }
    }
    updateFloor(roomX:number, roomY:number) {
        this.config.roomX = roomX;
        this.config.roomY = roomY;

        this.removeOldTiles();
        this.switchStrips(this.showStrips);
        this.renderTiles();
        this.renderWalls()
        this.camera.updateProjectionMatrix();
        this.raycaster.setNewTiles(this.currentTilesIds)
        this.render()
    }

    switchWalls(val:boolean):void {
        this.showWalls = val
        if (!val) {
            this.currentWallsIds.forEach((e) => {
                const object = (this.scene.getObjectByProperty('uuid', e) as THREE.Mesh)
                object.geometry.dispose();
                (object!.material as THREE.MeshBasicMaterial).dispose();
                this.scene.remove(object!)
            })
            this.currentWallsIds = []
        }
        this.removeOldStrips()
        this.renderWalls()
        this.renderTiles()
        this.render()
    }
    switchStrips(val:boolean):void {
        this.showStrips = val
        if (!val) {
            console.log(this.currentStripIds)
            this.removeOldStrips()
        }
        this.renderWalls()
        this.removeOldTiles();
        this.renderTiles()
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
    removeOldStrips():void {
        if (this.currentStripIds.length > 0) {
            this.currentStripIds.forEach((obj) => {
                console.log(obj)
                // @ts-ignore
                const object = (this.scene.getObjectByProperty('uuid', obj) as THREE.Mesh)
                object.geometry.dispose();
                (object!.material as THREE.MeshBasicMaterial).dispose();
                this.scene.remove(object!)
            })
            this.currentStripIds = []
        }
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

        const leftWall = new THREE.Mesh(
            new THREE.PlaneGeometry(this.config.roomY, .75),
            new THREE.MeshBasicMaterial( {color: 0x2D2335, side: THREE.DoubleSide} )
        )
        leftWall.rotation.set(0, Math.PI / 2, 0)
        leftWall.position.set((0 - (this.config.roomX / 2)), .375, 0)

        if (this.showWalls) {
            this.scene.add(afterWall)
            this.scene.add(leftWall)
            // @ts-ignore
            this.currentWallsIds.push(afterWall.uuid)
            // @ts-ignore
            this.currentWallsIds.push(leftWall.uuid)
        }

        // @ts-ignore
        this.currentWallsIds.push(floor.uuid)

    }
    switch2d():void {

    }
    getTilesCount():number {
        return (this.currentTilesIds.length / 2)
    }
    getStripCount():number {
        return this.currentStripIds.length
    }
    initRaycaster() {
        this.raycaster.init(this.currentTilesIds)
    }
    exportLayout():void {
        let exportObject:{} = {
            layoutId: Math.floor(100000000 + Math.random() * 900000000),
            layoutConfig: {
                roomX: this.config.roomX,
                roomY: this.config.roomY,
                showWalls: this.showWalls,
                showStrips: this.showStrips
            },
            stripObjects: [],
            objects: []
        }
        this.currentTilesIds.forEach((id) => {
            const object = (this.scene.getObjectByProperty('uuid', id) as THREE.Mesh)
            if (object.type === 'Mesh') {
                // @ts-ignore
                exportObject.objects.push({
                    uuid: object.uuid,
                    // @ts-ignore
                    color: object.material.color.getHexString(),
                    order: this.tilesOrder.filter((e) => {
                        return (e["uuid"] === object.uuid)
                    }).map(e => e["orderId"])[0]
                })
            }
        })
        if (this.showStrips) {

            this.currentStripIds.forEach((id) => {
                const object = (this.scene.getObjectByProperty('uuid', id) as THREE.Mesh)
                console.log(object.geometry)
                // @ts-ignore
                exportObject.stripObjects.push({
                    uuid: object.uuid,
                    // @ts-ignore
                    color: object.material.color.getHexString(),
                    position: object.position,
                    // @ts-ignore
                    geometry: object.geometry.parameters.geometry.parameters
                })
            })
        }
        const exportEngine = new ExportEngine()
        // @ts-ignore
        exportEngine.downloadConfigFile(exportObject, true, exportObject.layoutId)
    }
    loadConfig(objects:[]):void {
        this.renderTiles()
        setTimeout(() => {
            objects.forEach((newObj) => {
                const uuid = this.tilesOrder.filter((e) => {
                    return (e["orderId"] === newObj["order"])
                }).map(e => e["uuid"])[0]
                if (uuid !== undefined) {
                    const obj = (this.scene.getObjectByProperty('uuid', uuid) as THREE.Mesh)
                    // @ts-ignore
                    obj.material.color.set(parseInt(('0x' + newObj["color"])))
                }
            })
            this.render()
        }, 100)

    }
    loadConfigStrips(objects:[]):void {
        setTimeout(() => {
            this.removeOldStrips()
            objects.forEach((obj) => {
                // @ts-ignore
                const geometry = new THREE.BoxGeometry( obj.geometry.width, obj.geometry.height, obj.geometry.depth );
                const edges = new THREE.EdgesGeometry( geometry );
                // @ts-ignore
                const lineMaterial = new THREE.LineBasicMaterial( { color: parseInt("0x" + obj.color) } );
                const tileStrip = new THREE.LineSegments(edges, lineMaterial)
                // @ts-ignore
                tileStrip!.position.set(obj.position.x, obj.position.y, obj.position.z)
                this.currentStripIds.push(tileStrip!.uuid)
                this.scene!.add(tileStrip)
            })
            this.render()
        }, 100)
    }
}

export class ExportEngine {
    constructor() {
    }
    downloadConfigFile(json:{}, download:boolean, id:any) {
        const fileName = 'FB_LAYOUT_' + id + '.json'
        const file = this.renderJsonConfig(json, fileName)
        if (download) {
            if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) { // IE
                (window.navigator as any).msSaveOrOpenBlob(file, fileName);
                (window.navigator as any).msSaveOrOpenBlob(file, fileName);
            } else { //Chrome & Firefox
                const a = document.createElement('a');
                const url = window.URL.createObjectURL(file);
                a.href = url;
                a.download = fileName;
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            }
        }
    }
    renderJsonConfig(json:{}, fileName:string):File {
        return new File([JSON.stringify(json)], fileName, {
            type: 'application/json'
        })
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
    strips:[];
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
        this.strips = []
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
    getStrips(): string[] {
        return this.strips
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
    addTileStrip(x:number, countColumn:number, y:number, countRow:number):void {
        const stripWidth = 0.06
        const stripHeight = 0.395

        const stripDepth = 0.018 // change
        const startZ = this.z - 0.001

        if (x === 0) {
            const geometry = new THREE.BoxGeometry( stripWidth, stripDepth, this.y );
            const edges = new THREE.EdgesGeometry( geometry );
            const lineMaterial = new THREE.LineBasicMaterial( { color: 'dodgerblue' } );
            const tileStrip = new THREE.LineSegments(edges, lineMaterial)
            tileStrip!.position.set((this.posX - (this.x / 2) - (stripWidth / 2)), startZ, this.posY)
            this.scene!.add(tileStrip)
            // @ts-ignore
            this.strips.push(tileStrip.uuid);
            if (y === 0) {
                const geometryStart = new THREE.BoxGeometry( this.y, stripDepth, stripWidth );
                const edgesStart = new THREE.EdgesGeometry( geometryStart );
                const lineMaterialStart = new THREE.LineBasicMaterial( { color: 'dodgerblue' } );
                const tileStripStart = new THREE.LineSegments(edgesStart, lineMaterialStart)
                tileStripStart!.position.set(this.posX, startZ, (this.posY - (this.y / 2) - (stripWidth / 2)))
                this.scene!.add(tileStripStart)
                // @ts-ignore
                this.strips.push(tileStripStart.uuid);
            }
            if (y === (countRow - 1)) {
                const geometryEnd = new THREE.BoxGeometry( this.y, stripDepth, stripWidth );
                const edgesEnd = new THREE.EdgesGeometry( geometryEnd );
                const lineMaterialEnd = new THREE.LineBasicMaterial( { color: 'dodgerblue' } );
                const tileStripEnd = new THREE.LineSegments(edgesEnd, lineMaterialEnd)
                tileStripEnd!.position.set(this.posX, startZ, (this.posY + (this.y / 2) + (stripWidth / 2)))
                this.scene!.add(tileStripEnd)
                // @ts-ignore
                this.strips.push(tileStripEnd.uuid);
            }
        }
        if (x === (countColumn - 1)) {
            const geometry = new THREE.BoxGeometry( stripWidth, stripDepth, this.y );
            const edges = new THREE.EdgesGeometry( geometry );
            const lineMaterial = new THREE.LineBasicMaterial( { color: 'dodgerblue' } );
            const tileStrip = new THREE.LineSegments(edges, lineMaterial)
            tileStrip!.position.set((this.posX + (this.x / 2) + (stripWidth / 2)), startZ, this.posY)
            this.scene!.add(tileStrip)
            // @ts-ignore
            this.strips.push(tileStrip.uuid);
            if (y === 0) {
                const geometryStart = new THREE.BoxGeometry( this.y, stripDepth, stripWidth );
                const edgesStart = new THREE.EdgesGeometry( geometryStart );
                const lineMaterialStart = new THREE.LineBasicMaterial( { color: 'dodgerblue' } );
                const tileStripStart = new THREE.LineSegments(edgesStart, lineMaterialStart)
                tileStripStart!.position.set(this.posX, startZ, (this.posY - (this.y / 2) - (stripWidth / 2)))
                this.scene!.add(tileStripStart)
                // @ts-ignore
                this.strips.push(tileStripStart.uuid);
            }
            if (y === (countRow - 1)) {
                const geometryEnd = new THREE.BoxGeometry( this.y, stripDepth, stripWidth );
                const edgesEnd = new THREE.EdgesGeometry( geometryEnd );
                const lineMaterialEnd = new THREE.LineBasicMaterial( { color: 'dodgerblue' } );
                const tileStripEnd = new THREE.LineSegments(edgesEnd, lineMaterialEnd)
                tileStripEnd!.position.set(this.posX, startZ, (this.posY + (this.y / 2) + (stripWidth / 2)))
                this.scene!.add(tileStripEnd)
                // @ts-ignore
                this.strips.push(tileStripEnd.uuid);
            }
        }
        if (y === 0 && x >= 1 && x < (countColumn -1)) {
            const geometry = new THREE.BoxGeometry( this.y, stripDepth, stripWidth );
            const edges = new THREE.EdgesGeometry( geometry );
            const lineMaterial = new THREE.LineBasicMaterial( { color: 'dodgerblue' } );
            const tileStrip = new THREE.LineSegments(edges, lineMaterial)
            tileStrip!.position.set(this.posX, startZ, (this.posY - (this.y / 2) - (stripWidth / 2)))
            this.scene!.add(tileStrip)
            // @ts-ignore
            this.strips.push(tileStrip.uuid);
        }
        if (y === (countRow - 1) && x >= 1 && x < (countColumn -1)) {
            const geometry = new THREE.BoxGeometry( this.y, stripDepth, stripWidth );
            const edges = new THREE.EdgesGeometry( geometry );
            const lineMaterial = new THREE.LineBasicMaterial( { color: 'dodgerblue' } );
            const tileStrip = new THREE.LineSegments(edges, lineMaterial)
            tileStrip!.position.set(this.posX, startZ, (this.posY + (this.y / 2) + (stripWidth / 2)))
            this.scene!.add(tileStrip)
            // @ts-ignore
            this.strips.push(tileStrip.uuid);
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
                }
            }
        })
        this.renderer.clear();
        this.renderer.render( this.scene, this.camera );
    }
    // @ts-ignore
    genRanHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

}