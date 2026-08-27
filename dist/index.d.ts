import * as _THREE from 'three';

interface THREESubset {
    Vector2: typeof _THREE.Vector2;
    Vector3: typeof _THREE.Vector3;
    Vector4: typeof _THREE.Vector4;
    Quaternion: typeof _THREE.Quaternion;
    Matrix4: typeof _THREE.Matrix4;
    Spherical: typeof _THREE.Spherical;
    Box3: typeof _THREE.Box3;
    Sphere: typeof _THREE.Sphere;
    Raycaster: typeof _THREE.Raycaster;
    [key: string]: any;
}
type Ref = {
    value: number;
};
interface SmoothTimes {
    rotateAzimuth: number;
    rotatePolar: number;
    truck: number;
    dolly: number;
    zoom: number;
    offset: number;
}
type SmoothTimeOption = number | (Partial<SmoothTimes> & {
    rotate?: number;
});
declare const MOUSE_BUTTON: {
    readonly LEFT: 1;
    readonly RIGHT: 2;
    readonly MIDDLE: 4;
};
type MOUSE_BUTTON = typeof MOUSE_BUTTON[keyof typeof MOUSE_BUTTON];
declare const ACTION: Readonly<{
    readonly NONE: 0;
    readonly ROTATE_AZIMUTH: 1;
    readonly ROTATE_POLAR: 2;
    readonly ROTATE: number;
    readonly TRUCK: 4;
    readonly SCREEN_PAN: 8;
    readonly OFFSET: 16;
    readonly DOLLY: 32;
    readonly ZOOM: 64;
    readonly TOUCH_ROTATE_AZIMUTH: 128;
    readonly TOUCH_ROTATE_POLAR: 256;
    readonly TOUCH_ROTATE: number;
    readonly TOUCH_TRUCK: 512;
    readonly TOUCH_SCREEN_PAN: 1024;
    readonly TOUCH_OFFSET: 2048;
    readonly TOUCH_DOLLY: 4096;
    readonly TOUCH_ZOOM: 8192;
    readonly TOUCH_DOLLY_TRUCK: number;
    readonly TOUCH_DOLLY_SCREEN_PAN: number;
    readonly TOUCH_DOLLY_OFFSET: number;
    readonly TOUCH_DOLLY_ROTATE: number;
    readonly TOUCH_ZOOM_TRUCK: number;
    readonly TOUCH_ZOOM_OFFSET: number;
    readonly TOUCH_ZOOM_SCREEN_PAN: number;
    readonly TOUCH_ZOOM_ROTATE: number;
}>;
type ACTION = number;
interface PointerInput {
    pointerId: number;
    clientX: number;
    clientY: number;
    deltaX: number;
    deltaY: number;
    mouseButton: MOUSE_BUTTON | null;
}
type mouseButtonAction = typeof ACTION.ROTATE | typeof ACTION.ROTATE_AZIMUTH | typeof ACTION.ROTATE_POLAR | typeof ACTION.TRUCK | typeof ACTION.SCREEN_PAN | typeof ACTION.OFFSET | typeof ACTION.DOLLY | typeof ACTION.ZOOM | typeof ACTION.NONE;
type mouseWheelAction = typeof ACTION.ROTATE | typeof ACTION.ROTATE_AZIMUTH | typeof ACTION.ROTATE_POLAR | typeof ACTION.TRUCK | typeof ACTION.SCREEN_PAN | typeof ACTION.OFFSET | typeof ACTION.DOLLY | typeof ACTION.ZOOM | typeof ACTION.NONE;
type singleTouchAction = typeof ACTION.TOUCH_ROTATE | typeof ACTION.TOUCH_ROTATE_AZIMUTH | typeof ACTION.TOUCH_ROTATE_POLAR | typeof ACTION.TOUCH_TRUCK | typeof ACTION.TOUCH_SCREEN_PAN | typeof ACTION.TOUCH_OFFSET | typeof ACTION.DOLLY | typeof ACTION.ZOOM | typeof ACTION.NONE;
type multiTouchAction = typeof ACTION.TOUCH_DOLLY_ROTATE | typeof ACTION.TOUCH_DOLLY_TRUCK | typeof ACTION.TOUCH_DOLLY_OFFSET | typeof ACTION.TOUCH_ZOOM_ROTATE | typeof ACTION.TOUCH_ZOOM_TRUCK | typeof ACTION.TOUCH_ZOOM_OFFSET | typeof ACTION.TOUCH_DOLLY | typeof ACTION.TOUCH_ZOOM | typeof ACTION.TOUCH_ROTATE | typeof ACTION.TOUCH_ROTATE_AZIMUTH | typeof ACTION.TOUCH_ROTATE_POLAR | typeof ACTION.TOUCH_TRUCK | typeof ACTION.TOUCH_SCREEN_PAN | typeof ACTION.TOUCH_OFFSET | typeof ACTION.NONE;
interface MouseButtons {
    left: mouseButtonAction;
    middle: mouseButtonAction;
    right: mouseButtonAction;
    wheel: mouseWheelAction;
}
interface Touches {
    one: singleTouchAction;
    two: multiTouchAction;
    three: multiTouchAction;
}
declare const DOLLY_DIRECTION: {
    readonly NONE: 0;
    readonly IN: 1;
    readonly OUT: -1;
};
type DOLLY_DIRECTION = typeof DOLLY_DIRECTION[keyof typeof DOLLY_DIRECTION];
interface FitToOptions {
    cover: boolean;
    paddingLeft: number;
    paddingRight: number;
    paddingBottom: number;
    paddingTop: number;
}
interface CameraControlsEventMap {
    update: {
        type: 'update';
    };
    wake: {
        type: 'wake';
    };
    rest: {
        type: 'rest';
    };
    sleep: {
        type: 'sleep';
    };
    transitionstart: {
        type: 'transitionstart';
    };
    controlstart: {
        type: 'controlstart';
    };
    control: {
        type: 'control';
    };
    controlend: {
        type: 'controlend';
    };
}
type CameraControlsLerpState = {
    target: [number, number, number];
} & ({
    spherical: Parameters<_THREE.Spherical["set"]>;
} | {
    position: [number, number, number];
});

