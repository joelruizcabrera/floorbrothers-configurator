import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { KMZLoader } from 'three/addons/loaders/KMZLoader.js';

export default class renderEngine {

    container;
    scene;
    camera;
    renderer;
    light;
    controls;
    floorMaterial;
    floor;

    constructor(id: string) {
        this.container = document.querySelector(id);
        this.camera = new THREE.PerspectiveCamera( 60, this.container!.clientWidth / this.container!.clientHeight, 1, 100 );
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer( { antialias: true } );
        this.light = new THREE.DirectionalLight( 0xffffff, 3 );

        this.controls = new OrbitControls( this.camera, this.renderer.domElement );

        this.floorMaterial = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} )
        this.floor = new THREE.Mesh(new THREE.PlaneGeometry( 1, 1 ), this.floorMaterial );
    }
    createView():void {
        this.renderer.setSize(this.container!.clientWidth, this.container!.clientHeight);
        this.scene.background = new THREE.Color('white');

        // creating light
        this.light.position.set( 0.5, 1.0, 0.5 ).normalize();
        this.scene.add( this.light );

        // set camera
        this.camera.position.set( 4, 6, 20 );
        this.scene.add(this.camera)

        this.renderer.autoClear = false;
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( this.container!.clientWidth, this.container!.clientHeight );
        this.container!.appendChild( this.renderer.domElement );

        const grid = new THREE.GridHelper( 50, 50, 0xffffff, 0x7b7b7b );
        this.scene.add( grid );

        const hlp = new THREE.AxesHelper(1);
        this.scene.add(hlp);

        this.createInitFloor()

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
    createInitFloor():void {
        this.floor.rotateX(Math.PI / 180 * 90);
        this.scene.add( this.floor );
    }
    updateFloor(x: number, y: number): void {
        console.log(x)
        console.log(y)
    }
    onWindowResize():void {
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.container!.clientWidth, this.container!.clientHeight);
        this.render();

    }
    render() {
        this.renderer.clear();
        this.renderer.render( this.scene, this.camera );
    }
}