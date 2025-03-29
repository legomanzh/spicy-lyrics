import Whentil from "../../utils/Whentil";

// Define types directly in this file
type CoverArtContainer = "SidePanel" | string;

// Store our WebGL-processed cover art containers
const ProcessedContainers: Map<string, Map<CoverArtContainer, HTMLDivElement>> = new Map();

// Vertex shader for rendering a simple quad
const vertexShaderSource = `
  attribute vec4 aVertexPosition;
  attribute vec2 aTextureCoord;
  
  varying highp vec2 vTextureCoord;
  
  void main(void) {
    gl_Position = aVertexPosition;
    vTextureCoord = aTextureCoord;
  }
`;

// Fragment shader with three overlapping rotating images
const fragmentShaderSource = `
  precision mediump float;
  
  varying highp vec2 vTextureCoord;
  
  uniform sampler2D uSampler;
  uniform float uBlurAmount;
  uniform float uBrightness;
  uniform float uSaturation;
  uniform float uRadius;
  uniform vec2 uTextureSize;
  uniform float uTime;
  uniform int uLayer; // 0 = Front, 1 = Back, 2 = BackCenter
  uniform float uFrontRotationSpeed;
  uniform float uBackRotationSpeed;
  uniform float uBackCenterRotationSpeed;
  
  // Helper for gaussian blur
  vec4 blur13(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
    vec4 color = vec4(0.0);
    vec2 off1 = vec2(1.411764705882353) * direction;
    vec2 off2 = vec2(3.2941176470588234) * direction;
    vec2 off3 = vec2(5.176470588235294) * direction;
    
    color += texture2D(image, uv) * 0.1964825501511404;
    color += texture2D(image, uv + (off1 / resolution)) * 0.2969069646728344;
    color += texture2D(image, uv - (off1 / resolution)) * 0.2969069646728344;
    color += texture2D(image, uv + (off2 / resolution)) * 0.09447039785044732;
    color += texture2D(image, uv - (off2 / resolution)) * 0.09447039785044732;
    color += texture2D(image, uv + (off3 / resolution)) * 0.010381362401148057;
    color += texture2D(image, uv - (off3 / resolution)) * 0.010381362401148057;
    
    return color;
  }
  
  // Function to adjust saturation
  vec3 adjustSaturation(vec3 color, float saturation) {
    float gray = dot(color, vec3(0.2126, 0.7152, 0.0722));
    return mix(vec3(gray), color, saturation);
  }
  
  void main(void) {
    // Get base center
    vec2 center = vec2(0.5, 0.5);
    
    // Layer-specific parameters
    float rotationSpeed, scale, offsetX, offsetY;
    
    if (uLayer == 0) { // Front
      rotationSpeed = uFrontRotationSpeed;
      scale = 2.0;
      offsetX = 0.5; // Move right
      offsetY = 0.0;
    } else if (uLayer == 1) { // Back
      rotationSpeed = uBackRotationSpeed;
      scale = 2.0;
      offsetX = -0.5; // Move left
      offsetY = 1.0; // Move down
    } else { // BackCenter
      rotationSpeed = uBackCenterRotationSpeed;
      scale = 3.0;
      offsetX = -0.5;
      offsetY = -0.2;
    }
    
    // Calculate angle in radians - Convert from seconds to radians
    // 2π radians = 360 degrees = one full rotation
    // We divide by rotationSpeed to get seconds per rotation
    float angle = uTime * (2.0 * 3.14159) / rotationSpeed;
    
    float s = sin(angle);
    float c = cos(angle);
    
    // Scale and offset
    vec2 scaledCoord = (vTextureCoord - center) / scale;
    vec2 offsetCoord = scaledCoord + vec2(offsetX, offsetY) / scale;
    
    // Rotate
    vec2 rotatedCoord = vec2(
      offsetCoord.x * c - offsetCoord.y * s,
      offsetCoord.x * s + offsetCoord.y * c
    );
    
    // Final texture coordinates
    vec2 finalUV = rotatedCoord + center;
    
    // Apply circular mask
    float dist = distance(vTextureCoord, center);
    if (dist > uRadius) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      return;
    }
    
    // Apply blur
    vec4 color = vec4(0.0);
    if (uBlurAmount > 0.0) {
      // Two-pass gaussian blur
      vec2 direction = vec2(uBlurAmount, 0.0);
      vec4 blur1 = blur13(uSampler, finalUV, uTextureSize, direction);
      
      direction = vec2(0.0, uBlurAmount);
      color = blur13(uSampler, finalUV, uTextureSize, direction);
      
      color = (blur1 + color) * 0.5;
    } else {
      color = texture2D(uSampler, finalUV);
    }
    
    // Apply brightness
    color.rgb *= uBrightness;
    
    // Apply saturation
    color.rgb = adjustSaturation(color.rgb, uSaturation);
    
    gl_FragColor = color;
  }
`;

