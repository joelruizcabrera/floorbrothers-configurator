import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { KMZLoader } from 'three/addons/loaders/KMZLoader.js';
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import modelDefault from '../assets/tile_default.glb'

export default class renderEngine {

    container;
    scene;
    camera;
    renderer;
    light;
    controls;
    config;

    model:any;

    constructor(id: string) {

        this.config = {
            tileSize: 0.395,
            showGrid: true,
            showAxes: true,
            tileFactor: 0.005,
            testXMeters: 15.5,
            testYMeters: 20.20
        }

        this.container = document.querySelector(id);
        this.camera = new THREE.PerspectiveCamera( 60, this.container!.clientWidth / this.container!.clientHeight, 1, 100 );
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer( { antialias: true } );
        this.light = new THREE.DirectionalLight( 0xffffff, 3 );

        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
    }
    createView():void {
        this.renderer.setSize(this.container!.clientWidth, this.container!.clientHeight);
        this.scene.background = new THREE.Color('white');

        // creating light
        this.light.position.set( 0.5, .75, 0.5 ).normalize();
        this.scene.add( this.light );

        // set camera
        this.camera.position.set( 4, 6, 20 );
        this.scene.add(this.camera)

        this.renderer.autoClear = false;
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( this.container!.clientWidth, this.container!.clientHeight );
        this.container!.appendChild( this.renderer.domElement );

        this.addTiles()

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

        // resize function needs to be always on bottom of create view

        window.addEventListener( 'resize', () => {
            this.onWindowResize()
        });

        this.renderer.render(this.scene, this.camera)
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
    addTiles():void {
        /*
        TEESTTTING
        */
        const loader = new GLTFLoader();

        const timesColumn = Math.floor(this.config.testXMeters / this.config.tileSize)
        const timesRow = Math.floor((this.config.testYMeters - 1) / this.config.tileSize)

        console.log(timesColumn)

        const allGroup = new THREE.Group();

        for (let x = 0; x < timesColumn; x++) {
            let _this = this;
            for (let y = 0; y < timesRow; y++) {
                loader.load(
                    modelDefault,
                    (glb:any) => {
                        glb.scene.scale.set(this.config.tileFactor, this.config.tileFactor, this.config.tileFactor)
                        glb.scene.position.set(x, 1, (y + 1))
                        _this.model = glb.scene;
                        allGroup.add(_this.model)
                    },
                    function (xhr:ProgressEvent) {
                        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
                    },
                    function (error:any) {
                        console.log("An error happened:", error);
                    }
                );
            }
        }

        allGroup.updateMatrixWorld( true )
        this.scene.add(allGroup)
    }
}