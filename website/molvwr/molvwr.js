﻿var Molvwr;
(function (Molvwr) {
    var BabylonContext = (function () {
        function BabylonContext(canvas) {
            var _this = this;
            this.canvas = canvas;
            this.engine = new BABYLON.Engine(canvas, true);
            this.atomsMaterials = {};
            this.engine.runRenderLoop(function () {
                if (_this.scene)
                    _this.scene.render();
            });
        }
        BabylonContext.prototype.dispose = function () {
            this.engine.dispose();
        };
        BabylonContext.prototype.getMaterial = function (atomsymbol) {
            var existing = this.atomsMaterials[atomsymbol];
            if (existing)
                return existing;
            var atomKind = Molvwr.Elements.elementsBySymbol[atomsymbol];
            if (atomKind) {
                var atomMat = new BABYLON.StandardMaterial('materialFor' + atomsymbol, this.scene);
                atomMat.diffuseColor = new BABYLON.Color3(atomKind.color[0], atomKind.color[1], atomKind.color[2]);
                atomMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                atomMat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
                atomMat.bumpTexture = new BABYLON.Texture('bump.png', this.scene);
                atomMat.bumpTexture.uScale = 6;
                atomMat.bumpTexture.vScale = 6;
                atomMat.bumpTexture.wrapU = BABYLON.Texture.MIRROR_ADDRESSMODE;
                atomMat.bumpTexture.wrapV = BABYLON.Texture.MIRROR_ADDRESSMODE;
                this.atomsMaterials[atomsymbol] = atomMat;
                return atomMat;
            }
        };
        BabylonContext.prototype.createScene = function () {
            if (this.scene)
                this.scene.dispose();
            console.log("create babylon scene");
            var scene = new BABYLON.Scene(this.engine);
            this.scene = scene;
            scene.clearColor = new BABYLON.Color3(100, 100, 100);
            scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
            scene.fogColor = new BABYLON.Color3(0.9, 0.9, 0.85);
            scene.fogDensity = 0.01;
            var camera = new BABYLON.ArcRotateCamera('Camera', 1, .8, 28, new BABYLON.Vector3(0, 0, 0), scene);
            camera.wheelPrecision = 10;
            camera.setTarget(BABYLON.Vector3.Zero());
            camera.attachControl(this.canvas, true);
            this.camera = camera;
            var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(40, 40, 40), scene);
            light.intensity = 0.6;
            //this.useAmbientOcclusion();
            //this.useHDR();
        };
        BabylonContext.prototype.useAmbientOcclusion = function () {
            var ssao = new BABYLON.SSAORenderingPipeline('ssaopipeline', this.scene, 0.75);
            this.scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("ssaopipeline", this.camera);
            //this.scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline("ssaopipeline", this.camera);
        };
        BabylonContext.prototype.useHDR = function () {
            var hdr = new BABYLON.HDRRenderingPipeline("hdr", this.scene, 1.0, null, [this.camera]);
            // About gaussian blur : http://homepages.inf.ed.ac.uk/rbf/HIPR2/gsmooth.htm
            hdr.brightThreshold = 1.2; // Minimum luminance needed to compute HDR
            hdr.gaussCoeff = 0.3; // Gaussian coefficient = gaussCoeff * theEffectOutput;
            hdr.gaussMean = 1; // The Gaussian blur mean
            hdr.gaussStandDev = 0.8; // Standard Deviation of the gaussian blur.
            hdr.exposure = 1; // Controls the overall intensity of the pipeline
            hdr.minimumLuminance = 0.5; // Minimum luminance that the post-process can output. Luminance is >= 0
            hdr.maximumLuminance = 1e10; //Maximum luminance that the post-process can output. Must be suprerior to minimumLuminance 
            hdr.luminanceDecreaseRate = 0.5; // Decrease rate: white to dark
            hdr.luminanceIncreaserate = 0.5; // Increase rate: dark to white
            this.scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("hdr", [this.camera]);
            //this.scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline("hdr", [this.camera]);
        };
        BabylonContext.prototype.testScene = function () {
            // Our built-in 'sphere' shape. Params: name, subdivs, size, scene
            var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, this.scene);
            // Move the sphere upward 1/2 its height
            sphere.position.y = 1;
            // Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
            var ground = BABYLON.Mesh.CreateGround("ground1", 6, 6, 2, this.scene);
        };
        return BabylonContext;
    })();
    Molvwr.BabylonContext = BabylonContext;
})(Molvwr || (Molvwr = {}));

