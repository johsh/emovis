	var viz, renderer, scene, camera, controls, pointLight, modifier, minAngle, gui, shader, uniforms, materials, parametricCube, theta;

	$(document).ready( function() {

		//GLOBAL STUFF

		// intialize the noise for the roughness
		noise.seed(Math.random());


		modifier = new THREE.SubdivisionModifier( 1 );
		minAngle = 1;//IN RADIANS

		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera( 75, $(window).innerWidth() / $(window).innerHeight(), 0.1, 1000);
		controls = new THREE.OrbitControls( camera );
		renderer = new THREE.WebGLRenderer( { antialias: true } );
		renderer.setSize( $(window).innerWidth(), $(window).innerHeight() );
		renderer.setClearColor( 0xffffff, 1 );

		shader = THREE.ShaderLib["normalmap"];
		uniforms = THREE.UniformsUtils.clone( shader.uniforms );

		/* Material & Shader */
		materials = {
			normal : new THREE.MeshNormalMaterial(),
			test : new THREE.MeshPhongMaterial( { color: 0x000000, specular: 0xffffff, emissive: 0xff0000, ambient: 0x000000, shininess: 10, shading: THREE.SmoothShading, opacity: 0.9, transparent: true } ),
			redClay : new THREE.MeshLambertMaterial( { color: 0x666666, emissive: 0xa00000, ambient: 0x000000, shading: THREE.SmoothShading } ),
			greenGreySmooth : new THREE.MeshPhongMaterial( { ambient: 0x030303, color: 0xdddddd, specular: 0x009900, shininess: 30, shading: THREE.SmoothShading, transparent: true } ),
			grey : new THREE.MeshLambertMaterial( { color: 0xdddddd, shading: THREE.SmoothShading } ),
			greenBlack : new THREE.MeshPhongMaterial({
				ambient: 0x2551311, 
				color: 0x2493992, 
				specular: 0x2551311, 
				shininess: 255, 								
				shading: THREE.SmoothShading
			}),
			wired : new THREE.MeshBasicMaterial({ 
				color: 0x000000, 
				shading: THREE.FlatShading, 
				wireframe: true, 
				transparent: true 
			}),			
		};


		pointLight = new THREE.PointLight(0xffffff);
		scene.add(pointLight);
		pointLight.position.set(0, 0, -10);

		camera.position.set(0, 0, 10);

		ratioValue = .5;
		scaleValue = 10;


		document.body.appendChild( renderer.domElement );

		// initialize the parametric cube
		parametricCube = new ParametricCube();
		parametricCube.generateMesh();

		scene.add( parametricCube.mesh );

		theta=0.0;




		// the rendering loop
		function render() {
			requestAnimationFrame( render ); 
			theta+=0.1;
			//parametricCube.mesh.rotation.y += 0.01;
			renderer.render(scene, camera);
			pointLight.position.set(Math.sin(theta)*10, 0, Math.cos(theta)*10);
		}
		render();



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

		// GET INNER GEOMETRY
		//  ADDS VERTICES AND FACES, 
		//  AND INITS LIST .inner 
		//  WHERE TRIPPLES (OUTER + INNER VERTEX, CENTER) ARE STORED
		//	WHICH WILL BE USED FOR SETTING EDGINBESS IN set(amount)

		this.gui = new dat.GUI();

		this.parameters = {
			  smoothness: .5,
			  ratio: .5, 
			  scale: .5, 
			  complexity: .5,
			  surface: .5,
			  symmetrie: 0,
			  roughness: 1.0,

			  setWireframe : function() {
			  	this.setWireframe();
			  }, 
			  switchMaterial : function() {
			  	self.switchMaterial();
			  }
		};

		// this object hols the event bindings for every parameter
		this.parameterBindings = {
			  smoothness : this.gui.add(this.parameters, 'smoothness', 0, 1),
			  ratio : this.gui.add(this.parameters, 'ratio', 0, 1), 
			  scale : this.gui.add(this.parameters, 'scale', 0, 1), 
			  complexity : this.gui.add(this.parameters, 'complexity', 0, 1),
			  surface : this.gui.add(this.parameters, 'surface', 0, 1),
			  symmetrie : this.gui.add(this.parameters, 'symmetrie', 0, 1),
			  roughness : this.gui.add(this.parameters, 'roughness', 0, 1),
			  switchMaterial : this.gui.add(this.parameters, 'switchMaterial'),
			  setWireframe : this.gui.add(this.parameters, 'setWireframe')
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

		this.parameterBindings.complexity.onChange(
			function (value){
				//var value=parseInt(value*20);
				//self.complexity(value);
				self.generateMesh();
			}
		)

		this.parameterBindings.scale.onChange(
			function (value) {
				self.generateMesh();
				//var scaleValue = value*20;
				//parametricCube.mesh.scale.set(scaleValue*ratioValue, scaleValue*(1-ratioValue), scaleValue*ratioValue);
			}
		);

		this.parameterBindings.roughness.onChange( 
			function (value) {
				self.generateMesh();
			}
		);



		this.subdivideRigid = function(geometry, value){
			for (var i=0; i<value;i++)
				geometry=this._subdivideRigid(geometry);
			return geometry;
		};

		this._subdivideRigid = function(geometry){

			//GET NEIGHBOURS
			this.smoothGeometry = geometry;
			this.smoothGeometry.computeFaceNormals();
			this.computeNeighbours();

			//INIT NEW GEOMETRY - SUCH THAT VERTICES ARE NOT MIXED UP
			var tmp = new THREE.Geometry();
			//LINK OLD VERTICES
			tmp.vertices = geometry.vertices;

			//FOR ALL old VERTICES
			var len = geometry.faces.length;
			for (var i=0;i<len;i++){
				var face = geometry.faces[i];

				/*
				if (face.neighbours.ab.normal.angleTo(face.normal) < minAngle && face.neighbours.ac.normal.angleTo(face.normal) < minAngle &&face.neighbours.bc.normal.angleTo(face.normal) < minAngle){

					continue;
				}
				*/

				//CURRENT FACE a, b, c
				var a = face.a;
				var b = face.b;
				var c = face.c;
				var vA = geometry.vertices[a];
				var vB = geometry.vertices[b];
				var vC = geometry.vertices[c];

				//GET CENTERS	
				var ab = tmp.vertices.length;				
				var vAB = tmp.vertices.push(vA.clone().lerp(vB, .5));

				var ac = tmp.vertices.length;				
				var vAC = tmp.vertices.push(vA.clone().lerp(vC, .5));

				var bc = tmp.vertices.length;				
				var vBC = tmp.vertices.push(vB.clone().lerp(vC, .5));

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

		this.computeNeighbours = function(){
			var geometry = this.geometry;

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

			this.mesh = new THREE.Mesh(this.smoothGeometry, this.material);

			this.smoothGeometry.computeFaceNormals();


			this.modifyRatio();
			this.modifySmoothness();
			this.modifyRoughness();


			this.smoothGeometry.mergeVertices();

			this.mesh = new THREE.Mesh(this.smoothGeometry, this.material);

			this.modifyScale();


			// DOES NOT WORK DUE TO WRONGLY ASSIGNED UVs :/

			//this.smoothGeometry.computeTangents();
			//this.mesh = new THREE.Mesh(this.smoothGeometry, roughMaterial);
			//console.log("rough");

			this.mesh.name="ParametricCube";




			// remove the old object from the renderer and add the new mesh
			this.resetObject();

		};


		/* updates the smoothness/edginess of our shape */
		this.modifySmoothness = function() {

			// JUST A HELPER, AS this.geometry SOMEHOW IS NOT 
			// KNOWN IN THE function BELOW
			if (parseInt(this.parameters.smoothness*4) > 3) {
				// REMOVE CURRENT OBJECT
				scene.remove(scene.getObjectByName("ParametricCube"));
				this.smoothGeometry = undefined;
				this.smoothGeometry = this.subdivideRigid(this.geometry.clone(), 4);
				this.geometry.verticesNeedUpdate = true;
				this.geometry.colorsNeedUpdate = true
				// ADD NEW OBJECT
				scene.add(this.mesh);
			} else {
				modifier = new THREE.SubdivisionModifier( 4-parseInt(this.parameters.smoothness*4) );
				this.smoothGeometry = this.subdivideRigid(this.geometry.clone(), parseInt(this.parameters.smoothness*4));
				this.smooth();
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
			if (this.parameters.complexity*20 <= 1){
				this.geometry = new THREE.BoxGeometry(1,1,1);
			} else {
				//RANDOM POLYGON
				var polyGeometry = new THREE.Geometry(); 
				for (var i=0; i<this.parameters.complexity*10*20; i++){
					var v = new THREE.Vector3(	1*(Math.random()-.5),
												1*(Math.random()-.5),
												1*(Math.random()-.5));
					v.id = i;
					polyGeometry.vertices.push(v);
				}
				this.geometry = QuickHull(polyGeometry);
			}
			this.smoothGeometry = this.subdivideRigid(this.geometry.clone(), 1);

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
		};

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

		this.currentMaterial = 1;
		this.modifyComplexity();
		this.switchMaterial();
	}