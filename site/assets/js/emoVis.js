var viz, renderer, scene, camera, controls, pointLight, modifier, minAngle, gui, shader, uniforms, materials, parametricCube, theta, texture;


$(document).ready( function() {

    /* intialize the noise generator */
    noise.seed(0.5);

    modifier = new THREE.SubdivisionModifier(1);
    minAngle = .1;//IN RADIANS

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, $(window).innerWidth() / $(window).innerHeight(), 0.1, 1000);
    //controls = new THREE.OrbitControls( camera );
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha:true });
    renderer.setSize($(window).innerWidth() - 10, $(window).innerHeight() - 10);
    renderer.setClearColor(0x000000, 0);

    renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = true;

    shader = THREE.ShaderLib["normalmap"];
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);


    porosityTextures = [];

    /* this loop loads the textures used by the porosity-parameter */
    for (var i = 0; i < 10; i++) {
        porosityTextures.push(THREE.ImageUtils.loadTexture('../assets/images/porosity-texture_' + i + '.png'));
        porosityTextures[i].ansitropy = renderer.getMaxAnisotropy();
    }

    /* Material & Shader */
    materials = {
        normalMap: new THREE.MeshNormalMaterial({ shading: THREE.FlatShading }),
        //redPlastic : new THREE.MeshPhongMaterial( { color: 0x000000, specular: 0xffffff, emissive: 0xff0000, ambient: 0x000000, shininess: 100, shading: THREE.SmoothShading, vertexColors: THREE.VertexColors } ),
        redClay: new THREE.MeshLambertMaterial({ color: 0x666666, shadow: 0x666666, emissive: 0xa00000, ambient: 0x000000, shading: THREE.FlatShading, vertexColors: THREE.VertexColors }),
        wireFrame: new THREE.MeshBasicMaterial({
            color: 0x000000,
            shading: THREE.FlatShading,
            wireframe: true,
            transparent: true,
            vertexColors: THREE.VertexColors
        }),
        porosity: new THREE.MeshLambertMaterial({
            side: THREE.DoubleSide,
            depthWrite: true,
            depthTest: true,
            map: texture,
            shading: THREE.FlatShading,
            transparent: true
        })
    };

    topPointLight = new THREE.PointLight(0xffffff);
    bottomPointLight = new THREE.PointLight(0xffffff);

    scene.add(topPointLight);
    scene.add(bottomPointLight);

    camera.position.set(0, 0, 20);
    document.body.appendChild(renderer.domElement);

    parametricCube = new ParametricCube();

    var geometry = new THREE.PlaneGeometry( 20, 20 );
    parametricCube.plane = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial({ transparent: true, side: THREE.DoubleSide, map: new THREE.ImageUtils.loadTexture('../assets/images/plane-texture.png'), shading: THREE.FlatShading}));
    console.log(parametricCube.plane);
    parametricCube.plane.rotation.x = -80*Math.PI / 180;
    scene.add(parametricCube.plane);

    parametricCube.initializeParameters();
    parametricCube.generateMesh();
    parametricCube.castShadow = true;
    parametricCube.receiveShadow = true;



    parametricCube.plane.translateZ(-4);

    topPointLight.position.set(0, parametricCube.parameters.scale.value*10, parametricCube.parameters.scale.value*5);
    bottomPointLight.position.set(0, parametricCube.parameters.scale.value*-10, parametricCube.parameters.scale.value*5);

    theta = 0.0;

    /* the rendering loop */
    function render() {
        requestAnimationFrame(render);
        theta += 0.005;
        parametricCube.generateMesh();
        parametricCube.mesh.rotation.y = Math.sin(theta*0.5)*Math.PI*2;
        parametricCube.mesh.rotation.x = Math.cos(theta*0.5)*Math.PI*2;
        renderer.render(scene, camera);
    }

    /* start loop after everything is loaded */
    $(window).load(function () {
        console.timeEnd("load");
        render();
    });

    /* bind the switching to buttons */
    $('#emotion-select-bar a').click(function () {
        $('#emotion-select-bar a')
            .removeClass('active');
        $(this)
            .addClass('active');
        parametricCube.switchEmotion($(this).attr('href'));
    });

    $('.screenshot').click(function() {
        $.post( "../add-entry.php", { emotions: parametricCube.emotions, images: renderer.domElement.toDataURL("image/png")})
            .done(function( data ) {
                console.log(data);
        });
    });

});

