import { mul, perspectiveProjection, rotatex, rotatey, traslate } from "./matrix_utils.js";
import { createCubeMesh } from "./mesh.js";

const startTime = Date.now() / 1000;

let gameState = {
    camera: {
        position: [ 0, 0, 5 ],
        // Pitch (x rot), Yaw (y rot), Roll (z rot)
        rotation: [ Math.PI/4, -Math.PI/4, 0 ]
    },
    coobe: {
        position: [ -0.5 - 3, -0.5 - 4, -0.5 - 3],
        rotation: [ 0, 0, 0 ]
    }
};

if (!navigator.gpu) {
    throw Error("WebGPU not supported.");
}

const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
    throw Error("Couldn't request WebGPU adapter.");
}

const device = await adapter.requestDevice();

let shaderCode = await fetch("/resources/shader.wgsl").then(response => response.text()).then(sc => sc);

const shaderModule = device.createShaderModule(
    {
        code: shaderCode
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

const cube = createCubeMesh(device);

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
        topology: "triangle-list"
    },
    layout: pipelineLayout,
    depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus"
    }
};

const depthTexture = device.createTexture(
    {
        size: [canvas.width, canvas.height],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    }
);

const renderPipeline = device.createRenderPipeline(pipelineDescriptor);

const modelBuffer = device.createBuffer(
    {
        size: 16 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    }
);

let modelData = new Float32Array(traslate(gameState.coobe.position[0], gameState.coobe.position[1], gameState.coobe.position[2]));

device.queue.writeBuffer(modelBuffer, 0, modelData, 0, modelData.length);

const viewBuffer = device.createBuffer(
    {
        size: 16 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    }
);

function updateViewBuffer() {
    let pos = gameState.camera.position;
    let rot = gameState.camera.rotation;

    let traslation = traslate(-pos[0], -pos[1], -pos[2]);

    let pitchRotation = rotatex(rot[0]);

    let yawRotation = rotatey(rot[1]);

    let rotation = new Float32Array(mul(pitchRotation, yawRotation));

    let viewData = rotation;

    device.queue.writeBuffer(viewBuffer, 0, viewData, 0, viewData.length);
}

updateViewBuffer();

const projectionBuffer = device.createBuffer(
    {
        size: 16 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    }
);

const fov = Math.PI / 4;    // 45deg
const aspectRatio = 16.0/9.0;
const zNear = 1.0;
const zFar = 100.0

const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);

let projectionData = new Float32Array(perspectiveProjection(fov, aspectRatio, zNear, zFar));

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
        ],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: "clear",
            depthStoreOp: "store"
        }
    };

    updateViewBuffer();

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

    
    passEncoder.setVertexBuffer(0, cube.vertexBuffer);
    passEncoder.setIndexBuffer(cube.indexBuffer, "uint16");
    passEncoder.drawIndexed(cube.triangleCount * 3);


    passEncoder.end();
    
    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
}

canvas.addEventListener("click", async () => {
    canvas.requestPointerLock();
});

document.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement) {
        // Pitch
        gameState.camera.rotation[0] += e.movementY * 0.001;
        if (gameState.camera.rotation[0] >  Math.PI / 2)
            gameState.camera.rotation[0] =  Math.PI / 2;
        if (gameState.camera.rotation[0] < -Math.PI / 2)
            gameState.camera.rotation[0] = -Math.PI / 2;

        // Yaw
        gameState.camera.rotation[1] += e.movementX * 0.001;
        gameState.camera.rotation[1] %= Math.PI * 2;
    }
});

requestAnimationFrame(frame);

export default {};