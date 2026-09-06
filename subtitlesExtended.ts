/**
 * 3D Mesh & Geometry Converters
 * Wavefront OBJ (.obj) <-> Stereolithography STL (.stl), CSV, JSON
 */

export interface MeshData {
  vertices: [number, number, number][];
  normals: [number, number, number][];
  faces: [number, number, number][]; // 1-based vertex indices of triangles
}

export function parseOBJ(content: string): MeshData {
  const vertices: [number, number, number][] = [];
  const normals: [number, number, number][] = [];
  const faces: [number, number, number][] = [];

  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0];

    if (cmd === 'v') {
      const x = parseFloat(parts[1]) || 0;
      const y = parseFloat(parts[2]) || 0;
      const z = parseFloat(parts[3]) || 0;
      vertices.push([x, y, z]);
    } else if (cmd === 'vn') {
      const x = parseFloat(parts[1]) || 0;
      const y = parseFloat(parts[2]) || 0;
      const z = parseFloat(parts[3]) || 0;
      normals.push([x, y, z]);
    } else if (cmd === 'f') {
      // Faces can be v, v/vt, v/vt/vn, v//vn
      const vIndices: number[] = [];
      for (let i = 1; i < parts.length; i++) {
        const vPart = parts[i].split('/')[0];
        const vIdx = parseInt(vPart, 10);
        if (!isNaN(vIdx)) {
          // OBJ supports negative relative indices
          vIndices.push(vIdx < 0 ? vertices.length + vIdx + 1 : vIdx);
        }
      }
      // Triangulate if polygon has more than 3 vertices (fan triangulation)
      for (let i = 1; i < vIndices.length - 1; i++) {
        faces.push([vIndices[0], vIndices[i], vIndices[i + 1]]);
      }
    }
  }

  return { vertices, normals, faces };
}

export function objToSTL(mesh: MeshData, solidName = 'converted_mesh'): string {
  const lines: string[] = [`solid ${solidName}`];

  for (const face of mesh.faces) {
    const v1 = mesh.vertices[face[0] - 1] || [0, 0, 0];
    const v2 = mesh.vertices[face[1] - 1] || [0, 0, 0];
    const v3 = mesh.vertices[face[2] - 1] || [0, 0, 0];

    // Compute surface normal
    const ax = v2[0] - v1[0];
    const ay = v2[1] - v1[1];
    const az = v2[2] - v1[2];

    const bx = v3[0] - v1[0];
    const by = v3[1] - v1[1];
    const bz = v3[2] - v1[2];

    let nx = ay * bz - az * by;
    let ny = az * bx - ax * bz;
    let nz = ax * by - ay * bx;

    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (len > 0) {
      nx /= len;
      ny /= len;
      nz /= len;
    }

    lines.push(`  facet normal ${nx.toFixed(6)} ${ny.toFixed(6)} ${nz.toFixed(6)}`);
    lines.push('    outer loop');
    lines.push(`      vertex ${v1[0].toFixed(6)} ${v1[1].toFixed(6)} ${v1[2].toFixed(6)}`);
    lines.push(`      vertex ${v2[0].toFixed(6)} ${v2[1].toFixed(6)} ${v2[2].toFixed(6)}`);
    lines.push(`      vertex ${v3[0].toFixed(6)} ${v3[1].toFixed(6)} ${v3[2].toFixed(6)}`);
    lines.push('    endloop');
    lines.push('  endfacet');
  }

  lines.push(`endsolid ${solidName}`);
  return lines.join('\n');
}

export function parseSTL(content: string): MeshData {
  const vertices: [number, number, number][] = [];
  const faces: [number, number, number][] = [];
  const vertexMap = new Map<string, number>();

  const vertexRegex = /vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)/g;
  let match: RegExpExecArray | null;
  const currentFace: number[] = [];

  while ((match = vertexRegex.exec(content)) !== null) {
    const x = parseFloat(match[1]);
    const y = parseFloat(match[2]);
    const z = parseFloat(match[3]);
    const key = `${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)}`;

    let idx = vertexMap.get(key);
    if (idx === undefined) {
      vertices.push([x, y, z]);
      idx = vertices.length; // 1-based index
      vertexMap.set(key, idx);
    }

    currentFace.push(idx);
    if (currentFace.length === 3) {
      faces.push([currentFace[0], currentFace[1], currentFace[2]]);
      currentFace.length = 0;
    }
  }

  return { vertices, normals: [], faces };
}

export function meshToOBJ(mesh: MeshData): string {
  const lines: string[] = ['# Converted from 3D model'];
  for (const v of mesh.vertices) {
    lines.push(`v ${v[0]} ${v[1]} ${v[2]}`);
  }
  for (const f of mesh.faces) {
    lines.push(`f ${f[0]} ${f[1]} ${f[2]}`);
  }
  return lines.join('\n');
}

export function meshToCSV(mesh: MeshData): string {
  const rows = ['index,x,y,z'];
  mesh.vertices.forEach((v, i) => {
    rows.push(`${i + 1},${v[0]},${v[1]},${v[2]}`);
  });
  return rows.join('\n');
}

export function meshToJSON(mesh: MeshData): string {
  return JSON.stringify(
    {
      stats: {
        vertexCount: mesh.vertices.length,
        faceCount: mesh.faces.length,
      },
      vertices: mesh.vertices,
      faces: mesh.faces,
    },
    null,
    2
  );
}