//PARAMETRIC CUBES
function ParametricCube () {


    self = this;
    this.center = new THREE.Vector3(0.0, 0.0, 0.0);

    this.parameters = {
        smoothness:             { value: 1, min:0, max:1 },
        ratio:                  { value: .5, min:0, max:1 },
        scale:                  { value: .5, min:0, max:2 },
        complexity:             { value: 0, min:0, max:1 },
        //surface:                { value: .5, min:0, max:1 },
        //symmetrie:              { value: 0, min:0, max:1 },
        roughness:              { value: 0.0, min:0, max:1 },
        extrusion:              { value: 0.0, min:0, max:1 },
        //vertexShadowMultiplier: { value: 1.6, min:0, max:1 },
        porosity:               { value: 0.0, min:0, max:1 },
        sharpness:              { value: 0.5, min:0, max:1 }
    };



    this.initializeParameters = function() {


        this.emotions = {

            'anger': this.extractParameterValues(),
            'disgust':this.extractParameterValues(),
            'anger':this.extractParameterValues(),
            'joy':this.extractParameterValues(),
            'suprise':this.extractParameterValues(),
            'despise':this.extractParameterValues(),
            'sadness':this.extractParameterValues(),
            'fear':this.extractParameterValues()
        };

        /* this object keeps all parameters, which are used to generate the current shape */
        /* iterate over all parameters and generate their dom-element-sliders */
        for (parameter in this.parameters) {
            parameter.value = parameter.inital;
            var slider =
                '<img src="../assets/images/parameter-icons/'+parameter+'-01.svg"/>' +
                '<input min="'+this.parameters[parameter].min*100+'" max="'+this.parameters[parameter].max*100+'" value="'+this.parameters[parameter].value*100+'" id="'+parameter+'" type="range"/>' +
                '<img src="../assets/images/parameter-icons/'+parameter+'-02.svg"/>';
            $("#parameter-sliders").append('<div></div>').append(slider);
            element = $("#"+parameter);
            element.on("input change", function() {
                parametricCube.parameters[$(this).attr("id")].value = $(this).val() * 0.01;
                parametricCube.emotions[parametricCube.currentEmotion] = parametricCube.extractParameterValues(); // copy the current values to the saved emotions
                parametricCube.modifyComplexity();
                parametricCube.generateMesh($(this).attr("id"));
                topPointLight.position.set(0, parametricCube.parameters.scale.value*10, Math.sin(theta)*parametricCube.parameters.scale.value*-5);
                bottomPointLight.position.set(0, parametricCube.parameters.scale.value*-10, Math.sin(theta)*parametricCube.parameters.scale.value*-5);
            });
        }
    };

    /* the currently selected emotion */
    this.currentEmotion = "anger";

    this.emotions = {};

    /* this tupid functions returns all the values of the current parameters as object because javscript automatically would reference them */
    this.extractParameterValues = function () {
        return {
            'smoothness' : this.parameters.smoothness.value,
            'porosity' : this.parameters.porosity.value,
            'ratio' : this.parameters.ratio.value,
            'scale' : this.parameters.scale.value,
            'roughness' : this.parameters.roughness.value,
            'extrusion' : this.parameters.extrusion.value,
            'sharpness' : this.parameters.sharpness.value
        };
    }

    // this object hols the event bindings for every parameter

    this.switchEmotion = function (hashtag) {

        // save the values

        console.log(this.extractParameterValues());

        // update current emotion
        this.currentEmotion = hashtag.replace("#edit-", "");


        // copy the existing values to the variables
        this.parameters.porosity.value = this.emotions[this.currentEmotion].porosity;
        this.parameters.ratio.value = this.emotions[this.currentEmotion].ratio;
        this.parameters.scale.value = this.emotions[this.currentEmotion].scale;
        this.parameters.roughness.value = this.emotions[this.currentEmotion].roughness;
        this.parameters.extrusion.value = this.emotions[this.currentEmotion].extrusion;
        this.parameters.smoothness.value = this.emotions[this.currentEmotion].smoothness;
        this.parameters.sharpness.value = this.emotions[this.currentEmotion].sharpness;

        // update the sliders
        for (parameter in this.parameters) {
            $("#"+parameter).val(this.parameters[parameter].value*100);
        }

        // regenerate the mesh with the updated values
        this.generateMesh();
    };

    this.subdivideRigid = function(geometry, value){
        for (var i=0; i<value;i++)
            geometry=this._subdivideRigid(geometry);
        return geometry;
    };

    this._subdivideRigid = function(geometry){

        //GET NEIGHBOURS
        this.smoothGeometry = geometry;
        this.smoothGeometry.computeFaceNormals();

        //INIT NEW GEOMETRY - SUCH THAT VERTICES ARE NOT MIXED UP
        var tmp = new THREE.Geometry();
        //LINK OLD VERTICES
        tmp.vertices = geometry.vertices;

        //FOR ALL old VERTICES
        var len = geometry.faces.length;
        for (var i=0;i<len;i++){
            var face = geometry.faces[i];

            //CURRENT FACE a, b, c
            var a = face.a;
            var b = face.b;
            var c = face.c;
            var vA = geometry.vertices[a];
            var vB = geometry.vertices[b];
            var vC = geometry.vertices[c];

            //GET CENTERS
            var ab = tmp.vertices.length;
            var vAB = tmp.vertices.push(vA.clone().lerp(vB, 0.5));

            var ac = tmp.vertices.length;
            var vAC = tmp.vertices.push(vA.clone().lerp(vC, 0.5));

            var bc = tmp.vertices.length;
            var vBC = tmp.vertices.push(vB.clone().lerp(vC, 0.5));

            //BUILT NEW FACES
            /*
             a 		new faces:
             /\			a, ab, ac
             /  \		ab, b, bc
             ab /____\ ac 	ab, bc, ac
             /\    /\		ac, bc, c
             /  \  /  \
             b /____\/____\ c
             bc
             */

            tmp.faces.push(new THREE.Face3(a, ab, ac));
            tmp.faces.push(new THREE.Face3(ab, b, bc));
            tmp.faces.push(new THREE.Face3(ab, bc, ac));
            tmp.faces.push(new THREE.Face3(ac, bc, c));
        };

        //tmp.mergeVertices();
        return tmp;
    };

    this.computeNeighbours = function(geometry){
        //var geometry = this.geometry;
        geometry.mergeVertices();

        // GET NEIGHBOURS
        geometry.faces.forEach(function(face,i){
            face.neighbours = {};
            geometry.faces.forEach(function(_face,j){
                if (i==j){
                    ;
                } else if (	(face.a == _face.a || face.a == _face.b || face.a == _face.c) &&
                    (face.b == _face.a || face.b == _face.b || face.b == _face.c) )
                {
                    face.neighbours["ab"] = _face;
                } else if (	(face.c == _face.a || face.c == _face.b || face.c == _face.c) &&
                    (face.a == _face.a || face.a == _face.b || face.a == _face.c) )
                {
                    face.neighbours["ac"] = _face;
                } else if (	(face.c == _face.a || face.c == _face.b || face.c == _face.c) &&
                    (face.b == _face.a || face.b == _face.b || face.b == _face.c) )
                {
                    face.neighbours["bc"] = _face;
                }
            });
        });
    };

    /* This function acts as a the pipeline that generates the mesh */
    this.generateMesh = function () {
        console.log("generate mesh");

        // if there is no geometry, add it!
        if (this.smoothGeometry == undefined){
            this.smoothGeometry = this.geometry.clone();
        }

        this.mesh = new THREE.Mesh(this.geometry, this.material);

        //this.smoothGeometry.computeFaceNormals();

        this.modifyScaleRatio();


        //this.modifyComplexity();
        this.modifySmoothness();




        this.modifyRoughness();
        this.modifyPorosity();




        //UV shiat
        this.smoothGeometry.mergeVertices();
        this.smoothGeometry.computeFaceNormals();

        this.mesh = new THREE.Mesh(this.smoothGeometry, this.material);
        this.mesh.name="ParametricCube";

        // remove the old object from the renderer and add the new mesh
        this.resetObject();

        var all = this.mesh.geometry.vertices.map(function(d){return d.y}).sort();
        var _minY = Math.min.apply(Math, all);
        //var minY = _minY*this.parameters.scale.value*10*(.5+(1-this.parameters.ratio.value)*.6+.2);
        //console.log(minY);


        var sizex = Math.min(this.parameters.ratio.value*this.parameters.scale.value*3, (1-this.parameters.ratio.value)*this.parameters.scale.value*3);
        var sizey = Math.max(this.parameters.ratio.value*this.parameters.scale.value*3, (1-this.parameters.ratio.value)*this.parameters.scale.value*3);

        parametricCube.plane.scale.x = sizex;
        parametricCube.plane.scale.y = sizex;

        //this.mesh.translateY(-4-minY/2);

        //console.log("faces: "+this.smoothGeometry.faces.length);
        //console.log("vertices: "+this.smoothGeometry.vertices.length);

    };

    /* updates the smoothness/edginess of our shape */
    this.modifySmoothness = function() {

        //map parameter smoothness to 0-3
        mappedSmoothness = parseInt(this.parameters.smoothness.value*3.5);

        //smoothen
        modifier = new THREE.SubdivisionModifier( mappedSmoothness );
        this.smoothGeometry = this.geometry.clone();
        this.smooth();

        //adjust subdivision inverse to smoothing
        this.smoothGeometry = this.subdivideRigid(this.smoothGeometry, 3-mappedSmoothness);

        if (mappedSmoothness > 0 && this.parameters.roughness.value < 0.5){
            this.smoothGeometry.computeFaceNormals();
            this.smoothGeometry.computeVertexNormals();
        }
    };

    this.smooth = function () {
        // BUILT NEW OBJECT
        if (this.smoothGeometry == undefined)
            this.smoothGeometry = this.geometry.clone();

        var tmp = new THREE.Geometry();
        tmp.vertices = this.smoothGeometry.vertices;
        tmp.faces = this.smoothGeometry.faces;
        tmp.inner = this.smoothGeometry.inner;

        // MAKE IT SMOOTH
        modifier.modify(tmp);
        this.smoothGeometry = tmp;
    };

    this.modifyScaleRatio = function () {
        var scaleValue = this.parameters.scale.value*20;
        //var ratioValue = this.parameters.ratio.value*.6+.2;
        // this.mesh.scale.set(scaleValue*ratioValue, scaleValue*(1-ratioValue), scaleValue*ratioValue);
        for (var i=0; i<this.smoothGeometry.vertices.length; i++) {
            this.smoothGeometry.vertices[i].multiply(new THREE.Vector3(scaleValue*this.parameters.ratio.value, scaleValue*(1-this.parameters.ratio.value), scaleValue*this.parameters.ratio.value));
        }
    };

    /*this.modifyRatio = function () {
        var scaleValue = this.parameters.scale.value*20;
        var ratioValue = 1;//this.parameters.ratio.value*.8;
        this.mesh.scale.set(scaleValue*ratioValue, scaleValue*(1-ratioValue), scaleValue*ratioValue);
    };*/

    this.modifyComplexity = function () {
        console.log("modify complexity");

        this.geometry = new THREE.TetrahedronGeometry(1,parseInt(this.parameters.complexity.value*2.5));

        /*  //RANDOM POLYGON
            var polyGeometry = new THREE.Geometry();
            for (var i=1; i<this.parameters.complexity.value*20*10; i++){
                var v = new THREE.Vector3(	1*(Math.random()-.5),
                        1*(Math.random()-.5),
                        1*(Math.random()-.5));
                v.id = i;
                polyGeometry.vertices.push(v);
            }
            this.geometry = QuickHull(polyGeometry);
        */
        this.modifyExtrude(this.geometry);

        if (viz != undefined) this.resetObject();
    };
    this.modifyRoughness = function () {

        // compute the roughness and add it to the vertices
        for (var i=0; i<this.smoothGeometry.vertices.length; i++) {
            var direction = this.smoothGeometry.vertices[i].clone().normalize();
            this.smoothGeometry.vertices[i].add(
                direction.multiplyScalar(
                    noise.simplex3(
                        this.smoothGeometry.vertices[i].x * (1-this.parameters.roughness.value) + theta,
                        this.smoothGeometry.vertices[i].y * (1-this.parameters.roughness.value) + theta,
                        this.smoothGeometry.vertices[i].z * (1-this.parameters.roughness.value) + theta) * (1-this.parameters.roughness.value)*this.parameters.scale.value));
        }

        /*for (var i=0; i<this.smoothGeometry.faces.length; i++) {

         var da = this.smoothGeometry.vertices[this.smoothGeometry.faces[i].a].distanceTo(this.center)*this.parameters.vertexShadowMultiplier;
         var db = this.smoothGeometry.vertices[this.smoothGeometry.faces[i].b].distanceTo(this.center)*this.parameters.vertexShadowMultiplier;
         var dc = this.smoothGeometry.vertices[this.smoothGeometry.faces[i].c].distanceTo(this.center)*this.parameters.vertexShadowMultiplier;

         this.smoothGeometry.faces[i].vertexColors.push(new THREE.Color(da, da, da));
         this.smoothGeometry.faces[i].vertexColors.push(new THREE.Color(db, db, db));
         this.smoothGeometry.faces[i].vertexColors.push(new THREE.Color(dc, dc, dc));
         }*/

    };
    this.modifyPorosity = function (value) {
        this.smoothGeometry.faceVertexUvs = [[[]]];
        for (var i=0; i<this.smoothGeometry.faces.length; i++) {

            // this noise based random number defines which part of the texture is mapped… that helps to make it look more natural

            var indexScrambler = noise.simplex2(i, this.smoothGeometry.faces.length);
            if (indexScrambler < 0.125) {
                this.smoothGeometry.faceVertexUvs[0][i] = [
                    new THREE.Vector2(0.0, 0.0),
                    new THREE.Vector2(0.5, 0.0),
                    new THREE.Vector2(0.0, 0.5)
                ];
            }
            if (indexScrambler > 0.125) {
                this.smoothGeometry.faceVertexUvs[0][i] = [
                    new THREE.Vector2(0.5, 0.5),
                    new THREE.Vector2(0.0, 0.5),
                    new THREE.Vector2(0.5, 0.0)
                ];
            }
            if (indexScrambler > 0.25) {
                this.smoothGeometry.faceVertexUvs[0][i] = [
                    new THREE.Vector2(0.5, 0.0),
                    new THREE.Vector2(1.0, 0.0),
                    new THREE.Vector2(0.5, 0.5)
                ];
            }
            if (indexScrambler > 0.375) {
                this.smoothGeometry.faceVertexUvs[0][i] = [
                    new THREE.Vector2(1.0, 0.5),
                    new THREE.Vector2(0.5, 0.5),
                    new THREE.Vector2(1.0, 0.0)
                ];
            }
            if (indexScrambler > 0.5) {
                this.smoothGeometry.faceVertexUvs[0][i] = [
                    new THREE.Vector2(0.0, 0.5),
                    new THREE.Vector2(0.5, 0.5),
                    new THREE.Vector2(0.0, 1.0)
                ];
            }
            if (indexScrambler > 0.625) {
                this.smoothGeometry.faceVertexUvs[0][i] = [
                    new THREE.Vector2(0.5, 1.0),
                    new THREE.Vector2(0.0, 1.0),
                    new THREE.Vector2(0.5, 0.5)
                ];
            }
            if (indexScrambler > 0.75) {
                this.smoothGeometry.faceVertexUvs[0][i] = [
                    new THREE.Vector2(0.5, 0.5),
                    new THREE.Vector2(1.0, 0.5),
                    new THREE.Vector2(0.5, 1.0)
                ];
            }
            if (indexScrambler > 0.875) {
                this.smoothGeometry.faceVertexUvs[0][i] = [
                    new THREE.Vector2(1.0, 1.0),
                    new THREE.Vector2(0.5, 1.0),
                    new THREE.Vector2(1.0, 0.5)
                ];
            }
        }

        materials.porosity.map = porosityTextures[parseInt(this.parameters.porosity.value*9)];
        this.smoothGeometry.uvsNeedUpdate = true;
    };

    this.modifyExtrude = function(geometry){
        var weirdRndValue = .39;
        // DO STUFF //
        var value = this.parameters.extrusion.value*.66;
        var sharpness = this.parameters.sharpness.value;

        //if (value == 0) return;
        //value = .5;

        //this.computeNeighbours(geometry);
        var newFaces = [];

        geometry.faces.forEach(function(face,i){
            face.rnd = 1.0;//Math.abs(noise.simplex2(i,100));
        })

        geometry.faces.forEach(function(face,i){



            /*
            if (face.rnd < weirdRndValue) {
                newFaces.push(face);
                return;
            }

            */

            var normal=face.normal.clone();
            normal.multiplyScalar(value*face.rnd*3);

            // re-built main face

            var v1 = geometry.vertices[face.a].clone();
            var v2 = geometry.vertices[face.b].clone();
            var v3 = geometry.vertices[face.c].clone();

            // extrude main face

            v1.add(normal);
            v2.add(normal);
            v3.add(normal);

            // de-scale towards centre == SHARPNESS
            var centre = v1.clone();
            centre.add(v2);
            centre.add(v3);
            var scalar = 3;


            // the following part garantuees, that sharpness of neighbours
            // does not produce detached faces

            /*if (face.rnd > weirdRndValue &&
                face.neighbours.ab.rnd > weirdRndValue &&
                face.neighbours.ab.normal.angleTo(face.normal) < minAngle){

                centre.add( geometry.vertices[face.neighbours.ab.a] );
                centre.add( geometry.vertices[face.neighbours.ab.b] );
                centre.add( geometry.vertices[face.neighbours.ab.c] );

                scalar += 3;
            }

            if (face.rnd > weirdRndValue &&
                face.neighbours.bc.rnd > weirdRndValue &&
                face.neighbours.bc.normal.angleTo(face.normal) < minAngle){

                centre.add( geometry.vertices[face.neighbours.bc.a] );
                centre.add( geometry.vertices[face.neighbours.bc.b] );
                centre.add( geometry.vertices[face.neighbours.bc.c] );

                scalar += 3;
            }

            if (face.rnd > weirdRndValue &&
                face.neighbours.ac.rnd > weirdRndValue &&
                face.neighbours.ac.normal.angleTo(face.normal) < minAngle){

                centre.add( geometry.vertices[face.neighbours.ac.a] );
                centre.add( geometry.vertices[face.neighbours.ac.b] );
                centre.add( geometry.vertices[face.neighbours.ac.c] );

                scalar += 3;
            }*/

            centre.multiplyScalar(1/scalar);

            // get vectors to centre

            var c1 = centre.clone();
            c1.sub(v1);
            c1.multiplyScalar(sharpness);
            v1.add(c1);

            var c2 = centre.clone();
            c2.sub(v2);
            c2.multiplyScalar(sharpness);
            v2.add(c2);

            var c3 = centre.clone();
            c3.sub(v3);
            c3.multiplyScalar(sharpness);
            v3.add(c3);

            var i=geometry.vertices.length;

            geometry.vertices.push(v1);
            geometry.vertices.push(v2);
            geometry.vertices.push(v3);

            // adjust neighbouring faces if necessary
            // and add additional faces

           /* if (face.rnd > weirdRndValue &&
                face.neighbours.ab.rnd > weirdRndValue &&
                face.neighbours.ab.normal.angleTo(face.normal) < minAngle){
                face.neighbours.ab.rnd = face.rnd;
            } else {*/
                newFaces.push(new THREE.Face3(face.a, face.b, i+1));
                newFaces.push(new THREE.Face3(face.a, i+1, i));
            /*}

            if (face.rnd > weirdRndValue &&
                face.neighbours.bc.rnd > weirdRndValue &&
                face.neighbours.bc.normal.angleTo(face.normal) < minAngle){
                face.neighbours.bc.rnd = face.rnd;
            } else {*/
                newFaces.push(new THREE.Face3(face.b, face.c, i+2));
                newFaces.push(new THREE.Face3(face.b, i+2, i+1));
            /*}

            if (face.rnd > weirdRndValue &&
                face.neighbours.ac.rnd > weirdRndValue &&
                face.neighbours.ac.normal.angleTo(face.normal) < minAngle){
                face.neighbours.ac.rnd = face.rnd;
            } else {*/
                newFaces.push(new THREE.Face3(face.c, face.a, i));
                newFaces.push(new THREE.Face3(face.c, i, i+2));
            //}

            newFaces.push(new THREE.Face3(i, i+1, i+2));
            face = [];//kill old face
        });

        geometry.faces = newFaces;
        //geometry.mergeVertices(); //REMOVE
        //geometry.computeFaceNormals(); //REMOVE
        // END DO STUFF //
    }


    this.resetObject = function () {

        // REMOVE CURRENT OBJECT
        scene.remove(scene.getObjectByName("ParametricCube"));

        this.geometry.verticesNeedUpdate = true;
        this.geometry.colorsNeedUpdate = true

        // ADD NEW OBJECT
        scene.add(this.mesh);
    };


    this.switchMaterial = function() {
        this.currentMaterial = (this.currentMaterial+1)%Object.keys(materials).length;
        this.material = materials[Object.keys(materials)[this.currentMaterial]];
        console.log(Object.keys(materials)[this.currentMaterial]);

        if (this.mesh != undefined)
            this.mesh.material = this.material;

        //if (viz != undefined) this.resetObject();
    };

    this.currentMaterial = 2;
    this.switchMaterial();
    this.modifyComplexity();
}