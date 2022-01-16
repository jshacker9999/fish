ROME = {};




ROME.Animal = function (geometry, parseMorphTargetsNames) {

    var result = ROME.AnimalAnimationData.init(geometry, parseMorphTargetsNames);

    var that = {};
    that.morph = 0.0;
    that.animalA = {
        frames: undefined,
        currentFrame: 0,
        lengthInFrames: 0,
        currentTime: 0,
        lengthInMS: 0,
        timeScale: 1.0,
        name: ""
    };
    that.animalB = {
        frames: undefined,
        currentFrame: 0,
        lengthInFrames: 0,
        currentTime: 0,
        lengthInMS: 0,
        timeScale: 1.0,
        name: ""
    };
    that.availableAnimals = result.availableAnimals;
    that.mesh = new THREE.Mesh(geometry, result.material);

    var isPlaying = false;
    var morphTargetOrder = that.mesh.morphTargetForcedOrder;
    var material = result.material;




    that.play = function (animalA, animalB, morph, startTimeAnimalA, startTimeAnimalB) {

        if (!isPlaying) {

            isPlaying = true;
            that.morph = 0;

            THREE.AnimationHandler.addToUpdate(that);

        }

        animalB = animalB !== undefined ? animalB : animalA;
        morph = morph !== undefined ? morph : 0;

        setAnimalData(animalA, that.animalA);
        setAnimalData(animalB, that.animalB);

        that.animalA.currentTime = startTimeAnimalA ? startTimeAnimalA : 0;
        that.animalB.currentTime = startTimeAnimalB ? startTimeAnimalB : 0;

        that.update(0);

    };




    that.update = function (deltaTimeMS) {

        if (that.mesh._modelViewMatrix) {

            var data, dataNames = ["animalA", "animalB"];
            var d, dl;
            var f, fl;
            var frame, nextFrame;
            var time, nextTime;
            var unloopedTime;
            var lengthInMS;
            var lenghtInFrames;
            var morphTarget;
            var scale;

            for (d = 0, dl = dataNames.length, morphTarget = 0; d < dl; d++) {

                data = that[dataNames[d]];

                unloopedTime = data.currentTime;
                data.currentTime = (data.currentTime + deltaTimeMS * data.timeScale) % data.lengthInMS;




                if (unloopedTime > data.currentTime) {

                    data.currentFrame = 0;

                }





                frame = 0;

                for (f = data.currentFrame, fl = data.lengthInFrames - 1; f < fl; f++) {

                    if (data.currentTime >= data.frames[f].time && data.currentTime < data.frames[f + 1].time) {

                        frame = f;
                        break;
                    }
                }

                data.currentFrame = frame;
                nextFrame = frame + 1 < fl ? frame + 1 : 0;


                morphTargetOrder[morphTarget++] = data.frames[frame].index;
                morphTargetOrder[morphTarget++] = data.frames[nextFrame].index;


                time = data.frames[frame].time;
                nextTime = data.frames[nextFrame].time > time ? data.frames[nextFrame].time : data.frames[nextFrame].time + data.lengthInMS;

                scale = (data.currentTime - time) / (nextTime - time);

                material.uniforms[dataNames[d] + "Interpolation"].value = scale;

            }

            material.uniforms.animalMorphValue.value = that.morph;

            if (material.attributes[that.animalA.name] !== undefined) {

                material.attributes.colorAnimalA.buffer = material.attributes[that.animalA.name].buffer;

            }

            if (material.attributes[that.animalB.name] !== undefined) {

                material.attributes.colorAnimalB.buffer = material.attributes[that.animalB.name].buffer;

            }

        }

    };




    that.setNewTargetAnimal = function (animal, startTimeAnimalB) {

        if (that.morph === 1) {



            for (var property in that.animalA) {

                that.animalA[property] = that.animalB[property];

            }




            that.animalB.currentTime = startTimeAnimalB ? startTimeAnimalB : 0;
            setAnimalData(animal, that.animalB);
            setFrame(that.animalB);
            that.morph = 0;

        } else {

            console.log("Error: Cannot change animal target if morph != 1. Skipping.");

        }

    };




    var setAnimalData = function (name, data) {

        if (ROME.AnimalAnimationData[name] !== undefined) {

            data.frames = ROME.AnimalAnimationData[name];
            data.lengthInFrames = data.frames.length;
            data.lengthInMS = data.frames[data.lengthInFrames - 1].time;
            data.name = name.toLowerCase();
            data.normalsOffset = Math.floor(data.frames.length * 0.5, 10);

        } else {

            console.log("Error: Couldn't find data for animal " + name);

        }

    };




    var setFrame = function (data) {

        var f, fl;
        var currentTime = data.currentTime;
        var frames = data.frames;

        for (f = 0, fl < frames.length; f < fl; f++) {

            if (currentTime >= frames[f].time) {

                data.currentFrame = f;
                return;

            }

        }

    };




    var setCurrentFrame = function (data) {

    };




    return that;

};





