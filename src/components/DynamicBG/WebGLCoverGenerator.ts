import Whentil from "@spikerko/tools/Whentil";
import Global from "../Global/Global";
import { SpotifyPlayer } from "../Global/SpotifyPlayer";

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
  uniform float uRadius;
  uniform vec2 uTextureSize;
  uniform float uTime;
  uniform float uFrontRotationSpeed;
  uniform float uBackRotationSpeed;
  uniform float uBackCenterRotationSpeed;
  uniform float uPulseIntensity;
  
  void main(void) {
    vec2 center = vec2(0.5, 0.5);
    vec4 finalColor = vec4(0.0);
    
    // Process all three layers
    for(int layer = 0; layer < 3; layer++) {
      float rotationSpeed, scale, offsetX, offsetY;
      float layerOpacity;
      float layerRadius;  // Add radius control per layer
      
      if (layer == 0) { // Front
        rotationSpeed = uFrontRotationSpeed;
        scale = 1.35;
        offsetX = -0.17;
        offsetY = 0.3;
        layerOpacity = 1.0;
        layerRadius = 0.5;  // 50% of the normalized space
      } else if (layer == 1) { // Back
        rotationSpeed = uBackRotationSpeed;
        scale = 1.25;
        offsetX = -0.5;
        offsetY = -0.3;
        layerOpacity = 1.0;
        layerRadius = 0.5;
      } else { // BackCenter
        rotationSpeed = uBackCenterRotationSpeed;
        scale = 1.21;
        offsetX = 0.5;
        offsetY = -0.1;
        layerOpacity = 1.0;
        layerRadius = 0.5;
      }
      
      float angle = uTime * (2.0 * 3.14159) / rotationSpeed;
      float s = sin(angle);
      float c = cos(angle);
      
      vec2 scaledCoord = (vTextureCoord - center) / scale;
      vec2 offsetCoord = scaledCoord + vec2(offsetX, offsetY) / scale;
      
      vec2 rotatedCoord = vec2(
        offsetCoord.x * c - offsetCoord.y * s,
        offsetCoord.x * s + offsetCoord.y * c
      );
      
      vec2 finalUV = rotatedCoord + center;
      
      // Apply circular mask for both the layer and the overall shape
      float dist = distance(vTextureCoord, center);
      float layerDist = distance(finalUV, center);
      
      if (dist <= uRadius && layerDist <= layerRadius) {
        vec4 layerColor = texture2D(uSampler, finalUV);
        
        // Smooth the edge of the circle
        float smoothEdge = smoothstep(layerRadius, layerRadius - 0.01, layerDist);
        layerColor.a *= layerOpacity * smoothEdge;
        
        finalColor = mix(finalColor, layerColor, layerColor.a);
      }
    }
    
    // Apply pulse effect to final color
    finalColor.rgb *= (1.0 + uPulseIntensity);
    
    gl_FragColor = finalColor;
  }