var Molvwr;
(function (Molvwr) {
    var Config;
    (function (Config) {
        function defaultConfig() {
            return {
                renderers: ['Sphere'],
                atomScaleFactor: 3,
                sphereSegments: 16
            };
        }
        Config.defaultConfig = defaultConfig;
        function sphere() {
            return {
                renderers: ['Sphere'],
                atomScaleFactor: 3,
                sphereSegments: 16
            };
        }
        Config.sphere = sphere;
        function sphereAndLineBonds() {
            return {
                renderers: ['BondsLines', 'Sphere'],
                atomScaleFactor: 1,
                sphereSegments: 16
            };
        }
        Config.sphereAndLineBonds = sphereAndLineBonds;
    })(Config = Molvwr.Config || (Molvwr.Config = {}));
})(Molvwr || (Molvwr = {}));

var Molvwr;
(function (Molvwr) {
    var Viewer = (function () {
        function Viewer(element, config) {
            if (!element)
                throw new Error("you must provide an element to host the viewer");
            this.config = config || Molvwr.Config.defaultConfig();
            this.element = element;
            this.canvas = document.createElement("CANVAS");
            this.element.appendChild(this.canvas);
            this.context = new Molvwr.BabylonContext(this.canvas);
        }
        Viewer.prototype._loadContentFromString = function (content, contentFormat) {
            var _this = this;
            var parser = Molvwr.Parser[contentFormat];
            if (parser) {
                var molecule = parser.parse(content);
                if (molecule) {
                    this._postProcessMolecule(molecule);
                    this.molecule = molecule;
                    if (this.config.renderers) {
                        this.config.renderers.forEach(function (rendererName) {
                            var rendererClass = Molvwr.Renderer[rendererName];
                            if (rendererClass) {
                                var renderer = new rendererClass(_this, _this.context, _this.config);
                                renderer.render(molecule);
                            }
                            else {
                                console.warn("no renderer for " + rendererName);
                            }
                        });
                    }
                }
                else {
                    console.warn("no molecule from parser " + contentFormat);
                }
            }
            else {
                console.warn("no parser for " + contentFormat);
            }
        };
        Viewer.prototype.createContext = function () {
            if (this.context)
                this.context.dispose();
            this.context = new Molvwr.BabylonContext(this.canvas);
            this.context.createScene();
        };
        Viewer.prototype.loadContentFromString = function (content, contentFormat) {
            this.createContext();
            this._loadContentFromString(content, contentFormat);
        };
        Viewer.prototype.loadContentFromUrl = function (url, contentFormat) {
            var _this = this;
            this.createContext();
            try {
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4) {
                        if (xhr.status == 200) {
                            _this._loadContentFromString(xhr.responseText, contentFormat);
                        }
                        else {
                            console.warn("cannot get content from " + url + " " + xhr.status + " " + xhr.statusText);
                        }
                    }
                };
                xhr.open("GET", url, true);
                xhr.send(null);
            }
            catch (e) {
                console.error(e);
            }
        };
        Viewer.prototype._postProcessMolecule = function (molecule) {
            //this._center(molecule);
            this._calculateAtomsBonds(molecule);
        };
        Viewer.prototype._calculateAtomsBonds = function (molecule) {
            console.time("check bounds");
            var bonds = [];
            var nbatoms = molecule.atoms.length;
            molecule.atoms.forEach(function (atom, index) {
                for (var i = index + 1; i < nbatoms; i++) {
                    var siblingAtom = molecule.atoms[i];
                    var l = new BABYLON.Vector3(atom.x, atom.y, atom.z);
                    var m = new BABYLON.Vector3(siblingAtom.x, siblingAtom.y, siblingAtom.z);
                    var d = BABYLON.Vector3.Distance(l, m);
                    if (d < 1.1 * (atom.kind.radius + siblingAtom.kind.radius)) {
                        bonds.push({
                            d: d,
                            atomA: atom,
                            atomB: siblingAtom,
                            cutoff: d / (atom.kind.radius + siblingAtom.kind.radius)
                        });
                    }
                }
            });
            molecule.bonds = bonds;
            console.timeEnd("check bounds");
            console.log("found " + bonds.length + " bonds");
        };
        Viewer.prototype._getCentroid = function (s) {
            var xsum = 0;
            var ysum = 0;
            var zsum = 0;
            for (var i = 0; i < s.atoms.length; i++) {
                xsum += s.atoms[i].x;
                ysum += s.atoms[i].y;
                zsum += s.atoms[i].z;
            }
            return {
                x: xsum / s.atoms.length,
                y: ysum / s.atoms.length,
                z: zsum / s.atoms.length
            };
        };
        Viewer.prototype._center = function (molecule) {
            var shift = this._getCentroid(molecule);
            molecule.atoms.forEach(function (atom) {
                atom.x -= shift.x;
                atom.y -= shift.y;
                atom.z -= shift.z;
            });
        };
        return Viewer;
    })();
    Molvwr.Viewer = Viewer;
})(Molvwr || (Molvwr = {}));

