import { useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";

/**
 * Bloom → vignette → grain → ACES tone mapping.
 *
 * EffectComposer renders into a HalfFloat (HDR) buffer and switches the renderer's own tone
 * mapping off, so materials are NOT tone mapped in the scene pass. Bloom therefore sees raw HDR
 * values, and the ToneMapping effect at the end restores the filmic look for the whole frame.
 *
 * Bloom thresholds on LUMINANCE, not channel max. Per unit of emissive intensity:
 *   cyan #00f0ff ≈ 0.69, magenta #ff007f ≈ 0.23, purple #8b5cf6 ≈ 0.20.
 * With threshold 0.6, emissives need roughly: cyan ≥ 1, magenta ≥ 3, purple ≥ 3.5.
 */
const Effects = () => {
  const dpr = useThree((s) => s.viewport.dpr);
  // High-DPR screens already sample densely; MSAA on an HDR target is costly there.
  const multisampling = dpr > 1.5 ? 2 : 4;

  return (
    <EffectComposer multisampling={multisampling}>
      <Bloom mipmapBlur luminanceThreshold={0.6} luminanceSmoothing={0.1} intensity={0.9} radius={0.72} />
      <Vignette offset={0.28} darkness={0.6} />
      {/* Light grain also dithers banding in the dark gradients and bloom falloff. */}
      <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.35} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
};

export default Effects;