// Container for all WebGL resources
class WebGLRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private positionBuffer: WebGLBuffer;
  private textureCoordBuffer: WebGLBuffer;
  private texture: WebGLTexture;
  private startTime: number;
  private animationFrameId: number | null = null;
  private layer: number; // 0 = Front, 1 = Back, 2 = BackCenter

  constructor(canvas: HTMLCanvasElement, layer: number) {
    this.layer = layer;
    this.gl = canvas.getContext('webgl', { premultipliedAlpha: false }) as WebGLRenderingContext;
    
    if (!this.gl) {
      throw new Error("WebGL not supported");
    }
    
    // Initialize shaders
    const vertexShader = this.compileShader(vertexShaderSource, this.gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);
    
    // Create program
    this.program = this.createProgram(vertexShader, fragmentShader);
    
    // Create buffers
    this.positionBuffer = this.createQuadBuffer();
    this.textureCoordBuffer = this.createTextureCoordBuffer();
    
    // Create texture
    this.texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    
    // Set texture parameters - FIXED THIS SECTION
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    
    // Time tracking for animations
    this.startTime = performance.now();
  }
  
  private compileShader(source: string, type: number): WebGLShader {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('An error occurred compiling the shader: ' + this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      throw new Error('Shader compilation failed');
    }
    
    return shader;
  }
  
  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(program));
      throw new Error('Program linking failed');
    }
    
    return program;
  }
  
  private createQuadBuffer(): WebGLBuffer {
    const positions = [
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
       1.0,  1.0,
    ];
    
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
    
    return buffer;
  }
  
  private createTextureCoordBuffer(): WebGLBuffer {
    const textureCoordinates = [
      0.0, 1.0,
      1.0, 1.0,
      0.0, 0.0,
      1.0, 0.0,
    ];
    
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), this.gl.STATIC_DRAW);
    
    return buffer;
  }
  
  // Process an image with the specified parameters
  processImage(
    image: HTMLImageElement, 
    blurAmount: number, 
    brightness: number, 
    saturation: number,
    frontRotationSpeed: number,
    backRotationSpeed: number,
    backCenterRotationSpeed: number
  ): void {
    // Use our shader program
    this.gl.useProgram(this.program);
    
    // Set up the position attribute
    const positionAttributeLocation = this.gl.getAttribLocation(this.program, 'aVertexPosition');
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.vertexAttribPointer(positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(positionAttributeLocation);
    
    // Set up the texture coordinate attribute
    const textureCoordAttributeLocation = this.gl.getAttribLocation(this.program, 'aTextureCoord');
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureCoordBuffer);
    this.gl.vertexAttribPointer(textureCoordAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(textureCoordAttributeLocation);
    
    // Upload the image into the texture
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
    
    // Animation frame function
    const animate = () => {
      // Set uniforms
      const uBlurAmountLocation = this.gl.getUniformLocation(this.program, 'uBlurAmount');
      const uBrightnessLocation = this.gl.getUniformLocation(this.program, 'uBrightness');
      const uSaturationLocation = this.gl.getUniformLocation(this.program, 'uSaturation');
      const uRadiusLocation = this.gl.getUniformLocation(this.program, 'uRadius');
      const uTextureSizeLocation = this.gl.getUniformLocation(this.program, 'uTextureSize');
      const uTimeLocation = this.gl.getUniformLocation(this.program, 'uTime');
      const uFrontRotationSpeedLocation = this.gl.getUniformLocation(this.program, 'uFrontRotationSpeed');
      const uBackRotationSpeedLocation = this.gl.getUniformLocation(this.program, 'uBackRotationSpeed');
      const uBackCenterRotationSpeedLocation = this.gl.getUniformLocation(this.program, 'uBackCenterRotationSpeed');
      
      // Calculate time in seconds
      const currentTime = (performance.now() - this.startTime) / 1000;
      
      this.gl.uniform1f(uBlurAmountLocation, blurAmount);
      this.gl.uniform1f(uBrightnessLocation, brightness);
      this.gl.uniform1f(uSaturationLocation, saturation);
      this.gl.uniform1f(uRadiusLocation, 0.5); // Circular mask with radius 0.5 (normalized)
      this.gl.uniform2f(uTextureSizeLocation, this.gl.canvas.width, this.gl.canvas.height);
      this.gl.uniform1f(uTimeLocation, currentTime);
      this.gl.uniform1f(uFrontRotationSpeedLocation, frontRotationSpeed);
      this.gl.uniform1f(uBackRotationSpeedLocation, backRotationSpeed);
      this.gl.uniform1f(uBackCenterRotationSpeedLocation, backCenterRotationSpeed);
      
      // Set layer uniform
      const uLayerLocation = this.gl.getUniformLocation(this.program, 'uLayer');
      this.gl.uniform1i(uLayerLocation, this.layer);
      
      // Set up the texture unit
      const samplerLocation = this.gl.getUniformLocation(this.program, 'uSampler');
      this.gl.uniform1i(samplerLocation, 0);
      
      // Draw
      this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
      
      // Continue animation
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    // Start the animation
    animate();
  }
  
  // Stop animation to clean up resources
  stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  // Get the WebGL context
  getContext(): WebGLRenderingContext {
    return this.gl;
  }
}

// Parameters for different container types with rotation speeds in seconds per rotation
const ContainerParameters: Map<(CoverArtContainer | "Default"), { 
  blur: number, 
  brightness: number, 
  saturation: number,
  frontRotationSpeed: number,    // seconds per full rotation
  backRotationSpeed: number,     // seconds per full rotation
  backCenterRotationSpeed: number // seconds per full rotation
}> = new Map();

ContainerParameters.set("Default", { 
  blur: 2,
  brightness: 0.64,
  saturation: 2.5,
  frontRotationSpeed: 65,
  backRotationSpeed: -66,
  backCenterRotationSpeed: 65
});

ContainerParameters.set("SidePanel", { 
  blur: 2,
  brightness: 0.6,
  saturation: 2.25,
  frontRotationSpeed: 65,
  backRotationSpeed: -66,
  backCenterRotationSpeed: 65
});

// Get current cover art URL
const GetCoverArtURL = (): string => {
  const GetFullUrl = (uri: string): string | undefined => {
    if (!uri) return undefined
    return `https://i.scdn.co/image/${uri.replace("spotify:image:", "")}`;
  }

  return GetFullUrl(Spicetify.Player.data.item.album.images[0].url) ?? 
          GetFullUrl(Spicetify.Player.data.item.album.images[1].url) ?? 
            GetFullUrl(Spicetify.Player.data.item.album.images[2].url) ?? 
              GetFullUrl(Spicetify.Player.data.item.album.images[3].url) ?? 
                undefined;
};

// Create a new layer canvas for the given parameters
const createLayerCanvas = async (
  containerDiv: HTMLDivElement,
  coverArtURL: string,
  params: { 
    blur: number, 
    brightness: number, 
    saturation: number,
    frontRotationSpeed: number,
    backRotationSpeed: number,
    backCenterRotationSpeed: number
  },
  layer: number, // 0 = Front, 1 = Back, 2 = BackCenter
  className: string,
  width: number,
  height: number
): Promise<HTMLCanvasElement> => {
  // Load the image
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = coverArtURL;
  });
  
  // Create a canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.className = className;
  
  // Create WebGL renderer
  const renderer = new WebGLRenderer(canvas, layer);
  
  // Store renderer in canvas for cleanup later
  (canvas as any).__renderer = renderer;
  
  // Process the image
  renderer.processImage(
    image, 
    params.blur, 
    params.brightness, 
    params.saturation,
    params.frontRotationSpeed,
    params.backRotationSpeed,
    params.backCenterRotationSpeed
  );
  
  // Add canvas to container
  containerDiv.appendChild(canvas);
  
  return canvas;
};

