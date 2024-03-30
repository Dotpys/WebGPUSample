const startTime = Date.now() / 1000;

if (!navigator.gpu) {
    throw Error("WebGPU not supported.");
}
console.log("WebGPU supported...");

const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
    throw Error("Couldn't request WebGPU adapter.");
}
console.log("WebGPU adapter created...");

const device = await adapter.requestDevice();
console.log("WebGPU device requested...");

const shaders = `
@group(0) @binding(0) var<uniform> model: mat4x4f;
@group(0) @binding(1) var<uniform> view: mat4x4f;
@group(0) @binding(2) var<uniform> projection: mat4x4f;

@group(1) @binding(0) var<uniform> t: f32;

struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f
}

@vertex
fn vertex_main(@location(0) position: vec4f, @location(1) color: vec4f) -> VertexOut {
    var output: VertexOut;
    output.position = ((position * model) * view) * projection;
    output.color = color;
    return output;
}

@fragment
fn fragment_main(fragData: VertexOut) -> @location(0) vec4f {
    return fragData.color;
}
`;

let gameState = {
    camera: {
        position: [ 0, 0, 5 ],
        // Pitch (x rot), Yaw (y rot), Roll (z rot)
        rotation: [ 0, 0, 0 ]
    },
    coobe: {
        position: [ -0.5, -0.5, -0.5 ],
        rotation: [ 0, 0, 0 ]
    }
};

const shaderModule = device.createShaderModule(
    {
        code: shaders
    }
);

const canvas = document.getElementById("viewport") as HTMLCanvasElement;
const context = canvas.getContext("webgpu");

context.configure(
    {
        device: device,
        format: navigator.gpu.getPreferredCanvasFormat(),
        alphaMode: "premultiplied"
    }
);

const vertices = new Float32Array(
    [   // Voxel
        0, 1, 0, 1,
        1, 0, 0, 1,

        1, 1, 0, 1,
        0, 1, 0, 1,

        0, 0, 0, 1,
        0, 0, 1, 1,

        1, 0, 0, 1,
        0, 1, 1, 1
    ]
);

const vertexBuffer = device.createBuffer(
    {
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    }
);

device.queue.writeBuffer(vertexBuffer, 0, vertices, 0, vertices.length);

const vertexBuffers: GPUVertexBufferLayout[] = [
    {
        attributes: [
            {
                shaderLocation: 0,
                offset: 0,
                format: "float32x4"
            },
            {
                shaderLocation: 1,
                offset: 16,
                format: "float32x4"
            }
        ],
        arrayStride: 32,
        stepMode: "vertex"
    }
];

const mvpGroupLayout = device.createBindGroupLayout(
    {
        label: "MVP",
        entries: [
            {   // Model Matrix
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: {}
            },
            {   // View Matrix
                binding: 1,
                visibility: GPUShaderStage.VERTEX,
                buffer: {}
            },
            {   // Projection Matrix
                binding: 2,
                visibility: GPUShaderStage.VERTEX,
                buffer: {}
            }
        ]
    }
);

const tGroupLayout = device.createBindGroupLayout(
    {
        label: "t",
        entries: [
            {   // t
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: {}
            }
        ]
    }
);

const pipelineLayout = device.createPipelineLayout(
    {
        label: "sheidahh_leiaut",
        bindGroupLayouts: [
            mvpGroupLayout,
            tGroupLayout,
        ]
    }
);

const pipelineDescriptor: GPURenderPipelineDescriptor = {
    vertex: {
        module: shaderModule,
        entryPoint: "vertex_main",
        buffers: vertexBuffers
    },
    fragment: {
        module: shaderModule,
        entryPoint: "fragment_main",
        targets: [
            {
                format: navigator.gpu.getPreferredCanvasFormat()
            }
        ]
    },
    primitive: {
        topology: "triangle-strip"
    },
    layout: pipelineLayout
};

const renderPipeline = device.createRenderPipeline(pipelineDescriptor);

const modelBuffer = device.createBuffer(
    {
        size: 16 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    }
);

let modelData = new Float32Array(
    [
        1, 0, 0, gameState.coobe.position[0],
        0, 1, 0, gameState.coobe.position[1],
        0, 0, 1, gameState.coobe.position[2],
        0, 0, 0, 1
    ]
);

device.queue.writeBuffer(modelBuffer, 0, modelData, 0, modelData.length);

const viewBuffer = device.createBuffer(
    {
        size: 16 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    }
);

let viewData = new Float32Array(
    [
        1, 0, 0, -gameState.camera.position[0],
        0, 1, 0, -gameState.camera.position[1],
        0, 0, 1, -gameState.camera.position[2],
        0, 0, 0, 1
    ]
);

device.queue.writeBuffer(viewBuffer, 0, viewData, 0, viewData.length);

const projectionBuffer = device.createBuffer(
    {
        size: 16 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    }
);

const fov = Math.PI / 2;    // 90deg
const aspectRatio = 16.0/9.0;
const zNear = 1.0;
const zFar = 100.0

const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);

let projectionData = new Float32Array(
    [
        f/aspectRatio, 0, 0, 0,
        0, f, 0, 0,
        0, 0, zFar / (zNear - zFar), -1,
        0, 0, zFar * zNear / (zNear - zFar), 0
    ]
);

device.queue.writeBuffer(projectionBuffer, 0, projectionData, 0, projectionData.length);

const mvpBindGroup = device.createBindGroup(
    {
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: modelBuffer
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: viewBuffer
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: projectionBuffer
                }
            }
        ]
    }
);

const tBuffer = device.createBuffer(
    {
        size: 64,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    }
);

const tBindGroup = device.createBindGroup(
    {
        layout: renderPipeline.getBindGroupLayout(1),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: tBuffer
                }
            }
        ]
    }
);

function frame() {
    const commandEncoder = device.createCommandEncoder();

    const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
            {
                clearValue: {r: 0.0, g: 0.5, b: 1.0, a: 1.0 },
                loadOp: "clear",
                storeOp: "store",
                view: context.getCurrentTexture().createView()
            }
        ]
    };

    const now = (Date.now() / 1000) - startTime;
    let data = new Float32Array([now]);
    device.queue.writeBuffer(
        tBuffer,
        0,
        data.buffer,
        data.byteOffset,
        data.byteLength
      );
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(renderPipeline);
    passEncoder.setBindGroup(0, mvpBindGroup);
    passEncoder.setBindGroup(1, tBindGroup);

    passEncoder.setVertexBuffer(0, vertexBuffer);

    passEncoder.draw(4);
    passEncoder.end();
    
    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
}

canvas.addEventListener("click", async () => {
    canvas.requestPointerLock();
});

document.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement) {
        console.log("{} e {}", e.movementX, e.movementY);
    }
});

requestAnimationFrame(frame);

export default {};