type Matrix4x4 = [
    a11: number,
    a12: number,
    a13: number,
    a14: number,
    a21: number,
    a22: number,
    a23: number,
    a24: number,
    a31: number,
    a32: number,
    a33: number,
    a34: number,
    a41: number,
    a42: number,
    a43: number,
    a44: number,
];

function mul(a: Matrix4x4, b: Matrix4x4): Matrix4x4 {
    return [
         a[0]*b[0] +  a[1]*b[4] +  a[2]*b[8]  +  a[3]*b[12],
         a[0]*b[1] +  a[1]*b[5] +  a[2]*b[9]  +  a[3]*b[13],
         a[0]*b[2] +  a[1]*b[6] +  a[2]*b[10] +  a[3]*b[14],
         a[0]*b[3] +  a[1]*b[7] +  a[2]*b[11] +  a[3]*b[15],

         a[4]*b[0] +  a[5]*b[4] +  a[6]*b[8]  +  a[7]*b[12],
         a[4]*b[1] +  a[5]*b[5] +  a[6]*b[9]  +  a[7]*b[13],
         a[4]*b[2] +  a[5]*b[6] +  a[6]*b[10] +  a[7]*b[14],
         a[4]*b[3] +  a[5]*b[7] +  a[6]*b[11] +  a[7]*b[15],

         a[8]*b[0] +  a[9]*b[4] + a[10]*b[8]  + a[11]*b[12],
         a[8]*b[1] +  a[9]*b[5] + a[10]*b[9]  + a[11]*b[13],
         a[8]*b[2] +  a[9]*b[6] + a[10]*b[10] + a[11]*b[14],
         a[8]*b[3] +  a[9]*b[7] + a[10]*b[11] + a[11]*b[15],

        a[12]*b[0] + a[13]*b[4] + a[14]*b[8] +  a[15]*b[12],
        a[12]*b[1] + a[13]*b[5] + a[14]*b[9] +  a[15]*b[13],
        a[12]*b[2] + a[13]*b[6] + a[14]*b[10] + a[15]*b[14],
        a[12]*b[3] + a[13]*b[7] + a[14]*b[11] + a[15]*b[15]
    ];
}

function traslate(x: number, y: number, z: number): Matrix4x4 {
    return [
        1, 0, 0, x,
        0, 1, 0, y,
        0, 0, 1, z,
        0, 0, 0, 1
    ];
}

function rotatex(rad: number): Matrix4x4 {
    return [
        1, 0, 0, 0,
        0, Math.cos(rad), -Math.sin(rad), 0,
        0, Math.sin(rad), Math.cos(rad), 0,
        0, 0, 0, 1
    ];
}

function rotatey(rad: number): Matrix4x4 {
    return [
        Math.cos(rad), 0, Math.sin(rad), 0,
        0, 1, 0, 0,
        -Math.sin(rad), 0, Math.cos(rad), 0,
        0, 0, 0, 1
    ];
}

//TODO: rotatez

function perspectiveProjection(fov: number, aspectRatio: number, zNear: number, zFar: number): Matrix4x4 {
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
    return [
        f/aspectRatio, 0, 0, 0,
        0, f, 0, 0,
        0, 0, zFar / (zNear - zFar), -1,
        0, 0, zFar * zNear / (zNear - zFar), 0
    ];
}

export { Matrix4x4, mul, traslate, rotatex, rotatey, perspectiveProjection };