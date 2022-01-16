var container;
var stats;

var camera;
var scene;
var webglRenderer;

var directionalLight;

var windowHalfX = window.innerWidth >> 1;
var windowHalfY = window.innerHeight >> 1;

var render_gl = 1;
var has_gl = 0;

var r = 0;

var delta
var time;
var oldTime;

var numOfFish = 200;
var fishArray = [];

var waterMesh;
var ray1, ray2, ray3;

var particles;

init(), animate();



function init() {

    container = document.createElement('div');
    document.body.appendChild(container);

    var aspect = window.innerWidth / window.innerHeight;

    camera = new THREE.Camera(75, aspect, 1, 100000);
    camera.position.z = 780;
    camera.position.x = 0;
    camera.position.y = 0;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x418a93, 0.0008);



    var ambient = new THREE.AmbientLight(0x666666);
    scene.addLight(ambient);

    var directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.z = 2;
    directionalLight.position.y = 5;
    directionalLight.position.normalize();
    scene.addLight(directionalLight);



    var waterPlane = new THREE.Plane(100, 100, 1, 1);

    for (var i = 0; i < waterPlane.faceVertexUvs[0].length; i++) {
        var uvs = waterPlane.faceVertexUvs[0][i];

        for (var j = 0; j < uvs.length; j++) {
            uvs[j].u *= 30;
            uvs[j].v *= 30;
        }
    }

    waterMesh = new THREE.Mesh(waterPlane, getMaterial("images/water.jpg", 0.25));
    waterMesh.rotation.set(Math.PI / 2, 0, 0);
    waterMesh.scale.x = waterMesh.scale.y = waterMesh.scale.z = 100;
    waterMesh.position.y = 700;
    waterMesh.updateMatrix();
    scene.addObject(waterMesh);


    var loader = new THREE.JSONLoader();
    loader.load({
        model: "js/fish_a.js",
        callback: fishLoaded
    });
    loader.load({
        model: "js/fish_b.js",
        callback: fishLoaded
    });
    loader.load({
        model: "js/fish_c.js",
        callback: fishLoaded
    });
    loader.load({
        model: "js/fish_d.js",
        callback: fishLoaded
    });



    loader.load({
        model: "js/tile.js",
        callback: groundLoaded
    });


    loader.load({
        model: "js/vine1.js",
        callback: vineLoaded
    });
    loader.load({
        model: "js/vine2.js",
        callback: vineLoaded
    });
    loader.load({
        model: "js/vine3.js",
        callback: vineLoaded
    });
    loader.load({
        model: "js/vine6.js",
        callback: vineLoaded
    });


    var rayImage = THREE.ImageUtils.loadTexture("images/ray.png");

    ray1 = new THREE.Sprite({
        map: rayImage,
        useScreenCoordinates: false
    });
    ray1.position.set(300, 300, 200);
    ray1.scale.set(0.6, 5, 1);
    ray1.rotation = Math.PI + 0.5;
    ray1.opacity = 0.5;
    scene.addChild(ray1);

    ray2 = new THREE.Sprite({
        map: rayImage,
        useScreenCoordinates: false
    });
    ray2.position.set(-300, 300, 200);
    ray2.scale.set(0.6, 5, 1);
    ray2.rotation = Math.PI - 0.5;
    ray2.opacity = 0.5;
    scene.addChild(ray2);

    ray3 = new THREE.Sprite({
        map: rayImage,
        useScreenCoordinates: false
    });
    ray3.position.set(0, 200, 300);
    ray3.scale.set(0.8, 5, 1);
    ray3.rotation = Math.PI - 0.1;
    ray3.opacity = 0.8;
    scene.addChild(ray3);

    var geometry = new THREE.Geometry();

    for (i = 0; i < 5000; i++) {
        var vector = new THREE.Vector3(Math.random() * 3000 - 1500, Math.random() * 1000 - 500, Math.random() * 1400 - 700);
        geometry.vertices.push(new THREE.Vertex(vector));
    }

    var particleImage = THREE.ImageUtils.loadTexture("images/bob2.png");
    var particleMaterial = new THREE.ParticleBasicMaterial({
        size: 4,
        map: particleImage,
        color: 0x72ddcf,
        opacity: 0.75,
        transparent: false,
        depthTest: false,
        blending: THREE.AdditiveBlending
    });

    particles = new THREE.ParticleSystem(geometry, particleMaterial);

    scene.addObject(particles);

    try {
        webglRenderer = new THREE.WebGLRenderer({
            scene: scene,
            clearColor: 0x418a93,
            clearAlpha: 0.99
        });
        webglRenderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(webglRenderer.domElement);
        has_gl = 1;
        THREEx.WindowResize(webglRenderer, camera);
    } catch (e) {

        return;
    }

}

