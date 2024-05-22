  // Modify the vertex shader to pass tangent vectors to the fragment shader
  const vs = `
    attribute vec4 a_position;
    attribute vec3 a_normal;
    attribute vec3 a_tangent;
    attribute vec2 a_texcoord;
    attribute vec4 a_color;

    uniform mat4 u_projection;
    uniform mat4 u_view;
    uniform mat4 u_world;
    uniform vec3 u_viewWorldPosition;

    varying vec3 v_normal;
    varying vec3 v_tangent;
    varying vec3 v_surfaceToView;
    varying vec2 v_texcoord;
    varying vec4 v_color;

    void main() {
      vec4 worldPosition = u_world * a_position;
      gl_Position = u_projection * u_view * worldPosition;
      v_surfaceToView = u_viewWorldPosition - worldPosition.xyz;
      mat3 normalMat = mat3(u_world);
      v_normal = normalize(normalMat * a_normal);
      v_tangent = normalize(normalMat * a_tangent);
      v_texcoord = a_texcoord;
      v_color = a_color;
    }
`;

const fs = `
precision highp float;
varying vec3 v_normal;
varying vec3 v_tangent;
varying vec3 v_surfaceToView;
varying vec2 v_texcoord;
varying vec4 v_color;

uniform int u_lightsEnabled;
uniform int u_bumpMappingEnabled;
uniform vec3 diffuse;
uniform sampler2D diffuseMap;
uniform vec3 ambient;
uniform vec3 emissive;
uniform vec3 specular;
uniform sampler2D specularMap;
uniform sampler2D normalMap; // Add normal map texture
uniform float shininess;
uniform float opacity;
uniform vec3 u_lightDirection;
uniform vec3 u_ambientLight;

void main () {
    if (u_lightsEnabled == 1) {
      vec3 normal = normalize(v_normal) * ( float( gl_FrontFacing ) * 2.0 - 1.0 );
      if (u_bumpMappingEnabled == 0) {
        vec3 tangent = normalize(v_tangent) * ( float( gl_FrontFacing ) * 2.0 - 1.0 );
        vec3 bitangent = normalize(cross(normal, tangent));
        
        mat3 tbn = mat3(tangent, bitangent, normal);
        normal = texture2D(normalMap, v_texcoord).rgb * 2. - 1.;
        normal = normalize(tbn * normal);
      }
        vec3 surfaceToViewDirection = normalize(v_surfaceToView);
        vec3 halfVector = normalize(u_lightDirection + surfaceToViewDirection);

        float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
        float specularLight = clamp(dot(normal, halfVector), 0.0, 1.0);
        vec4 specularMapColor = texture2D(specularMap, v_texcoord);
        vec3 effectiveSpecular = specular * specularMapColor.rgb;

        vec4 diffuseMapColor = texture2D(diffuseMap, v_texcoord);
        vec3 effectiveDiffuse = diffuse * diffuseMapColor.rgb * v_color.rgb;
        float effectiveOpacity = opacity * diffuseMapColor.a * v_color.a;

        gl_FragColor = vec4(
            emissive +
            ambient * u_ambientLight +
            effectiveDiffuse * fakeLight +
            effectiveSpecular * pow(specularLight, shininess),
            effectiveOpacity);
    } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
}
`;