ROME.AnimalShader = {

    uniforms: function () {

        return THREE.UniformsUtils.merge([THREE.UniformsLib["common"],
            THREE.UniformsLib["lights"], {
                "animalAInterpolation": {
                    type: "f",
                    value: 0.0
                },
                "animalBInterpolation": {
                    type: "f",
                    value: 0.0
                },
                "animalMorphValue": {
                    type: "f",
                    value: 0.0
                },

                "lightScale": {
                    type: "f",
                    value: 1.0
                },
                "lightOffset": {
                    type: "v3",
                    value: new THREE.Vector3(0.0, 0.0, 0.0)
                }

            }
        ]);
    },

    attributes: function () {

        return {

            "colorAnimalA": {
                type: "c",
                boundTo: "faces",
                value: []
            },
            "colorAnimalB": {
                type: "c",
                boundTo: "faces",
                value: []
            }

        }

    },

    vertexShader: [

        "uniform 	float	animalAInterpolation;",
        "uniform 	float	animalBInterpolation;",
        "uniform 	float	animalMorphValue;",

        "attribute	vec3	colorAnimalA;",
        "attribute	vec3	colorAnimalB;",

        "varying vec3 vColor;",
        "varying vec3 vLightWeighting;",

        THREE.ShaderChunk["lights_pars_vertex"],

        "uniform float lightScale;",
        "uniform vec3 lightOffset;",

        "void main() {",

        "vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
        "vColor = mix( colorAnimalA, colorAnimalB, animalMorphValue );",

        "vec3 animalA = mix( morphTarget0, morphTarget1, animalAInterpolation );",
        "vec3 animalB = mix( morphTarget2, morphTarget3, animalBInterpolation );",
        "vec3 morphed = mix( animalA,      animalB,      animalMorphValue );",

        "vec3 transformedNormal = normalize( normalMatrix * normal );",






        "vLightWeighting = vec3( 0.2 );",



        "vec4 lDirection = viewMatrix * vec4( vec3( 0.0, 1.0, 1.0 ), 0.0 );",
        "float directionalLightWeighting = max( dot( transformedNormal, normalize( lDirection.xyz ) ), 0.0 );",
        "vLightWeighting += vec3( 1.0 ) * directionalLightWeighting;",






        "gl_Position = projectionMatrix * modelViewMatrix * vec4( morphed, 1.0 );",

        "}"

    ].join("\n"),

    fragmentShader: [

        "uniform vec3 diffuse;",
        "uniform float opacity;",

        THREE.ShaderChunk["fog_pars_fragment"],
        THREE.ShaderChunk["lights_pars_fragment"],

        "varying vec3 vLightWeighting;",
        "varying vec3 vColor;",

        "void main() {",



        "gl_FragColor = vec4( vLightWeighting, 1.0 );",





        "float depth = gl_FragCoord.z / gl_FragCoord.w;",
        "float near = 0.0;",
        "float far = 2400.0;",
        "float fog = 0.0 + smoothstep( near, far, depth );",

        "gl_FragColor = gl_FragColor * vec4( vColor, 1.0 );",
        "gl_FragColor = mix( gl_FragColor, vec4( vec3(0.25,0.54,0.57), gl_FragColor.w ), fog );",











        "}"

    ].join("\n")
}




