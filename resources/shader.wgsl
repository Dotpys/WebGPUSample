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
