import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { KMZLoader } from 'three/addons/loaders/KMZLoader.js';
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {DRACOLoader} from "three/examples/jsm/loaders/DRACOLoader.js";
import {BufferGeometry, Scene} from "three";
import {ExportEngine} from "@/plugins/exportEngine.ts";
import {Tile} from "@/plugins/tileHandler.ts"
import {RayCaster} from "@/plugins/raycasterEngine.ts";

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
    clickStripColor:any;
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
    setClickStripColor(color:any) {
        this.clickStripColor = color
        this.raycaster.setClickStripColor(this.clickStripColor)
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
    changeAllStripColor() {
        this.currentStripIds.forEach((e) => {
            const obj = (this.scene.getObjectByProperty('uuid', e) as THREE.Mesh)
            if (obj.type === 'Mesh') {
                // @ts-ignore
                obj.material.color.set(parseInt(('0x' + this.clickStripColor)))
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
        this.removeOldTiles()
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
        this.raycaster.setNewTiles(this.currentTilesIds, this.currentStripIds)
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
        this.raycaster.setNewTiles(this.currentTilesIds, this.currentStripIds)
        this.render()
    }
    switchStrips(val:boolean):void {
        this.showStrips = val
        if (!val) {
            this.removeOldStrips()
        }
        this.renderWalls()
        this.removeOldTiles();
        this.renderTiles()
        this.raycaster.setNewTiles(this.currentTilesIds, this.currentStripIds)

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
        console.log(this.currentTilesIds)
        return (this.currentTilesIds.length / 2)
    }
    getStripCount():number {
        return this.currentStripIds.length / 2
    }
    initRaycaster() {
        this.raycaster.init(this.currentTilesIds, this.currentStripIds)
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