type Listener = (event?: DispatcherEvent) => void;
interface DispatcherEvent {
    type: string;
    [key: string]: any;
}
declare class EventDispatcher {
    private _listeners;
    /**
     * Adds the specified event listener.
     * @param type event name
     * @param listener handler function
     * @category Methods
     */
    addEventListener(type: string, listener: Listener): void;
    /**
     * Presence of the specified event listener.
     * @param type event name
     * @param listener handler function
     * @category Methods
     */
    hasEventListener(type: string, listener: Listener): boolean;
    /**
     * Removes the specified event listener
     * @param type event name
     * @param listener handler function
     * @category Methods
     */
    removeEventListener(type: string, listener: Listener): void;
    /**
     * Removes all event listeners
     * @param type event name
     * @category Methods
     */
    removeAllEventListeners(type?: string): void;
    /**
     * Fire an event type.
     * @param event DispatcherEvent
     * @category Methods
     */
    dispatchEvent(event: DispatcherEvent): void;
}

declare class CameraControls extends EventDispatcher {
    /**
     * Injects THREE as the dependency. You can then proceed to use CameraControls.
     *
     * e.g
     * ```javascript
     * CameraControls.install( { THREE: THREE } );
     * ```
     *
     * Note: If you do not wish to use enter three.js to reduce file size(tree-shaking for example), make a subset to install.
     *
     * ```js
     * import {
     * 	Vector2,
     * 	Vector3,
     * 	Vector4,
     * 	Quaternion,
     * 	Matrix4,
     * 	Spherical,
     * 	Box3,
     * 	Sphere,
     * 	Raycaster,
     * 	MathUtils,
     * } from 'three';
     *
     * const subsetOfTHREE = {
     * 	Vector2   : Vector2,
     * 	Vector3   : Vector3,
     * 	Vector4   : Vector4,
     * 	Quaternion: Quaternion,
     * 	Matrix4   : Matrix4,
     * 	Spherical : Spherical,
     * 	Box3      : Box3,
     * 	Sphere    : Sphere,
     * 	Raycaster : Raycaster,
     * };

     * CameraControls.install( { THREE: subsetOfTHREE } );
     * ```
     * @category Statics
     */
    static install(libs: {
        THREE: THREESubset;
    }): void;
    /**
     * list all ACTIONs
     * @category Statics
     */
    static get ACTION(): typeof ACTION;
    /**
     * Minimum vertical angle in radians.
     * The angle has to be between `0` and `.maxPolarAngle` inclusive.
     * The default value is `0`.
     *
     * e.g.
     * ```
     * cameraControls.maxPolarAngle = 0;
     * ```
     * @category Properties
     */
    minPolarAngle: number;
    /**
     * Maximum vertical angle in radians.
     * The angle has to be between `.maxPolarAngle` and `Math.PI` inclusive.
     * The default value is `Math.PI`.
     *
     * e.g.
     * ```
     * cameraControls.maxPolarAngle = Math.PI;
     * ```
     * @category Properties
     */
    maxPolarAngle: number;
    /**
     * Minimum horizontal angle in radians.
     * The angle has to be less than `.maxAzimuthAngle`.
     * The default value is `- Infinity`.
     *
     * e.g.
     * ```
     * cameraControls.minAzimuthAngle = - Infinity;
     * ```
     * @category Properties
     */
    minAzimuthAngle: number;
    /**
     * Maximum horizontal angle in radians.
     * The angle has to be greater than `.minAzimuthAngle`.
     * The default value is `Infinity`.
     *
     * e.g.
     * ```
     * cameraControls.maxAzimuthAngle = Infinity;
     * ```
     * @category Properties
     */
    maxAzimuthAngle: number;
    /**
     * Minimum distance for dolly. The value must be higher than `0`. Default is `Number.EPSILON`.
     * PerspectiveCamera only.
     * @category Properties
     */
    minDistance: number;
    /**
     * Maximum distance for dolly. The value must be higher than `minDistance`. Default is `Infinity`.
     * PerspectiveCamera only.
     * @category Properties
     */
    maxDistance: number;
    /**
     * `true` to enable Infinity Dolly for wheel and pinch. Use this with `minDistance` and `maxDistance`
     * If the Dolly distance is less (or over) than the `minDistance` (or `maxDistance`), `infinityDolly` will keep the distance and pushes the target position instead.
     * @category Properties
     */
    infinityDolly: boolean;
    /**
     * Minimum camera zoom.
     * @category Properties
     */
    minZoom: number;
    /**
     * Maximum camera zoom.
     * @category Properties
     */
    maxZoom: number;
    /**
     * Max transition speed in unit-per-seconds
     * @category Properties
     */
    maxSpeed: number;
    /**
     * Speed of azimuth (horizontal) rotation.
     * @category Properties
     */
    azimuthRotateSpeed: number;
    /**
     * Speed of polar (vertical) rotation.
     * @category Properties
     */
    polarRotateSpeed: number;
    /**
     * Speed of mouse-wheel dollying.
     * @category Properties
     */
    dollySpeed: number;
    /**
     * `true` to invert direction when dollying or zooming via drag
     * @category Properties
     */
    dollyDragInverted: boolean;
    /**
     * Speed of drag for truck and pedestal.
     * @category Properties
     */
    truckSpeed: number;
    /**
     * `true` to enable Dolly-in to the mouse cursor coords.
     * @category Properties
     */
    dollyToCursor: boolean;
    /**
     * @category Properties
     */
    dragToOffset: boolean;
    /**
     * Friction ratio of the boundary.
     * @category Properties
     */
    boundaryFriction: number;
    /**
     * Controls how soon the `rest` event fires as the camera slows.
     * @category Properties
     */
    restThreshold: number;
    /**
     * An array of Meshes to collide with camera.
     * Be aware colliderMeshes may decrease performance. The collision test uses 4 raycasters from the camera since the near plane has 4 corners.
     * @category Properties
     */
    colliderMeshes: _THREE.Object3D[];
    /**
     * User's mouse input config.
     *
     * | button to assign      | behavior |
     * | --------------------- | -------- |
     * | `mouseButtons.left`   | `CameraControls.ACTION.ROTATE`* \| `CameraControls.ACTION.ROTATE_AZIMUTH` \| `CameraControls.ACTION.ROTATE_POLAR` \| `CameraControls.ACTION.TRUCK` \| `CameraControls.ACTION.OFFSET` \| `CameraControls.ACTION.DOLLY` \| `CameraControls.ACTION.ZOOM` \| `CameraControls.ACTION.NONE` |
     * | `mouseButtons.right`  | `CameraControls.ACTION.ROTATE` \| `CameraControls.ACTION.ROTATE_AZIMUTH` \| `CameraControls.ACTION.ROTATE_POLAR` \| `CameraControls.ACTION.TRUCK`* \| `CameraControls.ACTION.OFFSET` \| `CameraControls.ACTION.DOLLY` \| `CameraControls.ACTION.ZOOM` \| `CameraControls.ACTION.NONE` |
     * | `mouseButtons.wheel` ¹ | `CameraControls.ACTION.ROTATE` \| `CameraControls.ACTION.ROTATE_AZIMUTH` \| `CameraControls.ACTION.ROTATE_POLAR` \| `CameraControls.ACTION.TRUCK` \| `CameraControls.ACTION.OFFSET` \| `CameraControls.ACTION.DOLLY` \| `CameraControls.ACTION.ZOOM` \| `CameraControls.ACTION.NONE` |
     * | `mouseButtons.middle` ² | `CameraControls.ACTION.ROTATE` \| `CameraControls.ACTION.ROTATE_AZIMUTH` \| `CameraControls.ACTION.ROTATE_POLAR` \| `CameraControls.ACTION.TRUCK` \| `CameraControls.ACTION.OFFSET` \| `CameraControls.ACTION.DOLLY`* \| `CameraControls.ACTION.ZOOM` \| `CameraControls.ACTION.NONE` |
     *
     * 1. Mouse wheel event for scroll "up/down" on mac "up/down/left/right"
     * 2. Mouse click on wheel event "button"
     * - \* is the default.
     * - The default of `mouseButtons.wheel` is:
     *   - `DOLLY` for Perspective camera.
     *   - `ZOOM` for Orthographic camera, and can't set `DOLLY`.
     * @category Properties
     */
    mouseButtons: MouseButtons;
    /**
     * User's touch input config.
     *
     * | fingers to assign     | behavior |
     * | --------------------- | -------- |
     * | `touches.one` | `CameraControls.ACTION.TOUCH_ROTATE`* \| `CameraControls.ACTION.TOUCH_ROTATE_AZIMUTH` \| `CameraControls.ACTION.TOUCH_ROTATE_POLAR` \| `CameraControls.ACTION.TOUCH_TRUCK` \| `CameraControls.ACTION.TOUCH_OFFSET` \| `CameraControls.ACTION.DOLLY` \| `CameraControls.ACTION.ZOOM` \| `CameraControls.ACTION.NONE` |
     * | `touches.two` | `ACTION.TOUCH_DOLLY_TRUCK` \| `ACTION.TOUCH_DOLLY_OFFSET` \| `ACTION.TOUCH_DOLLY_ROTATE` \| `ACTION.TOUCH_ZOOM_TRUCK` \| `ACTION.TOUCH_ZOOM_OFFSET` \| `ACTION.TOUCH_ZOOM_ROTATE` \| `ACTION.TOUCH_DOLLY` \| `ACTION.TOUCH_ZOOM` \| `CameraControls.ACTION.TOUCH_ROTATE` \| `CameraControls.ACTION.TOUCH_TRUCK` \| `CameraControls.ACTION.TOUCH_OFFSET` \| `CameraControls.ACTION.NONE` |
     * | `touches.three` | `ACTION.TOUCH_DOLLY_TRUCK` \| `ACTION.TOUCH_DOLLY_OFFSET` \| `ACTION.TOUCH_DOLLY_ROTATE` \| `ACTION.TOUCH_ZOOM_TRUCK` \| `ACTION.TOUCH_ZOOM_OFFSET` \| `ACTION.TOUCH_ZOOM_ROTATE` \| `CameraControls.ACTION.TOUCH_ROTATE` \| `CameraControls.ACTION.TOUCH_TRUCK` \| `CameraControls.ACTION.TOUCH_OFFSET` \| `CameraControls.ACTION.NONE` |
     *
     * - \* is the default.
     * - The default of `touches.two` and `touches.three` is:
     *   - `TOUCH_DOLLY_TRUCK` for Perspective camera.
     *   - `TOUCH_ZOOM_TRUCK` for Orthographic camera, and can't set `TOUCH_DOLLY_TRUCK` and `TOUCH_DOLLY`.
     * @category Properties
     */
    touches: Touches;
    /**
     * Force cancel user dragging.
     * @category Methods
     */
    cancel: () => void;
    /**
     * Still an experimental feature.
     * This could change at any time.
     * @category Methods
     */
    lockPointer: () => void;
    /**
     * Still an experimental feature.
     * This could change at any time.
     * @category Methods
     */
    unlockPointer: () => void;
    protected _enabled: boolean;
    protected _camera: _THREE.PerspectiveCamera | _THREE.OrthographicCamera;
    protected _yAxisUpSpace: _THREE.Quaternion;
    protected _yAxisUpSpaceInverse: _THREE.Quaternion;
    protected _state: ACTION;
    protected _domElement?: HTMLElement;
    protected _viewport: _THREE.Vector4 | null;
    protected _target: _THREE.Vector3;
    protected _targetEnd: _THREE.Vector3;
    protected _focalOffset: _THREE.Vector3;
    protected _focalOffsetEnd: _THREE.Vector3;
    protected _spherical: _THREE.Spherical;
    protected _sphericalEnd: _THREE.Spherical;
    protected _lastDistance: number;
    protected _zoom: number;
    protected _zoomEnd: number;
    protected _lastZoom: number;
    protected _cameraUp0: _THREE.Vector3;
    protected _target0: _THREE.Vector3;
    protected _position0: _THREE.Vector3;
    protected _zoom0: number;
    protected _focalOffset0: _THREE.Vector3;
    protected _dollyControlCoord: _THREE.Vector2;
    protected _changedDolly: number;
    protected _changedZoom: number;
    protected _nearPlaneCorners: [_THREE.Vector3, _THREE.Vector3, _THREE.Vector3, _THREE.Vector3];
    protected _hasRested: boolean;
    protected _boundary: _THREE.Box3;
    protected _boundaryEnclosesCamera: boolean;
    protected _needsUpdate: boolean;
    protected _updatedLastTime: boolean;
    protected _elementRect: DOMRect;
    protected _isDragging: boolean;
    protected _dragNeedsUpdate: boolean;
    protected _activePointers: PointerInput[];
    protected _lockedPointer: PointerInput | null;
    protected _interactiveArea: DOMRect;
    protected _isUserControllingRotate: boolean;
    protected _isUserControllingDolly: boolean;
    protected _isUserControllingTruck: boolean;
    protected _isUserControllingOffset: boolean;
    protected _isUserControllingZoom: boolean;
    protected _lastDollyDirection: DOLLY_DIRECTION;
    protected _thetaVelocity: Ref;
    protected _phiVelocity: Ref;
    protected _radiusVelocity: Ref;
    protected _targetVelocity: _THREE.Vector3;
    protected _focalOffsetVelocity: _THREE.Vector3;
    protected _zoomVelocity: Ref;
    protected _smoothTime: SmoothTimes;
    protected _controlSmoothTime: SmoothTimes;
    /**
     * @deprecated Use `cameraControls.mouseButtons.left = CameraControls.ACTION.SCREEN_PAN` instead.
     */
    set verticalDragToForward(_: boolean);
    /**
     * Creates a `CameraControls` instance.
     *
     * Note:
     * You **must install** three.js before using camera-controls. see [#install](#install)
     * Not doing so will lead to runtime errors (`undefined` references to THREE).
     *
     * e.g.
     * ```
     * CameraControls.install( { THREE } );
     * const cameraControls = new CameraControls( camera, domElement );
     * ```
     *
     * @param camera A `THREE.PerspectiveCamera` or `THREE.OrthographicCamera` to be controlled.
     * @param domElement A `HTMLElement` for the draggable area, usually `renderer.domElement`.
     * @category Constructor
     */
    constructor(camera: _THREE.PerspectiveCamera | _THREE.OrthographicCamera, domElement?: HTMLElement);
    /**
     * The camera to be controlled
     * @category Properties
     */
    get camera(): _THREE.PerspectiveCamera | _THREE.OrthographicCamera;
    set camera(camera: _THREE.PerspectiveCamera | _THREE.OrthographicCamera);
    /**
     * Whether or not the controls are enabled.
     * `false` to disable user dragging/touch-move, but all methods works.
     * @category Properties
     */
    get enabled(): boolean;
    set enabled(enabled: boolean);
    /**
     * Returns `true` if the controls are active updating.
     * readonly value.
     * @category Properties
     */
    get active(): boolean;
    /**
     * Getter for the current `ACTION`.
     * readonly value.
     * @category Properties
     */
    get currentAction(): ACTION;
    /**
     * get/set Current distance.
     * @category Properties
     */
    get distance(): number;
    set distance(distance: number);
    /**
     * get/set the azimuth angle (horizontal) in radians.
     * Every 360 degrees turn is added to `.azimuthAngle` value, which is accumulative.
     * @category Properties
     */
    get azimuthAngle(): number;
    set azimuthAngle(azimuthAngle: number);
    /**
     * get/set the polar angle (vertical) in radians.
     * @category Properties
     */
    get polarAngle(): number;
    set polarAngle(polarAngle: number);
    /**
     * Whether camera position should be enclosed in the boundary or not.
     * @category Properties
     */
    get boundaryEnclosesCamera(): boolean;
    set boundaryEnclosesCamera(boundaryEnclosesCamera: boolean);
    /**
     * Set drag-start, touches and wheel enable area in the domElement.
     * each values are between `0` and `1` inclusive, where `0` is left/top and `1` is right/bottom of the screen.
     * e.g. `{ x: 0, y: 0, width: 1, height: 1 }` for entire area.
     * @category Properties
     */
    set interactiveArea(interactiveArea: DOMRect | {
        x: number;
        y: number;
        width: number;
        height: number;
    });
    /**
     * Adds the specified event listener.
     * Applicable event types (which is `K`) are:
     * | Event name          | Timing |
     * | ------------------- | ------ |
     * | `'controlstart'`    | When the user starts to control the camera via mouse / touches. ¹ |
     * | `'control'`         | When the user controls the camera (dragging). |
     * | `'controlend'`      | When the user ends to control the camera. ¹ |
     * | `'transitionstart'` | When any kind of transition starts, either user control or using a method with `enableTransition = true` |
     * | `'update'`          | When the camera position is updated. |
     * | `'wake'`            | When the camera starts moving. |
     * | `'rest'`            | When the camera movement is below `.restThreshold` ². |
     * | `'sleep'`           | When the camera end moving. |
     *
     * 1. `mouseButtons.wheel` (Mouse wheel control) does not emit `'controlstart'` and `'controlend'`. `mouseButtons.wheel` uses scroll-event internally, and scroll-event happens intermittently. That means "start" and "end" cannot be detected.
     * 2. Due to damping, `sleep` will usually fire a few seconds after the camera _appears_ to have stopped moving. If you want to do something (e.g. enable UI, perform another transition) at the point when the camera has stopped, you probably want the `rest` event. This can be fine tuned using the `.restThreshold` parameter. See the [Rest and Sleep Example](https://yomotsu.github.io/camera-controls/examples/rest-and-sleep.html).
     *
     * e.g.
     * ```
     * cameraControl.addEventListener( 'controlstart', myCallbackFunction );
     * ```
     * @param type event name
     * @param listener handler function
     * @category Methods
     */
    addEventListener<K extends keyof CameraControlsEventMap>(type: K, listener: (event: CameraControlsEventMap[K]) => any): void;
    /**
     * Removes the specified event listener
     * e.g.
     * ```
     * cameraControl.addEventListener( 'controlstart', myCallbackFunction );
     * ```
     * @param type event name
     * @param listener handler function
     * @category Methods
     */
    removeEventListener<K extends keyof CameraControlsEventMap>(type: K, listener: (event: CameraControlsEventMap[K]) => any): void;
    /**
     * Rotate azimuthal angle(horizontal) and polar angle(vertical).
     * Every value is added to the current value.
     * @param azimuthAngle Azimuth rotate angle. In radian.
     * @param polarAngle Polar rotate angle. In radian.
     * @param enableTransition Whether to move smoothly or immediately
     * @category Methods
     */
    rotate(azimuthAngle: number, polarAngle: number, enableTransition?: boolean): Promise<void>;
    /**
     * Rotate azimuthal angle(horizontal) to the given angle and keep the same polar angle(vertical) target.
     *
     * e.g.
     * ```
     * cameraControls.rotateAzimuthTo( 30 * THREE.MathUtils.DEG2RAD, true );
     * ```
     * @param azimuthAngle Azimuth rotate angle. In radian.
     * @param enableTransition Whether to move smoothly or immediately
     * @category Methods
     */
    rotateAzimuthTo(azimuthAngle: number, enableTransition?: boolean): Promise<void>;
    /**
     * Rotate polar angle(vertical) to the given angle and keep the same azimuthal angle(horizontal) target.
     *
     * e.g.
     * ```
     * cameraControls.rotatePolarTo( 30 * THREE.MathUtils.DEG2RAD, true );
     * ```
     * @param polarAngle Polar rotate angle. In radian.
     * @param enableTransition Whether to move smoothly or immediately
     * @category Methods
     */
    rotatePolarTo(polarAngle: number, enableTransition?: boolean): Promise<void>;
    /**
     * Rotate azimuthal angle(horizontal) and polar angle(vertical) to the given angle.
     * Camera view will rotate over the orbit pivot absolutely:
     *
     * azimuthAngle
     * ```
     *       0º
     *         \
     * 90º -----+----- -90º
     *           \
     *           180º
     * ```
     * | direction | angle                  |
     * | --------- | ---------------------- |
     * | front     | 0º                     |
     * | left      | 90º (`Math.PI / 2`)    |
     * | right     | -90º (`- Math.PI / 2`) |
     * | back      | 180º (`Math.PI`)       |
     *
     * polarAngle
     * ```
     *     180º
     *      |
     *      90º
     *      |
     *      0º
     * ```
     * | direction            | angle                  |
     * | -------------------- | ---------------------- |
     * | top/sky              | 180º (`Math.PI`)       |
     * | horizontal from view | 90º (`Math.PI / 2`)    |
     * | bottom/floor         | 0º                     |
     *
     * @param azimuthAngle Azimuth rotate angle to. In radian.
     * @param polarAngle Polar rotate angle to. In radian.
     * @param enableTransition  Whether to move smoothly or immediately
     * @category Methods
     */
    rotateTo(azimuthAngle: number, polarAngle: number, enableTransition?: boolean): Promise<void>;
    /**
     * Dolly in/out camera position.
     * @param distance Distance of dollyIn. Negative number for dollyOut.
     * @param enableTransition Whether to move smoothly or immediately.
     * @category Methods
     */
    dolly(distance: number, enableTransition?: boolean): Promise<void>;
    /**
     * Dolly in/out camera position to given distance.
     * @param distance Distance of dolly.
     * @param enableTransition Whether to move smoothly or immediately.
     * @category Methods
     */
    dollyTo(distance: number, enableTransition?: boolean): Promise<void>;
    protected _dollyToNoClamp(distance: number, enableTransition?: boolean): Promise<void>;
    /**
     * Dolly in, but does not change the distance between the target and the camera, and moves the target position instead.
     * Specify a negative value for dolly out.
     * @param distance Distance of dolly.
     * @param enableTransition Whether to move smoothly or immediately.
     * @category Methods
     */
    dollyInFixed(distance: number, enableTransition?: boolean): Promise<void>;
    /**
     * Zoom in/out camera. The value is added to camera zoom.
     * Limits set with `.minZoom` and `.maxZoom`
     * @param zoomStep zoom scale
     * @param enableTransition Whether to move smoothly or immediately
     * @category Methods
     */
    zoom(zoomStep: number, enableTransition?: boolean): Promise<void>;
    /**
     * Zoom in/out camera to given scale. The value overwrites camera zoom.
     * Limits set with .minZoom and .maxZoom
     * @param zoom
     * @param enableTransition
     * @category Methods
     */
    zoomTo(zoom: number, enableTransition?: boolean): Promise<void>;
    /**
     * @deprecated `pan()` has been renamed to `truck()`
     * @category Methods
     */
    pan(x: number, y: number, enableTransition?: boolean): Promise<void>;
    /**
     * Truck and pedestal camera using current azimuthal angle
     * @param x Horizontal translate amount
     * @param y Vertical translate amount
     * @param enableTransition Whether to move smoothly or immediately
     * @category Methods
     */
    truck(x: number, y: number, enableTransition?: boolean): Promise<void>;
    /**
     * Move forward / backward.
     * @param distance Amount to move forward / backward. Negative value to move backward
     * @param enableTransition Whether to move smoothly or immediately
     * @category Methods
     */
    forward(distance: number, enableTransition?: boolean): Promise<void>;
    /**
     * Move up / down.
     * @param height Amount to move up / down. Negative value to move down
     * @param enableTransition Whether to move smoothly or immediately
     * @category Methods
     */
    elevate(height: number, enableTransition?: boolean): Promise<void>;
    /**
     * Move target position to given point.
     * @param x x coord to move center position
     * @param y y coord to move center position
     * @param z z coord to move center position
     * @param enableTransition Whether to move smoothly or immediately
     * @category Methods
     */
    moveTo(x: number, y: number, z: number, enableTransition?: boolean): Promise<void>;
    /**
     * Look in the given point direction.
     * @param x point x.
     * @param y point y.
     * @param z point z.
     * @param enableTransition Whether to move smoothly or immediately.
     * @returns Transition end promise
     * @category Methods
     */
    lookInDirectionOf(x: number, y: number, z: number, enableTransition?: boolean): Promise<void>;
    /**
     * Fit the viewport to the box or the bounding box of the object, using the nearest axis. paddings are in unit.
     * set `cover: true` to fill enter screen.
     * e.g.
     * ```
     * cameraControls.fitToBox( myMesh );
     * ```
     * @param box3OrObject Axis aligned bounding box to fit the view.
     * @param enableTransition Whether to move smoothly or immediately.
     * @param options | `<object>` { cover: boolean, paddingTop: number, paddingLeft: number, paddingBottom: number, paddingRight: number }
     * @returns Transition end promise
     * @category Methods
     */
    fitToBox(box3OrObject: _THREE.Box3 | _THREE.Object3D, enableTransition: boolean, { cover, paddingLeft, paddingRight, paddingBottom, paddingTop }?: Partial<FitToOptions>): Promise<void[]>;
    /**
     * Fit the viewport to the sphere or the bounding sphere of the object.
     * @param sphereOrMesh
     * @param enableTransition
     * @category Methods
     */
    fitToSphere(sphereOrMesh: _THREE.Sphere | _THREE.Object3D, enableTransition: boolean): Promise<void[]>;
    /**
     * Look at the `target` from the `position`.
     * @param positionX
     * @param positionY
     * @param positionZ
     * @param targetX
     * @param targetY
     * @param targetZ
     * @param enableTransition
     * @category Methods
     */
    setLookAt(positionX: number, positionY: number, positionZ: number, targetX: number, targetY: number, targetZ: number, enableTransition?: boolean): Promise<void>;
    /**
     * Interpolates between two states.
     * @param stateA
     * @param stateB
     * @param t
     * @param enableTransition
     * @category Methods
     */
    lerp(stateA: CameraControlsLerpState, stateB: CameraControlsLerpState, t: number, enableTransition?: boolean): Promise<void>;
    /**
     * Similar to setLookAt, but it interpolates between two states.
     * @param positionAX
     * @param positionAY
     * @param positionAZ
     * @param targetAX
     * @param targetAY
     * @param targetAZ
     * @param positionBX
     * @param positionBY
     * @param positionBZ
     * @param targetBX
     * @param targetBY
     * @param targetBZ
     * @param t
     * @param enableTransition
     * @category Methods
     */
    lerpLookAt(positionAX: number, positionAY: number, positionAZ: number, targetAX: number, targetAY: number, targetAZ: number, positionBX: number, positionBY: number, positionBZ: number, targetBX: number, targetBY: number, targetBZ: number, t: number, enableTransition?: boolean): Promise<void>;
    /**
     * Set angle and distance by given position.
     * An alias of `setLookAt()`, without target change. Thus keep gazing at the current target
     * @param positionX
     * @param positionY
     * @param positionZ
     * @param enableTransition
     * @category Methods
     */
    setPosition(positionX: number, positionY: number, positionZ: number, enableTransition?: boolean): Promise<void>;
    /**
     * Set the target position where gaze at.
     * An alias of `setLookAt()`, without position change. Thus keep the same position.
     * @param targetX
     * @param targetY
     * @param targetZ
     * @param enableTransition
     * @category Methods
     */
    setTarget(targetX: number, targetY: number, targetZ: number, enableTransition?: boolean): Promise<void>;
    /**
     * Set focal offset using the screen parallel coordinates. z doesn't affect in Orthographic as with Dolly.
     * @param x
     * @param y
     * @param z
     * @param enableTransition
     * @category Methods
     */
    setFocalOffset(x: number, y: number, z: number, enableTransition?: boolean): Promise<void>;
    /**
     * Set orbit point without moving the camera.
     * SHOULD NOT RUN DURING ANIMATIONS. `setOrbitPoint()` will immediately fix the positions.
     * @param targetX
     * @param targetY
     * @param targetZ
     * @category Methods
     */
    setOrbitPoint(targetX: number, targetY: number, targetZ: number): void;
    /**
     * Set the boundary box that encloses the target of the camera. box3 is in THREE.Box3
     * @param box3
     * @category Methods
     */
    setBoundary(box3?: _THREE.Box3): void;
    /**
     * Set (or unset) the current viewport.
     * Set this when you want to use renderer viewport and .dollyToCursor feature at the same time.
     * @param viewportOrX
     * @param y
     * @param width
     * @param height
     * @category Methods
     */
    setViewport(viewportOrX: _THREE.Vector4 | number | null, y: number, width: number, height: number): void;
    /**
     * Calculate the distance to fit the box.
     * @param width box width
     * @param height box height
     * @param depth box depth
     * @returns distance
     * @category Methods
     */
    getDistanceToFitBox(width: number, height: number, depth: number, cover?: boolean): number;
    /**
     * Calculate the distance to fit the sphere.
     * @param radius sphere radius
     * @returns distance
     * @category Methods
     */
    getDistanceToFitSphere(radius: number): number;
    /**
     * Returns the orbit center position, where the camera looking at.
     * @param out The receiving Vector3 instance to copy the result
     * @param receiveEndValue Whether receive the transition end coords or current. default is `true`
     * @category Methods
     */
    getTarget(out: _THREE.Vector3, receiveEndValue?: boolean): _THREE.Vector3;
    /**
     * Returns the camera position.
     * @param out The receiving Vector3 instance to copy the result
     * @param receiveEndValue Whether receive the transition end coords or current. default is `true`
     * @category Methods
     */
    getPosition(out: _THREE.Vector3, receiveEndValue?: boolean): _THREE.Vector3;
    /**
     * Returns the spherical coordinates of the orbit.
     * @param out The receiving Spherical instance to copy the result
     * @param receiveEndValue Whether receive the transition end coords or current. default is `true`
     * @category Methods
     */
    getSpherical(out: _THREE.Spherical, receiveEndValue?: boolean): _THREE.Spherical;
    /**
     * Returns the focal offset, which is how much the camera appears to be translated in screen parallel coordinates.
     * @param out The receiving Vector3 instance to copy the result
     * @param receiveEndValue Whether receive the transition end coords or current. default is `true`
     * @category Methods
     */
    getFocalOffset(out: _THREE.Vector3, receiveEndValue?: boolean): _THREE.Vector3;
    /**
     * Normalize camera azimuth angle (horizontal rotation) between -180 and 180 degrees.
     * @returns This CameraControls instance.
     * @category Methods
     */
    normalizeRotations(): CameraControls;
    /**
     * stop all transitions.
     */
    stop(): void;
    /**
     * Reset all rotation and position to defaults.
     * @param enableTransition
     * @category Methods
     */
    reset(enableTransition?: boolean): Promise<void[]>;
    /**
     * Set current camera position as the default position.
     * @category Methods
     */
    saveState(): void;
    /**
     * Sync camera-up direction.
     * When camera-up vector is changed, `.updateCameraUp()` must be called.
     * @category Methods
     */
    updateCameraUp(): void;
    /**
     * Apply current camera-up direction to the camera.
     * The orbit system will be re-initialized with the current position.
     * @category Methods
     */
    applyCameraUp(): void;
    /**
     * Update camera position and directions.
     * This should be called in your tick loop every time, and returns true if re-rendering is needed.
     * @param delta
     * @returns updated
     * @category Methods
     */
    update(delta: number): boolean;
    /**
     * Get all state in JSON string
     * @category Methods
     */
    toJSON(): string;
    /**
     * Reproduce the control state with JSON. enableTransition is where anim or not in a boolean.
     * @param json
     * @param enableTransition
     * @category Methods
     */
    fromJSON(json: string, enableTransition?: boolean): void;
    /**
     * Attach all internal event handlers to enable drag control.
     * @category Methods
     */
    connect(domElement: HTMLElement): void;
    /**
     * Detach all internal event handlers to disable drag control.
     */
    disconnect(): void;
    /**
     * Dispose the cameraControls instance itself, remove all eventListeners.
     * @category Methods
     */
    dispose(): void;
    protected _getTargetDirection(out: _THREE.Vector3): _THREE.Vector3;
    protected _getCameraDirection(out: _THREE.Vector3): _THREE.Vector3;
    protected _findPointerById(pointerId: number): PointerInput | undefined;
    protected _findPointerByMouseButton(mouseButton: MOUSE_BUTTON): PointerInput | undefined;
    protected _disposePointer(pointer: PointerInput): void;
    protected _encloseToBoundary(position: _THREE.Vector3, offset: _THREE.Vector3, friction: number): _THREE.Vector3;
    protected _updateNearPlaneCorners(): void;
    protected _truckInternal: (deltaX: number, deltaY: number, dragToOffset: boolean, screenSpacePanning: boolean) => void;
    protected _rotateInternal: (deltaX: number, deltaY: number, state: ACTION) => void;
    protected _dollyInternal: (delta: number, x: number, y: number) => void;
    protected _zoomInternal: (delta: number, x: number, y: number) => void;
    protected _collisionTest(): number;
    /**
     * Get its client rect and package into given `DOMRect` .
     */
    protected _getClientRect(target: DOMRect): DOMRect | undefined;
    protected _createOnRestPromise(resolveImmediately: boolean): Promise<void>;
    protected _addAllEventListeners(_domElement: HTMLElement): void;
    protected _removeAllEventListeners(): void;
    /**
     * Approximate time in seconds to reach the target. A smaller value will reach the target faster.
     * Accepts a number (applied to every operation) or an object keyed by operation
     * (`rotateAzimuth`, `rotatePolar`, `truck`, `dolly`, `zoom`, `offset`); an object merges the
     * given keys. `rotate` is accepted as a write-only shorthand that sets both rotate axes, but
     * reads always expose `rotateAzimuth`/`rotatePolar` (never `rotate`).
     * @category Properties
     */
    get smoothTime(): SmoothTimes;
    set smoothTime(value: SmoothTimeOption);
    /**
     * The smoothTime used while the user is actively controlling the camera (overrides
     * `smoothTime` per operation). Accepts a number or an object keyed by operation.
     * @category Properties
     */
    get controlSmoothTime(): SmoothTimes;
    set controlSmoothTime(value: SmoothTimeOption);
    /**
     * backward compatible
     * @deprecated use controlSmoothTime instead
     * @category Properties
     */
    get draggingSmoothTime(): SmoothTimes;
    /**
     * backward compatible
     * @deprecated use controlSmoothTime instead
     * @category Properties
     */
    set draggingSmoothTime(value: SmoothTimeOption);
    /**
     * The smoothTime the target ease uses this frame. Extracted as a seam for subclasses that
     * move the target as PART OF another operation (e.g. MapControls' dolly-to-cursor) and so
     * need it to ease on that operation's clock rather than the truck's.
     */
    protected _getTargetSmoothTime(): number;
    protected _applySmoothTime(target: SmoothTimes, value: SmoothTimeOption): void;
    /**
     * backward compatible
     * @deprecated use smoothTime (in seconds) instead
     * @category Properties
     */
    get dampingFactor(): number;
    /**
     * backward compatible
     * @deprecated use smoothTime (in seconds) instead
     * @category Properties
     */
    set dampingFactor(_: number);
    /**
     * backward compatible
     * @deprecated use controlSmoothTime (in seconds) instead
     * @category Properties
     */
    get draggingDampingFactor(): number;
    /**
     * backward compatible
     * @deprecated use controlSmoothTime (in seconds) instead
     * @category Properties
     */
    set draggingDampingFactor(_: number);
    static createBoundingSphere(object3d: _THREE.Object3D, out?: _THREE.Sphere): _THREE.Sphere;
}

