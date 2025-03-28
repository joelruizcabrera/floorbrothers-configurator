import * as THREE from 'three';

export default class renderEngine {

    container;
    scene;
    camera;
    renderer;

    constructor(id) {
        this.container = document.querySelector(id);
        this.camera = new THREE.PerspectiveCamera( 60, this.container.clientWidth / this.container.clientHeight, 1, 100 );
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer( { antialias: true } );
    }
    createView():void {
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.scene.background = new THREE.Color('white');

        this.camera.position.set( 0, 0, 10 );
        this.scene.add(this.camera)

        this.renderer.autoClear = false;
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( this.container.clientWidth, this.container.clientHeight );
        this.container.appendChild( this.renderer.domElement );

        window.addEventListener( 'resize', () => {
            this.onWindowResize(this.container)
        });

        this.renderer.render(this.scene, this.camera)
    }
    onWindowResize():void {
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.render();

    }
    render() {
        this.renderer.clear();
        this.renderer.render( this.scene, this.camera );
    }
}