var Molvwr;
(function (Molvwr) {
    var Elements;
    (function (Elements) {
        Elements.elements = [
            { 'symbol': 'Xx', 'name': 'unknown', 'mass': 1.00000000, 'radius': 1.0000, 'color': [1.000, 0.078, 0.576], 'number': 0 },
            { 'symbol': 'H', 'name': 'hydrogen', 'mass': 1.00794000, 'radius': 0.3100, 'color': [1.000, 1.000, 1.000], 'number': 1 },
            { 'symbol': 'He', 'name': 'helium', 'mass': 4.00260200, 'radius': 0.2800, 'color': [0.851, 1.000, 1.000], 'number': 2 },
            { 'symbol': 'Li', 'name': 'lithium', 'mass': 6.94100000, 'radius': 1.2800, 'color': [0.800, 0.502, 1.000], 'number': 3 },
            { 'symbol': 'Be', 'name': 'beryllium', 'mass': 9.01218200, 'radius': 0.9600, 'color': [0.761, 1.000, 0.000], 'number': 4 },
            { 'symbol': 'B', 'name': 'boron', 'mass': 10.81100000, 'radius': 0.8400, 'color': [1.000, 0.710, 0.710], 'number': 5 },
            { 'symbol': 'C', 'name': 'carbon', 'mass': 12.01070000, 'radius': 0.7300, 'color': [0.565, 0.565, 0.565], 'number': 6 },
            { 'symbol': 'N', 'name': 'nitrogen', 'mass': 14.00670000, 'radius': 0.7100, 'color': [0.188, 0.314, 0.973], 'number': 7 },
            { 'symbol': 'O', 'name': 'oxygen', 'mass': 15.99940000, 'radius': 0.6600, 'color': [1.000, 0.051, 0.051], 'number': 8 },
            { 'symbol': 'F', 'name': 'fluorine', 'mass': 18.99840320, 'radius': 0.5700, 'color': [0.565, 0.878, 0.314], 'number': 9 },
            { 'symbol': 'Ne', 'name': 'neon', 'mass': 20.17970000, 'radius': 0.5800, 'color': [0.702, 0.890, 0.961], 'number': 10 },
            { 'symbol': 'Na', 'name': 'sodium', 'mass': 22.98976928, 'radius': 1.6600, 'color': [0.671, 0.361, 0.949], 'number': 11 },
            { 'symbol': 'Mg', 'name': 'magnesium', 'mass': 24.30500000, 'radius': 1.4100, 'color': [0.541, 1.000, 0.000], 'number': 12 },
            { 'symbol': 'Al', 'name': 'aluminum', 'mass': 26.98153860, 'radius': 1.2100, 'color': [0.749, 0.651, 0.651], 'number': 13 },
            { 'symbol': 'Si', 'name': 'silicon', 'mass': 28.08550000, 'radius': 1.1100, 'color': [0.941, 0.784, 0.627], 'number': 14 },
            { 'symbol': 'P', 'name': 'phosphorus', 'mass': 30.97376200, 'radius': 1.0700, 'color': [1.000, 0.502, 0.000], 'number': 15 },
            { 'symbol': 'S', 'name': 'sulfur', 'mass': 32.06500000, 'radius': 1.0500, 'color': [1.000, 1.000, 0.188], 'number': 16 },
            { 'symbol': 'Cl', 'name': 'chlorine', 'mass': 35.45300000, 'radius': 1.0200, 'color': [0.122, 0.941, 0.122], 'number': 17 },
            { 'symbol': 'Ar', 'name': 'argon', 'mass': 39.94800000, 'radius': 1.0600, 'color': [0.502, 0.820, 0.890], 'number': 18 },
            { 'symbol': 'K', 'name': 'potassium', 'mass': 39.09830000, 'radius': 2.0300, 'color': [0.561, 0.251, 0.831], 'number': 19 },
            { 'symbol': 'Ca', 'name': 'calcium', 'mass': 40.07800000, 'radius': 1.7600, 'color': [0.239, 1.000, 0.000], 'number': 20 },
            { 'symbol': 'Sc', 'name': 'scandium', 'mass': 44.95591200, 'radius': 1.7000, 'color': [0.902, 0.902, 0.902], 'number': 21 },
            { 'symbol': 'Ti', 'name': 'titanium', 'mass': 47.86700000, 'radius': 1.6000, 'color': [0.749, 0.761, 0.780], 'number': 22 },
            { 'symbol': 'V', 'name': 'vanadium', 'mass': 50.94150000, 'radius': 1.5300, 'color': [0.651, 0.651, 0.671], 'number': 23 },
            { 'symbol': 'Cr', 'name': 'chromium', 'mass': 51.99610000, 'radius': 1.3900, 'color': [0.541, 0.600, 0.780], 'number': 24 },
            { 'symbol': 'Mn', 'name': 'manganese', 'mass': 54.93804500, 'radius': 1.3900, 'color': [0.611, 0.478, 0.780], 'number': 25 },
            { 'symbol': 'Fe', 'name': 'iron', 'mass': 55.84500000, 'radius': 1.3200, 'color': [0.878, 0.400, 0.200], 'number': 26 },
            { 'symbol': 'Co', 'name': 'cobalt', 'mass': 58.69340000, 'radius': 1.2600, 'color': [0.941, 0.565, 0.627], 'number': 27 },
            { 'symbol': 'Ni', 'name': 'nickel', 'mass': 58.93319500, 'radius': 1.2400, 'color': [0.314, 0.816, 0.314], 'number': 28 },
            { 'symbol': 'Cu', 'name': 'copper', 'mass': 63.54600000, 'radius': 1.3200, 'color': [0.784, 0.502, 0.200], 'number': 29 },
            { 'symbol': 'Zn', 'name': 'zinc', 'mass': 65.38000000, 'radius': 1.2200, 'color': [0.490, 0.502, 0.690], 'number': 30 },
            { 'symbol': 'Ga', 'name': 'gallium', 'mass': 69.72300000, 'radius': 1.2200, 'color': [0.761, 0.561, 0.561], 'number': 31 },
            { 'symbol': 'Ge', 'name': 'germanium', 'mass': 72.64000000, 'radius': 1.2000, 'color': [0.400, 0.561, 0.561], 'number': 32 },
            { 'symbol': 'As', 'name': 'arsenic', 'mass': 74.92160000, 'radius': 1.1900, 'color': [0.741, 0.502, 0.890], 'number': 33 },
            { 'symbol': 'Se', 'name': 'selenium', 'mass': 78.96000000, 'radius': 1.2000, 'color': [1.000, 0.631, 0.000], 'number': 34 },
            { 'symbol': 'Br', 'name': 'bromine', 'mass': 79.90400000, 'radius': 1.2000, 'color': [0.651, 0.161, 0.161], 'number': 35 },
            { 'symbol': 'Kr', 'name': 'krypton', 'mass': 83.79800000, 'radius': 1.1600, 'color': [0.361, 0.722, 0.820], 'number': 36 },
            { 'symbol': 'Rb', 'name': 'rubidium', 'mass': 85.46780000, 'radius': 2.2000, 'color': [0.439, 0.180, 0.690], 'number': 37 },
            { 'symbol': 'Sr', 'name': 'strontium', 'mass': 87.62000000, 'radius': 1.9500, 'color': [0.000, 1.000, 0.000], 'number': 38 },
            { 'symbol': 'Y', 'name': 'yttrium', 'mass': 88.90585000, 'radius': 1.9000, 'color': [0.580, 1.000, 1.000], 'number': 39 },
            { 'symbol': 'Zr', 'name': 'zirconium', 'mass': 91.22400000, 'radius': 1.7500, 'color': [0.580, 0.878, 0.878], 'number': 40 },
            { 'symbol': 'Nb', 'name': 'niobium', 'mass': 92.90638000, 'radius': 1.6400, 'color': [0.451, 0.761, 0.788], 'number': 41 },
            { 'symbol': 'Mo', 'name': 'molybdenum', 'mass': 95.96000000, 'radius': 1.5400, 'color': [0.329, 0.710, 0.710], 'number': 42 },
            { 'symbol': 'Tc', 'name': 'technetium', 'mass': 98.00000000, 'radius': 1.4700, 'color': [0.231, 0.620, 0.620], 'number': 43 },
            { 'symbol': 'Ru', 'name': 'ruthenium', 'mass': 101.07000000, 'radius': 1.4600, 'color': [0.141, 0.561, 0.561], 'number': 44 },
            { 'symbol': 'Rh', 'name': 'rhodium', 'mass': 102.90550000, 'radius': 1.4200, 'color': [0.039, 0.490, 0.549], 'number': 45 },
            { 'symbol': 'Pd', 'name': 'palladium', 'mass': 106.42000000, 'radius': 1.3900, 'color': [0.000, 0.412, 0.522], 'number': 46 },
            { 'symbol': 'Ag', 'name': 'silver', 'mass': 107.86820000, 'radius': 1.4500, 'color': [0.753, 0.753, 0.753], 'number': 47 },
            { 'symbol': 'Cd', 'name': 'cadmium', 'mass': 112.41100000, 'radius': 1.4400, 'color': [1.000, 0.851, 0.561], 'number': 48 },
            { 'symbol': 'In', 'name': 'indium', 'mass': 114.81800000, 'radius': 1.4200, 'color': [0.651, 0.459, 0.451], 'number': 49 },
            { 'symbol': 'Sn', 'name': 'tin', 'mass': 118.71000000, 'radius': 1.3900, 'color': [0.400, 0.502, 0.502], 'number': 50 },
            { 'symbol': 'Sb', 'name': 'antimony', 'mass': 121.76000000, 'radius': 1.3900, 'color': [0.620, 0.388, 0.710], 'number': 51 },
            { 'symbol': 'Te', 'name': 'tellurium', 'mass': 127.60000000, 'radius': 1.3800, 'color': [0.831, 0.478, 0.000], 'number': 52 },
            { 'symbol': 'I', 'name': 'iodine', 'mass': 126.90470000, 'radius': 1.3900, 'color': [0.580, 0.000, 0.580], 'number': 53 },
            { 'symbol': 'Xe', 'name': 'xenon', 'mass': 131.29300000, 'radius': 1.4000, 'color': [0.259, 0.620, 0.690], 'number': 54 },
            { 'symbol': 'Cs', 'name': 'cesium', 'mass': 132.90545190, 'radius': 2.4400, 'color': [0.341, 0.090, 0.561], 'number': 55 },
            { 'symbol': 'Ba', 'name': 'barium', 'mass': 137.32700000, 'radius': 2.1500, 'color': [0.000, 0.788, 0.000], 'number': 56 },
            { 'symbol': 'La', 'name': 'lanthanum', 'mass': 138.90547000, 'radius': 2.0700, 'color': [0.439, 0.831, 1.000], 'number': 57 },
            { 'symbol': 'Ce', 'name': 'cerium', 'mass': 140.11600000, 'radius': 2.0400, 'color': [1.000, 1.000, 0.780], 'number': 58 },
            { 'symbol': 'Pr', 'name': 'praseodymium', 'mass': 140.90765000, 'radius': 2.0300, 'color': [0.851, 1.000, 0.780], 'number': 59 },
            { 'symbol': 'Nd', 'name': 'neodymium', 'mass': 144.24200000, 'radius': 2.0100, 'color': [0.780, 1.000, 0.780], 'number': 60 },
            { 'symbol': 'Pm', 'name': 'promethium', 'mass': 145.00000000, 'radius': 1.9900, 'color': [0.639, 1.000, 0.780], 'number': 61 },
            { 'symbol': 'Sm', 'name': 'samarium', 'mass': 150.36000000, 'radius': 1.9800, 'color': [0.561, 1.000, 0.780], 'number': 62 },
            { 'symbol': 'Eu', 'name': 'europium', 'mass': 151.96400000, 'radius': 1.9800, 'color': [0.380, 1.000, 0.780], 'number': 63 },
            { 'symbol': 'Gd', 'name': 'gadolinium', 'mass': 157.25000000, 'radius': 1.9600, 'color': [0.271, 1.000, 0.780], 'number': 64 },
            { 'symbol': 'Tb', 'name': 'terbium', 'mass': 158.92535000, 'radius': 1.9400, 'color': [0.189, 1.000, 0.780], 'number': 65 },
            { 'symbol': 'Dy', 'name': 'dysprosium', 'mass': 162.50000000, 'radius': 1.9200, 'color': [0.122, 1.000, 0.780], 'number': 66 },
            { 'symbol': 'Ho', 'name': 'holmium', 'mass': 164.93032000, 'radius': 1.9200, 'color': [0.000, 1.000, 0.612], 'number': 67 },
            { 'symbol': 'Er', 'name': 'erbium', 'mass': 167.25900000, 'radius': 1.8900, 'color': [0.000, 0.902, 0.459], 'number': 68 },
            { 'symbol': 'Tm', 'name': 'thulium', 'mass': 168.93421000, 'radius': 1.9000, 'color': [0.000, 0.831, 0.322], 'number': 69 },
            { 'symbol': 'Yb', 'name': 'ytterbium', 'mass': 173.05400000, 'radius': 1.8700, 'color': [0.000, 0.749, 0.220], 'number': 70 },
            { 'symbol': 'Lu', 'name': 'lutetium', 'mass': 174.96680000, 'radius': 1.8700, 'color': [0.000, 0.671, 0.141], 'number': 71 },
            { 'symbol': 'Hf', 'name': 'hafnium', 'mass': 178.49000000, 'radius': 1.7500, 'color': [0.302, 0.761, 1.000], 'number': 72 },
            { 'symbol': 'Ta', 'name': 'tantalum', 'mass': 180.94788000, 'radius': 1.7000, 'color': [0.302, 0.651, 1.000], 'number': 73 },
            { 'symbol': 'W', 'name': 'tungsten', 'mass': 183.84000000, 'radius': 1.6200, 'color': [0.129, 0.580, 0.839], 'number': 74 },
            { 'symbol': 'Re', 'name': 'rhenium', 'mass': 186.20700000, 'radius': 1.5100, 'color': [0.149, 0.490, 0.671], 'number': 75 },
            { 'symbol': 'Os', 'name': 'osmium', 'mass': 190.23000000, 'radius': 1.4400, 'color': [0.149, 0.400, 0.588], 'number': 76 },
            { 'symbol': 'Ir', 'name': 'iridium', 'mass': 192.21700000, 'radius': 1.4100, 'color': [0.090, 0.329, 0.529], 'number': 77 },
            { 'symbol': 'Pt', 'name': 'platinum', 'mass': 195.08400000, 'radius': 1.3600, 'color': [0.816, 0.816, 0.878], 'number': 78 },
            { 'symbol': 'Au', 'name': 'gold', 'mass': 196.96656900, 'radius': 1.3600, 'color': [1.000, 0.820, 0.137], 'number': 79 },
            { 'symbol': 'Hg', 'name': 'mercury', 'mass': 200.59000000, 'radius': 1.3200, 'color': [0.722, 0.722, 0.816], 'number': 80 },
            { 'symbol': 'Tl', 'name': 'thallium', 'mass': 204.38330000, 'radius': 1.4500, 'color': [0.651, 0.329, 0.302], 'number': 81 },
            { 'symbol': 'Pb', 'name': 'lead', 'mass': 207.20000000, 'radius': 1.4600, 'color': [0.341, 0.349, 0.380], 'number': 82 },
            { 'symbol': 'Bi', 'name': 'bismuth', 'mass': 208.98040000, 'radius': 1.4800, 'color': [0.620, 0.310, 0.710], 'number': 83 },
            { 'symbol': 'Po', 'name': 'polonium', 'mass': 210.00000000, 'radius': 1.4000, 'color': [0.671, 0.361, 0.000], 'number': 84 },
            { 'symbol': 'At', 'name': 'astatine', 'mass': 210.00000000, 'radius': 1.5000, 'color': [0.459, 0.310, 0.271], 'number': 85 },
            { 'symbol': 'Rn', 'name': 'radon', 'mass': 220.00000000, 'radius': 1.5000, 'color': [0.259, 0.510, 0.588], 'number': 86 },
            { 'symbol': 'Fr', 'name': 'francium', 'mass': 223.00000000, 'radius': 2.6000, 'color': [0.259, 0.000, 0.400], 'number': 87 },
            { 'symbol': 'Ra', 'name': 'radium', 'mass': 226.00000000, 'radius': 2.2100, 'color': [0.000, 0.490, 0.000], 'number': 88 },
            { 'symbol': 'Ac', 'name': 'actinium', 'mass': 227.00000000, 'radius': 2.1500, 'color': [0.439, 0.671, 0.980], 'number': 89 },
            { 'symbol': 'Th', 'name': 'thorium', 'mass': 231.03588000, 'radius': 2.0600, 'color': [0.000, 0.729, 1.000], 'number': 90 },
            { 'symbol': 'Pa', 'name': 'protactinium', 'mass': 232.03806000, 'radius': 2.0000, 'color': [0.000, 0.631, 1.000], 'number': 91 },
            { 'symbol': 'U', 'name': 'uranium', 'mass': 237.00000000, 'radius': 1.9600, 'color': [0.000, 0.561, 1.000], 'number': 92 },
            { 'symbol': 'Np', 'name': 'neptunium', 'mass': 238.02891000, 'radius': 1.9000, 'color': [0.000, 0.502, 1.000], 'number': 93 },
            { 'symbol': 'Pu', 'name': 'plutonium', 'mass': 243.00000000, 'radius': 1.8700, 'color': [0.000, 0.420, 1.000], 'number': 94 },
            { 'symbol': 'Am', 'name': 'americium', 'mass': 244.00000000, 'radius': 1.8000, 'color': [0.329, 0.361, 0.949], 'number': 95 },
            { 'symbol': 'Cm', 'name': 'curium', 'mass': 247.00000000, 'radius': 1.6900, 'color': [0.471, 0.361, 0.890], 'number': 96 },
            { 'symbol': 'Bk', 'name': 'berkelium', 'mass': 247.00000000, 'radius': 1.6600, 'color': [0.541, 0.310, 0.890], 'number': 97 },
            { 'symbol': 'Cf', 'name': 'californium', 'mass': 251.00000000, 'radius': 1.6800, 'color': [0.631, 0.212, 0.831], 'number': 98 },
            { 'symbol': 'Es', 'name': 'einsteinium', 'mass': 252.00000000, 'radius': 1.6500, 'color': [0.702, 0.122, 0.831], 'number': 99 },
            { 'symbol': 'Fm', 'name': 'fermium', 'mass': 257.00000000, 'radius': 1.6700, 'color': [0.702, 0.122, 0.729], 'number': 100 },
            { 'symbol': 'Md', 'name': 'mendelevium', 'mass': 258.00000000, 'radius': 1.7300, 'color': [0.702, 0.051, 0.651], 'number': 101 },
            { 'symbol': 'No', 'name': 'nobelium', 'mass': 259.00000000, 'radius': 1.7600, 'color': [0.741, 0.051, 0.529], 'number': 102 },
            { 'symbol': 'Lr', 'name': 'lawrencium', 'mass': 262.00000000, 'radius': 1.6100, 'color': [0.780, 0.000, 0.400], 'number': 103 },
            { 'symbol': 'Rf', 'name': 'rutherfordium', 'mass': 261.00000000, 'radius': 1.5700, 'color': [0.800, 0.000, 0.349], 'number': 104 },
            { 'symbol': 'Db', 'name': 'dubnium', 'mass': 262.00000000, 'radius': 1.4900, 'color': [0.820, 0.000, 0.310], 'number': 105 },
            { 'symbol': 'Sg', 'name': 'seaborgium', 'mass': 266.00000000, 'radius': 1.4300, 'color': [0.851, 0.000, 0.271], 'number': 106 },
            { 'symbol': 'Bh', 'name': 'bohrium', 'mass': 264.00000000, 'radius': 1.4100, 'color': [0.878, 0.000, 0.220], 'number': 107 },
            { 'symbol': 'Hs', 'name': 'hassium', 'mass': 277.00000000, 'radius': 1.3400, 'color': [0.902, 0.000, 0.180], 'number': 108 },
            { 'symbol': 'Mt', 'name': 'meitnerium', 'mass': 268.00000000, 'radius': 1.2900, 'color': [0.922, 0.000, 0.149], 'number': 10, },
            { 'symbol': 'Ds', 'name': 'Ds', 'mass': 271.00000000, 'radius': 1.2800, 'color': [0.922, 0.000, 0.149], 'number': 110 },
            { 'symbol': 'Uuu', 'name': 'Uuu', 'mass': 272.00000000, 'radius': 1.2100, 'color': [0.922, 0.000, 0.149], 'number': 11, },
            { 'symbol': 'Uub', 'name': 'Uub', 'mass': 285.00000000, 'radius': 1.2200, 'color': [0.922, 0.000, 0.149], 'number': 112 },
            { 'symbol': 'Uut', 'name': 'Uut', 'mass': 284.00000000, 'radius': 1.3600, 'color': [0.922, 0.000, 0.149], 'number': 113 },
            { 'symbol': 'Uuq', 'name': 'Uuq', 'mass': 289.00000000, 'radius': 1.4300, 'color': [0.922, 0.000, 0.149], 'number': 114 },
            { 'symbol': 'Uup', 'name': 'Uup', 'mass': 288.00000000, 'radius': 1.6200, 'color': [0.922, 0.000, 0.149], 'number': 115 },
            { 'symbol': 'Uuh', 'name': 'Uuh', 'mass': 292.00000000, 'radius': 1.7500, 'color': [0.922, 0.000, 0.149], 'number': 116 },
            { 'symbol': 'Uus', 'name': 'Uus', 'mass': 294.00000000, 'radius': 1.6500, 'color': [0.922, 0.000, 0.149], 'number': 117 },
            { 'symbol': 'Uuo', 'name': 'Uuo', 'mass': 296.00000000, 'radius': 1.5700, 'color': [0.922, 0.000, 0.149], 'number': 118 }
        ];
        Elements.elementsBySymbol = {};
        Elements.elements.forEach(function (e) {
            Elements.elementsBySymbol[e.symbol] = e;
        });
        Elements.elementsByNumber = {};
        Elements.elements.forEach(function (e) {
            Elements.elementsByNumber[e.number] = e;
        });
        Elements.MIN_ATOM_RADIUS = Infinity;
        Elements.MAX_ATOM_RADIUS = -Infinity;
        Elements.elements.forEach(function (e) {
            Elements.MIN_ATOM_RADIUS = Math.min(Elements.MIN_ATOM_RADIUS, e.radius);
            Elements.MAX_ATOM_RADIUS = Math.max(Elements.MAX_ATOM_RADIUS, e.radius);
        });
    })(Elements = Molvwr.Elements || (Molvwr.Elements = {}));
})(Molvwr || (Molvwr = {}));

