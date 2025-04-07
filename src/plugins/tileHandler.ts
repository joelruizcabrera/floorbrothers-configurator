import * as THREE from "three";

interface ConfigInterfaceTile {
    x: number,
    y: number,
    z: number
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
    strips:string[];
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

        this.cube.name = "Tile"

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
        let color = 0x63666a

        if (x === 0) {
            const tileStrip = this.createTileStrip(
                {x: stripWidth, y: stripDepth, z: this.y},
                color,
                {x: (this.posX - (this.x / 2) - (stripWidth / 2)), y: startZ, z: this.posY}
            )
            this.scene!.add(tileStrip)
            if (y === 0) {
                const tileStrip = this.createTileStrip(
                    {x: this.y, y: stripDepth, z: stripWidth},
                    color,
                    {x: this.posX, y: startZ, z: (this.posY - (this.y / 2) - (stripWidth / 2))}
                )
                this.scene!.add(tileStrip)
            }
            if (y === (countRow - 1)) {
                const tileStrip = this.createTileStrip(
                    {x: this.y, y: stripDepth, z: stripWidth},
                    color,
                    {x: this.posX, y: startZ, z: (this.posY + (this.y / 2) + (stripWidth / 2))}
                )
                this.scene!.add(tileStrip)
            }
        }
        if (x === (countColumn - 1)) {
            const tileStrip = this.createTileStrip(
                {x: stripWidth, y: stripDepth, z: this.y},
                color,
                {x: (this.posX + (this.x / 2) + (stripWidth / 2)), y: startZ, z: this.posY}
            )
            this.scene!.add(tileStrip)

            if (y === 0) {
                const tileStrip = this.createTileStrip(
                    {x: this.y, y: stripDepth, z: stripWidth},
                    color,
                    {x: this.posX, y: startZ, z: (this.posY - (this.y / 2) - (stripWidth / 2))}
                )
                this.scene!.add(tileStrip)
            }
            if (y === (countRow - 1)) {
                const tileStrip = this.createTileStrip(
                    {x: this.y, y: stripDepth, z: stripWidth},
                    color,
                    {x: this.posX, y: startZ, z: (this.posY + (this.y / 2) + (stripWidth / 2))}
                )
                this.scene!.add(tileStrip)
            }
        }
        if (y === 0 && x >= 1 && x < (countColumn -1)) {
            const tileStrip = this.createTileStrip(
                {x: this.y, y: stripDepth, z: stripWidth},
                color,
                {x: this.posX, y: startZ, z: (this.posY - (this.y / 2) - (stripWidth / 2))}
            )
            this.scene!.add(tileStrip)
        }
        if (y === (countRow - 1) && x >= 1 && x < (countColumn -1)) {
            const tileStrip = this.createTileStrip(
                {x: this.y, y: stripDepth, z: stripWidth},
                color,
                {x: this.posX, y: startZ, z: (this.posY + (this.y / 2) + (stripWidth / 2))}
            )
            this.scene!.add(tileStrip)
        }
    }
    createTileStrip(geo:any, color:any, pos:any) {
        const geometry = new THREE.BoxGeometry( geo.x, geo.y, geo.z );
        const material = new THREE.MeshBasicMaterial( {color: color} );
        const tileStrip = new THREE.Mesh( geometry, material );
        tileStrip.position.set(pos.x, pos.y, pos.z)

        if (this.showWireframe) {
            this.renderTileStripWireframe(geometry, pos)
        }
        this.strips.push(tileStrip.uuid);
        tileStrip.name = "TileStrip"
        return tileStrip
    }
    renderTileStripWireframe(geometry:any, pos:any) {
        const edges = new THREE.EdgesGeometry( geometry );
        const lineMaterial = new THREE.LineBasicMaterial( { color: 'black' } );
        const tileStripFrame = new THREE.LineSegments(edges, lineMaterial)
        tileStripFrame.position.set(pos.x, pos.y, pos.z)
        tileStripFrame.name = "TileStripFrame"
        this.strips.push(tileStripFrame.uuid);
        this.scene!.add(tileStripFrame)
    }
    renderWireframe(geometry:any) {
        const edges = new THREE.EdgesGeometry( geometry );
        const lineMaterial = new THREE.LineBasicMaterial( { color: 'black' } );
        this.frame = new THREE.LineSegments( edges, lineMaterial );
        this.frame!.position.set(this.posX, ((this.z / 2) + 0.01), this.posY)
        this.frame.name = "TileFrame"
        this.scene!.add(this.frame)
    }

    handleClick(event: Event):void {
        console.log(event)
    }

}