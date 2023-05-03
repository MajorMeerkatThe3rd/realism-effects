import { Effect } from "postprocessing"
import { Uniform } from "three"

const compose = /* glsl */ `
uniform sampler2D hbaoTexture;
uniform sampler2D ssaoTexture;

uniform sampler2D depthTexture;
uniform float x;
uniform float hbaoPower;
uniform float ssaoPower;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    float unpackedDepth = textureLod(depthTexture, uv, 0.).r;

    if(abs(vUv.x - x) < 0.001){
        outputColor = vec4(vec3(0., 0., 1.), inputColor.a);
        return;
    }

    if(unpackedDepth > 0.9999){
        outputColor = vec4(1.);
        return;
    }

    float ao = vUv.x > x ? pow(textureLod(ssaoTexture, uv, 0.).a, ssaoPower) : pow(textureLod(hbaoTexture, uv, 0.).a, hbaoPower);

    outputColor = vec4(vec3(textureLod(hbaoTexture, uv, 0.).rgb), inputColor.a);
}
`

class HBAOSSAOComparisonEffect extends Effect {
	constructor(hbaoEffect, ssaoEffect) {
		super("AOEffect", compose, {
			type: "FinalAOMaterial",
			uniforms: new Map([
				["hbaoTexture", new Uniform(hbaoEffect.poissionDenoisePass.texture)],
				["ssaoTexture", new Uniform(ssaoEffect.poissionDenoisePass.texture)],
				["depthTexture", new Uniform(ssaoEffect.composer.depthTexture)],
				["x", new Uniform(0.5)],
				["hbaoPower", new Uniform(0.5)],
				["ssaoPower", new Uniform(0.5)]
			])
		})

		document.addEventListener("mousemove", ev => {
			if (ev.shiftKey || ev.ctrlKey || ev.altKey || ev.metaKey) {
				const x = ev.clientX / window.innerWidth
				this.uniforms.get("x").value = x
			}
		})

		this.hbaoEffect = hbaoEffect
		this.ssaoEffect = ssaoEffect
	}

	update() {
		this.uniforms.get("hbaoPower").value = this.hbaoEffect.uniforms.get("power").value
		this.uniforms.get("ssaoPower").value = this.ssaoEffect.uniforms.get("power").value
	}
}

export { HBAOSSAOComparisonEffect }
