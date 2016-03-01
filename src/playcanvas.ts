declare module pc {
    export class Application {
        constructor(canvas: HTMLElement, options: any);
        start: () => void;
        setCanvasFillMode: (mode: any) => void;
        setCanvasResolution: (mode: any) => void;

        on: (event: string, any) => void;

        root: Entity;
        loader: pc.resources.ResourceLoader;
        assets: pc.asset.AssetRegistry;
        systems: ComponentSystemRegistry;
        scene: Scene;
        touch: pc.input.TouchDevice;
        keyboard: pc.Keyboard;
        mouse: pc.input.Mouse;
    }

    export class input {
        static EVENT_MOUSEDOWN: string;
    }

    export module input {
        export class Mouse {
            constructor(canvas: HTMLElement);
            on: (event: string, callback: (event) => void, context: any) => void;
        }
        export class TouchDevice {
            constructor(canvas: HTMLElement);
            on: (event: string, callback: (event) => void, context: any) => void;
        }
    }

    export class script {
        static create: (name: string, script: (app: Application) => any) => void;
    }

    export module resources {
        export class ResourceLoader {

        }
    }

    export module asset {
        export class Asset {
            resource: pc.resource;
        }
        export class AssetRegistry {
            find: (name: string) => pc.asset.Asset;
            loadFromUrl: (url: string, type: string) => any;
        }
    }

    export class CameraComponent {
        worldToScreen(worldCoord: Vec3, screenCoord?: Vec3): Vec3;
    }

    export class Entity {
        destroy(): void;

        addComponent: (type: string, options?: any) => pc.CameraComponent;
        removeComponent: (type: string) => void;
        addChild: (e: Entity) => void;
        getChildren(): Entity[];

        getEulerAngles: () => pc.Vec3;
        getLocalScale: () => pc.Vec3;
        getPosition: () => pc.Vec3;
        getLocalPosition: () => pc.Vec3;

        setLocalPosition: {
            (x: number, y: number, z: number): void;
            (position: pc.Vec3): void;
        }
        setPosition: {
            (x: number, y: number, z: number): void;
            (position: pc.Vec3): void;
        }
        setEulerAngles: {
            (x: number, y: number, z: number): void;
            (angles: pc.Vec3): void;
        }
        setLocalScale: {
            (x: number, y: number, z: number): void;
        }
        translate: {
            (x: number, y: number, z: number): void;
            (translation: pc.Vec3): void;
        }
        translateLocal: {
            (x: number, y: number, z: number): void;
            (translation: pc.Vec3): void;
        }
        rotate: {
            (x: number, y: number, z: number): void;
        }
        rotateLocal: {
            (x: number, y: number, z: number): void;
        }
        lookAt: {
            (target: pc.Vec3, up?: pc.Vec3): void;
            (tx: number, ty: number, tz: number, ux?: number, uy?: number, uz?: number): void;
        }

        getName: () => string;
        setName(name: string): void;

        addLabel: (label: string) => void;
        findByLabel: (label: string) => Entity[];

        name: string;
        label: string;
        displayOnly: boolean;
        enabled: boolean;

        model: ModelComponent;
        rigidbody: RigidBodyComponent;
        script: ScriptComponent;
    }

    export class Keyboard {
        constructor(canvas: HTMLElement);
        wasPressed: (key: number) => boolean;
        isPressed: (key: number) => boolean;
    }

    export class Scene {
        ambientLight: Color;
    }

    export class RigidBodyComponent {
        applyForce: (x: number, y: number, z: number) => void;
        applyTorque: (x: number, y: number, z: number) => void;
        syncEntityToBody: () => void;
        isActive: () => boolean;
        activate: () => void;
        setGravity: (x: number, y: number, z: number) => void;

        angularDamping: {};
        angularFactor: {};
        angularVelocity: {};
        enabled: {};
        friction: {};
        group: {};
        linearDamping: {};
        linearFactor: {};
        linearVelocity: {};
        _linearVelocity: {};
        mask: {};
        mass: {};
        restitution: {};
        type: {}
    }

    export class ModelComponent extends Model {
        material: PhongMaterial;
        enabled: boolean;
    }

    export class ScriptComponent {
        enabled: boolean;

        font_renderer: any;
    }

    export class ComponentSystemRegistry {
        rigidbody: RigidBodyComponent;
    }

    export class Vec3 {
        constructor(x: number, y: number, z: number);
        constructor();
        static ZERO: Vec3

        x: number;
        y: number;
        z: number;

        add: {
            (rhs: Vec3): Vec3;
        }
        add2: {
            (lhs: Vec3, rhs: Vec3): Vec3;
        }
        clone: () => Vec3;
        length: () => number;
        normalize: () => Vec3;
        scale: (x: number) => Vec3;
        sub: {
            (rhs: Vec3): Vec3;
        }
        data: Float32Array;
    }

    export class Vec2 {
        constructor(x: number, y: number, z: number);
        static ONE: Vec2;

        clone: () => Vec2;
        length: () => number;
        scale: (scale: number) => Vec2;
    }

    export class Color {
        constructor(r: number, g: number, b: number, a: number);
        constructor(r: number, g: number, b: number);

        r: number;
        g: number;
        b: number;
        a: number;
    }

    export class Texture extends resource { }

    export class Material { }

    export class Model extends resource { }


    export class PhongMaterial extends Material {
        diffuse: Color;
        diffuseMap: resource;
        diffuseMapTiling: Vec2;
        update: () => void;

    }


    export class resource { }

    export var FILLMODE_FILL_WINDOW: any;
    export var RESOLUTION_AUTO: any;

    export module math {
        export var random: (min: number, max: number) => number;
    }

    export class promise {
        static all: (promises: any[]) => promise;
        then: {
            (success: (value) => void): void;
            (success: (value) => void, failure: (value) => void): void;
        }
    }

    export var KEY_DOWN: number;
    export var KEY_LEFT: number;
    export var KEY_RIGHT: number;
    export var KEY_SPACE: number;
    export var KEY_UP: number;
}
