module Molvwr.Renderer {
	export class Sphere {	
		ctx: Molvwr.BabylonContext;
		config : Molvwr.Config.IMolvwrConfig;
		viewer : Molvwr.Viewer;
		meshes : any = {};
		
		constructor(viewer : Molvwr.Viewer, ctx: Molvwr.BabylonContext, config:Molvwr.Config.IMolvwrConfig){
			this.ctx = ctx;
			this.config = config;
			this.viewer = viewer;
		}	
		
		render(molecule){
			
			console.log("sphere rendering");
			if (molecule && molecule.atoms){
				var meshes = [];
				molecule.atoms.forEach((atom, index) => {
					meshes.push(this.renderAtom(atom, index));
				});
				//BABYLON.Mesh.MergeMeshes(meshes, true);
			}
		}
		
		
		renderAtom(atom, index){
			var cfg= this.config;
			var mesh = this.meshes[atom.symbol];
			var sphere : any = null;
			if (mesh){
				sphere = mesh.createInstance("sphere" + index);
			}else{
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
		}
	}
}