function getMaterial(_image, _opacity) {
    var textureMaterial = new THREE.MeshLambertMaterial({
        map: new THREE.Texture(null, THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping),
        opacity: _opacity
    });

    var img = new Image();
    textureMaterial.map.image = img;
    img.onload = function () {
        textureMaterial.map.image.loaded = 1;
        textureMaterial.map.needsUpdate = true;
    };

    img.src = _image;

    return textureMaterial;
}

function vineLoaded(geometry) {

    for (var i = 0; i < 20; ++i) {

        var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial());
        var scale = 1 + Math.random();
        mesh.scale.set(scale, scale, scale);
        mesh.rotation.set(0, Math.random() * Math.PI, 0);
        mesh.position.set(0, -500, 0);
        mesh.position.set((Math.random() * 6000) - 3000, -450, (Math.random() * 2500) - 2200);
        mesh.matrixAutoUpdate = false;
        mesh.updateMatrix();
        scene.addChild(mesh);
    }
}

function groundLoaded(geometry) {

    var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial());
    var scale = 0.18;
    mesh.scale.set(scale * 1.3, scale, scale);
    mesh.rotation.set(-Math.PI / 2, 0, Math.PI);
    mesh.position.set(0, -500, -600);
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    scene.addChild(mesh);

}

function fishLoaded(geometry) {

    var quarter = Math.round(numOfFish / 4);

    for (var i = 0; i < quarter; ++i) {

        var animal = ROME.Animal(geometry, false);
        var mesh = animal.mesh;
        var scale = 1 + (Math.random() * 2.2);

        mesh.scale.set(scale, scale, scale);
        mesh.position.set((Math.random() * 4000) - 2000, (Math.random() * 800) - 400, (Math.random() * 1800) - 900);

        scene.addChild(mesh);

        animal.play(animal.availableAnimals[0], animal.availableAnimals[0], 0, Math.random(), Math.random());

        var obj = {
            mesh: mesh,
            scale: scale,
            lookVector: new THREE.Vector3(),
            seed: i + Math.random()
        };

        fishArray.push(obj);

    }

}

function run(delta) {
    for (var i = 0; i < fishArray.length; ++i) {
        fishArray[i].seed += 0.02;

        var mesh = fishArray[i].mesh;
        var scale = fishArray[i].scale;
        var lookVector = fishArray[i].lookVector;
        var seed = fishArray[i].seed;

        var newz = mesh.position.z + scale * (delta / 4);
        var newx = mesh.position.x + Math.sin(seed) * (delta / 4);
        var newy = mesh.position.y + Math.cos(seed) * (delta / 6);

        if (newy < -500) {
            newy = -500;
        }

        lookVector.set(newx, newy, newz);

        mesh.lookAt(lookVector);

        mesh.position.z = newz;
        mesh.position.x = newx;
        mesh.position.y = newy;


        if (mesh.position.z > 800) {
            mesh.position.z = -1800;
        }

    }
}

function animate() {
    requestAnimationFrame(animate);
    loop();
}

function loop() {

    time = new Date().getTime();
    delta = time - oldTime;
    oldTime = time;

    if (isNaN(delta) || delta > 1000 || delta == 0) {
        delta = 1000 / 60;
    }

    r += delta / 1500;

    run(delta);

    camera.position.x = 300 * Math.cos(r);
    camera.position.y = 150 * Math.sin(r);

    waterMesh.position.x = 20 * Math.sin(r * 2);
    waterMesh.position.z = 20 * Math.cos(r * 2);

    ray1.position.x = 300 + Math.sin(r) * 10;
    ray2.position.x = -300 + Math.sin(r) * 10;
    ray3.position.x = 0 + Math.sin(r) * 10;

    particles.position.x = -50 * Math.cos(r * 2);
    particles.position.y = -30 * Math.sin(r * 2);

    THREE.AnimationHandler.update(delta);

    if (render_gl && has_gl) webglRenderer.render(scene, camera);

}