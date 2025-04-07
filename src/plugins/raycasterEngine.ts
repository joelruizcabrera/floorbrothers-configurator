import * as THREE from "three";

export class RayCaster {
    camera;
    scene;
    pointer;
    container;
    raycast;
    intersecting:[];
    currentTiles:string[];
    currentStripTiles:string[];
    renderer;
    clickColor:any;
    clickStripColor: any;
    constructor(camera: THREE.Camera, scene: THREE.Scene, container:any, renderer: THREE.WebGLRenderer) {
        this.camera = camera;
        this.scene = scene;
        this.raycast = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        this.container = container
        this.intersecting = []
        this.renderer = renderer
        this.currentTiles = [];
        this.currentStripTiles = [];
    }
    setClickColor(color:any) {
        this.clickColor = color
    }
    setClickStripColor(color:any) {
        this.clickStripColor = color
    }
    setNewTiles(tiles:string[], strips:string[]) {
        this.currentTiles = tiles
        this.currentStripTiles = strips
    }
    init(tiles:string[], stripTiles:string[]) {
        this.currentTiles = tiles
        this.currentStripTiles = stripTiles
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
        const meshs = this.scene.children.filter((obj) => obj.name === 'Tile')
        const meshStrips = this.scene.children.filter((obj) => obj.name === 'TileStrip')

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

        meshStrips.forEach((mesh) => {
            const intersects = this.raycast.intersectObject(mesh);
            if (intersects.length !== 0) {
                let obj = intersects[0].object;
                // @ts-ignore
                if (this.currentStripTiles.includes(obj.uuid)) {
                    // @ts-ignore
                    this.intersecting.push(obj)
                    // @ts-ignore
                    obj.material.color.set(parseInt(('0x' + this.clickStripColor)))
                }
            }
        })
        this.renderer.clear();
        this.renderer.render( this.scene, this.camera );
    }
    // @ts-ignore
    genRanHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

}