// Generate WebGL-processed background container
export const CreateDynamicBackground = (
  coverArtContainer: CoverArtContainer,
  width: number,
  height: number
): Promise<HTMLDivElement> => {
  return new Promise((resolve, reject) => {
    // Use Whentil to wait for a valid cover art URL
    const task = Whentil.When(
      () => {
        const url = GetCoverArtURL();
        return url && url.length > 0 ? url : null;
      }, 
      async (url) => {
        try {
          // Check if we already have a container for this URL
          const existingContainer = ProcessedContainers.get(url)?.get(coverArtContainer);
          if (existingContainer) {
            resolve(existingContainer);
            return;
          }
          
          // Create a container div
          const containerDiv = document.createElement('div');
          containerDiv.className = 'spicy-dynamic-bg';
          
          // Get processing parameters for this container
          const params = ContainerParameters.get(coverArtContainer) ?? ContainerParameters.get("Default");
          
          try {
            // Create each layer canvas
            await Promise.all([
              createLayerCanvas(containerDiv, url, params, 0, 'Front', width, height),
              createLayerCanvas(containerDiv, url, params, 1, 'Back', width, height),
              createLayerCanvas(containerDiv, url, params, 2, 'BackCenter', width, height)
            ]);
            
            // Store the container for reuse
            let storage = ProcessedContainers.get(url);
            if (!storage) {
              storage = new Map();
              ProcessedContainers.set(url, storage);
            }
            
            // Clean up old container if it exists
            const oldContainer = storage.get(coverArtContainer);
            if (oldContainer) {
              CleanupContainer(oldContainer);
            }
            
            storage.set(coverArtContainer, containerDiv);
            
            resolve(containerDiv);
          } catch (error) {
            console.error("WebGL processing failed:", error);
            reject(error);
          }
        } finally {
          task.Cancel();
        }
      }
    );
    
    // Add a timeout to reject the promise if it takes too long
    setTimeout(() => {
      task.Cancel();
      reject(new Error("Timed out waiting for cover art URL"));
    }, 10000); // 10 seconds timeout
  });
};

// Clean up resources when a container is no longer needed
export const CleanupContainer = (container: HTMLDivElement): void => {
  // Find all canvases in the container
  const canvases = container.querySelectorAll('canvas');
  canvases.forEach(canvas => {
    if ((canvas as any).__renderer) {
      (canvas as any).__renderer.stopAnimation();
    }
  });
};