`;

// Container for all WebGL resources
const MAX_WEBGL_CONTEXTS = 8;
const activeContexts: Set<WebGLRenderingContext> = new Set();

class WebGLRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private positionBuffer: WebGLBuffer;
  private textureCoordBuffer: WebGLBuffer;
  private texture: WebGLTexture;
  private startTime: number;
  private animationFrameId: number | null = null;
  private pulseStartTime: number | null = null;
  private pulseIntensity: number = 0;
  private isPulsing: boolean = false;  // Add pulse lock

  constructor(canvas: HTMLCanvasElement) {
    // Check if we need to clean up old contexts
    if (activeContexts.size >= MAX_WEBGL_CONTEXTS) {
      // Get the oldest context and clean it up
      const oldestContext = activeContexts.values().next().value;
      const canvas = oldestContext.canvas;
      if (canvas && (canvas as any).__renderer) {
        (canvas as any).__renderer.destroy();
      }
    }

    this.gl = canvas.getContext('webgl', { premultipliedAlpha: false }) as WebGLRenderingContext;
    
    if (!this.gl) {
      throw new Error("WebGL not supported");
    }

    activeContexts.add(this.gl);

    // Set the viewport to match the canvas dimensions
    this.gl.viewport(0, 0, canvas.width, canvas.height);

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
      const uPulseIntensityLocation = this.gl.getUniformLocation(this.program, 'uPulseIntensity');
      
      // Calculate time in seconds
      const currentTime = (performance.now() - this.startTime) / 1000;
      
      // Calculate pulse effect
      let currentPulseIntensity = 0;
      if (this.pulseStartTime) {
        const pulseProgress = (performance.now() - this.pulseStartTime) / 300;
        currentPulseIntensity = this.pulseIntensity * Math.sin(pulseProgress * Math.PI);
      }
      
      this.gl.uniform1f(uBlurAmountLocation, blurAmount);
      this.gl.uniform1f(uBrightnessLocation, brightness);
      this.gl.uniform1f(uSaturationLocation, saturation);
      // Set uRadius to 1.0 so that the full image is visible
      this.gl.uniform1f(uRadiusLocation, 1.0);
      this.gl.uniform2f(uTextureSizeLocation, this.gl.canvas.width, this.gl.canvas.height);
      this.gl.uniform1f(uTimeLocation, currentTime);
      this.gl.uniform1f(uFrontRotationSpeedLocation, frontRotationSpeed);
      this.gl.uniform1f(uBackRotationSpeedLocation, backRotationSpeed);
      this.gl.uniform1f(uBackCenterRotationSpeedLocation, backCenterRotationSpeed);
      this.gl.uniform1f(uPulseIntensityLocation, currentPulseIntensity);
      
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

  // Add destroy method to properly clean up WebGL resources
  destroy(): void {
    this.stopAnimation();

    // Delete shaders and program
    if (this.program) {
      const shaders = this.gl.getAttachedShaders(this.program);
      if (shaders) {
        shaders.forEach(shader => {
          this.gl.deleteShader(shader);
        });
      }
      this.gl.deleteProgram(this.program);
    }

    // Delete buffers
    if (this.positionBuffer) this.gl.deleteBuffer(this.positionBuffer);
    if (this.textureCoordBuffer) this.gl.deleteBuffer(this.textureCoordBuffer);
    
    // Delete texture
    if (this.texture) this.gl.deleteTexture(this.texture);

    // Remove from active contexts
    activeContexts.delete(this.gl);

    // Lose context
    const ext = this.gl.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
  }

  // Get the WebGL context
  getContext(): WebGLRenderingContext {
    return this.gl;
  }

  // Modify pulse method
  pulse(duration: number = 300, intensity: number = 0.3) {
    if (this.isPulsing) return;  // Skip if already pulsing
    this.isPulsing = true;
    this.pulseStartTime = performance.now();
    this.pulseIntensity = intensity;
    
    setTimeout(() => {
      this.pulseStartTime = null;
      this.pulseIntensity = 0;
      this.isPulsing = false;  // Reset lock after pulse
    }, duration);
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
  blur: 0,
  brightness: 0.2,
  saturation: 2.65,
  frontRotationSpeed: 65,
  backRotationSpeed: -66,
  backCenterRotationSpeed: 65
});

ContainerParameters.set("SidePanel", { 
  blur: 0,
  brightness: 0.2,
  saturation: 2.65,
  frontRotationSpeed: 65,
  backRotationSpeed: -66,
  backCenterRotationSpeed: 65
});

// Get current cover art URL
const GetCoverArtURL = (): string | null => {
  const GetFullUrl = (uri: string): string | undefined => {
    if (!uri) return undefined;
    return `https://i.scdn.co/image/${uri.replace("spotify:image:", "")}`;
  }

  const images = Spicetify.Player.data?.item?.album?.images;
  if (!images || images.length === 0) return null;

  for (const image of images) {
    const url = GetFullUrl(image.url);
    if (url) return url;
  }
  return null;
};

