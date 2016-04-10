/// <reference path="gamescreen.ts"/>
/// <reference path="gamesession.ts"/>
/// <reference path="login.ts"/>
/// <reference path="../babylon.2.3.d.ts"/>

var title;
var g_engine : BABYLON.Engine;

class EngineFactory {
    static create() {
        // Create a PlayCanvas application
        var canvas = document.getElementById("application-canvas");

        var engine = new BABYLON.Engine(<HTMLCanvasElement> canvas, true);

        window.addEventListener("resize", () => engine.resize());

        return engine;
    }
}

class TitleScreen {
    cube: BABYLON.Mesh;

    initialize(engine: BABYLON.Engine) {
        // Now create a basic Babylon Scene object
        var scene = new BABYLON.Scene(engine);

        scene.clearColor = new BABYLON.Color3(0.3, 0.1, 0.05);

        // This creates and positions a free camera
        var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 0, -10), scene);

        // This targets the camera to scene origin
        camera.setTarget(BABYLON.Vector3.Zero());

        // This attaches the camera to the canvas
        camera.attachControl(engine.getRenderingCanvas(), false);

        // This creates a light, aiming 0,1,0 - to the sky.
        //var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

        var light0 = new BABYLON.PointLight("Omni0", new BABYLON.Vector3(0, -10, -10), scene);
        light0.diffuse = new BABYLON.Color3(1, 0, 0);
        //light0.specular = new BABYLON.Color3(1, 1, 1);
        light0.specular = BABYLON.Color3.Black();

        // Let's try our built-in 'sphere' shape. Params: name, subdivisions, size, scene
        var cube = BABYLON.Mesh.CreateIcoSphere("sphere1", {radius: 3, flat: true, subdivisions: 2}, scene);

        var framerateIndicator = $('#framerate-indicator')[0];

        engine.runRenderLoop(function () {
            scene.render();

            cube.rotation.y += 0.01;

            framerateIndicator.innerHTML = engine.getFps().toFixed();
        });
    }

    uninitialize() {
        g_engine.stopRenderLoop();
    }
}

function connectToRealm(url: string, token: string) {
    title.uninitialize();
    $('#login-overlay').remove();

    var session = new agdg.GameSession();

    var chat = new agdg.Chat(session);
    var world = new agdg.World(session, g_engine);

    var gs = new agdg.GameScreen(world);

    session.chat = chat;
    session.world = world;

    session.connect(url, token);
}

window.onload = () => {
    g_engine = EngineFactory.create();
    
    var login = new Login.LoginSession();

    title = new TitleScreen();
    title.initialize(g_engine);
};
