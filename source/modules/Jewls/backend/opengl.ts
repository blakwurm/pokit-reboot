"use strict";

let _programs: IProgram[] = [];
let _gl: WebGL2RenderingContext | null = null;
let _textures: Map<string,ITexture> | null = null;
let _cameras: Map<string, ICamera> | null = null;
let _actors: Map<string, IActor> | null = null;

interface IProgram {
    program: WebGLProgram,
    attributes: {
        [number: string]: any
    },
    uniforms: {
        [WebGLUniformLocation: string]: any
    }
}

interface ITexture {
    texture: WebGLTexture,
    width: number,
    height: number,
    id?: string
}

interface ICamera {
    x: number,
    y: number
    angle: number,
    width: number,
    height: number,
    main: boolean,
    frameBuffer: WebGLFramebuffer,
    texture: ITexture,
    views: string[],
    clear: {
        r: number,
        g: number,
        b: number,
        a: number
    }
}

interface IActor {
    _tilemapData?: {
        numSpritesRow: number,
        numTilesRow: number,
        tileWidth: number,
        tileHeight: number,
        startGid: number,
        layer: number[]
    },
    name: string,
    texture: WebGLTexture,
    texture_id: string,
    vertexBuffer: WebGLBuffer,
    vertexArray: WebGLVertexArrayObject,
    uvBuffer: WebGLBuffer,
    passes: number,
    width: number,
    height: number,
    sheetWidth: number,
    sheetHeight: number,
    spriteWidth: number,
    spriteHeight: number,
    sprite_spacing_x: number,
    sprite_spacing_y: number,
    sprite_x: number,
    sprite_y: number,
    trans: [number,number,number,number],
    x_translation: number,
    y_translation: number,
    x_scale: number,
    y_scale: number,
    angle: number,
    priority: number
}
function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
    let shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
}

function createProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null {
    let program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    let success = gl.getProgramParameter(program!, gl.LINK_STATUS);
    if (success) {
        return program!;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
}

/** Initialize WebGL context and prepare renderer
 * @param {HTMLCanvasElement} canvas - The canvas to render to
 */
export async function initContext(canvas: HTMLCanvasElement): Promise<boolean> {
    _gl = canvas.getContext("webgl2", { premultipliedAlpha: false, alpha: true });
    _textures = new Map();
    _actors = new Map();
    _cameras = new Map();

    if (!_gl!) {
        return false;
    }

    _gl!.enable(_gl!.DEPTH_TEST);
    _gl!.depthFunc(_gl!.LEQUAL);
    _gl!.blendFunc(_gl!.ONE, _gl!.ONE_MINUS_SRC_ALPHA);
    _gl!.enable(_gl!.BLEND);

    let vertexShaderSource = await fetch("/js/modules/Jewls/backend/shaders/default_vertex_shader.glsl").then(b => b.text());
    let fragmentShaderSource = await fetch("/js/modules/Jewls/backend/shaders/default_fragment_shader.glsl").then(b => b.text());

    let vertexShader = createShader(_gl!, _gl!.VERTEX_SHADER, vertexShaderSource)!;
    let fragmentShader = createShader(_gl!, _gl!.FRAGMENT_SHADER, fragmentShaderSource)!;
    let program = createProgram(_gl!, vertexShader, fragmentShader)!;

    let positionAttributeLocation = _gl!.getAttribLocation(program, "a_vertexPosition");
    let uvAttributeLocation = _gl!.getAttribLocation(program, "a_uvCoord");

    let priorityUniformLocation = _gl!.getUniformLocation(program, "u_priority");
    let yFlipUnifomLocation = _gl!.getUniformLocation(program, "u_flip_y");
    let resolutionUniformLocation = _gl!.getUniformLocation(program, "u_resolution");
    let translationUniformLocation = _gl!.getUniformLocation(program, "u_translation");
    let rotationUniformLocation = _gl!.getUniformLocation(program, "u_rotation");
    let scaleUniformLocation = _gl!.getUniformLocation(program, "u_scale");
    let modifierUniformLocation = _gl!.getUniformLocation(program, "u_uvModifier");
    let translatorUniformLocation = _gl!.getUniformLocation(program, "u_uvTranslator");
    let imageUniformLocation = _gl!.getUniformLocation(program, "u_image");
    let transUniformLocation = _gl!.getUniformLocation(program, "u_trans");

    _programs.push({
        program: program,
        attributes: {
            vertexPosition: positionAttributeLocation,
            uvCoords: uvAttributeLocation,
        },
        uniforms: {
            priority: priorityUniformLocation,
            yFlip: yFlipUnifomLocation,
            resolution: resolutionUniformLocation,
            translation: translationUniformLocation,
            rotation: rotationUniformLocation,
            scale: scaleUniformLocation,
            uvModifier: modifierUniformLocation,
            uvTranslator: translatorUniformLocation,
            image: imageUniformLocation,
            trans: transUniformLocation
        },
    });

    return true;
}

/** Send image to GPU for use in rendering
 * @param {String} name - The ID to save the texture under
 * @param {HTMLImageElement} image - The image to send to the GPU
 */
export function createImageTexture(name: string, image: HTMLImageElement) {
    let tex = createTexture(image.width, image.height, image);
    tex.id = name;
    _textures!.set(name, tex);
}

/** Send raw image data to GPU for use in rendering
 * @param {String} name - The ID to save the texture under
 * @param {Number} width - The width of the image
 * @param {Number} height - The height of the image
 * @param {Uint8Array} data - The image data in RGBA format
 */
export function createRawTexture(name: string, width: number, height: number, data: Uint8Array) {
    let tex = createTexture(width, height, data);
    tex.id = name;
    _textures!.set(name, tex);
}

function createTexture(width: number, height: number, data: HTMLImageElement | Uint8Array | null): ITexture {
    let texture = _gl!.createTexture()!;

    _gl!.bindTexture(_gl!.TEXTURE_2D, texture);
    _gl!.pixelStorei(_gl!.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    //@ts-ignore
    _gl!.texImage2D(_gl!.TEXTURE_2D, 0, _gl!.RGBA, width, height, 0, _gl!.RGBA, _gl!.UNSIGNED_BYTE, data);

    _gl!.texParameteri(_gl!.TEXTURE_2D, _gl!.TEXTURE_MAG_FILTER, _gl!.NEAREST);
    _gl!.texParameteri(_gl!.TEXTURE_2D, _gl!.TEXTURE_MIN_FILTER, _gl!.NEAREST);
    _gl!.texParameteri(_gl!.TEXTURE_2D, _gl!.TEXTURE_WRAP_S, _gl!.CLAMP_TO_EDGE);
    _gl!.texParameteri(_gl!.TEXTURE_2D, _gl!.TEXTURE_WRAP_T, _gl!.CLAMP_TO_EDGE);
    _gl!.bindTexture(_gl!.TEXTURE_2D, null);

    return {
        texture: texture,
        width: width,
        height: height,
    };
}

/** Delete texture
 * @param {String} name - The ID of the texture to be deleted
 */
export function deleteTexture(name: string){
    _gl!.deleteTexture(_textures!.get(name)!.texture);
    _textures!.delete(name);
}

function parseTileMap(numSpritesRow: number, numTilesRow: number, tileWidth: number, tileHeight: number, startGid: number, layer: number[]): [number[],number[]] {

    //console.log(layers);

    let positions: number[] = [];
    let uvs: number[] = [];
    let offsetX = -((numTilesRow / 2) * tileWidth);
    let offsetY = -((layer.length / numTilesRow / 2) * tileWidth);
    for (let i = 0; i < layer.length; i++) {
        let x = i % numTilesRow;
        let y = Math.floor(i / numTilesRow);

        let spriteX,spriteY;

        if(layer[i] >= startGid){
            let tile = layer[i]-startGid;
            spriteX = tile % numSpritesRow;
            spriteY = Math.floor(tile / numSpritesRow);
        }else{
            spriteX = -999;
            spriteY = -999;
        }

        

        //console.log({ i: i, x: x, y: y, spriteX: spriteX, spriteY: spriteY })

        createSquare(positions,tileWidth, tileHeight, offsetX + tileWidth * x, offsetY + tileHeight * y, 0)
        createUvSquare(uvs, spriteX, spriteY);
    }

    return [positions, uvs];
}

export function setTileWithCoords(actor: string, x: number, y: number, tile: number, layer: number){
    let tilemap = _actors!.get(actor)!._tilemapData;
    setTile(actor, y*tilemap!.numTilesRow + x, tile, layer);
}

export function setTile(actor: string, index: number, tile: number, layer: number){
    _actors!.get(actor)!._tilemapData!.layer[index] = tile;
}

// export function updateTileMap(actorID: string){
//     let uvs = []
//     let actor = _actors.get(actorID);
//     let tilemap = actor._tilemapData;
//     for (let layer of tilemap.layers) {
//         for (let i = 0; i < layer.length; i++) {
//             let tile = tilemap.alphaTile;

//             if (layer[i] > 0)
//                 tile = layer[i] - 1;

//             let spriteX = tile % tilemap.numSpritesRow;
//             let spriteY = Math.floor(tile / tilemap.numSpritesRow);

//             //console.log({ i: i, x: x, y: y, spriteX: spriteX, spriteY: spriteY })

//             createUvSquare(uvs, spriteX, spriteY);
//             //return [positions, uvs];
//         }
//     }

//     let uvCoords = _programs[0].attributes.uvCoords;
//     bufferUvs(uvs, uvCoords, actor.uvBuffer);
// }

function createSquare(positions: number[], width: number, height: number, x: number, y: number, layer: number) {
    positions.push(x, y, layer);
    positions.push(x + width, y, layer);
    positions.push(x, y + height, layer);
    positions.push(x + width, y, layer);
    positions.push(x, y + height, layer);
    positions.push(x + width, y + width, layer);
}

function createUvSquare(uvs: number[], spriteX: number, spriteY: number){
    uvs.push(spriteX, spriteY);
    uvs.push(spriteX + 1, spriteY);
    uvs.push(spriteX, spriteY + 1);
    uvs.push(spriteX + 1, spriteY);
    uvs.push(spriteX, spriteY + 1);
    uvs.push(spriteX + 1, spriteY + 1);
}

/** Create tile map
 * @param {String} name - The ID to save the tile map under
 * @param {String} texture - The ID of the texture containing the sprite map
 * @param {Number} numSpritesRow - The ammount of sprites in a single row of the sprite map
 * @param {Number} numTilesRow - The ammount of tiles in a single row of the tile map
 * @param {Number} tileWidth - The pixel width of a single sprite
 * @param {Number} tileHeight - The pixel height of a single sprite
 * @param {Number} startGid - First gid of the spritesheet
 * @param {Array} layers - An array of arrays containing layer data for the tile map
 */
export function createTileMap(name: string, texture: string, numSpritesRow: number, numTilesRow: number, tileWidth: number, tileHeight: number, startGid: number, layer: number[], precision: number = 6) {

    let [positions, uvs] = parseTileMap(numSpritesRow, numTilesRow, tileWidth, tileHeight, startGid, layer);

    //console.log(positions);
    //console.log(uvs);

    let tex = _textures!.get(texture)!;
    let vertexPosition = _programs[0].attributes.vertexPosition;
    let uvCoords = _programs[0].attributes.uvCoords;

    let [positionBuffer, vao] = bufferObject(positions, vertexPosition);
    let coordBuffer = bufferUvs(uvs, uvCoords);

    let sWidth = tileWidth/tex.width;
    let sHeight = tileHeight/tex.height;

    let rWidth = parseFloat(sWidth.toFixed(precision));
    let rHeight = parseFloat(sHeight.toFixed(precision));

    _actors!.set(name, {
        _tilemapData: {
            numSpritesRow: numSpritesRow,
            numTilesRow: numTilesRow,
            tileWidth: tileWidth,
            tileHeight: tileHeight,
            startGid: startGid,
            layer: layer,
        },
        name: name,
        texture: tex.texture,
        texture_id: tex.id!,
        vertexBuffer: positionBuffer,
        vertexArray: vao,
        uvBuffer: coordBuffer,
        passes: positions.length/3,
        width: numTilesRow * tileWidth,
        height: Math.floor(layer.length / numTilesRow) * tileHeight,
        sheetWidth: tex.width,
        sheetHeight: tex.height,
        spriteWidth: rWidth,
        spriteHeight: rHeight,
        sprite_spacing_x: 0,
        sprite_spacing_y: 0,
        sprite_x: 0,
        sprite_y: 0,
        trans:[0,0,0,0],
        x_translation: 0,
        y_translation: 0,
        x_scale: 1,
        y_scale: 1,
        angle: 0,
        priority: 0,
    });
}

/** Create actor for defining sprite data on the canvas
 * @param {String} name - The ID to save the actor under
 * @param {String} texture - The ID of the sprite map or texure to be displayed
 * @param {Number} width - The width of the sprite
 * @param {Number} height - The height of the sprite
 * @param {Boolean} textureLiteral - Parameter for internal use only, should always be false
 */
export function createActor(name: string, texture: string | ITexture, width: number, height: number, textureLiteral: boolean = false, precision: number = 5) {
    let tex = _textures!.get(<string>texture)!;
    if (textureLiteral) tex = <ITexture>texture;
    //console.log(_programs);
    let vertexPosition = _programs[0].attributes.vertexPosition;
    let uvCoords = _programs[0].attributes.uvCoords;

    width = width || tex.width;
    height = height || tex.height;

    let offsetX = width / 2;
    let offsetY = height / 2;

    let positions = [
        -offsetX, -offsetY, 0,
        -offsetX, offsetY, 0,
        offsetX, -offsetY, 0,
        -offsetX, offsetY, 0,
        offsetX, -offsetY, 0,
        offsetX, offsetY, 0,
    ];

    let uvs = [
        0.0, 0.0,
        0.0, 1.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 1.0,
    ];

    let [positionBuffer, vao] = bufferObject(positions, vertexPosition);
    let coordBuffer = bufferUvs(uvs, uvCoords);

    let sWidth = width/tex.width;
    let sHeight = height/tex.height;

    let rWidth = parseFloat(sWidth.toFixed(precision));
    let rHeight = parseFloat(sHeight.toFixed(precision));

    _actors!.set(name, {
        name: name,
        texture: tex.texture,
        texture_id: tex.id!,
        vertexBuffer: positionBuffer,
        vertexArray: vao,
        uvBuffer: coordBuffer,
        passes: 6,
        width: width,
        height: height,
        sheetWidth: tex.width,
        sheetHeight: tex.height,
        spriteWidth: rWidth, 
        spriteHeight: rHeight,
        sprite_x: 0,
        sprite_y: 0,
        sprite_spacing_x: 0,
        sprite_spacing_y: 0,
        trans:[0,0,0,0],
        x_translation: 0,
        y_translation: 0,
        x_scale: 1,
        y_scale: 1,
        angle: 0,
        priority: 0,
    });
}

function bufferObject(positions: number[], vertexPosition: number): [WebGLBuffer, WebGLVertexArrayObject] {
    let positionBuffer = _gl!.createBuffer()!;
    _gl!.bindBuffer(_gl!.ARRAY_BUFFER, positionBuffer);

    _gl!.bufferData(_gl!.ARRAY_BUFFER, new Float32Array(positions), _gl!.STATIC_DRAW);

    let vao = _gl!.createVertexArray()!;
    _gl!.bindVertexArray(vao);
    _gl!.enableVertexAttribArray(vertexPosition);

    _gl!.vertexAttribPointer(vertexPosition, 3, _gl!.FLOAT, false, 0, 0);

    return [positionBuffer, vao];
}

function bufferUvs(uvs: Iterable<number>, uvCoords: number, coordBuffer?: WebGLBuffer): WebGLBuffer {
    coordBuffer = coordBuffer || _gl!.createBuffer()!;
    _gl!.bindBuffer(_gl!.ARRAY_BUFFER, coordBuffer);
    _gl!.bufferData(_gl!.ARRAY_BUFFER, new Float32Array(uvs), _gl!.STATIC_DRAW);

    _gl!.vertexAttribPointer(uvCoords, 2, _gl!.FLOAT, false, 0, 0);
    _gl!.enableVertexAttribArray(uvCoords);

    return coordBuffer;
}

/** Delete actor
 * @param {String} name - The ID of the actor to be deleted
 */
export function deleteActor(name: string) {
    let actor = _actors!.get(name)!;
    _gl!.deleteVertexArray(actor.vertexArray);
    _gl!.deleteBuffer(actor.vertexBuffer);
    _gl!.deleteBuffer(actor.uvBuffer);
    _actors!.delete(name);
}

/** Set sprite metadata for actor
 * @param {string} actor - The actor to be modified
 * @param {number} x - The x coordinate of the sprite in the sprite map
 * @param {number} y - The y coordinate of the sprite in the sprite map
 * @param {number} spacing - The ammount of space between sprites in the sprite map
 * @param {[number,number,number,number]} - The color to be replaced with transparency in RGBA 0-1 format
 */
export function setActorSprite(actor: string, x: number, y: number, spacing: number, trans: [number,number,number,number]) {
    let texId = _actors!.get(actor)!.texture_id;
    let tex = _textures!.get(texId)!;
    _actors!.get(actor)!.sprite_x = x;
    _actors!.get(actor)!.sprite_y = y;
    _actors!.get(actor)!.sprite_spacing_x = spacing / tex.width;
    _actors!.get(actor)!.sprite_spacing_y = spacing / tex.height;
    _actors!.get(actor)!.trans = trans;
}

/** Create camera for manipulating viewport
 * @param {String} name - The ID to save the camera under
 * @param {Number} width - The width of the viewport
 * @param {Number} height - The height of the viewport
 * @param {Boolean} isMainCamera - Determines weather or not this should be used as the main rendering camera (default False)
 * @param {Number} clearR - The red value of the viewport clear color (default 0)
 * @param {Number} clearG - The green value of the viewport clear color (default 0)
 * @param {Number} clearB - The blue value of the viewport clear color (default 0)
 * @param {Number} clearA - The alpha value of the viewport clear color (default 0)
 */
export function createCamera(name: string, width: number, height: number, isMainCamera: boolean = false, clearR: number = 0, clearG: number = 0, clearB: number = 0, clearA: number = 0) {

    const fb = _gl!.createFramebuffer()!;
    _gl!.bindFramebuffer(_gl!.FRAMEBUFFER, fb);

    let tex = createTexture(width, height, null);
    _gl!.framebufferTexture2D(_gl!.FRAMEBUFFER, _gl!.COLOR_ATTACHMENT0, _gl!.TEXTURE_2D, tex.texture, 0);

    _cameras!.set(name, {
        x: 0,
        y: 0,
        angle: 0,
        width: width,
        height: height,
        main: isMainCamera,
        frameBuffer: fb,
        texture: tex,
        views: [],
        clear: {
            r: clearR,
            g: clearG,
            b: clearB,
            a: clearA,
        },
    })

    if(isMainCamera) createCameraView('__main__', name);
}

/** Delete camera
 * @param {String} name - The ID of the camera to be deleted
*/
export function deleteCamera(name: string){
    let camera = _cameras!.get(name)!;
    for(let cv of camera.views){
        deleteActor(cv);
    }
    _gl!.deleteFramebuffer(camera.frameBuffer);
    _gl!.deleteTexture(camera.texture.texture);
    _cameras!.delete(name);
}

/** Create an actor that displays a camera's viewport
 * @param {String} name - The ID to save the actor under
 * @param {String} camera - The ID of the camera to be displayed
 */
export function createCameraView(name: string, camera: string) {
    let tex = _cameras!.get(camera)!.texture;
    createActor(name, tex, tex.width, tex.height, true);
    _cameras!.get(camera)!.views.push(name);
}

/**  Clear render canvas (automatically done in render)
 * @param {Number} r - The red value of the viewport clear color (default 0)
 * @param {Number} g - The green value of the viewport clear color (default 0)
 * @param {Number} b - The blue value of the viewport clear color (default 0)
 * @param {Number} a - The alpha value of the viewport clear color (default 0)
 */
export function clear(r: number = 0, g: number = 0, b: number = 0, a: number = 0) {
    _gl!.clearColor(r, g, b, a)
    _gl!.clear(_gl!.COLOR_BUFFER_BIT);
}

function toRad(deg: number) {
    return deg / 360 * 2 * Math.PI;
}

/** Sets actor rotation offset in degrees
 * @param {String} actor - The ID of the actor to be modified
 * @param {Number} degrees - The rotation offset
 */
export function rotateActor(actor: string, degrees: number) {
    _actors!.get(actor)!.angle = degrees;
}

/** Sets camera rotation offset in degrees
 * @param {String} camera - The ID of the camera to be modified
 * @param {Number} degrees - The rotation offset
 */
export function rotateCamera(camera: string, degrees: number) {
    _cameras!.get(camera)!.angle = degrees;
}

/** Sets the actor translation offset
 * @param {String} actor - The ID of the actor to be modified
 * @param {Number} x - The x value offset (default 0)
 * @param {Number} y - The y value offset (default 0)
 * @param {Number} z - The z value offset (default 0)
 */
export function translateActor(actor: string, x: number = 0, y: number = 0, z: number = 0) {
    _actors!.get(actor)!.x_translation = x;
    _actors!.get(actor)!.y_translation = y;
    _actors!.get(actor)!.priority = z;
}

/** Sets the camera translation offset
 * @param {String} camera - The ID of the camera to be modified
 * @param {Number} x - The x value offset (default 0)
 * @param {Number} y - The y value offset (default 0)
 */
export function translateCamera(camera: string, x: number = 0, y: number = 0) {
    _cameras!.get(camera)!.x = x;
    _cameras!.get(camera)!.y = y;
}

/** Sets the actor scale offset
 * @param {String} actor - The ID of the actor to be modified
 * @param {Number} x - The width value offset
 * @param {Number} y - The height value offset
 */
export function scaleActor(actor: string, x: number = 1, y: number = 1) {
    _actors!.get(actor)!.x_scale = x;
    _actors!.get(actor)!.y_scale = y;
}

function drawActor(actor: IActor, programData: IProgram, camera: ICamera, yFlip: number){
    _gl!.bindVertexArray(actor.vertexArray);

    _gl!.activeTexture(_gl!.TEXTURE0);
    _gl!.bindTexture(_gl!.TEXTURE_2D, actor.texture);

    _gl!.uniform1i(programData.uniforms.image, 0);
    _gl!.uniform1f(programData.uniforms.priority, actor.priority);
    _gl!.uniform1f(programData.uniforms.yFlip, yFlip);
    _gl!.uniform2f(programData.uniforms.resolution, camera.width, camera.height);
    _gl!.uniform2f(programData.uniforms.translation, actor.x_translation - camera.x, actor.y_translation - camera.y);
    _gl!.uniform2f(programData.uniforms.rotation, Math.sin(toRad(actor.angle - camera.angle)), Math.cos(toRad(actor.angle - camera.angle)));
    _gl!.uniform2f(programData.uniforms.scale, actor.x_scale, actor.y_scale);
    _gl!.uniform2f(programData.uniforms.uvModifier, actor.spriteWidth, actor.spriteHeight);
    _gl!.uniform2f(programData.uniforms.uvTranslator, actor.sprite_x * (actor.spriteWidth + actor.sprite_spacing_x), actor.sprite_y * (actor.spriteHeight + actor.sprite_spacing_y));
    _gl!.uniform4fv(programData.uniforms.trans, new Float32Array(actor.trans))

    _gl!.bindFramebuffer(_gl!.FRAMEBUFFER, camera.frameBuffer);
    _gl!.drawArrays(_gl!.TRIANGLES, 0, actor.passes);
}

/** Renders all viewports */
export function render(sortFunc?: (e?:any[], c?:any)=>any[]) {
    //@ts-ignore
    sortFunc = sortFunc || ((entities, cam) => entities);

    _gl!.colorMask(true, true, true, true);

    let programData = _programs[0];

    for (let camera of [..._cameras!.values()].sort((x,y)=>x.main?1:-1)) {
        _gl!.viewport(0, 0, camera.width, camera.height);

        if(camera.main){
            _gl!.bindFramebuffer(_gl!.FRAMEBUFFER, null);
            clear(camera.clear.r, camera.clear.g, camera.clear.b, camera.clear.a);
        }

        _gl!.bindFramebuffer(_gl!.FRAMEBUFFER, camera.frameBuffer);

        clear(camera.clear.r, camera.clear.g, camera.clear.b, camera.clear.a);

        _gl!.useProgram(programData.program);

        let cam = Object.assign({z:-200, depth:400}, camera)!
        
        let comprehended: any[] = [..._actors!.values()];
        comprehended.forEach(x=>{
            x.x = x.x_translation
            x.y=x.y_translation
            x.z=0;
            x.scaleX=x.x_scale
            x.scaleY=x.y_scale
        });
        let sorted = [...sortFunc!(comprehended, cam)!].sort((x,y) => y.priority - x.priority);

        //console.log(sorted);

        for (let actor of sorted) {//filterMap(_actors.values(), x => checkOverlap(camera.x, camera.y, camera.width, camera.height, x.x_translation, x.y_translation, x.width, x.height))) {
            if (actor.texture === camera.texture.texture || actor.name === '__main__') continue
            drawActor(actor, programData, camera, 1.0);
        }
        if(camera.main){
            let actor = _actors!.get('__main__');
            _gl!.bindFramebuffer(_gl!.FRAMEBUFFER, null);
            let c = {};
            Object.assign(c, camera, {x:0,y:0,frameBuffer:null});
            drawActor(actor!, programData, c as ICamera, -1.0);
        }
    }
     _gl!.colorMask(false, false, false, true);
    clear(1, 1, 1, 1);
}