// Create a new canvas for the given parameters
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
  width: number,
  height: number
): Promise<HTMLCanvasElement> => {
  // Validate URL before creating image
  if (!coverArtURL || coverArtURL.trim() === '') {
    throw new Error('Invalid cover art URL');
  }

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Verify the loaded image has valid dimensions
      if (img.width === 0 || img.height === 0) {
        reject(new Error('Loaded image has invalid dimensions'));
        return;
      }
      resolve(img);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = coverArtURL;
  });

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.className = 'combined-bg';
  
  const renderer = new WebGLRenderer(canvas);
  
  (canvas as any).__renderer = renderer;
  
  renderer.processImage(
    image, 
    params.blur, 
    params.brightness, 
    params.saturation,
    params.frontRotationSpeed,
    params.backRotationSpeed,
    params.backCenterRotationSpeed
  );
  
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
    let retryCount = 0;
    const maxRetries = 15;
    let retryTimeout: number | null = null;
    let checkInterval: number | null = null;

    const performCheck = () => {
      const url = GetCoverArtURL();
      if (url && url.length > 0) {
        if (checkInterval) clearInterval(checkInterval);
        if (retryTimeout) clearTimeout(retryTimeout);
        return url;
      }
      
      if (retryCount >= maxRetries) {
        if (checkInterval) clearInterval(checkInterval);
        return null;
      }
      
      retryCount++;
      return null;
    };

    // Use Whentil with synchronous URL checker
    const task = Whentil.When(
      performCheck,
      async (url: string) => {
        try {
          // Additional URL validation
          if (!url || url.trim() === '') {
            throw new Error('Invalid cover art URL received');
          }

          if (retryTimeout) {
            clearTimeout(retryTimeout);
            retryTimeout = null;
          }
          if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
          }
          
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
            // Create the canvas
            await createLayerCanvas(containerDiv, url, params, width, height);
            
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
        } catch (error) {
          console.error("WebGL background creation failed:", error);
          task.Cancel();
          if (retryTimeout) clearTimeout(retryTimeout);
          if (checkInterval) clearInterval(checkInterval);
          reject(error);
        } finally {
          task.Cancel();
        }
      }
    );

    // Set up interval to check for URL
    checkInterval = setInterval(performCheck, 500);
    
    // Add a timeout to reject the promise if it takes too long
    setTimeout(() => {
      if (retryTimeout) clearTimeout(retryTimeout);
      if (checkInterval) clearInterval(checkInterval);
      task.Cancel();
      reject(new Error("Timed out waiting for cover art URL"));
    }, 10000);
  });
};

// Clean up resources when a container is no longer needed
export const CleanupContainer = (container: HTMLDivElement): void => {
  const canvases = container.querySelectorAll('canvas');
  canvases.forEach(canvas => {
    if ((canvas as any).__renderer) {
      (canvas as any).__renderer.destroy();
      delete (canvas as any).__renderer;
    }
  });
  container.remove();
};

// New (unreleased) Pulsing BG
/* // Modify the global pulse function
export const PulseBg = () => {
  // Only pulse the first active context we find
  const firstContext = activeContexts.values().next().value;
  if (firstContext && firstContext.canvas && (firstContext.canvas as any).__renderer) {
    (firstContext.canvas as any).__renderer.pulse();
  }
};

// Define Beat type
type Beat = {
    start: number;
    duration: number;
    confidence: number;
};

let currentBeats: Beat[] = [];
let beatCheckInterval: number | null = null;

export const PulseOnBeat = (beats: Beat[]) => {
    // Clear any existing beat check interval
    if (beatCheckInterval !== null) {
        clearInterval(beatCheckInterval);
    }

    // Store beats array
    currentBeats = beats;

    // Start checking for beats every 10ms
    beatCheckInterval = setInterval(() => {
        // Check if player is actually playing
        if (!SpotifyPlayer.IsPlaying) {
            return;
        }

        const currentPosition = SpotifyPlayer.GetTrackPosition() / 1000; // Convert to seconds
        
        // Find if we're on a beat
        const currentBeat = currentBeats.find(beat => {
            const beatEnd = beat.start + beat.duration;
            return currentPosition >= beat.start && currentPosition < beatEnd;
        });

        // If we found a beat and it has good confidence, pulse
        if (currentBeat && currentBeat.confidence > 0.5) {
            // Scale pulse intensity by beat confidence
            const intensity = currentBeat.confidence * 0.4; // Max intensity of 0.4
            
            // Only pulse the first active context we find
            const firstContext = activeContexts.values().next().value;
            if (firstContext && firstContext.canvas && (firstContext.canvas as any).__renderer) {
                (firstContext.canvas as any).__renderer.pulse(currentBeat.duration * 1000, intensity);
            }
        }
    }, 10);
};

// Add cleanup function for when stopping beat pulses
export const StopPulseOnBeat = () => {
    if (beatCheckInterval !== null) {
        clearInterval(beatCheckInterval);
        beatCheckInterval = null;
    }
    currentBeats = [];
};

Global.SetScope("dynamicbg.pulses", {
    PulseBg,
    PulseOnBeat,
    StopPulseOnBeat,
}); */