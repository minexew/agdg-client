/// <reference path="gamescreen.ts"/>
/// <reference path="gamesession.ts"/>
/// <reference path="login.ts"/>
/// <reference path="../playcanvas.ts"/>

class Engine {
    start() {
        // Create a PlayCanvas application
        var canvas = document.getElementById("application-canvas");

        var app = new pc.Application(canvas, {
            keyboard: new pc.Keyboard(canvas)
        });
        app.start();

        // Fill the available space at full resolution
        app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
        app.setCanvasResolution(pc.RESOLUTION_AUTO);

        this.loadFontRenderer(app);

        return app;
    }

    loadFontRenderer(app: pc.Application) {
        var entity = new pc.Entity();
        entity.addComponent('script', {
            name: 'font_renderer', url: 'assets/font_renderer.js', attributes: {
                'text': 'Hello World',
                'maxTextLength': 256,
                'fontAtlas': 'assets/font/lato_0.png',
                'fontJson': 'assters/font/lato.json',
                'x': 0,
                'y': 100,
                'depth': 0,
            }
        });
        app.root.addChild(entity);
    }
}

class TitleScreen {
    cube: pc.Entity;
    camera: pc.Entity;
    light: pc.Entity;

    initialize(app) {
        var self = this;

        // Create box entity
        this.cube = new pc.Entity();
        this.cube.addComponent("model", {
            type: "box"
        });

        // Create camera entity
        this.camera = new pc.Entity();
        this.camera.addComponent("camera", {
            clearColor: new pc.Color(0.1, 0.1, 0.1)
        });

        // Create directional light entity
        this.light = new pc.Entity();
        this.light.addComponent("light");

        // Add to hierarchy
        app.root.addChild(this.cube);
        app.root.addChild(this.camera);
        app.root.addChild(this.light);

        // Set up initial positions and orientations
        this.camera.setPosition(0, 0, 3);
        this.light.setEulerAngles(45, 0, 0);

        // Register an update event
        app.on("update", function (deltaTime) {
            self.cube.rotate(10 * deltaTime, 20 * deltaTime, 30 * deltaTime);
        });
    }

    uninitialize() {
        this.cube.destroy();
        this.camera.destroy();
        this.light.destroy();
    }
}

var title;
var app;

function connectToRealm(url: string, token: string) {
    title.uninitialize();
    $('#login-overlay').remove();

    var session = new agdg.GameSession();

    var chat = new agdg.Chat(session);
    var world = new agdg.World(app, app.root, session);

    var gs = new agdg.GameScreen(app, world);

    session.chat = chat;
    session.world = world;

    session.connect(url, token);
}

window.onload = () => {
    var engine = new Engine();
    app = engine.start();
    
    var login = new Login.LoginSession();

    title = new TitleScreen();
    title.initialize(app);
};
