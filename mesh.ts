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

function loadMeshObj(device: GPUDevice, objTextData: string): Mesh {
    var lines = objTextData.split("\n");
    var vertices = lines.filter(line => line.startsWith("v "))
    .map(vertexDef => {
        let parts = vertexDef.split(" ");
        return [parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]
    });

    var arr = [];

    vertices.forEach(v => {
        arr.push(v[0], v[1], v[2], 1, v[0], v[1], v[2], 1);
    });
    
    var vData = new Float32Array(arr);

    const vBuf = device.createBuffer(
        {
            size: vData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        }
    );

    device.queue.writeBuffer(vBuf, 0, vData, 0, vData.length);
    // Faces
    var faces = lines.filter(line => line.startsWith("f "))
    .map(faceDef => {
        let parts = faceDef.split(" ");
        let i0 = parseInt(parts[1].split("/")[0]) - 1;
        let i1 = parseInt(parts[2].split("/")[0]) - 1;
        let i2 = parseInt(parts[3].split("/")[0]) - 1;
        let i3 = parseInt(parts[4].split("/")[0]) - 1;
        // Return quad
        return [i0, i1, i2, i0, i2, i3];
    });

    var arr = [];

    faces.forEach(f => {
        arr.push(f[0], f[1], f[2], f[3], f[4], f[5]);
    });

    var iData = new Int16Array(arr);

    const iBuf = device.createBuffer(
        {
            size: vData.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
        }
    );

    device.queue.writeBuffer(iBuf, 0, iData, 0, iData.length);

    return {
        vertexBuffer: vBuf,
        vertexCount: vData.byteLength / 32,
        indexBuffer: iBuf,
        triangleCount: iData.byteLength / 3
    };
}

export { createCubeMesh, loadMeshObj };