ROME.AnimalAnimationData = {



    animalNames: ["fisha", "fishb", "fishc", "fishd"],

    colorVariations: {

        "fish": {
            hRange: 0.00,
            sRange: 0.00,
            vRange: 0.00,
            hOffset: 0.00,
            sOffset: 0.00,
            vOffset: 0.00
        }

    },

    animalVariationMap: {

        "fisha": "fish",
        "fishb": "fish",
        "fishc": "fish",
        "fishd": "fish",

    },



    init: function (geometry, parseMorphTargetNames) {

        if (!geometry.initialized) {

            geometry.initialized = true;

            var availableAnimals = [];
            var animal, animalName;
            var charCode, morphTargetName, morphTarget, morphTargets = geometry.morphTargets;
            var a, al, m, ml, currentTime;



            if (parseMorphTargetNames) {

                for (m = 0, ml = morphTargets.length; m < ml; m++) {



                    for (a = 0, al = this.animalNames.length; a < al; a++) {

                        animalName = this.animalNames[a];

                        if (morphTargets[m].name.indexOf(animalName) !== -1) {

                            break;

                        }

                    }




                    if (a === al) {

                        morphTargetName = morphTargets[m].name;

                        for (a = 0; a < morphTargetName.length; a++) {

                            charCode = morphTargetName.charCodeAt(a);

                            if (!((charCode >= 65 && charCode <= 90) ||
                                    (charCode >= 97 && charCode <= 122))) {

                                break;

                            }

                        }

                        this.animalNames.push(morphTargetName.slice(0, a));

                    }

                }

            }



            for (a = 0, al = this.animalNames.length; a < al; a++) {

                animalName = this.animalNames[a];
                animal = this[animalName];
                currentTime = 0;

                if (animal === undefined || animal.length === 0) {

                    animal = this[animalName] = [];

                    for (m = 0, ml = morphTargets.length; m < ml; m++) {

                        if (morphTargets[m].name.indexOf(animalName) !== -1) {

                            animal.push({
                                index: m,
                                time: currentTime
                            });
                            currentTime += parseInt(1000 / 24, 10);


                            if (availableAnimals.indexOf(animalName) === -1) {

                                availableAnimals.push(animalName);

                            }

                        }

                    }

                } else {

                    for (m = 0, ml = morphTargets.length; m < ml; m++) {

                        if (availableAnimals.indexOf(animalName) === -1 && morphTargets[m].name.indexOf(animalName) !== -1) {

                            availableAnimals.push(animalName);

                        }

                    }

                }

            }




            var material = new THREE.MeshShaderMaterial({

                uniforms: ROME.AnimalShader.uniforms(),
                attributes: ROME.AnimalShader.attributes(),
                vertexShader: ROME.AnimalShader.vertexShader,
                fragmentShader: ROME.AnimalShader.fragmentShader,

                lights: true,
                morphTargets: true,
                vertexColors: THREE.VertexColors

            });









            var c, cl, morphColor, morphColors = geometry.morphColors;
            var attributes = material.attributes;

            if (geometry.morphColors && geometry.morphColors.length) {

                for (c = 0, cl = morphColors.length; c < cl; c++) {

                    morphColor = morphColors[c];
                    morphTargetName = morphColor.name;

                    for (a = 0; a < morphTargetName.length; a++) {

                        charCode = morphTargetName.charCodeAt(a);

                        if (!((charCode >= 65 && charCode <= 90) ||
                                (charCode >= 97 && charCode <= 122))) {

                            break;

                        }

                    }

                    morphTargetName = morphTargetName.slice(0, a).toLowerCase();
                    attributes[morphTargetName] = {
                        type: "c",
                        boundTo: "faces",
                        value: morphColor.colors
                    };



                    var variations = this.colorVariations["zero"];

                    if (this.animalVariationMap[morphTargetName] !== undefined) {

                        variations = this.colorVariations[this.animalVariationMap[morphTargetName]];


                    }

                    if (variations.lScale) {

                        material.uniforms.lightScale.value = variations.lScale;

                    } else {

                        material.uniforms.lightScale.value = 0.5;

                    }

                    if (variations.lOffset) {

                        material.uniforms.lightOffset.value.set(variations.lOffset[0], variations.lOffset[1], variations.lOffset[2]);

                    } else {

                        material.uniforms.lightOffset.value.set(0.6, 0.6, 0.6);

                    }



                    randomizeColors(attributes[morphTargetName].value, variations);

                }

                attributes.colorAnimalA.value = morphColors[0].colors;
                attributes.colorAnimalB.value = morphColors[0].colors;




                for (a = 0, al = availableAnimals.length; a < al; a++) {

                    animalName = availableAnimals[a].toLowerCase();

                    for (c = 0, cl = morphColors.length; c < cl; c++) {

                        morphColor = morphColors[c].name.toLowerCase();

                        if (morphColor.indexOf(animalName) !== -1) {

                            break;

                        }

                    }



                    if (c === cl) {

                        console.error("Animal.constructor: Morph Color missing for animal " + animalName + ". Deploying backup plan.");

                        attributes[animalName] = {
                            type: "c",
                            boundTo: "faces",
                            value: []
                        };

                        for (c = 0, cl = geometry.faces.length; c < cl; c++) {

                            attributes[animalName].value.push(new THREE.Color(0xff0000));

                        }

                    }

                }

            } else {

                console.error("Animal.constructor: Morph Colors doesn't exist, deploying fallback!");

                for (c = 0, cl = geometry.faces.length; c < cl; c++) {

                    attributes.colorAnimalA.value.push(new THREE.Color(0xff00ff));

                }

                attributes.colorAnimalB.value = attributes.colorAnimalA.value;

                for (a = 0, al = availableAnimals; a < al; a++) {

                    attributes[availableAnimals[a]] = {
                        type: "c",
                        boundTo: "faces",
                        value: attributes.colorAnimalA.value
                    };

                }

            }







            geometry.availableAnimals = availableAnimals;
            geometry.customAttributes = material.attributes;

        } else {



            var material = new THREE.MeshShaderMaterial({

                uniforms: ROME.AnimalShader.uniforms(),
                attributes: {},
                vertexShader: ROME.AnimalShader.vertexShader,
                fragmentShader: ROME.AnimalShader.fragmentShader,

                fog: true,
                lights: true,
                morphTargets: true

            });




            for (var a in geometry.customAttributes) {

                var srcAttribute = geometry.customAttributes[a];

                if (a === "colorAnimalA" || a === "colorAnimalB") {

                    material.attributes[a] = {

                        type: "c",
                        size: 3,
                        boundTo: srcAttribute.boundTo,
                        value: srcAttribute.value,
                        array: undefined,
                        buffer: undefined,
                        needsUpdate: false,
                        __webglInitialized: true

                    };

                } else {

                    material.attributes[a] = srcAttribute;

                }

            }

        }

        return {

            availableAnimals: geometry.availableAnimals,
            material: material

        };

    }

};

function randomizeColors(colors, variations) {

    var i, il, c, hd, sd, vd;

    for (i = 0, il = colors.length; i < il; i++) {

        c = colors[i];

        hd = variations.hRange * Math.random() + variations.hOffset;
        sd = variations.sRange * Math.random() + variations.sOffset;
        vd = variations.vRange * Math.random() + variations.vOffset;

        THREE.ColorUtils.adjustHSV(c, hd, sd, vd);

    }

};