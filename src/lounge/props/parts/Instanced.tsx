import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";
import type { BufferGeometry, Color, InstancedMesh, Material, Matrix4 } from "three";

const noRaycast = () => null;

interface Props {
  geometry: BufferGeometry;
  material: Material | Material[];
  matrices: Matrix4[];
  colors?: Color[];
  castShadow?: boolean;
  receiveShadow?: boolean;
  /** Decorative parts opt out of raycasting so pointer events stay cheap. */
  interactive?: boolean;
  renderOrder?: number;
}

/** An InstancedMesh whose matrices (and optional per-instance colours) are written once on mount. */
const Instanced = forwardRef<InstancedMesh, Props>(
  ({ geometry, material, matrices, colors, castShadow, receiveShadow, interactive = true, renderOrder }, fwd) => {
    const ref = useRef<InstancedMesh>(null!);
    useImperativeHandle(fwd, () => ref.current);

    useLayoutEffect(() => {
      const m = ref.current;
      matrices.forEach((mx, i) => m.setMatrixAt(i, mx));
      m.instanceMatrix.needsUpdate = true;
      if (colors) {
        colors.forEach((c, i) => m.setColorAt(i, c));
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
      }
    }, [matrices, colors]);

    return (
      <instancedMesh
        ref={ref}
        args={[geometry, material as Material, matrices.length]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        frustumCulled={false}
        renderOrder={renderOrder}
        {...(interactive ? {} : { raycast: noRaycast })}
      />
    );
  },
);
Instanced.displayName = "Instanced";

export default Instanced;