type NoTruckMouseAction = Exclude<MouseButtons['left'], typeof ACTION.TRUCK>;
interface MapMouseButtons extends MouseButtons {
    left: NoTruckMouseAction;
    middle: NoTruckMouseAction;
    right: NoTruckMouseAction;
    wheel: NoTruckMouseAction;
}
/**
 * Map-style controls: dolly/zoom-to-cursor anchors the world point under the cursor and
 * pans stay confined to a target plane. This assumes the camera stays ABOVE the plane, so
 * keep `maxPolarAngle` below 90° (e.g. 85°): at exactly 90° the forward axis is parallel to
 * the plane and dolly-to-cursor falls back to a plain dolly (the `f·n` guard prevents NaN).
 */
declare class MapControls extends CameraControls {
    /**
     * Grazing angle (radians) at which dolly-to-cursor (perspective) / zoom-to-cursor
     * (orthographic) hands off from EXACT anchoring to a sky-truck. Anchoring is exact
     * wherever the cursor ray meets the ground more steeply than this angle. Within a thin
     * band just above it — `[sin(0.5·angle), sin(angle)]` in the ray's grazing measure — the
     * anchor blends smoothly into a screen-pan along the cursor's ground bearing; above it
     * (the sky) it is a pure pan. Keep it small (a couple of degrees at the horizon):
     * widening it erodes the exact region below. The sky-pan SPEED is governed by
     * `truckSpeed` (it feels like a wheel-pan), not by this angle.
     */
    dollyToCursorHorizonAngle: number;
    mouseButtons: MapMouseButtons;
    protected _targetPlaneNormal: _THREE.Vector3;
    protected _targetPlaneConstant: number;
    protected _warnedTruck: boolean;
    /**
     * True while `_targetEnd` was last moved BY dolly/zoom-to-cursor rather than by a pan.
     * Gates `_getTargetSmoothTime` onto the dolly/zoom clock; see it for why.
     */
    protected _targetFollowsDolly: boolean;
    /** Working copy of `_targetPlaneNormal` for the current computation. */
    protected _normal: _THREE.Vector3;
    /** END-state camera position `C` (recomputed from `_sphericalEnd` + `_targetEnd`). */
    protected _endCamera: _THREE.Vector3;
    /** Camera forward basis `f = normalize( _targetEnd − C )`. */
    protected _forward: _THREE.Vector3;
    /** Camera right basis (column 0 of the camera world matrix). */
    protected _right: _THREE.Vector3;
    /** Camera up basis (column 1 of the camera world matrix). */
    protected _up: _THREE.Vector3;
    /** Cursor ray direction `u` in world space (perspective). */
    protected _cursorDir: _THREE.Vector3;
    /** Camera position after the dolly move `C' = C + m·u` (perspective). */
    protected _movedCamera: _THREE.Vector3;
    /** World-space origin of the cursor ray at mid-frustum (orthographic). */
    protected _rayOrigin: _THREE.Vector3;
    /** In-plane unit bearing of the cursor ray toward the ground (the sky-truck direction). */
    protected _bearing: _THREE.Vector3;
    /** Sky-truck target-shift vector (screen-pan along `_bearing`). */
    protected _truckShift: _THREE.Vector3;
    /** Exact-anchor target-shift vector (moves the target to pin the cursor point). */
    protected _anchorShift: _THREE.Vector3;
    /** Recomputed END-state target `T'`. */
    protected _newTarget: _THREE.Vector3;
    constructor(camera: _THREE.PerspectiveCamera | _THREE.OrthographicCamera, domElement?: HTMLElement);
    /**
     * Dolly/zoom-to-cursor moves the target as PART OF the dolly, so ease it on the dolly's
     * clock (the zoom's, for orthographic) instead of the truck's. `controlSmoothTime.truck = 0`
     * is a natural setting for map-style 1:1 drag panning; without this the target would snap
     * there while the radius kept easing, breaking the lockstep the exact anchoring depends on
     * and yanking the world out from under the cursor. Resolved the same way the radius/zoom
     * ease resolves its own smooth-time, so the two always match.
     *
     * Falls back to the base (truck) resolution for real pans, and — via
     * `_isUserControllingTruck`, which every programmatic move clears — whenever the target is
     * no longer under user control.
     */
    protected _getTargetSmoothTime(): number;
    protected _updateTargetPlaneNormal(): void;
    /**
     * Move the constraint plane to the given signed height along the current
     * up axis ( plane = { p : dot( p, up ) = height } ).
     */
    setTargetPlane(height: number): void;
    /**
     * The signed height of the target plane along the up axis.
     */
    getTargetPlane(): number;
}

export { EventDispatcher, MapControls, CameraControls as default };
export type { SmoothTimeOption, SmoothTimes };