var Molvwr;
(function (Molvwr) {
    var Parser;
    (function (Parser) {
        function getFloat(s) {
            if (!s)
                return 0;
            return parseFloat(s.trim());
        }
        Parser.mol = {
            parse: function (content) {
                console.log("parsing mol content");
                //console.log(content);
                var molecule = {
                    atoms: [],
                    title: null
                };
                var lines = content.split('\n');
                molecule.title = lines[1];
                for (var i = 4, l = lines.length; i < l; i++) {
                    var lineElements = lines[i].split(" ").filter(function (s) {
                        var tmp = s.trim();
                        if (tmp && tmp.length)
                            return true;
                        else
                            return false;
                    });
                    if (lineElements.length && lineElements.length >= 4) {
                        var symbol = lineElements[3].trim();
                        var x = getFloat(lineElements[0]);
                        var y = getFloat(lineElements[1]);
                        var z = getFloat(lineElements[2]);
                        var atomKind = Molvwr.Elements.elementsBySymbol[symbol];
                        if (atomKind) {
                            console.log("found atom " + atomKind.name + " " + x + "," + y + "," + z);
                            molecule.atoms.push({
                                kind: atomKind,
                                x: x,
                                y: y,
                                z: z,
                                bonds: []
                            });
                        }
                    }
                }
                console.log("found " + molecule.title + " " + molecule.atoms.length);
                return molecule;
            }
        };
    })(Parser = Molvwr.Parser || (Molvwr.Parser = {}));
})(Molvwr || (Molvwr = {}));

