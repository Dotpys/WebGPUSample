type Mesh = {
    vertexBuffer: GPUBuffer,
    vertexCount: number,
    indexBuffer: GPUBuffer,
    triangleCount: number
};

function createCubeMesh(device: GPUDevice): Mesh {

    const vData = new Float32Array([
    //  x, y, z, 1, r, g, b, 1,
    //=========================
        0, 0, 0, 1, 0, 0, 0, 1,
        0, 0, 1, 1, 0, 0, 1, 1,
        0, 1, 0, 1, 0, 1, 0, 1,
        0, 1, 1, 1, 0, 1, 1, 1,
        1, 0, 0, 1, 1, 0, 0, 1,
        1, 0, 1, 1, 1, 0, 1, 1,
        1, 1, 0, 1, 1, 1, 0, 1,
        1, 1, 1, 1, 1, 1, 1, 1
    ]);

    const vBuf = device.createBuffer(
        {
            size: vData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        }
    );

    device.queue.writeBuffer(vBuf, 0, vData, 0, vData.length);

    const iData = new Int16Array([
        //-X
        0, 2, 6,
        0, 6, 4,
        //+Z
        4, 6, 7,
        4, 7, 5,
        //+X
        5, 7, 3,
        5, 3, 1,
        //-Z
        1, 3, 2,
        1, 2, 0,
        //+Y
        6, 2, 3,
        6, 3, 7,
        //-Y
        0, 4, 5,
        0, 5, 1
    ]);

    const iBuf = device.createBuffer(
        {
            size: iData.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
        }
    );

    device.queue.writeBuffer(iBuf, 0, iData, 0, iData.length)

    return {
        vertexBuffer: vBuf,
        vertexCount: vData.byteLength / 32,
        indexBuffer: iBuf,
        triangleCount: iData.byteLength / 6
    };
}

export { createCubeMesh };