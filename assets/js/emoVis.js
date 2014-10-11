	var viz, renderer, scene, camera, controls, pointLight, modifier, minAngle, gui, shader, uniforms, materials, parametricCube, theta, texture;


	$(document).ready( function() {

		//GLOBAL STUFF

		// intialize the noise for the roughness
		noise.seed(Math.random());

		modifier = new THREE.SubdivisionModifier( 1 );
		minAngle = .1;//IN RADIANS

		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera( 75, $(window).innerWidth() / $(window).innerHeight(), 0.1, 1000);
		//controls = new THREE.OrbitControls( camera );
		renderer = new THREE.WebGLRenderer( { antialias: true } );
		renderer.setSize( $(window).innerWidth()-10, $(window).innerHeight()-10 );
		renderer.setClearColor( 0xfefefe, 1 );

		renderer.shadowMapEnabled = true;
		renderer.shadowMapSoft = true;

		shader = THREE.ShaderLib["normalmap"];
		uniforms = THREE.UniformsUtils.clone( shader.uniforms );


		alpha = THREE.ImageUtils.loadTexture('../../assets/images/porosity-alpha.png');
		texture = THREE.ImageUtils.loadTexture('../../assets/images/porosity-texture.png');
		porosityTextures = [];


		$(document).ready(function() {
			$('.emotion-select-bar a').click(function() {
				$('.emotion-select-bar a').removeClass('active');
				$(this).addClass('active');
				parametricCube.switchEmotion($(this).attr('href'));
//				parametricCube.switchEmotion()
			});
		});

		/* this loop loads the textures used by the porosity-parameter */
		for (var i=0; i<10; i++) {
			porosityTextures.push(THREE.ImageUtils.loadTexture('../../assets/images/porosity-texture_'+i+'.png'));
			porosityTextures[i].ansitropy = renderer.getMaxAnisotropy();
		}

		/* Material & Shader */
		materials = {
			normalMap : new THREE.MeshNormalMaterial({ shading: THREE.FlatShading }),
			//redPlastic : new THREE.MeshPhongMaterial( { color: 0x000000, specular: 0xffffff, emissive: 0xff0000, ambient: 0x000000, shininess: 100, shading: THREE.SmoothShading, vertexColors: THREE.VertexColors } ),
			redClay : new THREE.MeshLambertMaterial( { color: 0x666666, shadow: 0x666666, emissive: 0xa00000, ambient: 0x000000, shading: THREE.FlatShading, vertexColors: THREE.VertexColors } ),
			wireFrame : new THREE.MeshBasicMaterial({
				color: 0x000000,
				shading: THREE.FlatShading,
				wireframe: true,
				transparent: true,
				vertexColors: THREE.VertexColors
			}),
			porosity : new THREE.MeshLambertMaterial({
					side : THREE.DoubleSide,
					depthWrite:true,
					depthTest:true,
					map: texture,
					alphaMap: alpha,
					shading: THREE.SmoothShading,// THREE.FlatShading,
					transparent: true
				})
		};

		pointLight = new THREE.PointLight(0xffffff);
		bottomPointLight = new THREE.PointLight(0xffffff);
		leftPointLight = new THREE.PointLight(0xffffff);
		rightPointLight = new THREE.PointLight(0xffffff);

		// pointLight.distance = 10.0;

		scene.add(pointLight);
		scene.add(bottomPointLight);
		//scene.add(leftPointLight);
		//scene.add(rightPointLight);
		pointLight.position.set(0, 10, 5);
		bottomPointLight.position.set(0, -10, 5);
		leftPointLight.position.set(-3, 0, 5);
		rightPointLight.position.set(3, 0, 5);
		camera.position.set(0, 0, 20);


		document.body.appendChild( renderer.domElement);

		// initialize the parametric cube
		parametricCube = new ParametricCube();
		parametricCube.generateMesh();
		parametricCube.castShadow = true;
		//parametricCube.receiveShadow = true;

		//scene.add( parametricCube.mesh );


//var sphere = new THREE.Mesh( geometry, materials.redClay );
//scene.add( sphere );
//sphere.position.set(0,8,2);



		/*var pgeometry = new THREE.PlaneGeometry( 20, 20 );
		var material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
		var plane = new THREE.Mesh( pgeometry, materials.redClay );
		plane.position.set(0, 5, -5);
		scene.add( plane );
		plane.castShadow = true;
		plane.receiveShadow = true;*/

		theta=0.0;




		// the rendering loop
		function render() {
			requestAnimationFrame( render );
			theta += 0.005;
			parametricCube.mesh.rotation.y = theta;
			renderer.render(scene, camera);
			//pointLight.position.set(Math.sin(theta)*5, 0, Math.cos(theta)*5);
		}

	    $(window).load(function() {
					console.timeEnd("load");
	        render();
	    });



		//BULLSHIT
		/*var g = new THREE.PlaneGeometry(8, 9, 5, 10);
		g = new THREE.BoxGeometry(5,5,5,5,5,5);
		g.computeTangents();//absolutely necessary
			var plane = new THREE.Mesh( g, roughMaterial);
		scene.add(plane);*/
		}
	);

	//PARAMETRIC CUBES
	function ParametricCube () {


		self = this;
		this.center = new THREE.Vector3(0.0, 0.0, 0.0);

		// GET INNER GEOMETRY
		//  ADDS VERTICES AND FACES,
		//  AND INITS LIST .inner
		//  WHERE TRIPPLES (OUTER + INNER VERTEX, CENTER) ARE STORED
		//	WHICH WILL BE USED FOR SETTING EDGINESS IN set(amount)

		this.gui = new dat.GUI();

		this.parameters = {
			  smoothness: 0,
			  ratio: .5,
			  scale: .5,
			  complexity: 0,
			  surface: .5,
			  symmetrie: 0,
			  roughness: 0,
			  extrusion: 0.5,
			  sharpness: 0.5,
			  vertexShadowMultiplier: 1.6,
			  porosity: 0.0,

			  setWireframe : function() {
			  	this.setWireframe();
			  },
			  switchMaterial : function() {
			  	self.switchMaterial();
			  }
		};

		var mappedSmoothness = 0;

		/* this tupid functions returns all the values of the current parameters as object because javscript automatically would reference them */
		this.extractParameterValues = function () {
			return {
				'smoothness' : this.parameters.smoothness,
				'porosity' : this.parameters.porosity,
				'ratio' : this.parameters.ratio,
				'scale' : this.parameters.scale,
				'roughness' : this.parameters.roughness,
				'extrusion' : this.parameters.extrusion
			};
		}


		/* this keeps all the parameters for each emotion */
		this.emotionValues = {
			"anger": this.extractParameterValues(),
			"disgust": this.extractParameterValues(),
			"fear": this.extractParameterValues(),
			"joy": this.extractParameterValues(),
			"suprise": this.extractParameterValues(),
			"despise": this.extractParameterValues(),
			"sadness": this.extractParameterValues()
		};

		/* the currently selected emotion */
		this.currentEmotion = "anger";

		// this object hols the event bindings for every parameter
		this.parameterBindings = {
			  smoothness : this.gui.add(this.parameters, 'smoothness', 0, 1).listen(),
			  ratio : this.gui.add(this.parameters, 'ratio', 0, 1).listen(),
			  scale : this.gui.add(this.parameters, 'scale', 0, 1).listen(),
			  //complexity : this.gui.add(this.parameters, 'complexity', 0, 1).listen(),
			  //surface : this.gui.add(this.parameters, 'surface', 0, 1).listen(),
			  porosity :  this.gui.add(this.parameters, 'porosity', 0.0, 1.0).listen(),
			  //symmetrie : this.gui.add(this.parameters, 'symmetrie', 0, 1).listen(),
			  roughness : this.gui.add(this.parameters, 'roughness', 0, .1).listen(),
			  extrusion : this.gui.add(this.parameters, 'extrusion', 0, 1).listen(),
			  //vertexShadowMultiplier : this.gui.add(this.parameters, 'vertexShadowMultiplier', 0, 5).listen(),
				switchMaterial : this.gui.add(this.parameters, 'switchMaterial'),
				//setWireframe : this.gui.add(this.parameters, 'setWireframe')
		};



		// this event updates the parametriccube
		this.parameterBindings.smoothness.onChange(
			function (value) {
				//self.set(value);
				self.generateMesh();
			}
		);

		this.parameterBindings.ratio.onChange(
			function (value) {
				self.generateMesh();
			}
		);

		this.parameterBindings.scale.onChange(
			function (value) {
				self.generateMesh();
				//var scaleValue = value*20;
				//parametricCube.mesh.scale.set(scaleValue*ratioValue, scaleValue*(1-ratioValue), scaleValue*ratioValue);
			}
		);

		this.parameterBindings.porosity.onChange(
			function (value) {
				self.generateMesh();
			}
		);

		this.parameterBindings.roughness.onChange(
			function (value) {
				self.generateMesh();
			}
		);


		this.parameterBindings.extrusion.onChange(
			function (value) {
				self.modifyComplexity();
				self.generateMesh();
			}
		);


		this.switchEmotion = function (hashtag) {
			// save the values

			this.emotionValues[this.currentEmotion] = this.extractParameterValues();
			console.log(this.extractParameterValues());
			// update current emotion
			this.currentEmotion = hashtag.replace("#edit-", "");
			// copy the existing values to the sliders

			this.parameters.porosity = this.emotionValues[this.currentEmotion].porosity;
			this.parameters.ratio = this.emotionValues[this.currentEmotion].ratio;
			this.parameters.scale = this.emotionValues[this.currentEmotion].scale;
			this.parameters.roughness = this.emotionValues[this.currentEmotion].roughness;
			this.parameters.extrusion = this.emotionValues[this.currentEmotion].extrusion;
			this.parameters.smoothness = this.emotionValues[this.currentEmotion].smoothness;
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
			this.computeNeighbours(geometry);

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

			tmp.mergeVertices();
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

			// if there is no geometry, add it!
			if (this.smoothGeometry == undefined){
				this.smoothGeometry = this.geometry.clone();
			}

			this.mesh = new THREE.Mesh(this.geometry, this.material);

			//this.smoothGeometry.computeFaceNormals();

			this.modifyRatio();
			this.modifySmoothness();
			this.modifyRoughness();
			this.modifyPorosity();


			//UV shiat
			this.smoothGeometry.mergeVertices();
			//this.smoothGeometry.computeFaceNormals();

			this.smoothGeometry.computeFaceNormals();

			this.mesh = new THREE.Mesh(this.smoothGeometry, this.material);
			this.modifyScale();

			// DOES NOT WORK DUE TO WRONGLY ASSIGNED UVs :/

			//this.mesh = new THREE.Mesh(this.smoothGeometry, roughMaterial);
			//console.log("rough");
			this.mesh.name="ParametricCube";

			// remove the old object from the renderer and add the new mesh
			this.resetObject();

			//console.log("faces: "+this.smoothGeometry.faces.length);
			//console.log("vertices: "+this.smoothGeometry.vertices.length);

		};


		assignUVs = function( geometry ){

		    geometry.computeBoundingBox();

		    var max     = geometry.boundingBox.max;
		    var min     = geometry.boundingBox.min;

		    var offset  = new THREE.Vector2(0 - min.x, 0 - min.y);
		    var range   = new THREE.Vector2(max.x - min.x, max.y - min.y);

		    geometry.faceVertexUvs[0] = [];
		    var faces = geometry.faces;

		    for (i = 0; i < geometry.faces.length ; i++) {

		      var v1 = geometry.vertices[faces[i].a];
		      var v2 = geometry.vertices[faces[i].b];
		      var v3 = geometry.vertices[faces[i].c];

		      geometry.faceVertexUvs[0].push([
		        new THREE.Vector2( ( v1.x + offset.x ) / range.x , ( v1.y + offset.y ) / range.y ),
		        new THREE.Vector2( ( v2.x + offset.x ) / range.x , ( v2.y + offset.y ) / range.y ),
		        new THREE.Vector2( ( v3.x + offset.x ) / range.x , ( v3.y + offset.y ) / range.y )
		      ]);

		    }

		// modify UVs to accommodate MatCap texture
			var faceVertexUvs = geometry.faceVertexUvs[ 0 ];
			for ( i = 0; i < faceVertexUvs.length; i ++ ) {

				var uvs = faceVertexUvs[ i ];
				var face = geometry.faces[ i ];

				for ( var j = 0; j < 3; j ++ ) {

					uvs[ j ].x = face.vertexNormals[ j ].x * 0.5 + 0.5;
					uvs[ j ].y = face.vertexNormals[ j ].y * 0.5 + 0.5;

				}

			}

		    geometry.uvsNeedUpdate = true;
		    geometry.computeTangents();
		    geometry.computeFaceNormals();
		}

		/* updates the smoothness/edginess of our shape */
		this.modifySmoothness = function() {

				//map parameter smoothness to 0-3
				mappedSmoothness = parseInt(this.parameters.smoothness*3.5);

				//smoothen
				modifier = new THREE.SubdivisionModifier( mappedSmoothness );
				this.smoothGeometry = this.geometry.clone();
				this.smooth();

				//adjust subdivision inverse to smoothing
				this.smoothGeometry = this.subdivideRigid(this.smoothGeometry, 3-mappedSmoothness);

				if (mappedSmoothness > 0){
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

		this.modifyScale = function () {
			var scaleValue = this.parameters.scale*20;
			var ratioValue = this.parameters.ratio;
			this.mesh.scale.set(scaleValue*ratioValue, scaleValue*(1-ratioValue), scaleValue*ratioValue);
		};

		this.modifyRatio = function () {
			var scaleValue = this.parameters.scale*20;
			var ratioValue = this.parameters.ratio;
			this.mesh.scale.set(this.scaleValue*this.parameters.ratio, this.scaleValue*(1-this.parameters.ratio), this.scaleValue*this.ratio);
		}

		this.modifyComplexity = function () {
			console.log("modify complexity");

			if (this.parameters.complexity*20 <= 1){
				//this.geometry = new THREE.BoxGeometry(1,1,1);
				this.geometry = new THREE.SphereGeometry( 1, 5, 3 );
			} else {
				//RANDOM POLYGON
				var polyGeometry = new THREE.Geometry();
				for (var i=0; i<this.parameters.complexity*20*10; i++){
					var v = new THREE.Vector3(	1*(Math.random()-.5),
												1*(Math.random()-.5),
												1*(Math.random()-.5));
					v.id = i;
					polyGeometry.vertices.push(v);
				}
				this.geometry = QuickHull(polyGeometry);
			}
			this.modifyExtrude(this.geometry);

			//this.smoothGeometry = this.subdivideRigid(this.geometry.clone(), 1);

			this.mesh = this.generateMesh();
			/*
			this.mesh.scale.set(self.scaleValue*self.ratioValue,
			self.scaleValue*(1-self.ratioValue),
			self.scaleValue*self.ratioValue);
			*/

			if (viz != undefined) this.resetObject();
		};

		this.modifyRoughness = function (value) {

			// compute the roughness and add it to the vertices
			for (var i=0; i<this.smoothGeometry.vertices.length; i++) {
				this.smoothGeometry.vertices[i].multiplyScalar( 1 +
					noise.simplex3(this.smoothGeometry.vertices[i].x*50,
						this.smoothGeometry.vertices[i].y*50,
						this.smoothGeometry.vertices[i].z*50) * this.parameters.roughness
				);
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

			materials.porosity.map = porosityTextures[parseInt(this.parameters.porosity*9)];
			this.smoothGeometry.uvsNeedUpdate = true;
		};

		this.modifyExtrude = function(geometry){
			var weirdRndValue = .39;
			// DO STUFF //
			var value = this.parameters.extrusion*.66;
			var sharpness = this.parameters.sharpness;
			//if (value == 0) return;
			//value = .5;

			this.computeNeighbours(geometry);
			var newFaces = [];

			geometry.faces.forEach(function(face,i){
				face.rnd = Math.abs(noise.simplex2(i,100));
			})

			geometry.faces.forEach(function(face,i){

				 if (face.rnd < weirdRndValue) {
				 	newFaces.push(face);
				 	return;
				 }

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

				if (face.rnd > weirdRndValue &&
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
				}

				centre.multiplyScalar(1/scalar);


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

				if (face.rnd > weirdRndValue &&
					face.neighbours.ab.rnd > weirdRndValue &&
					face.neighbours.ab.normal.angleTo(face.normal) < minAngle){
					face.neighbours.ab.rnd = face.rnd;
				} else {
					newFaces.push(new THREE.Face3(face.a, face.b, i+1));
					newFaces.push(new THREE.Face3(face.a, i+1, i));
				}

				if (face.rnd > weirdRndValue &&
					face.neighbours.bc.rnd > weirdRndValue &&
					face.neighbours.bc.normal.angleTo(face.normal) < minAngle){
					face.neighbours.bc.rnd = face.rnd;
				} else {
					newFaces.push(new THREE.Face3(face.b, face.c, i+2));
					newFaces.push(new THREE.Face3(face.b, i+2, i+1));
				}

				if (face.rnd > weirdRndValue &&
					face.neighbours.ac.rnd > weirdRndValue &&
					face.neighbours.ac.normal.angleTo(face.normal) < minAngle){
					face.neighbours.ac.rnd = face.rnd;
				} else {
					newFaces.push(new THREE.Face3(face.c, face.a, i));
					newFaces.push(new THREE.Face3(face.c, i, i+2));
				}

				newFaces.push(new THREE.Face3(i, i+1, i+2));
				face = [];//kill old face
			});

			geometry.faces = newFaces;
			geometry.mergeVertices();
			geometry.computeFaceNormals();
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

		this.setWireframe = function() {
			this.material = materials.rough;//wired;
			this.mesh = this.generateMesh();
			//this.mesh.material = this.material;
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
		this.modifyComplexity();
		this.switchMaterial();
	}


	function rgb2hex(r, g, b) {
	    if (r > 255 || g > 255 || b > 255)
	        throw "Invalid color component";
	    return ((r << 16) | (g << 8) | b).toString(16);
	}