var Molvwr;
(function (Molvwr) {
    var Parser;
    (function (Parser) {
        function getFloat(s) {
            if (!s)
                return 0;
            return parseFloat(s.trim());
        }
        Parser.xyz = {
            parse: function (content) {
                console.log("parsing xyz content");
                //console.log(content);
                var molecule = {
                    atoms: [],
                    title: null
                };
                var lines = content.split('\n');
                molecule.title = lines[1];
                for (var i = 2, l = lines.length; i < l; i++) {
                    var lineElements = lines[i].split(" ").filter(function (s) {
                        var tmp = s.trim();
                        if (tmp && tmp.length)
                            return true;
                        else
                            return false;
                    });
                    if (lineElements.length && lineElements.length >= 4) {
                        var symbol = lineElements[0].trim();
                        var x = getFloat(lineElements[1]);
                        var y = getFloat(lineElements[2]);
                        var z = getFloat(lineElements[3]);
                        var atomKind = Molvwr.Elements.elementsBySymbol[symbol];
                        if (atomKind) {
                            console.log("found atom " + atomKind.name + " " + x + "," + y + "," + z);
                            molecule.atoms.push({
                                kind: atomKind,
                                x: x,
                                y: y,
                                z: z,
                                bonds: []
                            });
                        }
                    }
                }
                console.log("found " + molecule.title + " " + molecule.atoms.length);
                return molecule;
            }
        };
    })(Parser = Molvwr.Parser || (Molvwr.Parser = {}));
})(Molvwr || (Molvwr = {}));

var Molvwr;
(function (Molvwr) {
    var Renderer;
    (function (Renderer) {
        var BondsLines = (function () {
            function BondsLines(viewer, ctx, config) {
                this.meshes = {};
                this.ctx = ctx;
                this.config = config;
                this.viewer = viewer;
            }
            BondsLines.prototype.render = function (molecule) {
                var _this = this;
                var cfg = this.config;
                var meshes = [];
                console.log("rendering bonds as lines");
                molecule.bonds.forEach(function (b, index) {
                    var line = BABYLON.Mesh.CreateLines("bond-" + index, [
                        new BABYLON.Vector3(b.atomA.x, b.atomA.y, b.atomA.z),
                        new BABYLON.Vector3(b.atomB.x, b.atomB.y, b.atomB.z),
                    ], _this.ctx.scene, false);
                    line.color = new BABYLON.Color3(0.5, 0.5, 0.5);
                    meshes.push(line);
                });
            };
            return BondsLines;
        })();
        Renderer.BondsLines = BondsLines;
    })(Renderer = Molvwr.Renderer || (Molvwr.Renderer = {}));
})(Molvwr || (Molvwr = {}));

var Molvwr;
(function (Molvwr) {
    var Renderer;
    (function (Renderer) {
        var Sphere = (function () {
            function Sphere(viewer, ctx, config) {
                this.meshes = {};
                this.ctx = ctx;
                this.config = config;
                this.viewer = viewer;
            }
            Sphere.prototype.render = function (molecule) {
                var _this = this;
                console.log("sphere rendering");
                if (molecule && molecule.atoms) {
                    var meshes = [];
                    molecule.atoms.forEach(function (atom, index) {
                        meshes.push(_this.renderAtom(atom, index));
                    });
                }
            };
            Sphere.prototype.renderAtom = function (atom, index) {
                var cfg = this.config;
                var mesh = this.meshes[atom.symbol];
                var sphere = null;
                if (mesh) {
                    sphere = mesh.createInstance("sphere" + index);
                }
                else {
                    sphere = BABYLON.Mesh.CreateSphere("sphere" + index, cfg.sphereSegments, atom.kind.radius * cfg.atomScaleFactor, this.ctx.scene);
                    sphere.material = this.ctx.getMaterial(atom.kind.symbol);
                    this.meshes[atom.kind.symbol] = sphere;
                }
                // sphere = BABYLON.Mesh.CreateSphere("sphere" + index, cfg.sphereSegments, atomKind.radius * cfg.scale * cfg.atomScaleFactor, this.ctx.scene);
                // sphere.material = this.ctx.getMaterial(atom.symbol);
                sphere.pickable = false;
                sphere.position.x = atom.x;
                sphere.position.y = atom.y;
                sphere.position.z = atom.z;
                return sphere;
            };
            return Sphere;
        })();
        Renderer.Sphere = Sphere;
    })(Renderer = Molvwr.Renderer || (Molvwr.Renderer = {}));
})(Molvwr || (Molvwr = {}));
